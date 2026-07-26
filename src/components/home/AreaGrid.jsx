import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { AREA_LABELS } from "@/lib/availability";
import { Image } from "@/components/ui/image";

const BLURBS = {
  "north-myrtle-beach": "Family-friendly shores, championship golf, and the Cherry Grove pier.",
  "myrtle-beach": "The heart of the Grand Strand: boardwalk, shows, and oceanfront energy.",
  surfside: "A quiet, relaxed stretch perfect for unhurried family getaways.",
  "garden-city": "Canal-front charm and a laid-back pier just south of the action.",
  "murrells-inlet": "The seafood capital of SC: marsh views and the famous MarshWalk.",
  "pawleys-island": "Timeless lowcountry: one of America's oldest resort beaches.",
};

export default function AreaGrid({ images }) {
  const areas = Object.entries(AREA_LABELS);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {areas.map(([slug, label]) => {
        const img = images?.[`area-card:${slug}`];
        return (
          <Link
            key={slug}
            to={`/area/${slug}`}
            className="group relative overflow-hidden rounded-2xl h-48 flex flex-col justify-end p-5 text-white bg-gradient-to-br from-coast-navy-soft to-coast-navy hover:shadow-lg transition-shadow"
          >
            {img && (
              <>
                <Image
                  src={img.imageUrl}
                  alt={img.altText || label}
                  fittingType="fill"
                  className="absolute inset-0 w-full h-full"
                />
                {/* Bottom-weighted wash: photo stays visible, text stays readable. */}
                <div className="absolute inset-0 bg-gradient-to-t from-coast-navy/85 via-coast-navy/30 to-coast-navy-soft/15" />
              </>
            )}
            <MapPin className="absolute top-4 right-4 w-6 h-6 text-white/40 group-hover:text-white/70 transition-colors z-10" />
            <h3 className="relative z-10 font-heading text-lg font-semibold">{label}</h3>
            <p className="relative z-10 text-xs text-white/75 mt-1 line-clamp-2">{BLURBS[slug]}</p>
          </Link>
        );
      })}
    </div>
  );
}