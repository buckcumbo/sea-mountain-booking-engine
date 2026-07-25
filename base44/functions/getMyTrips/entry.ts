import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns the logged-in user's reservations (resolved via GuestProfile.email),
// joined with Listing data for display. Runs as service role so guest users can
// read their own reservations without changing Reservation/GuestProfile RLS.
// Display only — no payment/refund/cancel/modify logic.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const reservationId = payload.reservationId || null;

    const profiles = await base44.asServiceRole.entities.GuestProfile.filter({ email: user.email });
    const profile = profiles && profiles[0];
    if (!profile) {
      return Response.json({ reservations: [] });
    }

    if (reservationId) {
      let reservation = null;
      try { reservation = await base44.asServiceRole.entities.Reservation.get(reservationId); } catch { /* not found */ }
      if (!reservation || reservation.guestProfileId !== profile.id) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
      const listing = reservation.listingId ? await fetchListing(base44, reservation.listingId) : null;

      // Trip-portal property info, gated by reservation state and proximity:
      //   - address / parking / check-in notes: once confirmed
      //   - wifi + house manual: within 7 days of check-in (credentials should
      //     not float around inboxes weeks ahead)
      // PropertyInfo RLS is admin-only; this service-role read is the only
      // guest-facing path, so the gating lives here.
      let propertyInfo = null;
      const status = String(reservation.status || '').toLowerCase();
      const confirmed = status === 'confirmed' || status === 'checked_in';
      if (confirmed && reservation.listingId) {
        try {
          const infos = await base44.asServiceRole.entities.PropertyInfo.filter(
            { listingId: String(reservation.listingId) },
            '-created_date',
            1,
          );
          const info = infos && infos[0];
          if (info) {
            const msPerDay = 24 * 60 * 60 * 1000;
            const daysToCheckIn = Math.ceil(
              (new Date(String(reservation.checkIn) + 'T00:00:00Z').getTime() - Date.now()) / msPerDay,
            );
            const nearArrival = daysToCheckIn <= 7;
            propertyInfo = {
              address: info.address || null,
              parkingInfo: info.parkingInfo || null,
              checkInNotes: info.checkInNotes || null,
              wifiName: nearArrival ? (info.wifiName || null) : null,
              wifiPassword: nearArrival ? (info.wifiPassword || null) : null,
              houseManual: nearArrival ? (info.houseManual || null) : null,
              wifiLocked: !nearArrival && Boolean(info.wifiName || info.wifiPassword),
            };
          }
        } catch (e) {
          console.error('[getMyTrips] propertyInfo lookup failed:', e.message);
        }
      }

      return Response.json({ reservation, listing, propertyInfo });
    }

    const reservations = await base44.asServiceRole.entities.Reservation.filter(
      { guestProfileId: profile.id },
      '-checkIn',
      500
    );
    const listingIds = [...new Set(reservations.map((r) => r.listingId).filter(Boolean))];
    const listingMap = {};
    await Promise.all(listingIds.map(async (id) => {
      const l = await fetchListing(base44, id);
      if (l) listingMap[id] = l;
    }));
    return Response.json({
      reservations: reservations.map((r) => ({ reservation: r, listing: listingMap[r.listingId] || null })),
    });
  } catch (error) {
    // Full detail stays server-side; clients get a friendly message.
    console.error("[getMyTrips]", error.message);
    return Response.json({ error: "Could not load your trips. Please try again." }, { status: 500 });
  }
});

async function fetchListing(base44, id) {
  try {
    return await base44.asServiceRole.entities.Listing.get(id);
  } catch {
    return null;
  }
}