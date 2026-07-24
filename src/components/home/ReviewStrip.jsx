import React from "react";
import { Star } from "lucide-react";

export default function ReviewStrip({ reviews }) {
  if (!reviews || reviews.length === 0) return null;
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {reviews.map((r) => (
        <div key={r.id} className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (r.rating || 0)
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">"{r.text}"</p>
          <div className="mt-4 text-sm font-medium text-coast-navy">{r.guestName}</div>
        </div>
      ))}
    </div>
  );
}