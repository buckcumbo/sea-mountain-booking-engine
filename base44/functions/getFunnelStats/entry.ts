// getFunnelStats: admin-only booking funnel rollup for the direct site.
// Counts, for the selected window: searches, listing views, quotes created,
// direct reservations. All data is site-side; nothing here exists in Guesty.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.0";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch (_) {
    // no body is fine
  }
  const allowed = [7, 28, 90];
  const days = allowed.includes(Number(payload.days)) ? Number(payload.days) : 28;

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const startIso = start.toISOString();

  const svc = base44.asServiceRole.entities;

  const [searchEvents, listingViews, quotes, reservations] = await Promise.all([
    svc.AnalyticsEvent.filter(
      { eventType: "search", created_date: { $gte: startIso } },
      "-created_date",
      10000,
    ),
    svc.AnalyticsEvent.filter(
      { eventType: "listing_view", created_date: { $gte: startIso } },
      "-created_date",
      10000,
    ),
    svc.Quote.filter({ created_date: { $gte: startIso } }, "-created_date", 10000),
    svc.Reservation.filter(
      { source: "direct", created_date: { $gte: startIso } },
      "-created_date",
      10000,
    ),
  ]);

  const bookedQuotes = quotes.filter((q: { status?: string }) => q.status === "booked").length;

  return Response.json({
    days,
    since: startIso.slice(0, 10),
    searches: searchEvents.length,
    listingViews: listingViews.length,
    quotesCreated: quotes.length,
    quotesBooked: bookedQuotes,
    directReservations: reservations.length,
  });
});
