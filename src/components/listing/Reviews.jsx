import React from "react";
import { Star } from "lucide-react";
import { parseISO, format } from "date-fns";

// Shows published:true reviews for this listing (RLS already restricts public
// reads to published rows; admins see all).
export default function Reviews({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No reviews yet for this property.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="border border-border rounded-xl p-4 bg-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium text-coast-navy">{r.guestName}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-coast-navy">{r.rating}</span>
            </span>
          </div>
          {r.text && <p className="text-sm text-muted-foreground">{r.text}</p>}
          {r.stayDate && (
            <p className="text-xs text-muted-foreground mt-2">
              Stayed {format(parseISO(r.stayDate), "MMMM yyyy")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}