import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  upsertListingByGuestyId,
  upsertCalendarDay,
  upsertGuestProfileByEmail,
  upsertReservationByGuestyId,
} from '../../shared/upserts.ts';

// Guesty webhook receiver. Hardened with a shared-secret gate, idempotent
// dedupe (via the WebhookEvent entity), and event-type routing. It is fully
// self-contained — NO external API calls are made here; it only reads/writes
// local entities. It ALWAYS returns 200 (even when processing throws) so Guesty
// does not disable the endpoint on processing errors; failures are recorded as
// WebhookEvent rows with status "failed".
//
// CALENDAR CAVEAT: Guesty does NOT emit listing.calendar.updated events for
// availability changes caused by reservations. When a reservation is created,
// updated, or canceled, Guesty adjusts its internal calendar silently. Therefore
// reservation.new / reservation.updated must refresh the affected CalendarDay
// rows themselves (see routeReservation) — do not rely on a calendar webhook
// for reservation-driven blocks.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // (1) SHARED-SECRET CHECK — FAIL CLOSED. This endpoint performs writes
    // (reservations, calendar availability, listings), so with no secret
    // configured we cannot safely accept anything. Set the WEBHOOK_SECRET
    // project secret to enable the endpoint.
    const secret = Deno.env.get("WEBHOOK_SECRET");
    if (!secret) {
      console.error("[webhookReceiver] WEBHOOK_SECRET is not set — rejecting request");
      return Response.json({ error: "Webhook not configured" }, { status: 503 });
    }
    // Prefer the header; the ?key= query fallback is kept only for senders
    // that cannot set headers (query strings can leak into request logs).
    const key = req.headers.get("x-webhook-key") ?? new URL(req.url).searchParams.get("key");
    if (key !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.text();

    let payload: any = null;
    let parseError: string | null = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch (e) {
      parseError = e.message;
    }

    // (2) DEDUPE — first present id wins; no id -> hash of raw body.
    let eventId: string;
    if (payload && typeof payload === "object") {
      const id = payload.eventId ?? payload.event_id ?? payload.id ?? payload._id;
      eventId = id != null ? String(id) : "no-id-" + hashBody(rawBody);
    } else {
      eventId = "no-id-" + hashBody(rawBody);
    }

    try {
      const existing = await base44.asServiceRole.entities.WebhookEvent.filter(
        { eventId },
        "-created_date",
        1,
      );
      if (existing.length > 0) {
        return Response.json({ status: "duplicate" }, { status: 200 });
      }
    } catch {
      // best-effort dedupe; continue processing
    }

    const rawEvent =
      payload && typeof payload === "object"
        ? (payload.event ?? payload.eventType)
        : null;
    const eventType = rawEvent != null ? String(rawEvent).toLowerCase() : "";

    let status: "processed" | "failed" | "skipped" = "skipped";
    let error: string | null = null;

    try {
      if (parseError || !payload || typeof payload !== "object") {
        throw new Error(parseError || "Invalid JSON payload");
      }
      // (3) ROUTE by event type.
      if (eventType === "") {
        status = "skipped";
      } else if (eventType === "reservation.new" || eventType === "reservation.updated") {
        await routeReservation(base44, payload);
        status = "processed";
      } else if (eventType === "listing.new" || eventType === "listing.updated") {
        await routeListing(base44, payload);
        status = "processed";
      } else if (eventType === "listing.removed") {
        await routeListingRemoved(base44, payload);
        status = "processed";
      } else if (eventType === "listing.calendar.updated" || eventType === "calendar.updated.v2") {
        await routeCalendar(base44, payload);
        status = "processed";
      } else if (
        eventType === "payments.received" ||
        eventType === "payments.failed" ||
        eventType === "payments.refunded" ||
        eventType === "payments.overdue"
      ) {
        await routePayment(base44, payload, eventType);
        status = "processed";
      } else if (eventType.startsWith("guest.")) {
        await routeGuest(base44, payload);
        status = "processed";
      } else {
        status = "skipped";
      }
    } catch (e) {
      status = "failed";
      error = e.message;
    }

    // (4) Always record the outcome (even on failure/skip).
    try {
      await base44.asServiceRole.entities.WebhookEvent.create({
        eventId,
        eventType,
        status,
        error: error || "",
        processedAt: new Date().toISOString(),
        payload: payload && typeof payload === "object" ? payload : { raw: rawBody },
      });
    } catch (e) {
      console.error("[webhookReceiver] failed to record WebhookEvent:", e.message);
    }

    return Response.json({ status }, { status: 200 });
  } catch (error) {
    // Last-resort guard: never surface a non-200 to Guesty.
    console.error("[webhookReceiver] unexpected error:", error.message);
    return Response.json({ status: "failed" }, { status: 200 });
  }
});

// FNV-1a hash — used only for the no-id dedupe fallback; no crypto needed and
// collision tolerance is acceptable for that purpose.
function hashBody(raw: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

async function routeReservation(base44, p: any) {
  const guestyId = p.guestyId ?? p.reservationId ?? p.reservation?._id ?? p.reservation?.id;
  if (!guestyId) throw new Error("reservation event missing guestyId");
  const status = p.status; // stored verbatim
  await upsertReservationByGuestyId(base44, {
    guestyId: String(guestyId),
    listingId: p.listingId != null ? String(p.listingId) : undefined,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    status,
    paymentStatus: p.paymentStatus,
    totalAmount: p.totalAmount != null ? Number(p.totalAmount) : undefined,
    balanceDue: p.balanceDue != null ? Number(p.balanceDue) : undefined,
    source: p.source,
    syncedAt: new Date().toISOString(),
  });
  // Refresh calendar days (see file header) — only for confirmed/canceled.
  if (p.listingId && p.checkIn && p.checkOut && (status === "confirmed" || status === "canceled")) {
    const available = status === "canceled";
    await base44.asServiceRole.entities.CalendarDay.updateMany(
      { listingId: String(p.listingId), date: { $gte: String(p.checkIn), $lt: String(p.checkOut) } },
      { $set: { available } },
    );
  }
}

async function routeListing(base44, p: any) {
  const guestyId = p.guestyId ?? p.id;
  if (!guestyId) throw new Error("listing event missing guestyId");
  // Whitelist Guesty-owned fields only — editorial fields are never touched.
  const data: any = { guestyId: String(guestyId) };
  for (const f of ["title", "bedrooms", "bathrooms", "sleeps", "petFriendly", "amenities", "latitude", "longitude", "active"]) {
    if (p[f] !== undefined) data[f] = p[f];
  }
  if (p.photos !== undefined) data.photos = p.photos; // helper guards photosManaged
  await upsertListingByGuestyId(base44, data);
}

async function routeListingRemoved(base44, p: any) {
  const guestyId = p.guestyId ?? p.id;
  if (!guestyId) throw new Error("listing.removed missing guestyId");
  const existing = await base44.asServiceRole.entities.Listing.filter(
    { guestyId: String(guestyId) },
    "-created_date",
    1,
  );
  if (existing.length > 0) {
    // Soft delete only — never hard delete.
    await base44.asServiceRole.entities.Listing.update(existing[0].id, { active: false });
  }
}

async function routeCalendar(base44, p: any) {
  // Accept a single day object or an array of days.
  let days: any[] | null = null;
  if (Array.isArray(p.days)) days = p.days;
  else if (p.day && typeof p.day === "object") days = [p.day];
  else if (p.listingId && p.date) days = [p];
  if (!days) throw new Error("calendar event missing day data");
  for (const d of days) {
    if (!d || !d.listingId || !d.date) continue;
    await upsertCalendarDay(base44, {
      listingId: String(d.listingId),
      date: String(d.date),
      rate: d.rate,
      available: d.available,
      minNights: d.minNights,
      syncedAt: new Date().toISOString(),
    });
  }
}

async function routePayment(base44, p: any, eventType: string) {
  const guestyId = p.reservationId ?? p.reservation?._id ?? p.reservation?.id;
  if (!guestyId) throw new Error(`${eventType} missing reservation id`);
  const existing = await base44.asServiceRole.entities.Reservation.filter(
    { guestyId: String(guestyId) },
    "-created_date",
    1,
  );
  if (existing.length === 0) throw new Error(`reservation ${guestyId} not found`);
  const r = existing[0];
  const flags: string[] = Array.isArray(r.flags) ? [...r.flags] : [];
  const updates: any = {};
  if (eventType === "payments.received") {
    updates.paymentStatus = "paid";
    updates.balanceDue = 0;
    updates.flags = flags.filter((f) => f !== "unpaid-balance");
  } else if (eventType === "payments.failed" || eventType === "payments.overdue") {
    updates.paymentStatus = "failed";
    if (!flags.includes("unpaid-balance")) flags.push("unpaid-balance");
    updates.flags = flags;
  } else if (eventType === "payments.refunded") {
    updates.paymentStatus = "refunded";
  }
  await base44.asServiceRole.entities.Reservation.update(r.id, updates);
}

async function routeGuest(base44, p: any) {
  const guest = p.guest ?? p;
  if (!guest || !guest.email) throw new Error("guest event missing email");
  await upsertGuestProfileByEmail(base44, guest);
}