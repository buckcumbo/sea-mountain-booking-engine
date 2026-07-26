import { Waves, PawPrint, Droplets, Anchor, Wallet, Crown, Users } from "lucide-react";

// Canonical collection config. `slug` is the URL slug for /collections/:slug;
// `match` lists the stored Listing.collections values (slugified) that resolve
// to this page — covers aliasing for "budget" and "100-collection".
export const COLLECTIONS = [
  {
    slug: "oceanfront",
    label: "Oceanfront",
    blurb: "Wake up to the Atlantic right outside your door.",
    icon: Waves,
    match: ["oceanfront"],
  },
  {
    slug: "pet-friendly",
    label: "Pet Friendly",
    blurb: "Bring the whole family, four-legged members included.",
    icon: PawPrint,
    match: ["pet-friendly"],
  },
  {
    slug: "poolside",
    label: "Poolside",
    blurb: "Private and community pools steps from your stay.",
    icon: Droplets,
    match: ["poolside"],
  },
  {
    slug: "channel-homes",
    label: "Channel Homes",
    blurb: "Homes along the Grand Strand's salt-marsh channels.",
    icon: Anchor,
    // "marshfront" is the same waterfront — legacy tag folds in here.
    match: ["channel-homes", "marshfront"],
  },
  {
    slug: "budget-friendly",
    label: "Budget Friendly",
    blurb: "Great Grand Strand stays at a great value.",
    icon: Wallet,
    match: ["budget", "budget-friendly"],
  },
  {
    slug: "the-100-collection",
    label: "The 100 Collection",
    blurb: "Our premier collection of hand-picked luxury homes.",
    icon: Crown,
    match: ["100-collection", "the-100-collection", "100 collection"],
  },
  {
    slug: "family",
    label: "Family",
    blurb: "Room for everyone: multigenerational getaways made easy.",
    icon: Users,
    match: ["family"],
  },
];

export const COLLECTION_BY_SLUG = Object.fromEntries(
  COLLECTIONS.map((c) => [c.slug, c])
);

export function slugifyCollection(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listingMatchesCollection(listing, slug) {
  const cfg = COLLECTION_BY_SLUG[slug];
  if (!cfg) return false;
  const matchSet = new Set(cfg.match);
  return (listing.collections || []).some((c) => matchSet.has(slugifyCollection(c)));
}