import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Search as SearchIcon, Layers, BadgeCheck, Users2, ShieldCheck, ArrowUpRight } from "lucide-react";
import HeroBackground from "@/components/HeroBackground";
import { useSiteImageMap } from "@/hooks/useSiteImageMap";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/search/ListingCard";
import { COLLECTIONS, COLLECTION_BY_SLUG, listingMatchesCollection } from "@/lib/collections";
import Seo from "@/components/Seo";
import { buildCalendarMap, computeListingPrice } from "@/lib/availability";
import { getSessionSeed, seededShuffle } from "@/lib/shuffle";

// Guest-facing explainer for The 100 Collection — every claim comes from
// theonehundredcollection.com. Other collections have no about block.
const HUNDRED_ABOUT = {
  heading: "What is The 100 Collection™?",
  intro:
    "The 100 Collection™ imprint marks a collaborative effort to set the gold standard for vacation rentals across the US, Mexico, and Canada. Homes don't buy their way in: properties must pass quality, safety, and cleanliness inspections, and the stamp of approval is issued by a peer collective of the industry's most respected owners and operators — known as doyens. These Sea Mountain homes met that standard.",
  points: [
    {
      icon: BadgeCheck,
      title: "Inspected, not self-nominated",
      body: "Every home must pass specific quality, safety, and cleanliness inspections — and keep passing them.",
    },
    {
      icon: ShieldCheck,
      title: "Awarded by industry peers",
      body: "Only locally owned and operated brands are invited, and the imprint is issued by doyens — the most respected professionals in the field.",
    },
    {
      icon: Users2,
      title: "3.5 million+ guests",
      body: "Collection partners across three countries have hosted millions of stays. The standard travels.",
    },
  ],
};

export default function CollectionDetail() {
  const { slug } = useParams();
  const cfg = COLLECTION_BY_SLUG[slug];
  // Hero image: a dedicated hero:collection:<slug> upload wins; otherwise the
  // collection's card image does double duty.
  const heroImages = useSiteImageMap([`hero:collection:${slug}`, `collection-card:${slug}`]);
  const heroImage = heroImages[`hero:collection:${slug}`] || heroImages[`collection-card:${slug}`];
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});

  useEffect(() => {
    if (!cfg) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Card pricing uses the precomputed listing.fromRate — no calendar fetch.
        const all = await base44.entities.Listing.list("-created_date", 500);
        if (cancelled) return;
        // Session-seeded shuffle: a different home tops the grid for each
        // visitor, but the order is stable while they browse.
        setListings(
          seededShuffle(
            (all || []).filter(
              (l) => l.active !== false && listingMatchesCollection(l, slug)
            ),
            getSessionSeed()
          )
        );
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!cfg) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-coast-sand flex items-center justify-center mb-5">
          <Layers className="w-7 h-7 text-coast-ocean" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-coast-navy mb-2">
          Collection not found
        </h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find that collection.
        </p>
        <Link to="/collections" className="text-coast-ocean hover:underline text-sm">
          Browse all collections
        </Link>
      </div>
    );
  }

  const others = COLLECTIONS.filter((c) => c.slug !== slug);

  return (
    <div>
      <Seo
        title={`${cfg.label} Vacation Rentals | Sea Mountain Vacations`}
        description={cfg.blurb || ""}
        path={`/collections/${slug}`}
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <HeroBackground image={heroImage} />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <div className="text-sm text-white/70 mb-2">
            <Link to="/collections" className="hover:text-white">Collections</Link>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-semibold">{cfg.label}</h1>
          <p className="mt-3 text-white/85 max-w-2xl">{cfg.blurb}</p>
        </div>
      </section>

      {slug === "the-100-collection" && (
        <section className="max-w-7xl mx-auto px-6 pt-10">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">
              {HUNDRED_ABOUT.heading}
            </h2>
            <p className="text-sm text-muted-foreground max-w-3xl mb-6">{HUNDRED_ABOUT.intro}</p>
            <div className="grid sm:grid-cols-3 gap-5">
              {HUNDRED_ABOUT.points.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-coast-sand flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-coast-ocean" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-coast-navy">{title}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://www.theonehundredcollection.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-coast-ocean hover:underline mt-5"
            >
              Learn more at theonehundredcollection.com <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="font-heading text-lg font-semibold text-coast-navy mb-6">
          {loading ? "Loading…" : `${listings.length} home${listings.length === 1 ? "" : "s"}`}
        </h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-sm text-muted-foreground italic border border-dashed border-border rounded-xl p-10 text-center">
            No homes in this collection yet. Check back soon.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} price={computeListingPrice(l, calendarMap, "", "")} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SearchIcon className="w-5 h-5 text-coast-ocean" />
            <div>
              <div className="font-heading font-semibold text-coast-navy">Refine your search</div>
              <div className="text-sm text-muted-foreground">Filter by dates, area, and guest count.</div>
            </div>
          </div>
          <Button asChild className="bg-coast-navy hover:bg-coast-navy-soft text-white">
            <Link to={`/search?collection=${slug}`}>Search {cfg.label} homes</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <h3 className="font-heading font-semibold text-coast-navy mb-4">Other collections</h3>
        <div className="flex flex-wrap gap-2">
          {others.map((c) => (
            <Link
              key={c.slug}
              to={`/collections/${c.slug}`}
              className="text-xs px-3 py-1.5 rounded-full border bg-card text-coast-navy border-border hover:border-coast-ocean transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}