// Shared MOCK stay pricing, used by createQuote and getQuote (auto re-quote).
// All pricing math lives here, never in the frontend. When Guesty credentials
// arrive in September this module is replaced by a call to Guesty's quote
// endpoint; the return shape stays the same.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(iso: string) {
  const parts = String(iso).split("-").map(Number);
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function addDays(iso: string, n: number) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Prices a stay from stored CalendarDay rows. Returns { invoice } on success
// or { error, status } when the stay can't be priced. Never throws for
// expected cases (unavailable nights, minNights).
export async function priceStay(base44: any, params: {
  listingId: string; checkIn: string; checkOut: string; guests?: number;
}) {
  const { listingId, checkIn, checkOut, guests } = params;

  if (!listingId || !checkIn || !checkOut) {
    return { error: "listingId, checkIn and checkOut are required", status: 400 };
  }
  if (String(checkOut) <= String(checkIn)) {
    return { error: "Check-out must be after check-in", status: 400 };
  }

  // Build the night list [checkIn, checkOut)
  const nights: string[] = [];
  let cur = String(checkIn);
  const end = String(checkOut);
  while (cur < end) { nights.push(cur); cur = addDays(cur, 1); }
  if (nights.length === 0) {
    return { error: "Check-out must be after check-in", status: 400 };
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
      return { error: "One or more selected nights are not available", status: 400 };
    }
    const rate = Number(day.rate) || 0;
    nightsSubtotal += rate;
    lineItems.push({ kind: "nightly", date, label: `Night of ${fmtDate(date)}`, amount: rate });
  }

  // minNights enforced from the check-in day
  const checkInDay = dayByDate[nights[0]];
  const minNights = Number(checkInDay?.minNights) || 1;
  if (minNights > nights.length) {
    return { error: `This stay requires a minimum of ${minNights} night${minNights === 1 ? "" : "s"}`, status: 400 };
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

  return {
    invoice: {
      currency: "USD",
      nights: nights.length,
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: Number(guests) || 1,
      lineItems,
      subtotal,
      total,
    },
  };
}

// Sanitizes attribution fields coming from the frontend before storage.
export function cleanAttribution(raw: any) {
  const clean = (v: any) => {
    if (typeof v !== "string") return "";
    return v.trim().slice(0, 120);
  };
  return {
    utmSource: clean(raw?.utmSource),
    utmMedium: clean(raw?.utmMedium),
    utmCampaign: clean(raw?.utmCampaign),
    referrer: clean(raw?.referrer),
  };
}
