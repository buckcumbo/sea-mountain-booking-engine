import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import AreaGrid from "@/components/home/AreaGrid";
import FeaturedRentals from "@/components/home/FeaturedRentals";

import NewRentals from "@/components/home/NewRentals";
import GuestFaq from "@/components/home/GuestFaq";
import { Link } from "react-router-dom";
import { Receipt, MapPin, Tag, Heart } from "lucide-react";
import Seo from "@/components/Seo";
import { buildLocalBusinessJsonLd, DEFAULT_DESCRIPTION } from "@/lib/seo";
import { buildCalendarMap } from "@/lib/availability";
import { listingMatchesCollection } from "@/lib/collections";
import { useSiteImageMap } from "@/hooks/useSiteImageMap";
import { HOMEPAGE_IMAGE_KEYS } from "@/lib/siteImageKeys";
import { Skeleton } from "@/components/ui/skeleton";
import LazyIframe from "@/components/LazyIframe";
import ListingCard from "@/components/search/ListingCard";
import { computeListingPrice } from "@/lib/availability";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import { getSessionSeed, seededShuffle } from "@/lib/shuffle";
import { useSiteCopy } from "@/hooks/useSiteCopy";

// Placeholder cards shown while listings load — the section never renders its
// empty/blank state during the initial fetch.
function SkeletonCards({ count = 4, className = "grid sm:grid-cols-2 lg:grid-cols-4 gap-5" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

function Section({ title, subtitle, viewAllTo, children }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy">{title}</h2>
          {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
        </div>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-sm text-coast-ocean hover:underline shrink-0 mt-1">
            View all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// Icons only — titles/text come from Site Copy (Admin → Site Copy).
const WHY_ICONS = [Receipt, MapPin, Tag];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [recent, setRecent] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  const siteImages = useSiteImageMap(HOMEPAGE_IMAGE_KEYS);
  const { t } = useSiteCopy();

  useEffect(() => {
    (async () => {
      try {
        // Card pricing uses the precomputed listing.fromRate — no calendar fetch.
        const all = await base44.entities.Listing.list("-created_date", 500);
        // Shuffle per session so the homepage spotlights a different set of
        // 100 Collection homes for each visitor instead of the same four.
        const f = seededShuffle(
          all.filter((l) => listingMatchesCollection(l, "the-100-collection") && l.active !== false),
          getSessionSeed()
        );
        setFeatured(f.slice(0, 4));
        setNewest(all.filter((l) => l.active !== false).slice(0, 4));
        // Recently viewed — ids from localStorage, resolved against the
        // already-fetched listings, preserving most-recent-first order.
        const byId = Object.fromEntries(all.map((l) => [l.id, l]));
        setRecent(
          getRecentlyViewed()
            .map((id) => byId[id])
            .filter((l) => l && l.active !== false)
            .slice(0, 4)
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <Seo
        title="Sea Mountain Vacations | North Myrtle Beach & Grand Strand Vacation Rentals"
        description={DEFAULT_DESCRIPTION}
        path="/"
        jsonLd={buildLocalBusinessJsonLd()}
      />
      <Hero image={siteImages["hero:home"]} ready={siteImages.ready === true} />

      {!loading && recent.length > 0 && (
        <Section title="Pick up where you left off" viewAllTo="/search">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recent.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                price={computeListingPrice(l, calendarMap, "", "")}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title={t("home:collections:title")} subtitle={t("home:collections:subtitle")}>
        <CollectionGrid images={siteImages} />
      </Section>

      <section className="max-w-7xl mx-auto px-6">
        <Link
          to="/match"
          className="group flex flex-col sm:flex-row items-center justify-between gap-4 bg-coast-navy text-white rounded-2xl px-6 py-6 sm:px-8 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-coast-sunset flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold">{t("home:match:title")}</h2>
              <p className="text-sm text-white/75 mt-0.5">{t("home:match:subtitle")}</p>
            </div>
          </div>
          <span className="shrink-0 bg-coast-sunset group-hover:bg-coast-sunset-deep transition-colors text-white text-sm font-medium rounded-xl px-5 py-3">
            {t("home:match:button")}
          </span>
        </Link>
      </section>

      <Section title={t("home:areas:title")} subtitle={t("home:areas:subtitle")}>
        <AreaGrid images={siteImages} />
      </Section>

      <Section
        title={t("home:hundred:title")}
        subtitle={t("home:hundred:subtitle")}
        viewAllTo="/collections/the-100-collection"
      >
        {loading ? <SkeletonCards count={4} /> : <FeaturedRentals listings={featured} calendarMap={calendarMap} />}
      </Section>

      <Section title={t("home:new:title")} subtitle={t("home:new:subtitle")}>
        {loading ? (
          <SkeletonCards count={4} className="flex gap-5 overflow-hidden [&>div]:min-w-[280px] [&>div]:max-w-[280px]" />
        ) : (
          <NewRentals listings={newest} calendarMap={calendarMap} />
        )}
      </Section>

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-8">
          {WHY_ICONS.map((Icon, i) => {
            const title = t(`home:why${i + 1}:title`);
            const text = t(`home:why${i + 1}:text`);
            return (
            <div key={title} className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-white text-coast-ocean flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{text}</p>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      <Section title={t("home:video:title")} subtitle={t("home:video:subtitle")}>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-coast-navy max-w-4xl">
          <LazyIframe
            src="https://properties.williamcoveymedia.com/videos/019e0af8-01a6-700a-acf0-ae4458ec1c30"
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title="Sea Mountain Vacations property tour"
          />
        </div>
      </Section>

      <Section title={t("home:reviews:title")} subtitle={t("home:reviews:subtitle")}>
        <div className="w-full">
          <LazyIframe
            src="https://embed.joinreva.com/widgets/959b0dfd-c95f-4730-9f81-522a32ad120e"
            width="100%"
            height={1150}
            frameBorder="0"
            className="w-full block h-[1950px] sm:h-[1500px] md:h-[1350px] lg:h-[1150px]"
            title="Guest Reviews"
          />
        </div>
      </Section>

      <GuestFaq />
    </div>
  );
}