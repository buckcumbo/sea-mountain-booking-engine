import React from "react";
import { prettifyArea } from "@/lib/availability";
import { getBreezewayStatus } from "@/lib/breezewayMock";

const CLEAN_STYLES = {
  scheduled: "bg-muted text-muted-foreground",
  "in progress": "bg-blue-500/10 text-blue-600",
  done: "bg-emerald-500/10 text-emerald-600",
  inspected: "bg-teal-600/10 text-teal-700",
};

// One reservation row: unit + guest, dates, status/payment verbatim, flag
// chips, read-only Breezeway (mock) clean chip, and a disabled Guesty link.
export default function ReservationRow({ reservation, listing }) {
  const flags = reservation.flags || [];
  const breezeway = getBreezewayStatus(reservation.listingId);
  const cleanClass = CLEAN_STYLES[breezeway.status] || CLEAN_STYLES.scheduled;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-heading font-semibold text-foreground leading-tight truncate">
            {listing?.title || "Unknown unit"}
          </div>
          <div className="text-xs text-muted-foreground">{prettifyArea(listing?.area)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium text-foreground">{reservation.guestProfileId}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Guest</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {reservation.checkIn} → {reservation.checkOut}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {reservation.status || "—"}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {reservation.paymentStatus || "—"}
        </span>
        {flags.includes("unpaid-balance") && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-medium">
            Unpaid balance
          </span>
        )}
        {flags.includes("same-day-turn") && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-medium">
            Same-day turn
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <a
          href={breezeway.url}
          target="_blank"
          rel="noreferrer"
          className={`text-[11px] px-2 py-0.5 rounded-full ${cleanClass} hover:opacity-80`}
        >
          Breezeway (mock) · {breezeway.status}
        </a>
        <span title="Available after Guesty connection">
          <button
            type="button"
            disabled
            className="text-[11px] px-2.5 py-0.5 rounded-full border border-border text-muted-foreground opacity-60 cursor-not-allowed"
          >
            View in Guesty
          </button>
        </span>
      </div>
    </div>
  );
}