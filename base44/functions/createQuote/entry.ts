import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest, clientIp } from '../../shared/rateLimit.ts';

// MOCK quote generator. No Guesty credentials yet — returns a sample itemized
// invoice built from stored CalendarDay nightly rates plus placeholder fee/tax
// lines, flagged mock:true. Also creates a Quote entity row (status active,
// expires 24h from now). All pricing math lives here, never in the frontend.
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(iso) {
  const parts = String(iso).split("-").map(Number);
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function addDays(iso, n) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { listingId, checkIn, checkOut, guests } = payload;

    if (!listingId || !checkIn || !checkOut) {
      return Response.json({ error: "listingId, checkIn and checkOut are required" }, { status: 400 });
    }
    if (String(checkOut) <= String(checkIn)) {
      return Response.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    // Rate limit: public unauthenticated endpoint that writes a Quote row per
    // call — cap per-IP so it can't be used to flood the entity or burn quota.
    if (!(await allowRequest(base44, "createQuote", clientIp(req), 20, 10))) {
      return Response.json({ error: "Too many quote requests. Please try again in a few minutes." }, { status: 429 });
    }

    // Build the night list [checkIn, checkOut)
    const nights: string[] = [];
    let cur = String(checkIn);
    const end = String(checkOut);
    while (cur < end) { nights.push(cur); cur = addDays(cur, 1); }
    if (nights.length === 0) {
      return Response.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    // Read stored CalendarDay rows for this listing (rates live ONLY here)
    const days = await base44.asServiceRole.entities.CalendarDay.filter({ listingId }, "-date", 500);
    const dayByDate: Record<string, any> = {};
    for (const d of days) dayByDate[String(d.date)] = d;

    // Validate availability and collect nightly line items (verbatim rates)
    let nightsSubtotal = 0;
    const lineItems: any[] = [];
    for (const date of nights) {
      const day = dayByDate[date];
      if (!day || day.available !== true) {
        return Response.json({ error: "One or more selected nights are not available" }, { status: 400 });
      }
      const rate = Number(day.rate) || 0;
      nightsSubtotal += rate;
      lineItems.push({ kind: "nightly", date, label: `Night of ${fmtDate(date)}`, amount: rate });
    }

    // minNights enforced from the check-in day
    const checkInDay = dayByDate[nights[0]];
    const minNights = Number(checkInDay?.minNights) || 1;
    if (minNights > nights.length) {
      return Response.json({ error: `This stay requires a minimum of ${minNights} night${minNights === 1 ? "" : "s"}` }, { status: 400 });
    }

    // Placeholder fee + tax lines
    const cleaningFee = 150;
    const serviceFee = 75;
    const lodgingTax = Math.round(0.12 * nightsSubtotal);
    lineItems.push({ kind: "fee", label: "Cleaning fee", amount: cleaningFee });
    lineItems.push({ kind: "fee", label: "Service fee", amount: serviceFee });
    lineItems.push({ kind: "tax", label: "Lodging tax (12%)", amount: lodgingTax });

    const subtotal = nightsSubtotal + cleaningFee + serviceFee;
    const total = subtotal + lodgingTax;

    const invoice = {
      currency: "USD",
      nights: nights.length,
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: Number(guests) || 1,
      lineItems,
      subtotal,
      total,
    };

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const guestyQuoteId = "mock_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    const quote = await base44.asServiceRole.entities.Quote.create({
      guestyQuoteId,
      listingId: String(listingId),
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: Number(guests) || 1,
      invoice,
      expiresAt,
      status: "active",
    });

    return Response.json({
      mock: true,
      quoteId: quote.id,
      guestyQuoteId,
      invoice,
      expiresAt,
    });
  } catch (error) {
    // Full detail stays server-side; clients get a friendly message.
    console.error("[createQuote]", error.message);
    return Response.json({ error: "Something went wrong getting your quote. Please try again." }, { status: 500 });
  }
});