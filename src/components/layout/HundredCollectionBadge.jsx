import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";

const LOGO_URL =
  "https://media.base44.com/images/public/6a63dd8f4f2513356229c302/d4de64f63_100_Collection_Logo_Gold.png";

// "The 100 Collection™" membership badge. Displays the official gold logo
// next to a small "PROUD MEMBER" label. Links to the internal collection page.
export default function HundredCollectionBadge({ source: _source }) {
  return (
    <Link
      to="/collections/the-100-collection"
      className="inline-flex items-center gap-2 group"
      title="The 100 Collection™: Proud Member"
    >
      <span className="text-[10px] uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Proud Member
      </span>
      <Image
        src={LOGO_URL}
        alt="The 100 Collection™"
        fittingType="fit"
        originWidth={300}
        originHeight={400}
        className="h-10"
      />
    </Link>
  );
}