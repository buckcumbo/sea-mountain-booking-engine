import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { upsertListingByGuestyId } from '../../shared/upserts.ts';

// ONE-TIME Hospitable import for pre-Guesty testing. Deliberately NOT a live
// integration: Streamline is the PMS source of truth and the architecture is
// Guesty-shaped, so this seeds realistic Listing + CalendarDay data and
// nothing else. Every imported record carries guestyId "hosp_<uuid>" so
// pre-go-live cleanup is one filter. Guests/reservations are intentionally
// excluded (real PII; no testing value).
//
// Auth: HOSPITABLE_API_KEY project secret (Personal Access Token).
// Modes (payload.mode):
//   "dry-run"   — fetch 3 properties + a 14-day calendar sample; return the
//                 RAW API payloads next to the mapped versions. No writes.
//                 Always run this first to verify field mapping.
//   "listings"  — import one page of properties (payload.page, default 1).
//                 Returns nextPage until done; caller loops.
//   "calendars" — import calendars for hosp_ listings [offset, offset+limit).
//                 Skips listings that already have CalendarDay rows.
const API_BASE = "https://public.api.hospitable.com/v2";

const AREA_BY_CITY: Record<string, string> = {
  "north myrtle beach": "north-myrtle-beach",
  "myrtle beach": "myrtle-beach",
  "surfside beach": "surfside",
  "surfside": "surfside",
  "garden city": "garden-city",
  "garden city beach": "garden-city",
  "murrells inlet": "murrells-inlet",
  "pawleys island": "pawleys-island",
};

function inferArea(p: any): string {
  const city = String(p?.address?.city || "").trim().toLowerCase();
  return AREA_BY_CITY[city] || "myrtle-beach";
}

function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

// Hospitable amounts are integer cents when nested under price objects.
function toDollars(amount: any): number {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Number.isInteger(n) && n >= 1000 ? Math.round(n) / 100 : n;
}

function mapProperty(p: any, photos: any[]): any {
  const coords = p?.address?.coordinates || p?.coordinates || {};
  const lat = Number(coords.latitude ?? p?.address?.latitude);
  const lng = Number(coords.longitude ?? p?.address?.longitude);
  const amenities = Array.isArray(p?.amenities) ? p.amenities.map((a: any) => String(a?.name ?? a)) : [];
  const petFriendly =
    p?.house_rules?.pets_allowed === true ||
    amenities.some((a: string) => a.toLowerCase().includes("pets allowed") || a.toLowerCase() === "pets");
  // Title: prefer Hospitable's internal `name` — it's unique per unit.
  // public_name is OTA-styled and can be a shared generic descriptor across
  // same-building units ("4BR Oceanfront Unit w/ Pool" × 3), which collides
  // slugs. Fall back to public_name stripped of its "| marketing" suffix.
  const title =
    String(p?.name || "").trim() ||
    String(p?.public_name || "").split("|")[0].trim() ||
    "Untitled home";
  return {
    guestyId: `hosp_${p.id}`,
    syncedAt: new Date().toISOString(),
    title,
    slug: slugify(title),
    area: inferArea(p),
    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : {}),
    bedrooms: Number(p?.capacity?.bedrooms) || 0,
    bathrooms: Number(p?.capacity?.bathrooms) || 0,
    sleeps: Number(p?.capacity?.max) || 1,
    petFriendly,
    amenities,
    photos: photos.slice(0, 40).map((ph: any, i: number) => ({
      url: String(ph?.url ?? ph),
      caption: String(ph?.caption || ""),
      order: i,
    })).filter((ph) => ph.url && ph.url.startsWith("http")),
    // Hospitable marks delisted homes listed:false — import them inactive so
    // they never surface in search.
    active: p?.listed !== false,
  };
}

function mapCalendarDay(listingBase44Id: string, d: any): any | null {
  const date = d?.date;
  if (!date) return null;
  const available =
    d?.availability?.available ?? d?.status?.available ?? d?.available ?? (d?.status === "available");
  return {
    listingId: listingBase44Id,
    date: String(date),
    rate: toDollars(d?.price?.amount ?? d?.rate),
    available: available === true,
    minNights: Number(d?.min_stay ?? d?.minimum_stay) || 1,
    syncedAt: new Date().toISOString(),
  };
}

async function hospFetch(token: string, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after")) || 2;
    await new Promise((r) => setTimeout(r, wait * 1000));
    return hospFetch(token, path);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Hospitable ${path} failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  return res.json();
}

async function fetchImages(token: string, propertyId: string, property: any): Promise<any[]> {
  try {
    const res = await hospFetch(token, `/properties/${propertyId}/images`);
    const imgs = Array.isArray(res?.data) ? res.data : [];
    if (imgs.length > 0) return imgs;
  } catch { /* endpoint shape may differ — fall back below */ }
  if (Array.isArray(property?.photos) && property.photos.length) return property.photos;
  if (property?.picture) return [{ url: property.picture }];
  return [];
}

// Amenities hidden from the listing page by default — baseline expectations
// (the brand already promises linens/wifi/basics are always included), not
// selling points. Buck can re-show any of them per listing in the admin
// amenity editor; this list only seeds amenitiesHidden when it's empty.
const NOISE_AMENITIES = new Set([
  "ac", "heating", "hot_water", "essentials", "body_soap", "shower_gel",
  "shampoo", "conditioner", "cleaning_products", "cleaning_before_checkout",
  "baking_sheet", "cooking_basics", "dishes_and_silverware",
  "childrens_dinnerware", "wine_glasses", "toaster", "blender", "coffee",
  "coffee_maker", "microwave", "oven", "stove", "refrigerator", "freezer",
  "hangers", "iron", "hair_dryer", "extra_pillows_and_blankets", "bed_linens",
  "towels", "wardrobe_or_closet", "dining_table", "private_living_room",
  "lock_on_bedroom_door", "portable_fans", "ceiling_fan", "smoke_detector",
  "carbon_monoxide_detector", "fire_extinguisher", "first_aid_kit",
  "ethernet_connection", "internet", "wireless_internet",
  "babysitter_recommendations", "luggage_dropoff_allowed", "high_chair_optional",
]);

// Pull the best description text out of a Hospitable property — the field
// shape varies (plain string vs Airbnb-style object with summary/space).
function extractDescription(p: any): string {
  const d = p?.description;
  const parts: string[] = [];
  const push = (v: any) => {
    const s = typeof v === "string" ? v.trim() : "";
    if (s && !parts.includes(s)) parts.push(s);
  };
  if (typeof d === "string") push(d);
  if (d && typeof d === "object") {
    push(d.summary); push(d.space); push(d.description); push(d.neighborhood);
  }
  push(p?.summary);
  if (parts.length === 0 && p?.details) {
    push(p.details.description); push(p.details.summary);
  }
  // Channel listings (include=listings) often carry the guest-facing copy
  // when the property object itself doesn't.
  if (parts.length === 0 && Array.isArray(p?.listings)) {
    for (const ch of p.listings) {
      const cd = ch?.description;
      if (typeof cd === "string") push(cd);
      if (cd && typeof cd === "object") { push(cd.summary); push(cd.space); push(cd.description); }
      push(ch?.summary);
      if (parts.length > 0) break;
    }
  }
  return parts.join("\n\n").slice(0, 8000);
}

// Base name for sibling grouping: "Surf Sun Pura Vida - 3" and "Sea House
// Villas: Unit B2 (The Waypoint)" group under their shared building name.
function baseName(title: string): string {
  return String(title || "")
    .split(/[:\-(]| Unit /i)[0]
    .trim()
    .toLowerCase();
}

function isoDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    // Secret name per Buck's dashboard entry (HOSPITABLE_API_KEY kept as a
    // fallback in case it gets renamed to match convention later).
    const token = Deno.env.get("HOSPITABLE_SECRET") || Deno.env.get("HOSPITABLE_API_KEY");
    if (!token) {
      return Response.json(
        { error: "HOSPITABLE_SECRET secret is not set. Add it in the dashboard, then retry." },
        { status: 503 },
      );
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const mode = String(payload.mode || "dry-run");
    const svc = base44.asServiceRole.entities;

    if (mode === "dry-run") {
      const props = await hospFetch(token, `/properties?per_page=3&page=1&include=details`);
      const list = Array.isArray(props?.data) ? props.data : [];
      const first = list[0] || null;
      let rawCalendar = null;
      let mappedCalendar: any[] = [];
      let images: any[] = [];
      if (first) {
        images = await fetchImages(token, first.id, first);
        try {
          rawCalendar = await hospFetch(
            token,
            `/properties/${first.id}/calendar?start_date=${isoDate(0)}&end_date=${isoDate(14)}`,
          );
          const days = rawCalendar?.data?.days || rawCalendar?.data || [];
          mappedCalendar = (Array.isArray(days) ? days : []).slice(0, 5)
            .map((d: any) => mapCalendarDay("<listing-id>", d)).filter(Boolean);
        } catch (e) {
          rawCalendar = { error: e.message };
        }
      }
      return Response.json({
        mode,
        totalProperties: props?.meta?.total ?? props?.total ?? list.length,
        rawFirstProperty: first,
        rawFirstImages: images.slice(0, 2),
        mappedFirstProperty: first ? mapProperty(first, images) : null,
        rawCalendarSample: rawCalendar,
        mappedCalendarSample: mappedCalendar,
        note: "No writes performed. Check every mapped field against the raw payload before importing.",
      });
    }

    if (mode === "listings") {
      const page = Number(payload.page) || 1;
      const res = await hospFetch(token, `/properties?per_page=25&page=${page}&include=details`);
      const list = Array.isArray(res?.data) ? res.data : [];
      let imported = 0;
      const runSlugs = new Map<string, string>(); // slug -> guestyId (this invocation)
      for (const p of list) {
        const images = await fetchImages(token, p.id, p);
        const mapped = mapProperty(p, images);
        // Hard uniqueness guard: a slug is one URL — two homes must never
        // share it. Suffix -2, -3, … on collision with a different home.
        const baseSlug = mapped.slug || "home";
        let candidate = baseSlug;
        let n = 2;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const inRun = runSlugs.get(candidate);
          if (inRun && inRun !== mapped.guestyId) { candidate = `${baseSlug}-${n++}`; continue; }
          const existing = await svc.Listing.filter({ slug: candidate }, "-created_date", 1);
          const row = Array.isArray(existing) && existing[0];
          if (row && row.guestyId !== mapped.guestyId) { candidate = `${baseSlug}-${n++}`; continue; }
          break;
        }
        mapped.slug = candidate;
        runSlugs.set(candidate, mapped.guestyId);
        await upsertListingByGuestyId(base44, mapped);
        imported++;
      }
      const lastPage = res?.meta?.last_page ?? (list.length < 25 ? page : page + 1);
      const nextPage = page < lastPage ? page + 1 : null;
      return Response.json({ mode, page, imported, nextPage });
    }

    if (mode === "calendars") {
      const offset = Number(payload.offset) || 0;
      const limit = Math.min(Number(payload.limit) || 5, 10);
      const months = Math.min(Number(payload.months) || 12, 18);
      const all = await svc.Listing.list("-created_date", 500);
      const hosp = (Array.isArray(all) ? all : [])
        .filter((l: any) => String(l.guestyId || "").startsWith("hosp_"))
        .sort((a: any, b: any) => String(a.guestyId).localeCompare(String(b.guestyId)));
      const batch = hosp.slice(offset, offset + limit);

      const results: any[] = [];
      for (const listing of batch) {
        const existing = await svc.CalendarDay.filter({ listingId: listing.id }, "-date", 1);
        if (Array.isArray(existing) && existing.length > 0) {
          results.push({ listing: listing.title, skipped: "already has calendar rows" });
          continue;
        }
        const propertyId = String(listing.guestyId).slice(5);
        const cal = await hospFetch(
          token,
          `/properties/${propertyId}/calendar?start_date=${isoDate(0)}&end_date=${isoDate(months * 30)}`,
        );
        const days = cal?.data?.days || cal?.data || [];
        const rows = (Array.isArray(days) ? days : [])
          .map((d: any) => mapCalendarDay(listing.id, d))
          .filter(Boolean);
        let created = 0;
        try {
          await svc.CalendarDay.bulkCreate(rows);
          created = rows.length;
        } catch {
          for (const r of rows) {
            try { await svc.CalendarDay.create(r); created++; } catch (e) {
              console.error("[importFromHospitable] day create failed:", listing.id, r.date, e.message);
            }
          }
        }
        results.push({ listing: listing.title, days: created });
      }

      const nextOffset = offset + limit < hosp.length ? offset + limit : null;
      return Response.json({ mode, totalHospListings: hosp.length, offset, results, nextOffset });
    }

    // Merge editorial content from the ORIGINAL hand-built records into their
    // same-named Hospitable twins. The originals carry the real descriptions,
    // sleeps-where, beach-walk times, and collection assignments — the hosp_
    // imports arrived bare. Copies each field only when the hosp record's is
    // empty. Run BEFORE purging the old seeds (they're the donors).
    if (mode === "merge-legacy") {
      const normalize = (t: string) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const all = await svc.Listing.list("-created_date", 500);
      const rows = Array.isArray(all) ? all : [];
      const hosp = rows.filter((l: any) => String(l.guestyId || "").startsWith("hosp_"));
      const legacy = rows.filter((l: any) => !String(l.guestyId || "").startsWith("hosp_"));
      const byNorm = new Map<string, any>();
      for (const l of legacy) {
        const key = normalize(l.title);
        if (!key) continue;
        const existing = byNorm.get(key);
        // Prefer the donor that actually has copy.
        if (!existing || (!existing.storyCopy && l.storyCopy)) byNorm.set(key, l);
      }

      const EDITORIAL_FIELDS = [
        "storyCopy", "sleepsWhere", "beachWalkMinutes", "featured",
        "collections", "revaWidgetId", "videoUrl", "tourUrl",
      ];
      const isEmpty = (v: any) =>
        v == null || v === "" || v === false || (Array.isArray(v) && v.length === 0);

      let merged = 0;
      const unmatched: string[] = [];
      for (const h of hosp) {
        const donor = byNorm.get(normalize(h.title));
        if (!donor) { unmatched.push(h.title); continue; }
        const updates: any = {};
        for (const f of EDITORIAL_FIELDS) {
          if (!isEmpty(donor[f]) && isEmpty(h[f])) updates[f] = donor[f];
        }
        if (Object.keys(updates).length > 0) {
          await svc.Listing.update(h.id, updates);
          merged++;
        }
      }
      return Response.json({ mode, merged, matchedDonors: hosp.length - unmatched.length, unmatched });
    }

    // Descriptions + amenity curation for already-imported hosp_ listings.
    // storyCopy and amenitiesHidden are editorial fields: each is written
    // ONLY when currently empty, so manual edits are never clobbered.
    if (mode === "enrich") {
      const offset = Number(payload.offset) || 0;
      const limit = Math.min(Number(payload.limit) || 15, 25);
      const all = await svc.Listing.list("-created_date", 500);
      const hosp = (Array.isArray(all) ? all : [])
        .filter((l: any) => String(l.guestyId || "").startsWith("hosp_"))
        .sort((a: any, b: any) => String(a.guestyId).localeCompare(String(b.guestyId)));
      const batch = hosp.slice(offset, offset + limit);

      let described = 0;
      let curated = 0;
      let debugKeys: string[] | null = null;
      for (const listing of batch) {
        const updates: any = {};
        // Amenity curation — seed hidden list from the noise set.
        const hasHidden = Array.isArray(listing.amenitiesHidden) && listing.amenitiesHidden.length > 0;
        if (!hasHidden && Array.isArray(listing.amenities)) {
          const hidden = listing.amenities.filter((a: string) =>
            NOISE_AMENITIES.has(String(a).toLowerCase()),
          );
          if (hidden.length > 0) { updates.amenitiesHidden = hidden; curated++; }
        }
        // Description — fetch from Hospitable only when storyCopy is empty.
        if (!listing.storyCopy || String(listing.storyCopy).trim() === "") {
          const propertyId = String(listing.guestyId).slice(5);
          try {
            const res = await hospFetch(token, `/properties/${propertyId}?include=details,listings`);
            const prop = res?.data || res;
            const text = extractDescription(prop);
            if (text) {
              updates.storyCopy = text;
              described++;
            } else if (!debugKeys) {
              // Self-diagnosis: when no description is found, report the shape
              // so the mapping can be fixed without guesswork.
              debugKeys = Object.keys(prop || {});
            }
          } catch (e) {
            console.error("[importFromHospitable] description fetch failed:", listing.title, e.message);
          }
        }
        if (Object.keys(updates).length > 0) {
          await svc.Listing.update(listing.id, updates);
        }
      }

      const nextOffset = offset + limit < hosp.length ? offset + limit : null;
      return Response.json({
        mode, offset, described, curated, nextOffset, totalHospListings: hosp.length,
        ...(debugKeys ? { noDescriptionFoundKeys: debugKeys } : {}),
      });
    }

    // After enrich: same-building units share copy — a unit still missing a
    // description borrows its sibling's. No Hospitable calls; one pass.
    if (mode === "sibling-fill") {
      const all = await svc.Listing.list("-created_date", 500);
      const hosp = (Array.isArray(all) ? all : []).filter((l: any) =>
        String(l.guestyId || "").startsWith("hosp_"),
      );
      const byBase = new Map<string, any[]>();
      for (const l of hosp) {
        const key = baseName(l.title);
        if (!key) continue;
        const arr = byBase.get(key) || [];
        arr.push(l);
        byBase.set(key, arr);
      }
      let filled = 0;
      for (const group of byBase.values()) {
        if (group.length < 2) continue;
        const donor = group.find((l) => l.storyCopy && String(l.storyCopy).trim() !== "");
        if (!donor) continue;
        for (const l of group) {
          if (l.id === donor.id) continue;
          if (l.storyCopy && String(l.storyCopy).trim() !== "") continue;
          await svc.Listing.update(l.id, { storyCopy: donor.storyCopy });
          filled++;
        }
      }
      return Response.json({ mode, filled });
    }

    return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  } catch (error) {
    console.error("[importFromHospitable]", error.message);
    return Response.json({ error: `Import failed: ${error.message}` }, { status: 500 });
  }
});