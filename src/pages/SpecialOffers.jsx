import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Tag, Mail } from "lucide-react";
import { COLLECTIONS } from "@/lib/collections";
import ListingCard from "@/components/search/ListingCard";
import Seo from "@/components/Seo";
import { EMAIL } from "@/lib/contact";

export default function SpecialOffers() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Listing.list("-created_date", 500);
        setOffers((all || []).filter((l) => l.active !== false && l.offer));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <Seo
        title="Special Offers | Sea Mountain Vacations"
        description="Seasonal deals and last-minute savings on Grand Strand vacation rentals."
        path="/special-offers"
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold">Special Offers</h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            Seasonal deals and last-minute savings on Grand Strand vacation rentals.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
          </div>
        ) : offers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map((l) => (
              <ListingCard key={l.id} listing={l} price={{ hasDates: false, from: null }} />
            ))}
          </div>
        ) : (
          <div className="bg-coast-sand rounded-2xl p-10 text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center mb-4">
              <Tag className="w-6 h-6 text-coast-ocean" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">No current offers</h2>
            <p className="text-muted-foreground mb-6">
              We don't have any active specials right now — but new offers drop seasonally. Join our list
              to be the first to know.
            </p>
            <a
              href={`mailto:${EMAIL}?subject=Special%20Offers%20List`}
              className="inline-flex items-center gap-2 bg-coast-navy hover:bg-coast-navy-soft text-white text-sm px-5 py-2.5 rounded-lg"
            >
              <Mail className="w-4 h-4" /> Join our offers list
            </a>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Browse by collection</p>
              <div className="flex flex-wrap justify-center gap-2">
                {COLLECTIONS.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/collections/${c.slug}`}
                    className="text-xs px-3 py-1.5 rounded-full border bg-card text-coast-navy border-border hover:border-coast-ocean transition-colors"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}