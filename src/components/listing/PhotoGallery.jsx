import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Image } from "@/components/ui/image";
import { X, ChevronLeft, ChevronRight, Images, ArrowLeft } from "lucide-react";

// Airbnb-style gallery in three layers:
//  1. Hero — desktop: collage (1 big + 4 small) with "Show all photos";
//     mobile: full-width swipeable photo with an index counter.
//  2. Photo wall — full-screen scrollable grid of every photo, grouped into
//     sections by caption (captions come from the admin editor, so curating
//     captions curates the tour).
//  3. Carousel — full-bleed lightbox with arrows, keyboard, swipe, and room
//     chips. Opened from the wall (or hero), backs out to the wall.
export default function PhotoGallery({ photos, title }) {
  const sorted = useMemo(
    () => [...(photos || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [photos]
  );
  const count = sorted.length;
  const [idx, setIdx] = useState(0);
  // view: null (page) | "wall" (photo grid) | "carousel" (full-bleed)
  const [view, setView] = useState(null);
  const touchX = useRef(null);
  const wallRef = useRef(null);

  // Sections for the wall: consecutive runs of the same caption become one
  // titled group; uncaptioned leading photos land in the home-name group.
  const sections = useMemo(() => {
    const out = [];
    sorted.forEach((p, i) => {
      const label = (p.caption || "").trim();
      const last = out[out.length - 1];
      if (last && (label === "" || last.label === label)) {
        last.items.push({ ...p, index: i });
      } else {
        out.push({ label: label || title || "Photos", items: [{ ...p, index: i }] });
      }
    });
    return out;
  }, [sorted, title]);

  // [label, firstIndex] chips for the carousel header.
  const rooms = useMemo(() => {
    const map = new Map();
    sorted.forEach((p, i) => {
      const key = (p.caption || "").trim();
      if (key && !map.has(key)) map.set(key, i);
    });
    return [...map.entries()];
  }, [sorted]);

  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (!view) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        // Carousel backs out to the wall; the wall closes.
        setView((v) => (v === "carousel" ? "wall" : null));
      }
      if (view === "carousel") {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [view, prev, next]);

  if (count === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-coast-sand flex items-center justify-center text-muted-foreground text-sm">
        No photos available
      </div>
    );
  }

  const active = sorted[Math.min(idx, count - 1)];
  const collage = sorted.slice(0, 5);
  const openAt = (i, v = "carousel") => {
    setIdx(i);
    setView(v);
  };

  // Swipe helpers shared by mobile hero and carousel.
  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const swipeEnd = (e, onLeft, onRight) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx > 60) onRight();
    else if (dx < -60) onLeft();
  };

  return (
    <div>
      {/* ---- Mobile hero: swipeable single photo with counter ---- */}
      <div
        className="relative md:hidden aspect-[4/3] rounded-2xl overflow-hidden bg-coast-foam"
        onTouchStart={onTouchStart}
        onTouchEnd={(e) => swipeEnd(e, next, prev)}
      >
        <button
          type="button"
          onClick={() => setView("wall")}
          className="absolute inset-0 w-full h-full"
          aria-label="Open photo gallery"
        >
          <Image src={active.url} alt={active.caption || title || ""} fittingType="fill" className="w-full h-full" />
        </button>
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full tabular-nums pointer-events-none">
          {idx + 1} / {count}
        </span>
      </div>

      {/* ---- Desktop hero: 1 + 4 collage ---- */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden relative aspect-[2/1]">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative col-span-2 row-span-2 group"
          aria-label="Open photo 1"
        >
          <Image src={collage[0].url} alt={collage[0].caption || title || ""} fittingType="fill" className="w-full h-full group-hover:brightness-95 transition-[filter]" />
        </button>
        {collage.slice(1).map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => openAt(i + 1)}
            className="relative group"
            aria-label={`Open photo ${i + 2}`}
          >
            <Image src={p.url} alt={p.caption || ""} fittingType="fill" className="w-full h-full group-hover:brightness-95 transition-[filter]" />
          </button>
        ))}
        {/* Pad the grid when fewer than 5 photos so cells don't collapse */}
        {collage.length < 5 &&
          Array.from({ length: 5 - collage.length }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-coast-sand" />
          ))}
        <button
          type="button"
          onClick={() => setView("wall")}
          className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-white text-coast-navy text-sm font-medium px-4 py-2 rounded-lg border border-coast-navy/20 shadow-sm hover:bg-coast-foam transition-colors"
        >
          <Images className="w-4 h-4" /> Show all {count} photos
        </button>
      </div>

      {/* ---- Photo wall: scrollable grid grouped by room ---- */}
      {view === "wall" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col" role="dialog" aria-modal="true" aria-label={`All photos of ${title || "this home"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0">
            <button
              type="button"
              onClick={() => setView(null)}
              className="p-2 -ml-2 text-coast-navy hover:bg-muted rounded-full"
              aria-label="Close photos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-heading font-semibold text-coast-navy text-sm truncate px-2">
              {title}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{count} photos</span>
          </div>
          <div ref={wallRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
              {sections.map((s, si) => (
                <section key={si}>
                  <h3 className="font-heading font-semibold text-coast-navy mb-3">{s.label}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {s.items.map((p, pi) => (
                      <button
                        key={p.index}
                        type="button"
                        onClick={() => openAt(p.index)}
                        // Airbnb rhythm: first photo of each room spans full
                        // width, the rest pair up two across.
                        className={`relative overflow-hidden rounded-xl group ${pi % 3 === 0 ? "col-span-2 aspect-[2/1]" : "aspect-[4/3]"}`}
                        aria-label={`Open photo ${p.index + 1}`}
                      >
                        <Image src={p.url} alt={p.caption || ""} fittingType="fill" className="w-full h-full group-hover:brightness-95 transition-[filter]" />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Carousel: full-bleed lightbox ---- */}
      {view === "carousel" && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onTouchStart={onTouchStart}
          onTouchEnd={(e) => swipeEnd(e, next, prev)}
          role="dialog"
          aria-modal="true"
          aria-label={`Photos of ${title || "this home"}`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setView("wall")}
              className="text-white/80 hover:text-white p-1 shrink-0"
              aria-label="Back to all photos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-white/80 text-sm tabular-nums shrink-0">
              {idx + 1} / {count}
            </span>
            {rooms.length > 1 && rooms.length <= 14 && (
              <div className="flex gap-1.5 overflow-x-auto">
                {rooms.map(([label, firstIdx]) => {
                  const activeRoom = (active.caption || "").trim() === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIdx(firstIdx)}
                      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                        activeRoom ? "bg-white text-coast-navy" : "bg-white/15 text-white hover:bg-white/25"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => setView(null)}
              className="text-white/80 hover:text-white p-1 shrink-0"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-12">
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <Image src={active.url} alt={active.caption || title || ""} fittingType="fit" className="max-h-full w-full h-full" />
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
              aria-label="Next photo"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="px-4 py-3 text-center text-white/80 text-sm min-h-[2.5rem]">
            {active.caption || ""}
          </div>
        </div>
      )}
    </div>
  );
}
