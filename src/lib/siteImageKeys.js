import { COLLECTIONS } from "@/lib/collections";
import { AREA_LABELS, prettifyArea } from "@/lib/availability";

const PAGE_HERO_LABELS = {
  "hero:home": "Homepage",
  "hero:search": "Search",
  "hero:guides": "Things To Do",
  "hero:collections": "Collections",
  "hero:about": "About",
  "hero:contact": "Contact",
  "hero:list-your-property": "List Your Property",
  "hero:special-offers": "Special Offers",
};

const AREA_SLUGS = Object.keys(AREA_LABELS);

// Three grouped sections rendered by the admin image manager. `key` is the
// unique SiteImage key; public pages read the same keys.
export const SITE_IMAGE_GROUPS = [
  {
    title: "Page Heroes",
    items: [
      ...Object.keys(PAGE_HERO_LABELS).map((key) => ({
        key,
        label: `${PAGE_HERO_LABELS[key]} Page Hero`,
      })),
      ...AREA_SLUGS.map((slug) => ({
        key: `hero:area:${slug}`,
        label: `${prettifyArea(slug)} Area Hero`,
      })),
    ],
  },
  {
    title: "Collection Cards",
    items: COLLECTIONS.map((c) => ({
      key: `collection-card:${c.slug}`,
      label: `${c.label} Collection Card`,
    })),
  },
  {
    title: "Area Cards",
    items: AREA_SLUGS.map((slug) => ({
      key: `area-card:${slug}`,
      label: `${prettifyArea(slug)} Area Card`,
    })),
  },
];

// Keys fetched by the homepage so the hero, collection cards, and area cards
// can all be resolved with a single SiteImage list call.
export const HOMEPAGE_IMAGE_KEYS = [
  "hero:home",
  ...COLLECTIONS.map((c) => `collection-card:${c.slug}`),
  ...AREA_SLUGS.map((slug) => `area-card:${slug}`),
];