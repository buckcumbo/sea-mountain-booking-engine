import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Waves, Building2, CalendarDays, BookOpen, Users, FileText, Loader2, RefreshCw } from "lucide-react";

const STAT_CARDS = [
  { key: "Listing", label: "Listings", icon: Building2 },
  { key: "CalendarDay", label: "Calendar Days", icon: CalendarDays },
  { key: "Reservation", label: "Reservations", icon: BookOpen },
  { key: "GuestProfile", label: "Guest Profiles", icon: Users },
  { key: "Quote", label: "Quotes", icon: FileText },
];

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [listings, setListings] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [listingData, days, reservations, guests, quotes] = await Promise.all([
      base44.entities.Listing.list("-created_date", 500),
      base44.entities.CalendarDay.list("-created_date", 5000),
      base44.entities.Reservation.list("-created_date", 500),
      base44.entities.GuestProfile.list("-created_date", 500),
      base44.entities.Quote.list("-created_date", 500),
    ]);
    setListings(listingData);
    setCounts({
      Listing: listingData.length,
      CalendarDay: days.length,
      Reservation: reservations.length,
      GuestProfile: guests.length,
      Quote: quotes.length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold leading-tight">Sea Mountain Booking Engine</h1>
              <p className="text-xs text-primary-foreground/70">Back Office · Grand Strand, SC</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="font-heading text-base font-semibold mb-4">Data Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {STAT_CARDS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-heading font-semibold">
                {loading ? <span className="text-muted-foreground">—</span> : (counts[key] ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-heading text-base font-semibold mb-4">Listings</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Area</th>
                  <th className="text-right font-medium px-4 py-3">Beds</th>
                  <th className="text-right font-medium px-4 py-3">Baths</th>
                  <th className="text-right font-medium px-4 py-3">Max Guests</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td></tr>
                ) : listings.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No listings yet.</td></tr>
                ) : (
                  listings.map((l) => (
                    <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{l.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.area}</td>
                      <td className="px-4 py-3 text-right">{l.bedrooms}</td>
                      <td className="px-4 py-3 text-right">{l.bathrooms}</td>
                      <td className="px-4 py-3 text-right">{l.max_occupancy}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${l.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}