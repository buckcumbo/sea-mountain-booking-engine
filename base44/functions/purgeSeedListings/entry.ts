import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Removes the pre-Hospitable MOCK seed data: every Listing whose guestyId
// does NOT start with "hosp_", plus that listing's CalendarDay rows. The old
// seeds served their purpose and now squat on clean URL slugs the real homes
// need. Mock Reservations/Quotes are left alone (they degrade gracefully and
// get purged with the Guesty go-live cleanup).
//
// Guarded: requires payload.confirm === "PURGE". Batched: deletes up to
// ~40 listings' worth per call and returns `remaining` — the caller loops.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    if (payload.confirm !== "PURGE") {
      return Response.json({ error: 'Pass { "confirm": "PURGE" } to run this.' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const all = await svc.Listing.list("-created_date", 500);
    const mocks = (Array.isArray(all) ? all : []).filter(
      (l: any) => !String(l.guestyId || "").startsWith("hosp_"),
    );
    const batch = mocks.slice(0, 40);

    let listingsDeleted = 0;
    let daysDeleted = 0;
    for (const l of batch) {
      // Calendar rows first, in pages, so a re-run never orphans anything.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const days = await svc.CalendarDay.filter({ listingId: l.id }, "-date", 200);
        const arr = Array.isArray(days) ? days : [];
        if (arr.length === 0) break;
        for (const d of arr) {
          try { await svc.CalendarDay.delete(d.id); daysDeleted++; } catch (e) {
            console.error("[purgeSeedListings] day delete failed:", d.id, e.message);
          }
        }
      }
      try {
        await svc.Listing.delete(l.id);
        listingsDeleted++;
      } catch (e) {
        console.error("[purgeSeedListings] listing delete failed:", l.id, e.message);
      }
    }

    return Response.json({
      listingsDeleted,
      daysDeleted,
      remaining: mocks.length - batch.length,
    });
  } catch (error) {
    console.error("[purgeSeedListings]", error.message);
    return Response.json({ error: `Purge failed: ${error.message}` }, { status: 500 });
  }
});