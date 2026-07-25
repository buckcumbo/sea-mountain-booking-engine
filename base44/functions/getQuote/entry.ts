import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest, clientIp } from '../../shared/rateLimit.ts';
import { priceStay } from '../../shared/pricing.ts';

// Returns a Quote for the listing-page restore flow. Public (no auth): a guest
// follows a recovery link.
//
// - Active and unexpired: returns the quote as stored.
// - Expired: AUTO RE-QUOTE. Re-prices the same listing/dates/guests from
//   current CalendarDay data and returns a fresh 24h quote flagged
//   requoted:true (with previousTotal so the UI can note a price change).
//   The new quote carries the guest email but has recoveryEmailSentAt set,
//   so the hourly recovery job never emails about it again.
// - Expired and no longer priceable (dates unavailable / in the past):
//   returns { expired: true } with checkIn/checkOut for date prefill.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { quoteId } = payload;

    if (!quoteId) {
      return Response.json({ error: "quoteId is required" }, { status: 400 });
    }

    let quote: any = null;
    try {
      quote = await base44.asServiceRole.entities.Quote.get(String(quoteId));
    } catch {
      return Response.json({ expired: true });
    }
    if (!quote) {
      return Response.json({ expired: true });
    }

    const nowMs = Date.now();
    const expired = quote.status !== "active" ||
      (quote.expiresAt && new Date(quote.expiresAt).getTime() <= nowMs);

    if (!expired) {
      return Response.json({
        quoteId: quote.id,
        guestyQuoteId: quote.guestyQuoteId,
        listingId: quote.listingId,
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        guests: quote.guests,
        invoice: quote.invoice,
        expiresAt: quote.expiresAt,
        status: quote.status,
        email: quote.email,
      });
    }

    // Booked quotes are never re-quoted; the guest already completed this stay.
    // Only expired quotes with future check-in dates are eligible.
    const todayIso = new Date().toISOString().slice(0, 10);
    const eligible = quote.status !== "booked" && String(quote.checkIn) > todayIso;
    if (!eligible) {
      return Response.json({ expired: true, checkIn: quote.checkIn, checkOut: quote.checkOut });
    }

    // Rate limit: the re-quote path writes a Quote row, same cap as createQuote.
    if (!(await allowRequest(base44, "requote", clientIp(req), 20, 10))) {
      return Response.json({ expired: true, checkIn: quote.checkIn, checkOut: quote.checkOut });
    }

    const priced = await priceStay(base44, {
      listingId: String(quote.listingId),
      checkIn: String(quote.checkIn),
      checkOut: String(quote.checkOut),
      guests: quote.guests,
    });
    if (priced.error) {
      // Dates no longer available at the same span — fall back to prefill.
      return Response.json({ expired: true, checkIn: quote.checkIn, checkOut: quote.checkOut });
    }

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
    const guestyQuoteId = "mock_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    const fresh = await base44.asServiceRole.entities.Quote.create({
      guestyQuoteId,
      listingId: String(quote.listingId),
      checkIn: String(quote.checkIn),
      checkOut: String(quote.checkOut),
      guests: Number(quote.guests) || 1,
      invoice: priced.invoice,
      expiresAt,
      status: "active",
      email: quote.email || "",
      // Suppress the recovery email for auto re-quotes — the guest is already here.
      recoveryEmailSentAt: nowIso,
      requotedFrom: quote.id,
      utmSource: quote.utmSource || "",
      utmMedium: quote.utmMedium || "",
      utmCampaign: quote.utmCampaign || "",
      referrer: quote.referrer || "",
    });

    if (quote.status === "active") {
      try {
        await base44.asServiceRole.entities.Quote.update(quote.id, { status: "expired" });
      } catch { /* the hourly job will expire it */ }
    }

    return Response.json({
      requoted: true,
      previousTotal: quote.invoice?.total ?? null,
      quoteId: fresh.id,
      guestyQuoteId,
      listingId: fresh.listingId,
      checkIn: fresh.checkIn,
      checkOut: fresh.checkOut,
      guests: fresh.guests,
      invoice: priced.invoice,
      expiresAt,
      status: "active",
      email: fresh.email,
    });
  } catch (error) {
    console.error("[getQuote]", error.message);
    return Response.json({ error: "Could not load this quote." }, { status: 500 });
  }
});
