import React, { useMemo } from "react";
import ListingCard from "@/components/search/ListingCard";

function shareCollection(a, b) {
  const ac = new Set((a.collections || []).map((c) => String(c).toLowerCase()));
  return (b.collections || []).some((c) => ac.has(String(c).toLowerCase()));
}

// Up to 4 related listings: prefer same area, then shared collections, then fill.
export default function RelatedListings({ current, listings }) {
  const related = useMemo(() => {
    if (!current || !listings) return [];
    const others = listings.filter(
      (l) => l.id !== current.id && l.active !== false
    );
    const sameArea = others.filter((l) => l.area === current.area);
    const used = new Set(sameArea.map((l) => l.id));
    const sameCol = others.filter(
      (l) => !used.has(l.id) && shareCollection(current, l)
    );
    sameCol.forEach((l) => used.add(l.id));
    const fill = others.filter((l) => !used.has(l.id));
    return [...sameArea, ...sameCol, ...fill].slice(0, 4);
  }, [current, listings]);

  if (related.length === 0) return null;
  return (
    <div className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
      {related.map((l) => (
        <div
          key={l.id}
          className="min-w-[280px] max-w-[280px] snap-start shrink-0"
        >
          <ListingCard listing={l} />
        </div>
      ))}
    </div>
  );
}