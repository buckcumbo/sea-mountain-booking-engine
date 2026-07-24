import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { upsertCalendarDay } from '../../shared/upserts.ts';

// Pulls availability + rates from Guesty and upserts CalendarDay rows by listingId+date (unique).
// Rates and availability live ONLY in CalendarDay; money is stored verbatim from Guesty.
// Until guestyFetch returns real Guesty data, callers may pass { days: [...] } to exercise the upsert.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }

    const incoming = Array.isArray(payload?.days) ? payload.days : [];
    let upserted = 0;
    for (const d of incoming) {
      if (!d?.listingId || !d?.date) continue;
      await upsertCalendarDay(base44, d);
      upserted++;
    }

    const days = await base44.asServiceRole.entities.CalendarDay.list();
    return Response.json({
      status: incoming.length ? 'upserted' : 'skeleton',
      message: incoming.length
        ? `${upserted} calendar days upserted by listingId+date`
        : 'syncCalendars awaiting Guesty data; pass { days: [...] } to upsert',
      upserted,
      currentCount: days.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});