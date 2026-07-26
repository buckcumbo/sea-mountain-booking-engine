import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Play, X } from "lucide-react";
import { sizedImageUrl } from "@/lib/mediaUrl";

const TOUR_VIDEO_URL =
  "https://properties.williamcoveymedia.com/videos/019e0af8-01a6-700a-acf0-ae4458ec1c30";

const FALLBACK =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80";

export default function Hero({ image, ready }) {
  // Never flash the stock fallback: render no photo (the navy backdrop shows)
  // until the site-image lookup finishes, and only fall back if no hero is
  // configured. The configured hero loads as a CDN-sized WebP, eagerly and
  // at high priority — it's the largest thing above the fold.
  const src = image?.imageUrl
    ? sizedImageUrl(image.imageUrl, 1920)
    : ready
      ? FALLBACK
      : null;
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(0);
  const [showFilm, setShowFilm] = useState(false);

  useEffect(() => {
    if (!showFilm) return;
    const onKey = (e) => e.key === "Escape" && setShowFilm(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showFilm]);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-coast-navy">
      {src && (
        <img
          src={src}
          alt={image?.altText || ""}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover fade-in"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-coast-navy/50 via-coast-navy/40 to-coast-navy/75" />
      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 text-white">
        <h1 className="font-heading text-3xl md:text-5xl font-semibold max-w-3xl leading-tight">
          Vacation Rentals in North Myrtle Beach &amp; the Grand Strand
        </h1>
        <p className="mt-4 text-white/85 max-w-xl">
          Stay in one of our 100 Collection homes along the South Carolina coast: oceanfront,
          channel, and poolside escapes managed by a local on-the-ground team.
        </p>
        <form
          onSubmit={submit}
          className="mt-8 bg-white text-coast-navy rounded-2xl shadow-xl p-3 flex flex-col md:flex-row md:items-end gap-3 max-w-3xl"
        >
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-muted-foreground">Check-in</label>
            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-11 block" />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-muted-foreground">Check-out</label>
            <Input
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(e) => setCheckOut(e.target.value)}
              className="h-11 block"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-muted-foreground">Guests</label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="0">Any</option>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((g) => (
                <option key={g} value={g}>{g}+</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="h-11 px-6 bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            <SearchIcon className="w-4 h-4 mr-1.5" /> Search
          </Button>
        </form>

        <button
          onClick={() => setShowFilm(true)}
          className="mt-6 inline-flex items-center gap-2.5 text-sm text-white/90 hover:text-white group"
        >
          <span className="w-11 h-11 rounded-full bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center group-hover:bg-coast-sunset group-hover:border-coast-sunset transition-colors">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
          Watch the tour
        </button>
      </div>

      {showFilm && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setShowFilm(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Property tour video"
        >
          <button
            onClick={() => setShowFilm(false)}
            aria-label="Close video"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${TOUR_VIDEO_URL}?autoplay=1`}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Sea Mountain Vacations tour"
            />
          </div>
        </div>
      )}
    </section>
  );
}