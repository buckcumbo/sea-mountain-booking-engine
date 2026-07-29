import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingDown, Eye, Tag } from "lucide-react";
import { activePriceDrop } from "@/lib/callouts";

// Honest marketing callouts for the listing detail page:
//  - Price drop: only when refreshFromRates recorded a real >=5% drop
//  - "N guests viewed": real distinct-session count from our analytics,
//    only shown at 3+ (getListingBuzz returns 0 below that)
//  - Promo: admin-written text from Listing.promoBadge, shown verbatim
export default function ListingCallouts({ listing }) {
  const [views, setViews] = useState(0);
  const drop = activePriceDrop(listing);
  const promo = (listing?.promoBadge || "").trim();

  useEffect(() => {
    if (!listing?.slug) return;
    let cancelled = false;
    base44.functions
      .invoke("getListingBuzz", { slug: listing.slug })
      .then((res) => {
        const body = res?.data ?? res;
        if (!cancelled && body?.views > 0) setViews(body.views);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [listing?.slug]);

  if (!drop && !promo && !views) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {drop && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full">
          <TrendingDown className="w-3.5 h-3.5" />
          Price drop — from ${Math.round(drop.from)} to ${Math.round(drop.now)}/night
        </span>
      )}
      {promo && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-coast-sunset/10 text-coast-sunset-deep px-2.5 py-1 rounded-full">
          <Tag className="w-3.5 h-3.5" />
          {promo}
        </span>
      )}
      {views > 0 && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          {views} guests viewed this home in the last day
        </span>
      )}
    </div>
  );
}
