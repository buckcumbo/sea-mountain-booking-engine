import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  BedDouble,
  Bath,
  Users,
  PawPrint,
  Waves,
  MapPin,
} from "lucide-react";
import { prettifyArea } from "@/lib/availability";
import PhotoGallery from "@/components/listing/PhotoGallery";
import BookingPanel from "@/components/listing/BookingPanel";
import Reviews from "@/components/listing/Reviews";

// Reads ONLY Listing, CalendarDay, Review. No external network calls.
export default function ListingDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [listing, setListing] = useState(null);
  const [cal, setCal] = useState({});
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setListing(null);
      try {
        let found = null;
        if (slug) {
          const matches = await base44.entities.Listing.filter({ slug }, "-created_date", 1);
          found = matches && matches[0];
          if (!found) {
            try { found = await base44.entities.Listing.get(slug); } catch { /* not an id */ }
          }
        }
        if (!found) { if (!cancelled) setNotFound(true); return; }
        if (cancelled) return;
        setListing(found);
        const [days, revs] = await Promise.all([
          base44.entities.CalendarDay.filter({ listingId: found.id }, "-date", 500),
          base44.entities.Review.filter({ listingId: found.id, published: true }, "-stayDate", 100),
        ]);
        if (cancelled) return;
        const map = {};
        for (const d of days) map[d.date] = d;
        setCal(map);
        setReviews(revs || []);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-coast-foam flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-coast-foam flex flex-col items-center justify-center gap-2">
        <h1 className="font-heading text-xl font-semibold text-coast-navy">Listing not found</h1>
        <Link to="/search" className="text-coast-ocean hover:underline text-sm">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coast-foam">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            <PhotoGallery photos={listing.photos} title={listing.title} />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {prettifyArea(listing.area)}
                </span>
                {listing.petFriendly && (
                  <span className="inline-flex items-center gap-1 text-xs bg-coast-ocean-soft text-coast-ocean px-2 py-1 rounded-full">
                    <PawPrint className="w-3 h-3" /> Pet-friendly
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl font-semibold text-coast-navy leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" /> {listing.bedrooms} bed{listing.bedrooms === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="w-4 h-4" /> {listing.bathrooms} bath{listing.bathrooms === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Sleeps {listing.sleeps}
                </span>
              </div>
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {listing.amenities.map((a, i) => (
                    <span
                      key={i}
                      className="text-xs bg-card border border-border rounded-full px-2.5 py-1 text-coast-navy"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {listing.storyCopy && (
              <section className="space-y-2">
                <h2 className="font-heading text-lg font-semibold text-coast-navy">About this stay</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.storyCopy}
                </p>
              </section>
            )}

            <section className="grid sm:grid-cols-2 gap-6">
              {listing.beachWalkMinutes != null && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Waves className="w-4 h-4 text-coast-ocean" />
                    <span className="font-heading text-sm font-semibold text-coast-navy">
                      Walk to the beach
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {listing.beachWalkMinutes}-minute walk to the beach
                  </p>
                </div>
              )}
              {listing.sleepsWhere && listing.sleepsWhere.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="font-heading text-sm font-semibold text-coast-navy">
                    Sleeping arrangements
                  </span>
                  <ul className="mt-2 space-y-1 text-sm">
                    {listing.sleepsWhere.map((s, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{s.room}</span>
                        <span className="text-coast-navy">{s.beds}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-heading text-lg font-semibold text-coast-navy">Guest reviews</h2>
              <Reviews reviews={reviews} />
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <BookingPanel listing={listing} cal={cal} />
          </aside>
        </div>
      </main>
    </div>
  );
}