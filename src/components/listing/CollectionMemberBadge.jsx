import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";

const LOGO_URL =
  "https://media.base44.com/images/public/6a63dd8f4f2513356229c302/d4de64f63_100_Collection_Logo_Gold.png";

// Shown on listing detail pages for 100 Collection member properties.
// Displays the gold logo, a "Proud member" label, and the award note.
// Links to the internal collection page.
export default function CollectionMemberBadge() {
  return (
    <Link
      to="/collections/the-100-collection"
      className="flex items-center gap-3 rounded-xl border border-coast-sand-deep bg-coast-sand/30 px-4 py-3 hover:bg-coast-sand/50 transition-colors"
    >
      <Image
        src={LOGO_URL}
        alt="The 100 Collection™"
        fittingType="fit"
        originWidth={300}
        originHeight={400}
        className="h-9 shrink-0"
      />
      <div className="space-y-0.5">
        <p className="font-heading text-sm font-semibold text-coast-navy">
          Proud member of The 100 Collection™
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Independently evaluated and awarded The 100 Collection's exclusive imprint for the highest standard of hospitality on the Grand Strand.
        </p>
      </div>
    </Link>
  );
}