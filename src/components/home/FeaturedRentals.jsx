import React from "react";
import ListingCard from "@/components/search/ListingCard";
import { computeListingPrice } from "@/lib/availability";

// Reuses the existing search ListingCard. Displays each listing's stored
// nightly "from" rate; falls back to "Rates on request" when none exists.
export default function FeaturedRentals({ listings, calendarMap = {} }) {
  if (!listings || listings.length === 0) {
    return <div className="text-sm text-muted-foreground">No 100 Collection homes available.</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          listing={l}
          price={computeListingPrice(l, calendarMap, "", "")}
        />
      ))}
    </div>
  );
}