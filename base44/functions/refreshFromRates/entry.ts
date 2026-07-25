import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Precomputes Listing.fromRate — the lowest upcoming nightly rate — for every
// active listing. Card pricing reads this single field, so browse pages never
// download the (tens of thousands of rows) calendar table. Runs nightly after
// data retention, and can be invoked any time after a calendar sync.
//
// Rate selection: prefer the cheapest AVAILABLE upcoming night; a fully
// booked home falls back to its cheapest upcoming night of any status so it
// still shows an honest indicative price.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const svc = base44.asServiceRole.entities;
    const today = new Date().toISOString().slice(0, 10);
    const all = await svc.Listing.list("-created_date", 500);
    const listings = (Array.isArray(all) ? all : []).filter((l: any) => l.active !== false);

    let updated = 0;
    let cleared = 0;
    for (const listing of listings) {
      try {
        const days = await svc.CalendarDay.filter(
          { listingId: listing.id, date: { $gte: today } },
          "date",
          500,
        );
        let minAvailable: number | null = null;
        let minAny: number | null = null;
        for (const d of Array.isArray(days) ? days : []) {
          const r = Number(d.rate) || 0;
          if (r <= 0) continue;
          if (minAny === null || r < minAny) minAny = r;
          if (d.available === true && (minAvailable === null || r < minAvailable)) minAvailable = r;
        }
        const fromRate = minAvailable ?? minAny;
        if (fromRate != null && listing.fromRate !== fromRate) {
          await svc.Listing.update(listing.id, { fromRate });
          updated++;
        } else if (fromRate == null && listing.fromRate != null) {
          await svc.Listing.update(listing.id, { fromRate: 0 });
          cleared++;
        }
      } catch (e) {
        console.error("[refreshFromRates]", listing.title, e.message);
      }
    }

    const summary = { checked: listings.length, updated, cleared };
    console.log("[refreshFromRates]", JSON.stringify(summary));
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[refreshFromRates]", error.message);
    return Response.json({ error: "Refresh failed" }, { status: 500 });
  }
});