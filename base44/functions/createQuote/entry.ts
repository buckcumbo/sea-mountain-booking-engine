import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest, clientIp } from '../../shared/rateLimit.ts';
import { priceStay, cleanAttribution } from '../../shared/pricing.ts';

// MOCK quote generator. No Guesty credentials yet. Pricing math lives in
// shared/pricing.ts (also used by getQuote's auto re-quote). Creates a Quote
// entity row (status active, expires 24h from now) stamped with first-touch
// attribution when the frontend provides it.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { listingId, checkIn, checkOut, guests } = payload;

    // Rate limit: public unauthenticated endpoint that writes a Quote row per
    // call — cap per-IP so it can't be used to flood the entity or burn quota.
    if (!(await allowRequest(base44, "createQuote", clientIp(req), 20, 10))) {
      return Response.json({ error: "Too many quote requests. Please try again in a few minutes." }, { status: 429 });
    }

    const priced = await priceStay(base44, { listingId, checkIn, checkOut, guests });
    if (priced.error) {
      return Response.json({ error: priced.error }, { status: priced.status || 400 });
    }
    const invoice = priced.invoice;

    const attribution = cleanAttribution(payload.attribution);

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
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      referrer: attribution.referrer,
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
