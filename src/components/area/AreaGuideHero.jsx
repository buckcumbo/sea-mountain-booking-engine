import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prettifyArea, computeListingPrice } from "@/lib/availability";
import { FEATURE_FILTERS, listingMatchesFeatures } from "@/lib/features";
import ListingCard from "@/components/search/ListingCard";
import GuideCard from "@/components/guides/GuideCard";

const GUEST_OPTIONS = [0, 2, 4, 6, 8, 10, 12, 14, 16];
const BED_OPTIONS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_AREA_FILTERS = {
  checkIn: "",
  checkOut: "",
  guests: 0,
  minBedrooms: 0,
  features: [],
};

export default function AreaGuideHero({ guide, listings, guides, calendarMap = {}, siteImage }) {
  const areaName = prettifyArea(guide.area);
  const heroSrc = siteImage?.imageUrl || guide.heroImage;

  const [filters, setFilters] = useState(DEFAULT_AREA_FILTERS);
  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const hasDates = !!(
    filters.checkIn &&
    filters.checkOut &&
    filters.checkOut > filters.checkIn
  );
  const filtersActive =
    hasDates || filters.guests > 0 || filters.minBedrooms > 0 || filters.features.length > 0;

  const toggleFeature = (key) => {
    const has = filters.features.includes(key);
    update({
      features: has
        ? filters.features.filter((k) => k !== key)
        : [...filters.features, key],
    });
  };

  // Client-side only: listings and CalendarDay data are already loaded by the
  // page, so filtering never triggers a network call.
  const filtered = useMemo(() => {
    return listings
      .map((l) => ({
        listing: l,
        price: computeListingPrice(
          l,
          calendarMap,
          hasDates ? filters.checkIn : "",
          hasDates ? filters.checkOut : ""
        ),
      }))
      .filter(({ listing: l, price }) => {
        if (hasDates && !price.available) return false;
        if (filters.guests > 0 && (Number(l.sleeps) || 0) < filters.guests) return false;
        if (filters.minBedrooms > 0 && (Number(l.bedrooms) || 0) < filters.minBedrooms) return false;
        if (!listingMatchesFeatures(l, filters.features)) return false;
        return true;
      });
  }, [listings, calendarMap, filters, hasDates]);
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-coast-navy">
        {heroSrc && (
          <img
            src={heroSrc}
            alt={siteImage?.altText || ""}
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
              {filtersActive
                ? `${filtered.length} of ${listings.length} homes match your filters.`
                : `${listings.length} ${listings.length === 1 ? "home" : "homes"} available here.`}
            </p>
          </div>
          <Link
            to={`/search?area=${guide.area}`}
            className="hidden sm:inline-flex items-center gap-1 text-sm text-coast-ocean hover:underline"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {listings.length > 0 && (
          <div className="mb-7 rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Check-in</Label>
                <Input
                  type="date"
                  value={filters.checkIn}
                  onChange={(e) => update({ checkIn: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Check-out</Label>
                <Input
                  type="date"
                  value={filters.checkOut}
                  min={filters.checkIn || undefined}
                  onChange={(e) => update({ checkOut: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Guests</Label>
                <Select
                  value={String(filters.guests)}
                  onValueChange={(v) => update({ guests: Number(v) })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {GUEST_OPTIONS.map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {g === 0 ? "Any" : `${g}+`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Min bedrooms</Label>
                <Select
                  value={String(filters.minBedrooms)}
                  onValueChange={(v) => update({ minBedrooms: Number(v) })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_OPTIONS.map((b) => (
                      <SelectItem key={b} value={String(b)}>
                        {b === 0 ? "Any" : `${b}+`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {FEATURE_FILTERS.map(({ key, label, icon: Icon }) => {
                const active = filters.features.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFeature(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-coast-navy text-white border-coast-navy"
                        : "bg-card text-coast-navy border-border hover:border-coast-ocean"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                );
              })}
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_AREA_FILTERS)}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-muted-foreground hover:text-coast-navy transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              )}
            </div>
          </div>
        )}
        {listings.length === 0 ? (
          <div className="text-sm text-muted-foreground italic border border-dashed border-border rounded-xl p-8 text-center">
            No rentals available in {areaName} right now.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-8 text-center">
            <p>No homes match those filters.</p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_AREA_FILTERS)}
              className="mt-2 text-coast-ocean hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(({ listing: l, price }) => (
              <ListingCard key={l.id} listing={l} price={price} />
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