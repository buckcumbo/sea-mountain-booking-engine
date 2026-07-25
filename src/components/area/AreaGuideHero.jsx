import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prettifyArea, computeListingPrice } from "@/lib/availability";
import ListingCard from "@/components/search/ListingCard";
import GuideCard from "@/components/guides/GuideCard";

export default function AreaGuideHero({ guide, listings, guides, calendarMap = {} }) {
  const areaName = prettifyArea(guide.area);
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-coast-navy">
        {guide.heroImage && (
          <img
            src={guide.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy/60 to-coast-navy/80" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-white">
          <div className="inline-flex items-center gap-1.5 text-sm text-white/80 mb-3">
            <MapPin className="w-4 h-4" /> {areaName}
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-semibold max-w-3xl leading-tight">
            {guide.title}
          </h1>
          {guide.excerpt && (
            <p className="mt-4 text-white/85 max-w-2xl">{guide.excerpt}</p>
          )}
        </div>
      </section>

      {/* Intro body */}
      {guide.body && (
        <section className="max-w-3xl mx-auto px-6 py-14">
          <div className="space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
            {guide.body}
          </div>
        </section>
      )}

      {/* Listings in this area */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy">
              Rentals in {areaName}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {listings.length} {listings.length === 1 ? "home" : "homes"} available here.
            </p>
          </div>
          <Link
            to={`/search?area=${guide.area}`}
            className="hidden sm:inline-flex items-center gap-1 text-sm text-coast-ocean hover:underline"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="text-sm text-muted-foreground italic border border-dashed border-border rounded-xl p-8 text-center">
            No rentals available in {areaName} right now.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} price={computeListingPrice(l, calendarMap, "", "")} />
            ))}
          </div>
        )}
        <div className="mt-7 sm:hidden">
          <Link
            to={`/search?area=${guide.area}`}
            className="inline-flex items-center gap-1 text-sm text-coast-ocean hover:underline"
          >
            View all rentals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Things to do */}
      {guides.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-10">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-7">
            Things to do in {areaName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-coast-navy">
              Ready to book your {areaName} stay?
            </h2>
            <p className="text-muted-foreground mt-1">
              Browse all available rentals and find your perfect Grand Strand getaway.
            </p>
          </div>
          <Button asChild className="bg-coast-navy hover:bg-coast-navy-soft text-white px-6 py-3 h-auto">
            <Link to={`/search?area=${guide.area}`}>Find a Rental</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}