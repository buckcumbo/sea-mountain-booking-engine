import { Waves, PawPrint, Droplets, Bath, Footprints, Anchor } from "lucide-react";
import { listingMatchesCollection } from "@/lib/collections";

// Top-feature quick filters. Each feature matches against real listing data —
// collections, amenity strings, and structured fields — so a chip never lies:
// if the data doesn't say a home has a pool, the pool chip won't include it.
const hasAmenity = (listing, keywords) => {
  // Normalize snake_case amenity keys (Hospitable/Guesty style: "hot_tub",
  // "beach_access") to spaces so keyword matching works across sources.
  const amenities = (listing.amenities || []).map((a) =>
    String(a).toLowerCase().replace(/[_-]+/g, " ")
  );
  return keywords.some((k) => amenities.some((a) => a.includes(k)));
};

export const FEATURE_FILTERS = [
  {
    key: "oceanfront",
    label: "Oceanfront",
    icon: Waves,
    match: (l) => listingMatchesCollection(l, "oceanfront") || hasAmenity(l, ["oceanfront", "ocean front"]),
  },
  {
    key: "pool",
    label: "Pool",
    icon: Droplets,
    match: (l) => listingMatchesCollection(l, "poolside") || hasAmenity(l, ["pool"]),
  },
  {
    key: "hot-tub",
    label: "Hot tub",
    icon: Bath,
    match: (l) => hasAmenity(l, ["hot tub", "hottub", "jacuzzi", "whirlpool"]),
  },
  {
    key: "pet-friendly",
    label: "Pet-friendly",
    icon: PawPrint,
    match: (l) => l.petFriendly === true,
  },
  {
    key: "walk-to-beach",
    label: "Walk to beach",
    icon: Footprints,
    match: (l) =>
      (l.beachWalkMinutes != null && Number(l.beachWalkMinutes) <= 10) ||
      hasAmenity(l, ["beach access", "beachfront", "beach front"]),
  },
  {
    key: "channel-home",
    label: "On the channel",
    icon: Anchor,
    match: (l) => listingMatchesCollection(l, "channel-homes") || hasAmenity(l, ["channel", "boat dock", "dock"]),
  },
];

export const FEATURE_BY_KEY = Object.fromEntries(FEATURE_FILTERS.map((f) => [f.key, f]));

export function listingMatchesFeatures(listing, featureKeys) {
  if (!featureKeys || featureKeys.length === 0) return true;
  return featureKeys.every((key) => {
    const f = FEATURE_BY_KEY[key];
    return f ? f.match(listing) : true;
  });
}