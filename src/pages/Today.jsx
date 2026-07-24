import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Waves, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import ReservationRow from "@/components/today/ReservationRow";

// Staff-only Today board. Reads ONLY Reservation + Listing. No external calls.
// Same auth gate as Admin (route lives under AuthenticatedApp; Reservation RLS
// is admin-only, so non-admins see an empty board).
export default function Today() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [listings, setListings] = useState([]);
  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    setLoading(true);
    const [res, list] = await Promise.all([
      base44.entities.Reservation.list("-created_date", 500),
      base44.entities.Listing.list("-created_date", 500),
    ]);
    setReservations(res);
    setListings(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const listingById = useMemo(
    () => Object.fromEntries(listings.map((l) => [l.id, l])),
    [listings]
  );

  const sections = useMemo(() => {
    const arrivals = reservations.filter((r) => r.checkIn === today);
    const departures = reservations.filter((r) => r.checkOut === today);
    const stayovers = reservations.filter(
      (r) => r.checkIn < today && r.checkOut > today
    );
    // Same-day turns are the fire drill — sort them to the top.
    const turnFirst = (a, b) => {
      const at = (a.flags || []).includes("same-day-turn") ? 0 : 1;
      const bt = (b.flags || []).includes("same-day-turn") ? 0 : 1;
      return at - bt;
    };
    arrivals.sort(turnFirst);
    departures.sort(turnFirst);
    return { arrivals, departures, stayovers };
  }, [reservations, today]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold leading-tight">
                Sea Mountain Booking Engine
              </h1>
              <p className="text-xs text-primary-foreground/70">
                Today's Board · {format(new Date(), "EEEE, MMM d")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg"
            >
              Dashboard
            </Link>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <Section title="Arrivals" rows={sections.arrivals} listingById={listingById} />
            <Section title="Departures" rows={sections.departures} listingById={listingById} />
            <Section title="Stayovers" rows={sections.stayovers} listingById={listingById} />
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, rows, listingById }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground italic border border-dashed border-border rounded-xl p-6 text-center">
          None today
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <ReservationRow key={r.id} reservation={r} listing={listingById[r.listingId]} />
          ))}
        </div>
      )}
    </section>
  );
}