import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Skeleton: pulls availability + rates from Guesty and upserts CalendarDay rows.
// Rates and availability live ONLY in CalendarDay; money is stored verbatim from Guesty.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // TODO: per listing, fetch calendar from Guesty, upsert CalendarDay { listing_id, date, available, nightly_rate, min_stay }.
    const days = await base44.asServiceRole.entities.CalendarDay.list();
    return Response.json({
      status: 'skeleton',
      message: 'syncCalendars not yet implemented',
      currentCount: days.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});