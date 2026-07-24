import { parseISO, eachDayOfInterval, subDays, format, startOfDay } from "date-fns";

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
  for (const date of Object.keys(cal)) {
    const day = cal[date];
    if (day.available !== true) continue;
    if (date < today) continue;
    const r = Number(day.rate) || 0;
    if (from === null || r < from) from = r;
  }
  return { hasDates: false, available: true, total: null, avg: null, from };
}