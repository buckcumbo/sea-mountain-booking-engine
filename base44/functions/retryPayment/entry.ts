import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// MOCK payment retry for a Reservation whose payment failed. Follows the same
// mock-now / Guesty-later pattern as bookReservation. When Guesty credentials
// arrive, this maps to the Guesty payment intent / charge retry flow and the
// mock token logic below is replaced by Guesty's payment retry endpoint.
//
// IMPORTANT: Guesty payment tokens are SINGLE-USE. Every retry requires a
// freshly tokenized card from the frontend — the original token used for the
// initial booking (or a prior retry attempt) must NEVER be reused. The frontend
// is responsible for re-collecting card details and obtaining a brand-new token
// before each retry call.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { reservationId, paymentToken } = payload;

    // (1) Validate the Reservation exists.
    if (!reservationId) {
      return Response.json({ error: "reservationId is required" }, { status: 400 });
    }
    let reservation: any;
    try {
      reservation = await base44.asServiceRole.entities.Reservation.get(reservationId);
    } catch {
      return Response.json({ error: "Reservation not found" }, { status: 400 });
    }

    // (2) Require a fresh, non-empty payment token (single-use — see header).
    if (!paymentToken || typeof paymentToken !== "string" || paymentToken.trim() === "") {
      return Response.json({ error: "paymentToken is required" }, { status: 400 });
    }

    // (3) Nothing to retry unless payment failed or there is an outstanding balance.
    const currentBalance = Number(reservation.balanceDue) || 0;
    if (reservation.paymentStatus !== "failed" && currentBalance <= 0) {
      return Response.json(
        { error: "Nothing to retry: reservation is not in a failed or unpaid state" },
        { status: 400 },
      );
    }

    const currentFlags: string[] = Array.isArray(reservation.flags) ? [...reservation.flags] : [];

    // (4) MOCK payment. "tok_fail" => retry failed; any other token => success.
    if (paymentToken === "tok_fail") {
      if (!currentFlags.includes("payment-retry-failed")) {
        currentFlags.push("payment-retry-failed");
        await base44.asServiceRole.entities.Reservation.update(reservationId, {
          flags: currentFlags,
        });
      }
      return Response.json({ reservationId, paymentStatus: "failed" }, { status: 402 });
    }

    // (5) Success — clear payment state. Record whether this reservation had
    // already been counted so the GuestProfile is credited at most once.
    const wasAlreadyPaid = reservation.paymentStatus === "paid";
    const cleanedFlags = currentFlags.filter(
      (f) => f !== "unpaid-balance" && f !== "payment-retry-failed",
    );

    await base44.asServiceRole.entities.Reservation.update(reservationId, {
      paymentStatus: "paid",
      balanceDue: 0,
      flags: cleanedFlags,
    });

    // (6) Credit the GuestProfile only on the first successful payment.
    if (!wasAlreadyPaid && reservation.guestProfileId) {
      let guest: any;
      try {
        guest = await base44.asServiceRole.entities.GuestProfile.get(reservation.guestProfileId);
      } catch {
        guest = null;
      }
      if (guest) {
        const totalAmount = Number(reservation.totalAmount) || 0;
        await base44.asServiceRole.entities.GuestProfile.update(guest.id, {
          stayCount: (Number(guest.stayCount) || 0) + 1,
          lifetimeValue: (Number(guest.lifetimeValue) || 0) + totalAmount,
        });
      }
    }

    // (7) Return the retry summary.
    return Response.json({
      reservationId,
      paymentStatus: "paid",
      balanceDue: 0,
      flags: cleanedFlags,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});