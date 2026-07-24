import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { upsertCalendarDay, upsertGuestProfileByEmail } from '../../shared/upserts.ts';

// Public webhook receiver for Guesty events. No auth — logs the payload and returns 200.
// If the payload describes a calendar day (listingId + date) it upserts CalendarDay by listingId+date.
// If the payload carries a guest (payload.guest.email) it upserts GuestProfile by email.
Deno.serve(async (req) => {
  let payload: any = null;
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try { payload = await req.json(); } catch { payload = null; }
    } else {
      try { payload = await req.text(); } catch { payload = null; }
    }
    console.log('[webhookReceiver] received:', JSON.stringify(payload));

    // TODO: verify Guesty webhook signature before processing.
    if (payload && typeof payload === 'object') {
      const base44 = createClientFromRequest(req);

      if (payload.listingId && payload.date) {
        await upsertCalendarDay(base44, {
          listingId: payload.listingId,
          date: payload.date,
          rate: payload.rate,
          available: payload.available,
          minNights: payload.minNights,
          syncedAt: new Date().toISOString(),
        });
        console.log('[webhookReceiver] upserted CalendarDay', payload.listingId, payload.date);
      }

      if (payload.guest && payload.guest.email) {
        await upsertGuestProfileByEmail(base44, payload.guest);
        console.log('[webhookReceiver] upserted GuestProfile', payload.guest.email);
      }
    }

    return Response.json({ received: true, status: 'ok' }, { status: 200 });
  } catch (error) {
    console.log('[webhookReceiver] error:', error.message);
    return Response.json({ received: true, status: 'ok' }, { status: 200 });
  }
});