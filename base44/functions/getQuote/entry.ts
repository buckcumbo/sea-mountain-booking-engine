import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns a Quote for the listing-page restore flow. Public (no auth): a guest
// follows a recovery link. Returns the quote fields when active and not yet
// expired. Otherwise returns { expired: true } with checkIn/checkOut when
// available, so the listing page can prefill the same dates.
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

    if (expired) {
      return Response.json({ expired: true, checkIn: quote.checkIn, checkOut: quote.checkOut });
    }

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
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});