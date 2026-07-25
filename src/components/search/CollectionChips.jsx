import React from "react";
import { useNavigate } from "react-router-dom";
import { COLLECTIONS, listingMatchesCollection } from "@/lib/collections";

// Up to `max` collection chips for a listing. Renders as spans (valid inside the
// card's anchor) and stops propagation so a chip click navigates to the
// collection page instead of the listing page.
export default function CollectionChips({ listing, max = 2 }) {
  const navigate = useNavigate();
  if (!listing || !listing.collections || listing.collections.length === 0) return null;

  const matched = COLLECTIONS.filter((c) =>
    listingMatchesCollection(listing, c.slug)
  ).slice(0, max);
  if (matched.length === 0) return null;

  const go = (e, slug) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/collections/${slug}`);
  };

  return (
    <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
      {matched.map((c) => (
        <span
          key={c.slug}
          role="button"
          tabIndex={0}
          onClick={(e) => go(e, c.slug)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") go(e, c.slug);
          }}
          className="text-xs font-medium bg-coast-sand text-coast-navy px-2.5 py-0.5 rounded-full border border-coast-sand-deep hover:bg-coast-sand-deep transition-colors cursor-pointer"
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}