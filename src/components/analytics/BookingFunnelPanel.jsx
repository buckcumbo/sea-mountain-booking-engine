import { useEffect, useState } from "react";
import { Loader2, Search, Home, FileText, CalendarCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Direct-site booking funnel: searches -> listing views -> quotes -> bookings.
// Counts come from the getFunnelStats backend function (admin-only). This is
// site behavior Guesty has no visibility into; PMS reporting stays in Guesty.

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

function pct(from, to) {
  if (!from) return null;
  return Math.round((to / from) * 1000) / 10;
}

export default function BookingFunnelPanel() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    base44.functions
      .invoke("getFunnelStats", { days })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.error || "Unable to load funnel");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const steps = data
    ? [
        { icon: Search, label: "Searches", value: data.searches, conv: null },
        { icon: Home, label: "Listing views", value: data.listingViews, conv: pct(data.searches, data.listingViews) },
        { icon: FileText, label: "Quotes created", value: data.quotesCreated, conv: pct(data.listingViews, data.quotesCreated) },
        { icon: CalendarCheck, label: "Direct bookings", value: data.directReservations, conv: pct(data.quotesCreated, data.directReservations) },
      ]
    : [];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-coast-navy">Booking funnel</h2>
          <p className="text-xs text-muted-foreground">
            Direct site only, last {days} days{data?.since ? ` (since ${data.since})` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                days === r.days
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-coast-ocean" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-muted-foreground py-4">{error}</p>}

      {!loading && !error && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </div>
              <div className="font-heading text-2xl font-semibold text-coast-navy">
                {Number(s.value).toLocaleString()}
              </div>
              {s.conv != null && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {s.conv}% of previous step
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
