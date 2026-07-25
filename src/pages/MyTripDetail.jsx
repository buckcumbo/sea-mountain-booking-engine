import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, ArrowLeft, MapPin, Calendar, Clock, Wallet, Home, Phone } from "lucide-react";
import { prettifyArea } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";

export default function MyTripDetail() {
  const { reservationId } = useParams();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!isAuthenticated) return;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getMyTrips", { reservationId });
        setData(res.data);
      } catch (e) {
        if (e?.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [reservationId, isAuthenticated, isLoadingAuth]);

  if (isLoadingAuth || (!isAuthenticated && loading) || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="font-heading text-xl font-semibold text-coast-navy mb-2">Reservation not found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find that reservation.</p>
        <Link to="/my-trips" className="text-coast-ocean hover:underline text-sm">
          Back to My Trips
        </Link>
      </div>
    );
  }

  const { reservation, listing } = data;
  const status = (reservation.status || "").toLowerCase();
  const showAddress = status === "confirmed" || status === "checked_in";
  const photo = listing?.photos?.[0]?.url;

  return (
    <div className="bg-coast-foam min-h-screen">
      <Seo title="My Trip | Sea Mountain Vacations" path="/my-trips" robots="noindex,nofollow" />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          to="/my-trips"
          className="inline-flex items-center gap-1 text-sm text-coast-ocean hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> My Trips
        </Link>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid sm:grid-cols-[180px_1fr]">
            <div className="aspect-[4/3] sm:aspect-auto bg-coast-foam">
              {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="p-5">
              <h1 className="font-heading text-xl font-semibold text-coast-navy">
                {listing?.title || "Your reservation"}
              </h1>
              {listing && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {prettifyArea(listing.area)}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-coast-ocean/10 text-coast-ocean capitalize">
                  {reservation.status || "N/A"}
                </span>
                {reservation.paymentStatus && (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                    {reservation.paymentStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <InfoCard icon={Calendar} title="Dates">
            <p className="text-sm text-coast-navy font-medium">
              {reservation.checkIn} → {reservation.checkOut}
            </p>
          </InfoCard>
          <InfoCard icon={Clock} title="Check-in / Check-out">
            <p className="text-sm text-muted-foreground">Check-in: 4:00 PM · Check-out: 10:00 AM</p>
            <p className="text-xs text-muted-foreground italic mt-1">
              Times are a placeholder. Confirm before travel.
            </p>
          </InfoCard>
          <InfoCard icon={Home} title="Property address">
            {showAddress ? (
              <p className="text-sm text-coast-navy">
                {listing?.address || "[Property address: to be provided]"}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Address available once your reservation is confirmed.
              </p>
            )}
          </InfoCard>
          <InfoCard icon={Wallet} title="Payment">
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="text-coast-navy font-medium capitalize">
                {reservation.paymentStatus || "N/A"}
              </span>
            </p>
            {reservation.balanceDue != null && (
              <p className="text-sm text-muted-foreground">
                Balance due:{" "}
                <span className="text-coast-navy font-medium">
                  ${Number(reservation.balanceDue).toLocaleString()}
                </span>
              </p>
            )}
          </InfoCard>
        </div>

        <div className="bg-coast-sand rounded-2xl p-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-coast-navy">
            <Phone className="w-4 h-4 text-coast-ocean" /> Questions about your stay?
          </div>
          <Button asChild variant="outline" className="border-coast-ocean text-coast-ocean">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-coast-ocean" />
        <span className="font-heading text-sm font-semibold text-coast-navy">{title}</span>
      </div>
      {children}
    </div>
  );
}