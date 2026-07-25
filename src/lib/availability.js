import { parseISO, eachDayOfInterval, subDays, addDays, format, startOfDay } from "date-fns";

export const AREA_LABELS = {
  "north-myrtle-beach": "North Myrtle Beach",
  "myrtle-beach": "Myrtle Beach",
  surfside: "Surfside Beach",
  "garden-city": "Garden City",
  "pawleys-island": "Pawleys Island",
  "murrells-inlet": "Murrells Inlet",
};

// Mock map coordinates (x%, y%) for the stylized Grand Strand coastline.
export const AREA_COORDS = {
  "north-myrtle-beach": { x: 28, y: 16 },
  "myrtle-beach": { x: 33, y: 38 },
  surfside: { x: 37, y: 58 },
  "garden-city": { x: 40, y: 70 },
  "murrells-inlet": { x: 44, y: 80 },
  "pawleys-island": { x: 34, y: 92 },
};

// Real-world approximate center coordinates for each area — used as a fallback
// map center when a listing lacks valid lat/lng.
export const AREA_CENTER_COORDS = {
  "north-myrtle-beach": { lat: 33.8216, lng: -78.6558 },
  "myrtle-beach": { lat: 33.6891, lng: -78.8867 },
  surfside: { lat: 33.6039, lng: -78.9715 },
  "garden-city": { lat: 33.576, lng: -79.004 },
  "murrells-inlet": { lat: 33.5518, lng: -79.0476 },
  "pawleys-island": { lat: 33.428, lng: -79.119 },
};

export const isValidCoord = (latitude, longitude) =>
  typeof latitude === "number" &&
  typeof longitude === "number" &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

export const prettifyArea = (slug) =>
  AREA_LABELS[slug] || (slug || "").replace(/-/g, " ");

export const prettifyCollection = (slug) =>
  (slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Group CalendarDay rows by listingId -> { 'YYYY-MM-DD': day }
export function buildCalendarMap(days) {
  const map = {};
  for (const d of days) {
    if (!map[d.listingId]) map[d.listingId] = {};
    map[d.listingId][d.date] = d;
  }
  return map;
}

// Availability + price logic. Reads ONLY stored CalendarDay rows.
//  - With dates: every night in [checkIn, checkOut) must have available:true,
//    and the check-in night's minNights must be <= stay length. Price = sum of rates.
//  - Without dates: lowest stored upcoming available rate.
export function computeListingPrice(listing, calendarMap, checkIn, checkOut) {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const cal = calendarMap[listing.id] || {};
  const hasDates = !!(
    checkIn &&
    checkOut &&
    parseISO(checkOut) > parseISO(checkIn)
  );

  if (hasDates) {
    const start = parseISO(checkIn);
    const end = subDays(parseISO(checkOut), 1);
    const nights = eachDayOfInterval({ start, end }).map((d) =>
      format(d, "yyyy-MM-dd")
    );
    const stayLen = nights.length;
    let total = 0;
    let allAvailable = true;
    for (const date of nights) {
      const day = cal[date];
      if (!day || day.available !== true) {
        allAvailable = false;
        break;
      }
      total += Number(day.rate) || 0;
    }
    const checkInDay = cal[nights[0]];
    const minNightsOk = checkInDay
      ? (Number(checkInDay.minNights) || 1) <= stayLen
      : true;
    const avg = stayLen > 0 ? Math.round(total / stayLen) : 0;
    return { hasDates: true, available: allAvailable && minNightsOk, total, avg, stayLen };
  }

  let from = null;
  let fromAnyDay = null;
  for (const date of Object.keys(cal)) {
    const day = cal[date];
    if (date < today) continue;
    const r = Number(day.rate) || 0;
    if (r > 0 && (fromAnyDay === null || r < fromAnyDay)) fromAnyDay = r;
    if (day.available !== true) continue;
    if (r > 0 && (from === null || r < from)) from = r;
  }
  // A fully-booked home still has real nightly rates — show the indicative
  // "from" price rather than "Rates on request" (availability is enforced at
  // date selection anyway). When no calendar rows are loaded client-side
  // (browse pages don't fetch the calendar at all anymore), fall back to the
  // precomputed Listing.fromRate maintained by the nightly refresh.
  const precomputed = Number(listing?.fromRate) > 0 ? Number(listing.fromRate) : null;
  return { hasDates: false, available: true, total: null, avg: null, from: from ?? fromAnyDay ?? precomputed };
}

// Flexible-date search: when the exact dates don't work, slide the same stay
// length up to ±flexDays and return the nearest available window (cheapest
// wins at equal distance). Runs entirely on stored CalendarDay data — no
// network calls. Returns the exact-date result untouched when it's available
// or when flex is off.
export function computeFlexiblePrice(listing, calendarMap, checkIn, checkOut, flexDays = 0) {
  const exact = computeListingPrice(listing, calendarMap, checkIn, checkOut);
  if (!checkIn || !checkOut || !flexDays || !exact.hasDates) return exact;
  if (exact.available) {
    return { ...exact, matchedCheckIn: checkIn, matchedCheckOut: checkOut, shifted: false };
  }
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  for (let off = 1; off <= flexDays; off++) {
    let best = null;
    for (const sign of [-1, 1]) {
      const ci = format(addDays(start, sign * off), "yyyy-MM-dd");
      const co = format(addDays(end, sign * off), "yyyy-MM-dd");
      if (ci < today) continue;
      const p = computeListingPrice(listing, calendarMap, ci, co);
      if (p.available && (best === null || p.total < best.total)) {
        best = { ...p, matchedCheckIn: ci, matchedCheckOut: co, shifted: true };
      }
    }
    if (best) return best; // smallest shift wins
  }
  return exact;
}

// "Jul 3 – Jul 10" from two yyyy-MM-dd strings.
export function prettifyDateRange(checkIn, checkOut) {
  try {
    const f = (iso) => format(parseISO(iso), "MMM d");
    return `${f(checkIn)} – ${f(checkOut)}`;
  } catch {
    return `${checkIn} – ${checkOut}`;
  }
}

// Honest scarcity: of the next `windowDays` nights with calendar data, how
// many are still open? Only ever surfaced when the numbers are literally true.
export function openNightsInWindow(cal, windowDays = 60) {
  const start = startOfDay(new Date());
  let open = 0;
  let tracked = 0;
  for (let i = 0; i < windowDays; i++) {
    const ds = format(addDays(start, i), "yyyy-MM-dd");
    const day = cal[ds];
    if (!day) continue;
    tracked++;
    if (day.available === true) open++;
  }
  return { open, tracked, windowDays };
}