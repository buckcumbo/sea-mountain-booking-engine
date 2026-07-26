import React from "react";
import CollectionGrid from "@/components/home/CollectionGrid";
import Seo from "@/components/Seo";
import { useSiteImageMap } from "@/hooks/useSiteImageMap";
import { COLLECTIONS } from "@/lib/collections";

export default function CollectionsIndex() {
  // The grid needs the uploaded card photos — the homepage passes its own
  // image map, so this page must fetch one too or the cards render bare.
  const images = useSiteImageMap(COLLECTIONS.map((c) => `collection-card:${c.slug}`));
  return (
    <div>
      <Seo
        title="Vacation Rental Collections | Sea Mountain Vacations"
        description="Browse vacation rentals by collection: oceanfront, pet-friendly, poolside, budget-friendly, and our premier 100 Collection."
        path="/collections"
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold">Browse by Collection</h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            From oceanfront retreats to budget-friendly getaways, find the perfect fit.
          </p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 py-14">
        <CollectionGrid images={images} />
      </section>
    </div>
  );
}