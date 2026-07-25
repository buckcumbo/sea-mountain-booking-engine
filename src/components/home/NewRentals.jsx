import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ListingCard from "@/components/search/ListingCard";

// Horizontal scroll row of the newest listings + a "View all rentals" link.
export default function NewRentals({ listings }) {
  if (!listings || listings.length === 0) return null;
  return (
    <div>
      <div className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
        {listings.map((l) => (
          <div
            key={l.id}
            className="min-w-[280px] max-w-[280px] snap-start shrink-0"
          >
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-coast-ocean hover:underline"
        >
          View all rentals <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}