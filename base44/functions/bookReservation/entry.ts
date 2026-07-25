import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// MOCK reservation booker. Converts an active Quote into a Reservation using
// the same mock-now / Guesty-later pattern as createQuote. When Guesty
// credentials arrive, this maps to:
//   POST /reservations/quotes/{quoteId}/instant  (Guesty Booking Engine API)
// and the mock payment token logic below is replaced by Guesty's payment
// intent flow. NOTE: payment tokens are single-use — a retry after a failed
// or completed charge must be issued a fresh token.
//
// Guesty gotcha encoded here: a Reservation is created EVEN when payment
// fails (Guesty behaves this way) — it is recorded with paymentStatus
// "failed", balanceDue equal to the full total, and a ["unpaid-balance"]
// flag. On success: paymentStatus "paid", balanceDue 0, no flags.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const { quoteId, guest, paymentToken } = payload;

    if (!quoteId) {
      return Response.json({ error: "quoteId is required" }, { status: 400 });
    }

    // (2) Validate guest fields.
    const firstName = guest?.firstName;
    const lastName = guest?.lastName;
    const email = guest?.email;
    const phone = guest?.phone;
    if (!firstName || !lastName || !email) {
      return Response.json({ error: "guest.firstName, guest.lastName and guest.email are required" }, { status: 400 });
    }

    // (1) Validate the Quote exists, is active, and not expired.
    let quote: any;
    try {
      quote = await base44.asServiceRole.entities.Quote.get(quoteId);
    } catch {
      return Response.json({ error: "Quote not found" }, { status: 400 });
    }
    if (!quote || quote.status !== "active") {
      return Response.json({ error: `Quote is not bookable (status: ${quote?.status || "unknown"})` }, { status: 400 });
    }
    if (quote.expiresAt && new Date(quote.expiresAt).getTime() <= Date.now()) {
      return Response.json({ error: "Quote has expired" }, { status: 400 });
    }

    // (3) MOCK payment. "tok_fail" => failed; any other non-empty token => paid.
    if (!paymentToken || typeof paymentToken !== "string" || paymentToken.trim() === "") {
      return Response.json({ error: "paymentToken is required" }, { status: 400 });
    }
    const paymentOk = paymentToken !== "tok_fail";

    // Total taken verbatim from the Quote invoice — never recomputed.
    const totalAmount = Number(quote.invoice?.total) || 0;
    const paymentStatus = paymentOk ? "paid" : "failed";
    const balanceDue = paymentOk ? 0 : totalAmount;
    const flags = paymentOk ? [] : ["unpaid-balance"];

    // (4) Upsert GuestProfile by email (unique in code).
    let guestProfile: any;
    const existing = await base44.asServiceRole.entities.GuestProfile.filter(
      { email },
      "-created_date",
      1,
    );
    if (existing.length === 0) {
      guestProfile = await base44.asServiceRole.entities.GuestProfile.create({
        email,
        firstName,
        lastName,
        phone: phone || "",
        stayCount: paymentOk ? 1 : 0,
        lifetimeValue: paymentOk ? totalAmount : 0,
      });
    } else {
      const cur = existing[0];
      const updates: any = { firstName, lastName, phone: phone || "" };
      if (paymentOk) {
        updates.stayCount = (Number(cur.stayCount) || 0) + 1;
        updates.lifetimeValue = (Number(cur.lifetimeValue) || 0) + totalAmount;
      }
      guestProfile = await base44.asServiceRole.entities.GuestProfile.update(cur.id, updates);
    }

    // (5) Create the Reservation.
    const guestyId = "mock-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const reservation = await base44.asServiceRole.entities.Reservation.create({
      guestyId,
      syncedAt: new Date().toISOString(),
      listingId: String(quote.listingId),
      guestProfileId: guestProfile.id,
      checkIn: String(quote.checkIn),
      checkOut: String(quote.checkOut),
      status: "confirmed",
      paymentStatus,
      totalAmount,
      balanceDue,
      source: "direct",
      flags,
    });

    // (6) Mark the Quote as booked.
    await base44.asServiceRole.entities.Quote.update(quoteId, { status: "booked" });

    // (7) Block the CalendarDay rows for [checkIn, checkOut).
    await base44.asServiceRole.entities.CalendarDay.updateMany(
      { listingId: String(quote.listingId), date: { $gte: String(quote.checkIn), $lt: String(quote.checkOut) } },
      { $set: { available: false } },
    );

    // (8) Return the booking summary.
    return Response.json({
      reservationId: reservation.id,
      guestyId,
      status: "confirmed",
      paymentStatus,
      totalAmount,
      balanceDue,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});