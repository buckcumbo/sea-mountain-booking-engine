// Session-stable shuffle. Every visitor gets their own random ordering of
// listings, but the order stays fixed for their whole session — so grids
// don't reshuffle when they hit "back", and no one sees the same home at
// the top of every page forever.

const KEY = "smv_shuffle_seed";

export function getSessionSeed() {
  try {
    let s = sessionStorage.getItem(KEY);
    if (!s) {
      s = String(Math.floor(Math.random() * 2147483647));
      sessionStorage.setItem(KEY, s);
    }
    return Number(s) || 42;
  } catch {
    // Storage blocked (private mode edge cases) — stable fallback so the
    // order is at least consistent within the page.
    return 42;
  }
}

// Cheap string hash mixed with the seed → deterministic 32-bit sort key.
function hash(str, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function seededOrder(id, seed) {
  return hash(String(id || ""), seed);
}

export function seededShuffle(arr, seed, keyFn = (x) => x?.id) {
  return [...arr].sort(
    (a, b) => seededOrder(keyFn(a), seed) - seededOrder(keyFn(b), seed)
  );
}
