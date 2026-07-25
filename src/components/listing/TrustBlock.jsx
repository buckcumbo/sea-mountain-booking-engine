import React from "react";
import { ShieldCheck, Star, KeyRound, Phone } from "lucide-react";
import { PHONE } from "@/lib/contact";

// Trust signals rendered under the booking panel. Every claim here is a
// verified brand fact (see smv-brand guide) — nothing aspirational, no
// manufactured urgency. If a fact changes, change it here once.
const ITEMS = [
  {
    icon: ShieldCheck,
    title: "No hidden fees",
    body: "The price you see is the price you pay. Utilities, WiFi, linens, and towels are always included.",
  },
  {
    icon: Star,
    title: "2,500+ five-star reviews",
    body: "From guests who booked direct with our local team.",
  },
  {
    icon: KeyRound,
    title: "Smart-lock check-in",
    body: "Your door code arrives before you do. Check-in at 4 PM, checkout at 10 AM.",
  },
  {
    icon: Phone,
    title: "A real local team",
    body: `We're up the road in Cherry Grove, not a call center. ${PHONE}.`,
  },
];

export default function TrustBlock() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <ul className="space-y-4">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-coast-sand flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-coast-ocean" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-coast-navy leading-tight">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}