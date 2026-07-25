import React from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PHONE_TEL } from "@/lib/contact";

// Mobile-only sticky bottom bar: name + from-price on the left, Call + Book
// buttons on the right. "Book" scrolls to the booking widget (#booking).
export default function MobileBookingBar({ listing, price }) {
  const scrollToBooking = () => {
    document
      .getElementById("booking")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const from =
    price && price.from != null
      ? `from $${price.from}/night`
      : "Rates on request";

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-heading font-semibold text-sm text-coast-navy truncate">
            {listing.title}
          </div>
          <div className="text-xs text-muted-foreground">{from}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`tel:${PHONE_TEL}`}
            aria-label="Call us"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-coast-navy"
          >
            <Phone className="w-4 h-4" />
          </a>
          <Button onClick={scrollToBooking} className="h-9 px-5">
            Book
          </Button>
        </div>
      </div>
    </div>
  );
}