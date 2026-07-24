import React, { useState } from "react";
import { Image } from "@/components/ui/image";

// Gallery-first: main photo + thumbnail strip. Respects `order`, shows captions.
export default function PhotoGallery({ photos, title }) {
  const sorted = [...(photos || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const [idx, setIdx] = useState(0);

  if (sorted.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-coast-sand flex items-center justify-center text-muted-foreground text-sm">
        No photos available
      </div>
    );
  }

  const active = sorted[Math.min(idx, sorted.length - 1)];

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-coast-foam">
        <Image
          src={active.url}
          alt={active.caption || title || ""}
          fittingType="fill"
          className="w-full h-full"
        />
        {active.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-white text-sm">
            {active.caption}
          </div>
        )}
      </div>
      {sorted.length > 1 && (
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
    </div>
  );
}