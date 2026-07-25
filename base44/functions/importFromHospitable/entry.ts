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
  // public_name is OTA-styled ("Callahan's Castle | 5BR Beach House w/ Heated
  // Pool") — keep only the clean home name for our site and slugs.
  const rawTitle = p?.public_name || p?.name || "Untitled home";
  const title = String(rawTitle).split("|")[0].trim() || String(p?.name || "Untitled home").trim();
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
      for (const p of list) {
        const images = await fetchImages(token, p.id, p);
        await upsertListingByGuestyId(base44, mapProperty(p, images));
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

    return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  } catch (error) {
    console.error("[importFromHospitable]", error.message);
    return Response.json({ error: `Import failed: ${error.message}` }, { status: 500 });
  }
});