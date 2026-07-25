import React from "react";
import { PawPrint, BedDouble, Bath, Users } from "lucide-react";
import { prettifyArea } from "@/lib/availability";
import { Link } from "react-router-dom";
import HeartToggle from "@/components/favorites/HeartToggle";
import CollectionChips from "@/components/search/CollectionChips";

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
  return (
    <Link to={`/listing/${listing.slug || listing.id}`} className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-coast-foam">
        {photo && (
          <img
            src={photo}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        )}
        {listing.featured && (
          <span className="absolute top-3 left-3 bg-coast-navy text-white text-xs font-medium px-2.5 py-1 rounded-full">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-coast-navy text-xs font-medium px-2.5 py-1 rounded-full">
          {prettifyArea(listing.area)}
        </span>
        <span className="absolute top-3 right-3">
          <HeartToggle listingId={listing.id} />
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
        <div className="pt-3 border-t border-border">
          <PriceLine price={price} />
        </div>
      </div>
    </Link>
  );
}