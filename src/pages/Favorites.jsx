import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Heart, Search } from "lucide-react";
import { useFavorites } from "@/lib/FavoritesContext";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/search/ListingCard";

export default function Favorites() {
  const { items } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const ids = items.map((f) => f.listingId);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Listing.list("-created_date", 500);
        setListings(all || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saved = listings.filter((l) => ids.includes(l.id));

  return (
    <div className="bg-coast-foam min-h-screen">
      <section className="bg-coast-navy text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="font-heading text-3xl font-semibold">Your Favorites</h1>
          <p className="text-white/80 mt-1 text-sm">
            {loading ? "Loading…" : `${saved.length} saved home${saved.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </section>
      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-coast-sand flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-coast-ocean" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">No favorites yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-5">
              Tap the heart on any rental to save it here for later.
            </p>
            <Button asChild className="bg-coast-navy hover:bg-coast-navy-soft text-white">
              <Link to="/search">
                <Search className="w-4 h-4 mr-1.5" /> Find a Rental
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {saved.map((l) => (
              <ListingCard key={l.id} listing={l} price={{ hasDates: false, from: null }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}