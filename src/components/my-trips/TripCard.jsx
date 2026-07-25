import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import { prettifyArea } from "@/lib/availability";

export default function TripCard({ reservation, listing }) {
  const photo = listing?.photos?.[0]?.url;
  return (
    <Link
      to={`/my-trips/${reservation.id}`}
      className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="grid sm:grid-cols-[160px_1fr]">
        <div className="aspect-[4/3] sm:aspect-auto bg-coast-foam">
          {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold text-coast-navy">
                {listing?.title || "Your reservation"}
              </h3>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {listing ? prettifyArea(listing.area) : "N/A"}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-coast-ocean/10 text-coast-ocean capitalize whitespace-nowrap">
              {reservation.status || "N/A"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {reservation.checkIn} → {reservation.checkOut}
            </span>
            {reservation.guests != null && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4" />
                {reservation.guests}
              </span>
            )}
          </div>
          {reservation.paymentStatus && (
            <p className="text-xs text-muted-foreground">
              Payment: <span className="text-coast-navy font-medium">{reservation.paymentStatus}</span>
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-coast-ocean">
            View details <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}