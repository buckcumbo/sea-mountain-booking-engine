import React from "react";
import { Link } from "react-router-dom";
import { Waves, PawPrint, Droplets, Anchor, Wallet, Crown } from "lucide-react";

const COLLECTIONS = [
  { label: "Oceanfront", slug: "oceanfront", icon: Waves },
  { label: "Pet Friendly", slug: "pet-friendly", icon: PawPrint },
  { label: "Poolside", slug: "poolside", icon: Droplets },
  { label: "Channel Homes", slug: "channel-homes", icon: Anchor },
  { label: "Budget Friendly", slug: "budget", icon: Wallet },
  { label: "The 100 Collection", slug: "100-collection", icon: Crown },
];

export default function CollectionGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {COLLECTIONS.map(({ label, slug, icon: Icon }) => (
        <Link
          key={slug}
          to={`/search?collection=${slug}`}
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