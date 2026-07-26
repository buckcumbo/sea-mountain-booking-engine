import React from "react";
import CollectionGrid from "@/components/home/CollectionGrid";
import Seo from "@/components/Seo";
import HeroBackground from "@/components/HeroBackground";
import { useSiteImageMap } from "@/hooks/useSiteImageMap";
import { COLLECTIONS } from "@/lib/collections";

export default function CollectionsIndex() {
  // One fetch covers the page hero and every card photo.
  const images = useSiteImageMap([
    "hero:collections",
    ...COLLECTIONS.map((c) => `collection-card:${c.slug}`),
  ]);
  return (
    <div>
      <Seo
        title="Vacation Rental Collections | Sea Mountain Vacations"
        description="Browse vacation rentals by collection: oceanfront, pet-friendly, poolside, budget-friendly, and our premier 100 Collection."
        path="/collections"
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <HeroBackground image={images["hero:collections"]} />
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