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
      return Response.json({ reservation, listing });
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchListing(base44, id) {
  try {
    return await base44.asServiceRole.entities.Listing.get(id);
  } catch {
    return null;
  }
}