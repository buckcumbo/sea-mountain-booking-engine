import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { allowRequest } from '../../shared/rateLimit.ts';

// Early check-in / late checkout requests from the guest trip portal.
// Ops rules (ops-playbooks): the portal takes the request ANYTIME but staff
// can only confirm day-of (early) or day-before (late), because the decision
// depends on the Breezeway turn schedule. This function:
//   1. verifies the logged-in guest owns the reservation (via GuestProfile email)
//   2. adds a request flag to the reservation (visible on the Today board)
//   3. creates a trip-request Inquiry so admins are emailed by the existing
//      Inquiry Alerts workflow
// No fees are charged and nothing is auto-approved — staff make the call.
const REQUEST_TYPES: Record<string, { flag: string; label: string }> = {
  "early-checkin": { flag: "early-checkin-requested", label: "Early check-in" },
  "late-checkout": { flag: "late-checkout-requested", label: "Late checkout" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Please log in to send a request." }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { reservationId, requestType, note } = payload;

    const spec = REQUEST_TYPES[String(requestType)];
    if (!reservationId || !spec) {
      return Response.json({ error: "reservationId and a valid requestType are required" }, { status: 400 });
    }

    if (!(await allowRequest(base44, "submitTripRequest", String(user.email), 5, 60))) {
      return Response.json({ error: "Too many requests. Give us a call instead." }, { status: 429 });
    }

    // Ownership check — same pattern as getMyTrips.
    const profiles = await base44.asServiceRole.entities.GuestProfile.filter({ email: user.email }, "-created_date", 1);
    const profile = profiles && profiles[0];
    if (!profile) return Response.json({ error: "Reservation not found" }, { status: 404 });

    let reservation: any = null;
    try { reservation = await base44.asServiceRole.entities.Reservation.get(String(reservationId)); } catch { /* not found */ }
    if (!reservation || reservation.guestProfileId !== profile.id) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    const flags: string[] = Array.isArray(reservation.flags) ? [...reservation.flags] : [];
    if (flags.includes(spec.flag)) {
      return Response.json({ ok: true, alreadyRequested: true, flags });
    }
    flags.push(spec.flag);
    await base44.asServiceRole.entities.Reservation.update(reservation.id, { flags });

    // Listing title for a readable admin alert.
    let listingTitle = reservation.listingId;
    try {
      const listing = await base44.asServiceRole.entities.Listing.get(String(reservation.listingId));
      if (listing?.title) listingTitle = listing.title;
    } catch { /* keep id */ }

    const cleanNote = note ? String(note).trim().slice(0, 500) : "";
    await base44.asServiceRole.entities.Inquiry.create({
      type: "trip-request",
      name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || user.email,
      email: user.email,
      phone: profile.phone || "",
      message: [
        `${spec.label} request`,
        `Property: ${listingTitle}`,
        `Stay: ${reservation.checkIn} to ${reservation.checkOut}`,
        `Reservation: ${reservation.id}`,
        cleanNote ? `Guest note: ${cleanNote}` : null,
      ].filter(Boolean).join("\n"),
    });

    return Response.json({ ok: true, flags });
  } catch (error) {
    console.error("[submitTripRequest]", error.message);
    return Response.json({ error: "Something went wrong sending your request. Please call us." }, { status: 500 });
  }
});