// Homes the guest swiped left on in the matchmaker — kept client-side in
// localStorage, no PII. Passed homes are hidden from search results until the
// guest brings them back, so "no" actually means something.
const KEY = "smv_passed_listings";

export function getPassedListings() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function addPassedListing(listingId) {
  if (!listingId) return;
  try {
    const cur = getPassedListings();
    if (!cur.includes(listingId)) {
      cur.push(listingId);
      localStorage.setItem(KEY, JSON.stringify(cur));
    }
  } catch {
    // private mode — quietly no-op
  }
}

export function removePassedListing(listingId) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(getPassedListings().filter((id) => id !== listingId))
    );
  } catch {
    // ignore
  }
}

export function clearPassedListings() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}