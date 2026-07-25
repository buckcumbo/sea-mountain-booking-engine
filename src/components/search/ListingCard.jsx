import React from "react";
import { PawPrint, BedDouble, Bath, Users } from "lucide-react";
import { prettifyArea, prettifyDateRange } from "@/lib/availability";
import { listingMatchesCollection } from "@/lib/collections";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import HeartToggle from "@/components/favorites/HeartToggle";
import CollectionChips from "@/components/search/CollectionChips";

const HUNDRED_COLLECTION_LOGO =
  "https://media.base44.com/images/public/6a63dd8f4f2513356229c302/d4de64f63_100_Collection_Logo_Gold.png";

function PriceLine({ price }) {
  if (!price) {
    return <div className="text-sm text-muted-foreground">Rates on request</div>;
  }
  if (price.hasDates) {
    return (
      <div className="text-sm">
        <span className="font-heading font-semibold text-coast-navy">
          from ${price.total} total
        </span>
        <span className="text-muted-foreground"> (${price.avg}/night avg)</span>
      </div>
    );
  }
  if (price.from != null) {
    return (
      <div className="text-sm">
        <span className="font-heading font-semibold text-coast-navy">
          from ${price.from}/night
        </span>
      </div>
    );
  }
  return <div className="text-sm text-muted-foreground">Rates on request</div>;
}

export default function ListingCard({ listing, price }) {
  const photo = listing.photos && listing.photos[0] ? listing.photos[0].url : null;
  const isHundredCollection = listingMatchesCollection(listing, "the-100-collection");
  return (
    <Link to={`/listing/${listing.slug || listing.id}`} className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-coast-foam">
        {photo && (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        )}
        {(listing.featured || isHundredCollection) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {listing.featured && (
              <span className="bg-coast-navy text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Featured
              </span>
            )}
            {isHundredCollection && (
              <span className="inline-flex items-center gap-1 bg-black/55 backdrop-blur text-white text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full">
                <Image
                  src={HUNDRED_COLLECTION_LOGO}
                  alt=""
                  fittingType="fit"
                  originWidth={300}
                  originHeight={400}
                  className="h-[18px]"
                />
                100 COLLECTION™
              </span>
            )}
          </div>
        )}
        <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-coast-navy text-xs font-medium px-2.5 py-1 rounded-full">
          {prettifyArea(listing.area)}
        </span>
        <span className="absolute top-3 right-3">
          <HeartToggle listingId={listing.id} listingSlug={listing.slug} />
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-coast-navy leading-tight">
            {listing.title}
          </h3>
          {listing.petFriendly && (
            <PawPrint className="w-4 h-4 text-coast-ocean shrink-0" />
          )}
        </div>
        <CollectionChips listing={listing} />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="w-4 h-4" />
            {listing.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="w-4 h-4" />
            {listing.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-4 h-4" />
            {listing.sleeps}
          </span>
        </div>
        <div className="pt-3 border-t border-border space-y-1">
          <PriceLine price={price} />
          {price?.shifted && (
            <div className="text-xs text-coast-ocean">
              Your dates are booked — open {prettifyDateRange(price.matchedCheckIn, price.matchedCheckOut)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}