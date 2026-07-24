import React from "react";
import { Link } from "react-router-dom";
import { COLLECTIONS } from "@/lib/collections";

export default function CollectionGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {COLLECTIONS.map(({ label, slug, icon: Icon }) => (
        <Link
          key={slug}
          to={`/collections/${slug}`}
          className="group relative overflow-hidden rounded-2xl p-6 h-40 flex flex-col justify-end text-white bg-gradient-to-br from-coast-ocean to-coast-navy hover:shadow-lg transition-shadow"
        >
          <Icon className="absolute top-5 right-5 w-8 h-8 text-white/40 group-hover:text-white/70 transition-colors" />
          <h3 className="font-heading text-lg font-semibold">{label}</h3>
          <span className="text-xs text-white/70 mt-1">Explore homes →</span>
        </Link>
      ))}
    </div>
  );
}