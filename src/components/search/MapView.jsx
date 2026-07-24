import React, { useMemo } from "react";
import { AREA_COORDS, prettifyArea } from "@/lib/availability";

export default function MapView({ listings, prices, selectedId, onSelect }) {
  const markers = useMemo(
    () =>
      listings.map((l, i) => {
        const coord = AREA_COORDS[l.area] || { x: 35, y: 50 };
        const jitter = (i % 5) * 3 - 6;
        return {
          id: l.id,
          listing: l,
          price: prices[l.id],
          left: coord.x + jitter * 0.4,
          top: coord.y + jitter * 0.5,
        };
      }),
    [listings, prices]
  );

  const selected = markers.find((m) => m.id === selectedId);

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-border bg-gradient-to-b from-coast-ocean-soft to-coast-foam">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 0 L 22 0 L 26 20 L 24 40 L 28 60 L 30 80 L 24 100 L 0 100 Z"
          fill="hsl(var(--coast-sand-deep))"
          opacity="0.6"
        />
        <path
          d="M 0 0 L 20 0 L 24 20 L 22 40 L 26 60 L 28 80 L 22 100 L 0 100 Z"
          fill="hsl(var(--coast-sand))"
          opacity="0.85"
        />
      </svg>

      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-coast-navy">
        Grand Strand · {listings.length} stay{listings.length === 1 ? "" : "s"}
      </div>

      {markers.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          style={{ left: `${m.left}%`, top: `${m.top}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md border transition-all ${
            selectedId === m.id
              ? "bg-coast-navy text-white border-coast-navy scale-110 z-20"
              : "bg-white text-coast-navy border-border hover:bg-coast-navy hover:text-white z-10"
          }`}
        >
          {m.price && m.price.hasDates
            ? `$${m.price.total}`
            : m.price && m.price.from != null
            ? `$${m.price.from}`
            : "•"}
        </button>
      ))}

      {selected && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-white rounded-xl shadow-lg border border-border p-3 flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-coast-foam overflow-hidden shrink-0">
            {selected.listing.photos && selected.listing.photos[0] && (
              <img
                src={selected.listing.photos[0].url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-heading font-semibold text-sm text-coast-navy truncate">
              {selected.listing.title}
            </div>
            <div className="text-xs text-muted-foreground">
              {prettifyArea(selected.listing.area)} · {selected.listing.sleeps} guests
            </div>
            <div className="text-sm font-semibold text-coast-ocean mt-1">
              {selected.price && selected.price.hasDates
                ? `from $${selected.price.total} total`
                : selected.price && selected.price.from != null
                ? `from $${selected.price.from}/night`
                : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}