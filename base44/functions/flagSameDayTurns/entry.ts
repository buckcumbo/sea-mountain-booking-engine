import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Flags arriving reservations that share a checkout/check-in date with a
// departing reservation on the same listing (a "same-day turn"). Runs daily at
// 6 AM ET via the "Same-Day Turn Flags" workflow, and is callable by admins.
// Adds the "same-day-turn" flag to the ARRIVING reservation only, preserves all
// other flags, and removes the flag where it no longer applies.
const FLAG = "same-day-turn";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    // All reservations: confirmed ones drive matching; any currently flagged
    // ones (incl. canceled) drive cleanup.
    const all = await base44.asServiceRole.entities.Reservation.filter({}, "-checkIn", 5000);
    const reservations = Array.isArray(all) ? all : [];
    const confirmed = reservations.filter((r) => r.status === "confirmed" && r.listingId);

    // Group confirmed reservations by listing.
    const byListing: Record<string, any[]> = {};
    for (const r of confirmed) {
      const lid = String(r.listingId);
      if (!byListing[lid]) byListing[lid] = [];
      byListing[lid].push(r);
    }

    // Arriving B should be flagged when some departing A (same listing,
    // confirmed, different record) has A.checkOut == B.checkIn.
    const shouldFlag = new Set<string>();
    for (const lid of Object.keys(byListing)) {
      const arr = byListing[lid];
      for (const b of arr) {
        for (const a of arr) {
          if (a.id === b.id) continue;
          if (a.checkOut && b.checkIn && a.checkOut === b.checkIn) {
            shouldFlag.add(b.id);
            break;
          }
        }
      }
    }

    const updates: any[] = [];
    let flagged = 0;
    let unflagged = 0;

    for (const r of reservations) {
      const current = Array.isArray(r.flags) ? r.flags : [];
      const hasFlag = current.includes(FLAG);
      const wantsFlag = shouldFlag.has(r.id);
      if (wantsFlag && !hasFlag) {
        updates.push({ id: r.id, flags: [...current, FLAG] });
        flagged++;
      } else if (!wantsFlag && hasFlag) {
        updates.push({ id: r.id, flags: current.filter((f) => f !== FLAG) });
        unflagged++;
      }
    }

    if (updates.length > 0) {
      await base44.asServiceRole.entities.Reservation.bulkUpdate(updates);
    }

    return Response.json({ flagged, unflagged });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});