// Recently-viewed listings, kept client-side in localStorage — no PII, no
// server round-trips, survives the session. Capped and deduped, newest first.
const KEY = "smv_recently_viewed";
const CAP = 8;

export function getRecentlyViewed() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(listingId) {
  if (!listingId) return;
  try {
    const cur = getRecentlyViewed().filter((id) => id !== listingId);
    cur.unshift(listingId);
    localStorage.setItem(KEY, JSON.stringify(cur.slice(0, CAP)));
  } catch {
    // localStorage unavailable (private mode) — feature quietly no-ops
  }
}