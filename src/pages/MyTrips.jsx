import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Luggage, Search } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import TripCard from "@/components/my-trips/TripCard";

export default function MyTrips() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!isAuthenticated) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await base44.functions.invoke("getMyTrips", {});
        setReservations((res.data && res.data.reservations) || []);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Unable to load your trips");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isLoadingAuth]);

  if (isLoadingAuth || (!isAuthenticated && loading)) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
      </div>
    );
  }

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const upcoming = reservations.filter((r) => (r.reservation.checkOut || "") >= today);
  const past = reservations.filter((r) => (r.reservation.checkOut || "") < today);

  return (
    <div className="bg-coast-foam min-h-screen">
      <section className="bg-coast-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="font-heading text-3xl font-semibold">My Trips</h1>
          <p className="text-white/80 mt-1 text-sm">Your upcoming and past Grand Strand stays.</p>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
          </div>
        ) : error ? (
          <div className="text-sm text-muted-foreground text-center py-16">{error}</div>
        ) : reservations.length === 0 ? (
          <EmptyTrips />
        ) : (
          <>
            {upcoming.length > 0 && <Section title="Upcoming" items={upcoming} />}
            {past.length > 0 && <Section title="Past" items={past} />}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-coast-navy mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map(({ reservation, listing }) => (
          <TripCard key={reservation.id} reservation={reservation} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function EmptyTrips() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-full bg-coast-sand flex items-center justify-center mb-4">
        <Luggage className="w-7 h-7 text-coast-ocean" />
      </div>
      <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">No trips yet</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-5">
        When you book a stay with us, your reservations will appear here.
      </p>
      <Button asChild className="bg-coast-navy hover:bg-coast-navy-soft text-white">
        <Link to="/search">
          <Search className="w-4 h-4 mr-1.5" /> Find a Rental
        </Link>
      </Button>
    </div>
  );
}