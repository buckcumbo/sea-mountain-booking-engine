import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Image } from "@/components/ui/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

// Gallery-first: main photo + thumbnail strip, plus a full-screen lightbox
// with keyboard nav and a room-by-room photo tour. Rooms come straight from
// photo captions — the admin's captions ("Master Bedroom", "Kitchen") become
// the tour chips, so curating captions curates the tour.
export default function PhotoGallery({ photos, title }) {
  const sorted = useMemo(
    () => [...(photos || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [photos]
  );
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  // Touch swipe in the lightbox — phones page through photos like a native
  // gallery instead of hunting for arrow buttons.
  const touchX = useRef(null);

  // [label, firstIndex] per distinct caption, in photo order.
  const rooms = useMemo(() => {
    const map = new Map();
    sorted.forEach((p, i) => {
      const key = (p.caption || "").trim();
      if (key && !map.has(key)) map.set(key, i);
    });
    return [...map.entries()];
  }, [sorted]);

  const count = sorted.length;
  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  if (count === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-coast-sand flex items-center justify-center text-muted-foreground text-sm">
        No photos available
      </div>
    );
  }

  const active = sorted[Math.min(idx, count - 1)];

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-coast-foam">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute inset-0 w-full h-full cursor-zoom-in"
          aria-label="Open photo gallery"
        >
          <Image
            src={active.url}
            alt={active.caption || title || ""}
            fittingType="fill"
            className="w-full h-full"
          />
        </button>
        {active.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-white text-sm pointer-events-none">
            {active.caption}
          </div>
        )}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur text-coast-navy text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white transition-colors"
        >
          <Images className="w-3.5 h-3.5" /> See all {count} photos
        </button>
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 ${
                i === idx ? "border-coast-ocean" : "border-transparent"
              }`}
            >
              <Image src={p.url} alt="" fittingType="fill" className="w-full h-full" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx > 60) prev();
            else if (dx < -60) next();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Photos of ${title || "this home"}`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-white/80 text-sm tabular-nums shrink-0">
              {idx + 1} / {count}
            </span>
            {rooms.length > 1 && rooms.length <= 14 && (
              <div className="flex gap-1.5 overflow-x-auto">
                {rooms.map(([label, firstIdx]) => {
                  const activeRoom =
                    (active.caption || "").trim() === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIdx(firstIdx)}
                      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                        activeRoom
                          ? "bg-white text-coast-navy"
                          : "bg-white/15 text-white hover:bg-white/25"
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
              onClick={() => setLightbox(false)}
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
            <Image
              src={active.url}
              alt={active.caption || title || ""}
              fittingType="fit"
              className="max-h-full w-full h-full"
            />
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