import React from "react";
import { Link } from "react-router-dom";
import { COLLECTIONS } from "@/lib/collections";
import { Image } from "@/components/ui/image";

const HUNDRED_COLLECTION_LOGO =
  "https://media.base44.com/images/public/6a63dd8f4f2513356229c302/d4de64f63_100_Collection_Logo_Gold.png";

export default function CollectionGrid({ images }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {COLLECTIONS.map(({ label, slug, icon: Icon }) => {
        const img = images?.[`collection-card:${slug}`];
        return (
          <Link
            key={slug}
            to={`/collections/${slug}`}
            className="group relative overflow-hidden rounded-2xl p-6 h-40 flex flex-col justify-end text-white bg-gradient-to-br from-coast-ocean to-coast-navy hover:shadow-lg transition-shadow"
          >
            {img && (
              <>
                <Image
                  src={img.imageUrl}
                  alt={img.altText || label}
                  fittingType="fill"
                  className="absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-coast-ocean/70 to-coast-navy/90" />
              </>
            )}
            {slug === "the-100-collection" ? (
              <div className="absolute top-4 right-4 w-12 h-12 opacity-80 group-hover:opacity-100 transition-opacity">
                <Image
                  src={HUNDRED_COLLECTION_LOGO}
                  alt="The 100 Collection"
                  fittingType="fit"
                  originWidth={300}
                  originHeight={400}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <Icon className="absolute top-5 right-5 w-8 h-8 text-white/40 group-hover:text-white/70 transition-colors" />
            )}
            <h3 className="relative z-10 font-heading text-lg font-semibold">{label}</h3>
            <span className="relative z-10 text-xs text-white/70 mt-1">Explore homes →</span>
          </Link>
        );
      })}
    </div>
  );
}