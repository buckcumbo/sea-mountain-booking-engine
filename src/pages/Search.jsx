import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  LayoutGrid,
  Map as MapIcon,
  Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildCalendarMap, computeListingPrice } from "@/lib/availability";
import Seo from "@/components/Seo";
import FiltersPanel from "@/components/search/FiltersPanel";
import ListingCard from "@/components/search/ListingCard";
import MapView, { useIsLgUp } from "@/components/search/MapView";
import { track } from "@/lib/analytics";

const DEFAULT_FILTERS = {
  checkIn: "",
  checkOut: "",
  guests: 0,
  area: "all",
  minBedrooms: 0,
  petFriendly: false,
  collections: [],
  maxBudget: 1000,
};

export default function Search() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("price");
  const [selectedId, setSelectedId] = useState(null);
  const isLgUp = useIsLgUp();
  const showMap = isLgUp || view === "map";
  const [filters, setFilters] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const collection = p.get("collection");
    return {
      ...DEFAULT_FILTERS,
      checkIn: p.get("checkIn") || "",
      checkOut: p.get("checkOut") || "",
      guests: Number(p.get("guests")) || 0,
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
      const [listingData, days] = await Promise.all([
        base44.entities.Listing.list("-created_date", 500),
        base44.entities.CalendarDay.list("-created_date", 5000),
      ]);
      setListings(listingData);
      setCalendarMap(buildCalendarMap(days));
    } catch (e) {
      setError(e.message || "Unable to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        guests: filters.guests || undefined,
        area: filters.area !== "all" ? filters.area : undefined,
        minBedrooms: filters.minBedrooms || undefined,
        petFriendly: filters.petFriendly || undefined,
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
        const price = computeListingPrice(
          l,
          calendarMap,
          filters.checkIn,
          filters.checkOut
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
        if (filters.petFriendly && !listing.petFriendly) return false;
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
      const pa = a.price.hasDates ? a.price.total : a.price.from;
      const pb = b.price.hasDates ? b.price.total : b.price.from;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    });
    return { items: computed, prices };
  }, [listings, calendarMap, filters, sort]);

  const hasActiveFilters =
    filters.guests > 0 ||
    filters.area !== "all" ||
    filters.minBedrooms > 0 ||
    filters.petFriendly ||
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
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-card text-sm px-3 text-coast-navy"
                >
                  <option value="price">Price: low to high</option>
                  <option value="featured">Featured first</option>
                </select>
                <div className="flex rounded-lg border border-border overflow-hidden lg:hidden">
                  <button
                    onClick={() => setView("list")}
                    className={`h-9 w-9 flex items-center justify-center ${
                      view === "list"
                        ? "bg-coast-navy text-white"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView("map")}
                    className={`h-9 w-9 flex items-center justify-center ${
                      view === "map"
                        ? "bg-coast-navy text-white"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
              </div>
            ) : error ? (
              <div className="text-center py-20 text-muted-foreground">{error}</div>
            ) : items.length === 0 ? (
              <EmptyState onClear={() => setFilters(DEFAULT_FILTERS)} />
            ) : (
              <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
                <div className={view === "map" ? "hidden lg:block" : "block"}>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                </div>
                <div className={view === "list" ? "hidden lg:block" : "block"}>
                  <div className="lg:sticky lg:top-6 h-[460px] lg:h-[calc(100vh-7rem)] rounded-2xl overflow-hidden border border-border shadow-sm">
                    {showMap ? (
                      <MapView
                        listings={items.map((i) => i.listing)}
                        prices={prices}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
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