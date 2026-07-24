import React from "react";
import ListingCard from "@/components/search/ListingCard";

// Reuses the existing search ListingCard. No price math on the homepage —
// the stub price renders "Rates on request" via ListingCard's PriceLine.
export default function FeaturedRentals({ listings }) {
  if (!listings || listings.length === 0) {
    return <div className="text-sm text-muted-foreground">Loading featured rentals…</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} price={{ hasDates: false, from: null }} />
      ))}
    </div>
  );
}