import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { prettifyArea } from "@/lib/availability";

// Shared guide card used on the guides hub and the area "Things to do" strip.
export default function GuideCard({ guide }) {
  return (
    <Link
      to={`/guides/${guide.slug}`}
      className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[16/10] relative bg-gradient-to-br from-coast-ocean to-coast-navy">
        {guide.heroImage && (
          <img
            src={guide.heroImage}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <span className="absolute top-3 left-3 text-[11px] uppercase tracking-wide text-white bg-coast-navy/70 backdrop-blur px-2 py-0.5 rounded-full capitalize">
          {guide.category}
        </span>
      </div>
      <div className="p-5">
        <div className="text-xs text-muted-foreground mb-1">{prettifyArea(guide.area)}</div>
        <h3 className="font-heading font-semibold text-coast-navy group-hover:text-coast-ocean transition-colors">
          {guide.title}
        </h3>
        {guide.excerpt && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{guide.excerpt}</p>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-coast-ocean mt-3">
          Read more <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}