// Legacy WordPress URL → new route resolver.
// Returns { to: "/new-path" } | { gone: true } | null.
// Frontend only — no entity lookups, no external calls.

// (A) GONE — 410. These old pages have no equivalent.
const GONE_PATHS = new Set([
  "/sample-page",
  "/homepage",
  "/checkout-confirmation",
  "/property-details-tabs",
  "/checkout",
  "/single-discount",
  "/lmpm-checkout",
  "/booking-request",
  "/custom-quote",
  "/homeowner-acquisition",
  "/temp-header",
  "/booking-plan",
  "/property-listing",
]);

// (B) Exact legacy → new mappings.
const EXACT_MAP = {
  "/properties-a-z": "/search",
  "/about-sea-mountain-vacation-rentals": "/about",
  "/contact-sea-mountain-vacation-rentals": "/contact",
  "/property-management-services": "/list-your-property",
  "/south-carolina-property-management": "/list-your-property",
  "/privacy-policy": "/privacy",
  "/terms-conditions": "/terms",
  "/things-to-do": "/guides",
  "/events": "/guides",
  "/north-myrtle-beach": "/area/north-myrtle-beach",
  "/myrtle-beach": "/area/myrtle-beach",
  "/surfside": "/area/surfside",
  "/garden-city": "/area/garden-city",
  "/murrells-inlet": "/area/murrells-inlet",
  "/pawleys-island": "/area/pawleys-island",
};

// (C) /browse-properties/<slug> handling.
const BROWSE_ALIASES = {
  "it-s-always-sunny": "/listing/its-always-sunny",
  "saltwater-and-sunsets": "/listing/saltwater-sunsets",
};
const BROWSE_DROPPED = new Set([
  "7-days-grace-1",
  "7-days-grace-2",
  "dog-daze",
  "carolina-cottage",
  "park-place",
  "urban-cowboy",
  "going-coasta",
  "barefoot-bay",
]);

// (D) /property-groups/<g> handling.
const GROUP_MAP = {
  "surfside-beach": "/area/surfside",
  "garden-city": "/area/garden-city",
  "pawleys-island": "/area/pawleys-island",
};

// (F) Root-level article slugs that map 1:1 to /guides/<slug>.
const SAME_SLUG = new Set([
  "things-to-do-in-garden-city",
  "things-to-do-in-murrells-inlet",
  "discover-north-myrtle-beach-activities",
  "things-to-do-in-pawleys-island",
  "things-to-do-in-surfside",
  "best-golf-courses-north-myrtle-beach",
  "barefoot-landing-in-north-myrtle-beach",
  "pet-friendly-things-to-do-in-north-myrtle-beach",
  "unique-things-to-do-in-north-myrtle-beach-for-couples",
  "shopping-places-in-north-myrtle-beach",
  "best-seafood-restaurants-in-north-myrtle-beach",
  "explore-the-best-mini-golf-in-north-myrtle-beach",
  "everything-you-need-to-know-about-surfing-in-north-myrtle-beach",
  "guide-fishing-charters-and-pier-fishing-in-north-myrtle-beach",
  "visit-cherry-grove-pier-in-north-myrtle-beach",
  "when-is-the-best-time-to-visit-north-myrtle-beach",
  "best-beaches-in-north-myrtle-beach",
  "myrtle-beach-in-april",
  "myrtle-beach-weather-in-march",
  "explore-surfside-beach",
  "best-things-to-do-in-myrtle-beach-in-october",
  "family-kingdom-amusement-park-in-north-myrtle-beach",
  "best-myrtle-beach-theme-parks",
  "cherry-grove-north-myrtle-beach-sc",
  "steakhouse-restaurants-in-north-myrtle-beach",
  "best-restaurants-in-murrells-inlet",
  "winter-rentals-in-north-myrtle-beach",
  "3-day-itinerary-for-north-myrtle-beach",
  "best-spas-in-north-myrtle-beach",
  "best-pizza-in-north-myrtle-beach",
  "best-place-to-eat-breakfast-in-north-myrtle-beach",
  "ripleys-aquarium-in-north-myrtle-beach",
  "best-night-clubs-in-myrtle-beach",
  "best-things-to-do-pawleys-island",
  "best-restaurants-in-cherry-grove-sc",
  "jet-ski-rentals-in-myrtle-beach",
  "itinerary-for-couples-in-north-myrtle-beach",
  "best-italian-restaurants-in-north-myrtle-beach",
  "best-mexican-restaurants-in-north-myrtle-beach",
  "best-wineries-in-north-myrtle-beach",
]);

// (F) Remapped article slugs → different guide slug.
const REMAP = {
  "best-things-to-do-murrells-inlet": "/guides/things-to-do-in-murrells-inlet",
  "things-to-do-garden-city": "/guides/things-to-do-in-garden-city",
  "the-top-10_activities-to-enjoy-in-north-myrtle-beach":
    "/guides/discover-north-myrtle-beach-activities",
  "free-and-affordable-things-to-do-in-myrtle-beach-with-kids":
    "/guides/discover-north-myrtle-beach-activities",
  "best-night-clubs-in-myrtle-beach-1": "/guides/best-night-clubs-in-myrtle-beach",
};

// Normalize: lowercase, strip query/hash, strip trailing slash.
function normalize(path) {
  let p = path || "/";
  const qIdx = p.indexOf("?");
  if (qIdx !== -1) p = p.slice(0, qIdx);
  const hIdx = p.indexOf("#");
  if (hIdx !== -1) p = p.slice(0, hIdx);
  p = p.toLowerCase();
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

function resolveArticleSlug(slug) {
  if (REMAP[slug]) return { to: REMAP[slug] };
  if (SAME_SLUG.has(slug)) return { to: `/guides/${slug}` };
  return null;
}

export function resolveLegacyPath(pathname) {
  const path = normalize(pathname);

  // (A) GONE
  if (GONE_PATHS.has(path)) return { gone: true };

  // (B) Exact map
  if (EXACT_MAP[path]) return { to: EXACT_MAP[path] };

  // (C) /browse-properties
  if (path === "/browse-properties") return { to: "/search" };
  if (path.startsWith("/browse-properties/")) {
    const slug = path.slice("/browse-properties/".length);
    if (BROWSE_ALIASES[slug]) return { to: BROWSE_ALIASES[slug] };
    if (BROWSE_DROPPED.has(slug)) return { to: "/search" };
    return { to: `/listing/${slug}` };
  }

  // (D) /property-groups
  if (path === "/property-groups") return { to: "/collections" };
  if (path.startsWith("/property-groups/")) {
    const g = path.slice("/property-groups/".length);
    if (GROUP_MAP[g]) return { to: GROUP_MAP[g] };
    return { to: `/collections/${g}` };
  }

  // (E) /blog
  if (path === "/blog") return { to: "/guides" };
  if (path.startsWith("/blog/")) {
    const rest = path.slice("/blog/".length);
    const parts = rest.split("/");
    if (parts.length >= 2) {
      const slug = parts[parts.length - 1];
      const result = resolveArticleSlug(slug);
      if (result) return result;
    }
    return { to: "/guides" };
  }

  // (F) Root-level article slugs
  const result = resolveArticleSlug(path.slice(1));
  if (result) return result;

  // (G) No match
  return null;
}