// Lightweight per-visitor ranking — the core mechanic of tools like
// Aidaptive, built on signals we already collect client-side:
//   likes    = hearted homes + recently viewed (viewed counts half)
//   dislikes = match-deck left swipes
// A taste profile (areas, collections, size, pet need) is built from the
// liked homes' attributes, then candidates score by similarity. No PII, no
// server calls, no black box: a new visitor with no history scores all
// zeros and gets exactly the old behavior.

import { getRecentlyViewed } from "@/lib/recentlyViewed";
import { getPassedListings } from "@/lib/passedListings";

// Build a taste profile from the visitor's liked/viewed/passed homes.
// `allListings` supplies attributes; `favoriteIds` from FavoritesContext.
export function buildTasteProfile(allListings, favoriteIds) {
  const byId = new Map(allListings.map((l) => [l.id, l]));
  const weigh = (ids, w) =>
    ids.map((id) => [byId.get(id), w]).filter(([l]) => l);

  const liked = [
    ...weigh(favoriteIds || [], 1),
    ...weigh(getRecentlyViewed(), 0.5),
  ];
  const passed = weigh(getPassedListings(), 1);
  if (liked.length === 0 && passed.length === 0) return null;

  const profile = {
    areas: {},
    collections: {},
    bedrooms: 0,
    bedroomsWeight: 0,
    petFriendly: 0,
    likedIds: new Set(liked.map(([l]) => l.id)),
  };
  const bump = (map, key, w) => {
    if (key) map[key] = (map[key] || 0) + w;
  };
  for (const [l, w] of liked) {
    bump(profile.areas, l.area, w);
    for (const c of l.collections || []) bump(profile.collections, c, w);
    if (Number(l.bedrooms) > 0) {
      profile.bedrooms += Number(l.bedrooms) * w;
      profile.bedroomsWeight += w;
    }
    if (l.petFriendly) profile.petFriendly += w;
  }
  // Dislikes subtract from the same features — a left swipe on three channel
  // homes quietly demotes channel homes, it doesn't ban them.
  for (const [l, w] of passed) {
    bump(profile.areas, l.area, -0.5 * w);
    for (const c of l.collections || []) bump(profile.collections, c, -0.5 * w);
  }
  return profile;
}

// Similarity score for one candidate. Bounded and interpretable.
export function tasteScore(listing, profile) {
  if (!profile) return 0;
  let score = 0;
  score += profile.areas[listing.area] || 0;
  for (const c of listing.collections || []) {
    score += profile.collections[c] || 0;
  }
  if (profile.bedroomsWeight > 0 && Number(listing.bedrooms) > 0) {
    const ideal = profile.bedrooms / profile.bedroomsWeight;
    // Full point at the ideal size, fading to zero 4+ bedrooms away.
    score += Math.max(0, 1 - Math.abs(Number(listing.bedrooms) - ideal) / 4);
  }
  if (profile.petFriendly > 0 && listing.petFriendly) score += profile.petFriendly * 0.5;
  return score;
}
