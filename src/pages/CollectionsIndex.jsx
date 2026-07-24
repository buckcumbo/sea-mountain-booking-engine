import React from "react";
import CollectionGrid from "@/components/home/CollectionGrid";

export default function CollectionsIndex() {
  return (
    <div>
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
        <CollectionGrid />
      </section>
    </div>
  );
}