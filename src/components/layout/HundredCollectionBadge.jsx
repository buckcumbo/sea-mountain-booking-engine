import React from "react";

// "The 100 Collection" membership badge. External link with UTM params.
// Uses a bordered text-mark pill because the official logo image could not be
// reliably sourced/hosted as an app asset. Swap <span> for an <img> when an
// asset is available. Uses opacity-based colors so it adapts to light/dark bars.
export default function HundredCollectionBadge({ source }) {
  const href = `https://theonehundredcollection.com?utm_source=${encodeURIComponent(
    source
  )}&utm_medium=${encodeURIComponent("Sea Mountain Vacations")}&utm_campaign=${encodeURIComponent(
    "The 100 Collection"
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 group"
      title="The 100 Collection™ — Proud Member"
    >
      <span className="text-[10px] uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Proud Member
      </span>
      <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase border border-current rounded-full px-2 py-0.5 leading-none whitespace-nowrap">
        The 100 Collection™
      </span>
    </a>
  );
}