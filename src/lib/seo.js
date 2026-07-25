import { AREA_LABELS } from "@/lib/availability";
import { PHONE, PHONE_TEL, EMAIL } from "@/lib/contact";

export const SITE_NAME = "Sea Mountain Vacations";
// Canonical production origin. Update if the domain changes.
export const SITE_ORIGIN = "https://www.seamountainvacations.com";

export const SITE_PHONE = PHONE;
export const SITE_PHONE_TEL = PHONE_TEL;

export const DEFAULT_DESCRIPTION =
  "Book direct and save on North Myrtle Beach & Grand Strand vacation rentals: oceanfront condos, beach houses, and pet-friendly stays with no booking fees.";

export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80";

export const COLLECTION_SLUGS = [
  "oceanfront",
  "pet-friendly",
  "poolside",
  "channel-homes",
  "budget-friendly",
  "the-100-collection",
  "family",
  "marshfront",
];

export const AREA_SLUGS = Object.keys(AREA_LABELS);

// "{Page} | Sea Mountain Vacations"
export function pageTitle(page) {
  return `${page} | ${SITE_NAME}`;
}

export function truncateDescription(text, max = 155) {
  if (!text) return "";
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

// Absolute canonical URL for a site path (query strings intentionally dropped).
export function canonicalUrl(path) {
  const clean = (path || "/").replace(/\/+$/, "") || "/";
  return `${SITE_ORIGIN}${clean === "/" ? "" : clean}`;
}

// LocalBusiness (VacationRentalAgency) JSON-LD — homepage + contact.
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRentalAgency",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_ORIGIN,
    telephone: PHONE,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cherry Grove Beach",
      addressRegion: "SC",
      postalCode: "29582",
      addressCountry: "US",
    },
    areaServed: Object.values(AREA_LABELS),
    priceRange: "$$",
  };
}

// VacationRental listing JSON-LD. aggregateRating only when review data exists.
export function buildVacationRentalJsonLd(listing, reviews = []) {
  const areaName = AREA_LABELS[listing.area] || listing.area;
  const images = (listing.photos || [])
    .map((p) => (typeof p === "string" ? p : p && p.url))
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: listing.title,
    description: truncateDescription(listing.storyCopy || listing.title, 300),
    url: canonicalUrl(`/listing/${listing.slug || listing.id}`),
    ...(images.length > 0 ? { image: images } : {}),
    numberOfRooms: listing.bedrooms || undefined,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: listing.sleeps || undefined,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: areaName,
      addressRegion: "SC",
      addressCountry: "US",
    },
  };

  if (listing.amenities && listing.amenities.length > 0) {
    jsonLd.amenityFeature = listing.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    }));
  }

  const rated = (reviews || []).filter((r) => r && r.rating);
  if (rated.length > 0) {
    const total = rated.reduce((sum, r) => sum + Number(r.rating), 0);
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (total / rated.length).toFixed(1),
      reviewCount: rated.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
}

// Article JSON-LD for guide articles. datePublished from the record's created date.
export function buildArticleJsonLd(guide) {
  const datePublished = guide.created_date
    ? new Date(guide.created_date).toISOString()
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt || truncateDescription(guide.body, 155),
    ...(guide.heroImage ? { image: guide.heroImage } : {}),
    ...(datePublished ? { datePublished } : {}),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: canonicalUrl(`/guides/${guide.slug}`),
  };
}

// FAQPage JSON-LD — built from markdown ## headings that read like questions
// (end with "?") plus the first paragraph beneath each. Returns null if none.
export function buildFaqJsonLd(guide) {
  const faqs = extractFaqsFromMarkdown(guide.body || "");
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

// Parse a markdown body into Q&A pairs from "## ...?" headings + first paragraph.
export function extractFaqsFromMarkdown(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const faqs = [];
  let current = null;
  let collecting = false;
  for (const raw of lines) {
    const line = raw.trim();
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      const heading = h2[1].trim();
      if (heading.endsWith("?")) {
        current = { question: heading, answer: "" };
        faqs.push(current);
        collecting = true;
      } else {
        current = null;
        collecting = false;
      }
      continue;
    }
    if (collecting && current) {
      if (line === "") {
        if (current.answer) collecting = false; // stop after first paragraph
        continue;
      }
      current.answer = current.answer ? `${current.answer} ${line}` : line;
    }
  }
  return faqs.filter((f) => f.answer);
}