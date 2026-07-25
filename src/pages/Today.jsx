import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Waves, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import ReservationRow from "@/components/today/ReservationRow";
import Seo from "@/components/Seo";

// Staff/admin Today board. Loads all data from the getTodayBoard backend
// function (admin only) instead of querying entities directly. Same-day turns
// render at the top as the priority section.
export default function Today() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getTodayBoard", {});
      setBoard(res.data);
    } catch {
      setBoard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <Seo title="Today's Board | Sea Mountain Vacations" path="/today" robots="noindex,nofollow" />
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
              to="/admin"
              className="text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg"
            >
              Dashboard
            </Link>
            {user?.role === "admin" && (
              <>
                <Link
                  to="/admin/listings"
                  className="text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg"
                >
                  Listings
                </Link>
                <Link
                  to="/admin/guides"
                  className="text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg"
                >
                  Guides
                </Link>
                <Link
                  to="/admin/users"
                  className="text-sm bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-3 py-2 rounded-lg"
                >
                  Users
                </Link>
              </>
            )}
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
        ) : board ? (
          <div className="space-y-6">
            {board.sameDayTurns.length > 0 && (
              <div className="bg-orange-500/5 border border-orange-500/30 rounded-2xl p-5">
                <Section title="Same-day turns" rows={board.sameDayTurns} />
              </div>
            )}
            <div className="grid lg:grid-cols-3 gap-6">
              <Section title="Arrivals" rows={board.arrivals} />
              <Section title="Departures" rows={board.departures} />
              <Section title="Unpaid balances" rows={board.unpaidBalances} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-24">
            Could not load the board.
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, rows }) {
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
            <ReservationRow key={r.id} reservation={r} listing={r.listing} />
          ))}
        </div>
      )}
    </section>
  );
}