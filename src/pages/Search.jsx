import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  LayoutGrid,
  Map as MapIcon,
  Search as SearchIcon,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildCalendarMap, computeFlexiblePrice } from "@/lib/availability";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import FiltersPanel from "@/components/search/FiltersPanel";
import ListingCard from "@/components/search/ListingCard";
import SearchMap from "@/components/search/SearchMap";
import { track } from "@/lib/analytics";
import { listingMatchesFeatures } from "@/lib/features";
import { getPassedListings, clearPassedListings } from "@/lib/passedListings";
import HeroBackground from "@/components/HeroBackground";
import { useSiteImage } from "@/hooks/useSiteImageMap";

const DEFAULT_FILTERS = {
  query: "",
  checkIn: "",
  checkOut: "",
  flexDays: 0,
  guests: 0,
  area: "all",
  minBedrooms: 0,
  features: [],
  collections: [],
  maxBudget: 1000,
};

export default function Search() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  // "list" (default): full-width cards, no map — cards get the whole row.
  // "map": split view on desktop (cards rail + big sticky map), map-only on
  // mobile. The map mounts only in map mode, so listing browsing never pays
  // its cost.
  const [view, setView] = useState("list");
  // Homes swiped left in the matchmaker stay out of search until reset.
  const [passedIds, setPassedIds] = useState(() => new Set(getPassedListings()));
  const [sort, setSort] = useState("price");
  const [selectedId, setSelectedId] = useState(null);
  const heroImage = useSiteImage("hero:search");
  const [filters, setFilters] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const collection = p.get("collection");
    const features = p.get("features");
    return {
      ...DEFAULT_FILTERS,
      query: p.get("q") || "",
      area: p.get("area") || "all",
      checkIn: p.get("checkIn") || "",
      checkOut: p.get("checkOut") || "",
      guests: Number(p.get("guests")) || 0,
      features: features ? features.split(",").filter(Boolean) : [],
      collections: collection ? [collection] : [],
    };
  });

  const update = useCallback(
    (patch) => setFilters((f) => ({ ...f, ...patch })),
    []
  );

  const cardRefs = useRef({});
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const listingData = await base44.entities.Listing.list("-created_date", 500);
      setListings(listingData);
    } catch (e) {
      setError(e.message || "Unable to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Calendar rows are fetched only for the chosen date window (±3 days for
  // flexibility) — without dates, cards price from the precomputed fromRate
  // and the browser never downloads the calendar table.
  useEffect(() => {
    if (!filters.checkIn || !filters.checkOut) {
      setCalendarMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const pad = (iso, delta) => {
          const t = new Date(`${iso}T00:00:00Z`);
          t.setUTCDate(t.getUTCDate() + delta);
          return t.toISOString().slice(0, 10);
        };
        const days = await base44.entities.CalendarDay.filter(
          { date: { $gte: pad(filters.checkIn, -3), $lte: pad(filters.checkOut, 3) } },
          "date",
          5000
        );
        if (!cancelled) setCalendarMap(buildCalendarMap(days));
      } catch {
        // cards fall back to fromRate
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters.checkIn, filters.checkOut]);

  // Track executed searches — fires on filter changes but not on initial mount.
  const searchMounted = useRef(false);
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true;
      return;
    }
    track("search", {
      searchParams: {
        checkIn: filters.checkIn || undefined,
        checkOut: filters.checkOut || undefined,
        flexDays: filters.flexDays || undefined,
        guests: filters.guests || undefined,
        area: filters.area !== "all" ? filters.area : undefined,
        minBedrooms: filters.minBedrooms || undefined,
        query: filters.query.trim() ? filters.query.trim().slice(0, 100) : undefined,
        features: filters.features.length ? filters.features : undefined,
        collections: filters.collections.length ? filters.collections : undefined,
        maxBudget: filters.maxBudget < 1000 ? filters.maxBudget : undefined,
      },
    });
  }, [filters]);

  const collectionOptions = useMemo(() => {
    const set = new Set();
    listings.forEach((l) =>
      (l.collections || []).forEach((c) => set.add(c))
    );
    return [...set];
  }, [listings]);

  const { items, prices } = useMemo(() => {
    const prices = {};
    const hasDates = !!(filters.checkIn && filters.checkOut);
    const computed = listings
      .filter((l) => l.active !== false)
      .map((l) => {
        const price = computeFlexiblePrice(
          l,
          calendarMap,
          filters.checkIn,
          filters.checkOut,
          filters.flexDays
        );
        prices[l.id] = price;
        return { listing: l, price };
      })
      .filter(({ listing, price }) => {
        if (filters.guests > 0 && (listing.sleeps || 0) < filters.guests)
          return false;
        if (filters.area !== "all" && listing.area !== filters.area)
          return false;
        if (filters.minBedrooms > 0 && (listing.bedrooms || 0) < filters.minBedrooms)
          return false;
        if (filters.query.trim()) {
          const q = filters.query.trim().toLowerCase();
          const hay = `${listing.title || ""} ${listing.slug || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (!listingMatchesFeatures(listing, filters.features)) return false;
        if (passedIds.has(listing.id)) return false;
        if (
          filters.collections.length > 0 &&
          !(listing.collections || []).some((c) => filters.collections.includes(c))
        )
          return false;
        if (hasDates && !price.available) return false;
        if (filters.maxBudget < 1000) {
          const nightly = price.hasDates ? price.avg : price.from;
          if (nightly == null || nightly > filters.maxBudget) return false;
        }
        return true;
      });

    computed.sort((a, b) => {
      if (sort === "featured") {
        const fa = a.listing.featured ? 1 : 0;
        const fb = b.listing.featured ? 1 : 0;
        if (fb !== fa) return fb - fa;
      }
      if (sort === "bedrooms") {
        const d = (b.listing.bedrooms || 0) - (a.listing.bedrooms || 0);
        if (d !== 0) return d;
      }
      if (sort === "sleeps") {
        const d = (b.listing.sleeps || 0) - (a.listing.sleeps || 0);
        if (d !== 0) return d;
      }
      if (sort === "newest") {
        const d = String(b.listing.created_date || "").localeCompare(String(a.listing.created_date || ""));
        if (d !== 0) return d;
      }
      const pa = a.price.hasDates ? a.price.total : a.price.from;
      const pb = b.price.hasDates ? b.price.total : b.price.from;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    });
    return { items: computed, prices };
  }, [listings, calendarMap, filters, sort, passedIds]);

  const hasActiveFilters =
    filters.guests > 0 ||
    filters.area !== "all" ||
    filters.minBedrooms > 0 ||
    filters.query.trim() !== "" ||
    filters.features.length > 0 ||
    filters.collections.length > 0 ||
    filters.checkIn ||
    filters.checkOut ||
    filters.maxBudget < 1000;

  return (
    <div className="min-h-screen bg-coast-foam">
      <Seo
        title="Find a Vacation Rental | Sea Mountain Vacations"
        description="Search oceanfront condos, beach houses, and pet-friendly vacation rentals across the Grand Strand. Filter by dates, area, and guests. Book direct with no fees."
        path="/search"
      />
      {heroImage && (
        <section className="relative overflow-hidden bg-coast-navy">
          <HeroBackground image={heroImage} />
          <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
            <h1 className="font-heading text-3xl md:text-5xl font-semibold">Find a Vacation Rental</h1>
            <p className="mt-3 text-white/80 max-w-2xl">Search oceanfront condos, beach houses, and pet-friendly stays across the Grand Strand.</p>
          </div>
        </section>
      )}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-coast-navy">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="text-xs text-coast-ocean hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <FiltersPanel
                filters={filters}
                onChange={update}
                collections={collectionOptions}
              />
            </div>
          </aside>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-heading text-lg font-semibold text-coast-navy">
                  {loading
                    ? "Searching…"
                    : `${items.length} stay${items.length === 1 ? "" : "s"} found`}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {filters.checkIn && filters.checkOut
                    ? `${filters.checkIn} → ${filters.checkOut}`
                    : "Pick dates for exact pricing & availability"}
                </p>
                {passedIds.size > 0 && (
                  <button
                    onClick={() => {
                      clearPassedListings();
                      setPassedIds(new Set());
                    }}
                    className="text-xs text-coast-ocean underline underline-offset-2 mt-0.5"
                  >
                    Hiding {passedIds.size} {passedIds.size === 1 ? "home" : "homes"} you passed on — bring {passedIds.size === 1 ? "it" : "them"} back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/match"
                  className="h-9 inline-flex items-center gap-1.5 text-xs font-medium bg-coast-sunset text-white rounded-lg px-3 hover:bg-coast-sunset-deep transition-colors"
                >
                  <Heart className="w-4 h-4" /> Find your match
                </Link>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-card text-sm px-3 text-coast-navy"
                >
                  <option value="price">Price: low to high</option>
                  <option value="featured">Featured first</option>
                  <option value="bedrooms">Most bedrooms</option>
                  <option value="sleeps">Sleeps the most</option>
                  <option value="newest">Newest homes</option>
                </select>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setView("list")}
                    aria-pressed={view === "list"}
                    className={`h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium ${
                      view === "list"
                        ? "bg-coast-navy text-white"
                        : "bg-card text-muted-foreground hover:text-coast-navy"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" /> List
                  </button>
                  <button
                    onClick={() => setView("map")}
                    aria-pressed={view === "map"}
                    className={`h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium ${
                      view === "map"
                        ? "bg-coast-navy text-white"
                        : "bg-card text-muted-foreground hover:text-coast-navy"
                    }`}
                  >
                    <MapIcon className="w-4 h-4" /> Map
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-muted-foreground">{error}</div>
            ) : items.length === 0 ? (
              <EmptyState onClear={() => setFilters(DEFAULT_FILTERS)} />
            ) : (
              view === "map" ? (
                <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
                  <div className="hidden lg:grid sm:grid-cols-2 gap-5 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                    {items.map(({ listing, price }) => (
                      <div
                        key={listing.id}
                        ref={(el) => (cardRefs.current[listing.id] = el)}
                        className={
                          selectedId === listing.id
                            ? "rounded-2xl ring-2 ring-coast-ocean"
                            : ""
                        }
                      >
                        <ListingCard listing={listing} price={price} />
                      </div>
                    ))}
                  </div>
                  <div className="lg:sticky lg:top-6 h-[70vh] lg:h-[calc(100vh-7rem)] rounded-2xl overflow-hidden border border-border shadow-sm">
                    <SearchMap
                      listings={items.map((i) => i.listing)}
                      prices={prices}
                      selectedId={selectedId}
                      onSelect={handleSelect}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map(({ listing, price }) => (
                    <div
                      key={listing.id}
                      ref={(el) => (cardRefs.current[listing.id] = el)}
                      className={
                        selectedId === listing.id
                          ? "rounded-2xl ring-2 ring-coast-ocean"
                          : ""
                      }
                    >
                      <ListingCard listing={listing} price={price} />
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto rounded-full bg-coast-sand flex items-center justify-center mb-4">
        <SearchIcon className="w-7 h-7 text-coast-ocean" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-coast-navy mb-2">
        No matches just yet
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-5">
        Try widening your budget, choosing flexible dates, or exploring a nearby
        area along the Grand Strand. The coast has plenty of options.
      </p>
      <Button
        variant="outline"
        onClick={onClear}
        className="border-coast-ocean text-coast-ocean"
      >
        Clear filters
      </Button>
    </div>
  );
}