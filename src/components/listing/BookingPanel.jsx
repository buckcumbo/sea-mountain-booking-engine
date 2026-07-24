import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfDay, differenceInCalendarDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Users } from "lucide-react";
import Invoice from "@/components/listing/Invoice";
import HeartToggle from "@/components/favorites/HeartToggle";

// Date-range picker driven by stored CalendarDay rows: unavailable + past dates
// are not selectable. A range shorter than the check-in day's minNights shows a
// friendly message instead of a quote. On a valid range, calls createQuote and
// renders the returned invoice verbatim — no pricing math in the frontend.
export default function BookingPanel({ listing, cal }) {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  const isDisabled = (date) => {
    const ds = format(date, "yyyy-MM-dd");
    if (ds < today) return true;
    const day = cal[ds];
    if (!day || day.available !== true) return true;
    return false;
  };

  useEffect(() => {
    if (!range.from || !range.to) {
      setQuote(null);
      setMessage("");
      return;
    }
    const checkIn = format(range.from, "yyyy-MM-dd");
    const checkOut = format(range.to, "yyyy-MM-dd");
    const nights = differenceInCalendarDays(range.to, range.from);
    const minN = Number(cal[checkIn]?.minNights) || 1;

    if (nights < minN) {
      setQuote(null);
      setLoading(false);
      setMessage(
        `This stay requires a minimum of ${minN} night${minN === 1 ? "" : "s"}.`
      );
      return;
    }

    setMessage("");
    setQuote(null);
    setLoading(true);
    base44.functions
      .invoke("createQuote", { listingId: listing.id, checkIn, checkOut, guests })
      .then((res) => setQuote(res.data))
      .catch((e) =>
        setMessage(e?.response?.data?.error || e?.message || "Unable to generate quote")
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  const maxGuests = Math.max(1, listing.sleeps || 1);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-heading text-lg font-semibold text-coast-navy">
            Check availability
          </div>
          <p className="text-xs text-muted-foreground">
            Select your dates for a sample quote.
          </p>
        </div>
        <HeartToggle listingId={listing.id} className="bg-coast-sand" />
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={1}
          disabled={isDisabled}
        />
      </div>

      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Guests</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="ml-auto h-9 rounded-lg border border-border bg-card text-sm px-2 text-coast-navy"
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className="text-sm rounded-lg bg-amber-500/10 text-amber-700 px-3 py-2">
          {message}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-coast-ocean" />
        </div>
      )}

      {quote && <Invoice quote={quote} />}
    </div>
  );
}