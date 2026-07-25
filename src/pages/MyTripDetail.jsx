import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Home,
  Phone,
  KeyRound,
  Wifi,
  Car,
  BookOpen,
  Sun,
} from "lucide-react";
import { prettifyArea, prettifyDateRange } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { PHONE } from "@/lib/contact";

// The guest trip portal. Everything a guest needs before and during a stay:
// countdown, arrival details, gated property info (address/parking on
// confirmation, wifi + house manual within 7 days of check-in), early/late
// requests (taken anytime, confirmed day-of / day-before per ops rules), and
// the emergency phone path — door-code trouble is urgent by definition.
export default function MyTripDetail() {
  const { reservationId } = useParams();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [areaGuides, setAreaGuides] = useState([]);
  const [requesting, setRequesting] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getMyTrips", { reservationId });
      setData(res.data);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!isAuthenticated) return;
    load();
  }, [isAuthenticated, isLoadingAuth, load]);

  // Local tips for the listing's area — AreaGuide is public-read when published.
  useEffect(() => {
    const area = data?.listing?.area;
    if (!area) return;
    base44.entities.AreaGuide.filter({ area, published: true }, "-created_date", 3)
      .then((guides) => setAreaGuides(guides || []))
      .catch(() => {});
  }, [data?.listing?.area]);

  const requestTripChange = async (requestType) => {
    setRequesting(requestType);
    try {
      await base44.functions.invoke("submitTripRequest", { reservationId, requestType });
      await load();
    } catch {
      // Portal stays calm — the card below always shows the phone path.
    } finally {
      setRequesting("");
    }
  };

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

  const { reservation, listing, propertyInfo } = data;
  const status = (reservation.status || "").toLowerCase();
  const confirmed = status === "confirmed" || status === "checked_in";
  const flags = Array.isArray(reservation.flags) ? reservation.flags : [];
  const photo = listing?.photos?.[0]?.url;

  // Countdown — plain date math on yyyy-MM-dd strings.
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const checkInDate = new Date(`${reservation.checkIn}T00:00:00`);
  const checkOutDate = new Date(`${reservation.checkOut}T00:00:00`);
  const daysToCheckIn = Math.round((checkInDate - startOfToday) / msPerDay);
  const daysToCheckOut = Math.round((checkOutDate - startOfToday) / msPerDay);

  let countdown = null;
  if (confirmed) {
    if (daysToCheckIn > 1) countdown = `${daysToCheckIn} days until the beach`;
    else if (daysToCheckIn === 1) countdown = "Tomorrow's the day — check-in opens at 4 PM";
    else if (daysToCheckIn === 0) countdown = "It's beach day — check-in opens at 4 PM";
    else if (daysToCheckOut > 0) countdown = `You're here. Checkout is 10 AM on ${reservation.checkOut}`;
    else countdown = "Hope it was a great stay. Come back soon.";
  }

  const upcoming = confirmed && daysToCheckIn >= 0;
  const earlyRequested = flags.includes("early-checkin-requested");
  const lateRequested = flags.includes("late-checkout-requested");

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

        {countdown && (
          <div className="bg-coast-navy text-white rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
            <Sun className="w-5 h-5 text-coast-sand shrink-0" />
            <p className="font-heading font-semibold">{countdown}</p>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="grid sm:grid-cols-[180px_1fr]">
            <div className="aspect-[4/3] sm:aspect-auto bg-coast-foam">
              {photo && <img src={photo} alt="" loading="lazy" className="w-full h-full object-cover" />}
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
          <InfoCard icon={Calendar} title="Your dates">
            <p className="text-sm text-coast-navy font-medium">
              {prettifyDateRange(reservation.checkIn, reservation.checkOut)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Check-in 4 PM · Checkout 10 AM
            </p>
          </InfoCard>

          <InfoCard icon={KeyRound} title="Your door code">
            <p className="text-sm text-muted-foreground">
              It arrives close to check-in — usually the last 4 digits of your phone number.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Trouble at the door? Call us any hour: <a href={`tel:${PHONE.replace(/[^0-9+]/g, "")}`} className="text-coast-ocean font-medium">{PHONE}</a>
            </p>
          </InfoCard>

          <InfoCard icon={Home} title="Address & parking">
            {propertyInfo?.address ? (
              <>
                <p className="text-sm text-coast-navy">{propertyInfo.address}</p>
                {propertyInfo.parkingInfo && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                    <Car className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {propertyInfo.parkingInfo}
                  </p>
                )}
                {propertyInfo.checkInNotes && (
                  <p className="text-xs text-muted-foreground mt-1">{propertyInfo.checkInNotes}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {confirmed
                  ? "We're adding this home's arrival details — call us if you need them sooner."
                  : "Address unlocks once your reservation is confirmed."}
              </p>
            )}
          </InfoCard>

          <InfoCard icon={Wifi} title="WiFi">
            {propertyInfo?.wifiName || propertyInfo?.wifiPassword ? (
              <>
                {propertyInfo.wifiName && (
                  <p className="text-sm text-coast-navy">
                    Network: <span className="font-medium">{propertyInfo.wifiName}</span>
                  </p>
                )}
                {propertyInfo.wifiPassword && (
                  <p className="text-sm text-coast-navy">
                    Password: <span className="font-mono font-medium">{propertyInfo.wifiPassword}</span>
                  </p>
                )}
              </>
            ) : propertyInfo?.wifiLocked ? (
              <p className="text-sm text-muted-foreground">
                WiFi details unlock 7 days before check-in. High-speed WiFi is included, always.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                High-speed WiFi is included. Details appear here close to arrival.
              </p>
            )}
          </InfoCard>

          <InfoCard icon={Clock} title="Early check-in / late checkout">
            <p className="text-xs text-muted-foreground mb-3">
              Ask anytime — we confirm early check-ins the morning of arrival and late
              checkouts the day before, once the cleaning schedule is set.
            </p>
            {upcoming ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={earlyRequested || requesting !== ""}
                  onClick={() => requestTripChange("early-checkin")}
                  className="border-coast-ocean text-coast-ocean text-xs"
                >
                  {requesting === "early-checkin" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : earlyRequested ? (
                    "Early check-in requested ✓"
                  ) : (
                    "Request early check-in"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={lateRequested || requesting !== ""}
                  onClick={() => requestTripChange("late-checkout")}
                  className="border-coast-ocean text-coast-ocean text-xs"
                >
                  {requesting === "late-checkout" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : lateRequested ? (
                    "Late checkout requested ✓"
                  ) : (
                    "Request late checkout"
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Available for upcoming confirmed stays.</p>
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

        {propertyInfo?.houseManual && (
          <div className="bg-card border border-border rounded-2xl p-5 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-coast-ocean" />
              <h2 className="font-heading text-sm font-semibold text-coast-navy">House manual</h2>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {propertyInfo.houseManual}
            </div>
          </div>
        )}

        {areaGuides.length > 0 && listing && (
          <div className="mt-6">
            <h2 className="font-heading text-base font-semibold text-coast-navy mb-3">
              While you're in {prettifyArea(listing.area)}
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {areaGuides.map((g) => (
                <Link
                  key={g.id}
                  to={`/guides/${g.slug}`}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {g.heroImage && (
                    <div className="aspect-[16/9] bg-coast-foam">
                      <img src={g.heroImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-coast-navy leading-tight">{g.title}</p>
                    {g.excerpt && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-coast-sand rounded-2xl p-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-coast-navy">
            <Phone className="w-4 h-4 text-coast-ocean" /> Questions about your stay? Someone local answers, day or night.
          </div>
          <Button asChild variant="outline" className="border-coast-ocean text-coast-ocean">
            <a href={`tel:${PHONE.replace(/[^0-9+]/g, "")}`}>{PHONE}</a>
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