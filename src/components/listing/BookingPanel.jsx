import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfDay, differenceInCalendarDays, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Users } from "lucide-react";
import Invoice from "@/components/listing/Invoice";
import PriceLockTimer from "@/components/listing/PriceLockTimer";
import HeartToggle from "@/components/favorites/HeartToggle";
import { openNightsInWindow } from "@/lib/availability";
import { PHONE } from "@/lib/contact";
import { getAttribution } from "@/lib/analytics";

// Date-range picker driven by stored CalendarDay rows: unavailable + past dates
// are not selectable. A range shorter than the check-in day's minNights shows a
// friendly message instead of a quote. On a valid range, calls createQuote and
// renders the returned invoice verbatim — no pricing math in the frontend.
export default function BookingPanel({ listing, cal, restore }) {
  const [range, setRange] = useState(() => {
    if (restore?.checkIn && restore?.checkOut) {
      try {
        return { from: parseISO(restore.checkIn), to: parseISO(restore.checkOut) };
      } catch { return { from: undefined, to: undefined }; }
    }
    return { from: undefined, to: undefined };
  });
  const [guests, setGuests] = useState(restore?.guests || 1);
  const [quote, setQuote] = useState(restore?.quote || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailInput, setEmailInput] = useState(restore?.quote?.email || "");
  const skipQuoteRef = useRef(!!restore?.quote);

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  // Calendar health: a home with no upcoming CalendarDay rows renders every
  // date disabled — a wall of grey that reads as broken. In that state we
  // swap the picker for a warm fallback instead. Rates-in-calendar likewise
  // only renders when there are real rates to show, so homes without rate
  // data keep the compact calendar (no empty second line under each date).
  const calStats = useMemo(() => {
    let upcoming = 0;
    let withRates = 0;
    for (const [ds, day] of Object.entries(cal || {})) {
      if (ds < today) continue;
      upcoming++;
      if (day.available === true && Number(day.rate) > 0) withRates++;
    }
    return { upcoming, withRates };
  }, [cal, today]);
  const hasCalendar = calStats.upcoming > 0;
  const showRates = calStats.withRates > 0;

  // Honest scarcity: computed from real CalendarDay data, shown only when a
  // meaningful share of the next 60 nights is already taken. Never a gimmick —
  // if the numbers aren't true, the line doesn't render (smv-brand rule).
  const scarcity = useMemo(() => openNightsInWindow(cal, 60), [cal]);
  const showScarcity =
    hasCalendar &&
    scarcity.tracked >= 30 &&
    scarcity.open > 0 &&
    scarcity.open / scarcity.tracked <= 0.4;

  const isDisabled = (date) => {
    const ds = format(date, "yyyy-MM-dd");
    if (ds < today) return true;
    const day = cal[ds];
    if (!day || day.available !== true) return true;
    return false;
  };

  // Nightly rates inside the date picker — the number under each open night
  // comes straight from the stored CalendarDay row (display only; totals
  // always come from the quote).
  const DayContent = ({ date }) => {
    const ds = format(date, "yyyy-MM-dd");
    const day = cal[ds];
    const showRate = day && day.available === true && ds >= today && Number(day.rate) > 0;
    return (
      <span className="flex flex-col items-center justify-center leading-none">
        <span>{date.getDate()}</span>
        <span className={`text-[8px] mt-0.5 tabular-nums ${showRate ? "opacity-70" : "opacity-0"}`}>
          {showRate ? `$${Math.round(Number(day.rate))}` : " "}
        </span>
      </span>
    );
  };

  useEffect(() => {
    if (skipQuoteRef.current) {
      skipQuoteRef.current = false;
      return;
    }
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
      .invoke("createQuote", {
        listingId: listing.id,
        checkIn,
        checkOut,
        guests,
        attribution: getAttribution(),
      })
      .then((res) => setQuote(res.data))
      .catch((e) =>
        setMessage(e?.response?.data?.error || e?.message || "Unable to generate quote")
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  const maxGuests = Math.max(1, listing.sleeps || 1);

  const handleEmailBlur = () => {
    const email = emailInput.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid || !quote?.quoteId) return;
    base44.functions
      .invoke("saveQuoteEmail", { quoteId: quote.quoteId, email })
      .catch(() => {});
  };

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

      {showScarcity && (
        <p className="text-xs rounded-lg bg-coast-sand text-coast-navy px-3 py-2">
          Booking up: only {scarcity.open} of the next {scarcity.tracked} nights are still open.
        </p>
      )}

      {!hasCalendar ? (
        <div className="text-sm rounded-lg bg-coast-sand text-coast-navy px-4 py-3 leading-relaxed">
          Live availability for this home is on its way. Call us at{" "}
          <a
            href={`tel:${PHONE.replace(/[^0-9+]/g, "")}`}
            className="font-medium text-coast-ocean"
          >
            {PHONE}
          </a>{" "}
          and we'll check your dates right now.
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={1}
              disabled={isDisabled}
              components={showRates ? { DayContent } : undefined}
              classNames={
                showRates
                  ? {
                      day: cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-10 w-10 p-0 font-normal aria-selected:opacity-100"
                      ),
                      head_cell:
                        "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                    }
                  : undefined
              }
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
        </>
      )}

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

      {restore?.expiredNote && (
        <div className="text-sm rounded-lg bg-amber-500/10 text-amber-700 px-3 py-2">
          That quote expired, but pick your dates and we will price it fresh.
        </div>
      )}

      {restore?.requoted && (
        <div className="text-sm rounded-lg bg-coast-ocean/10 text-coast-ocean px-3 py-2">
          We refreshed your quote with today's rates
          {restore.previousTotal != null &&
          quote?.invoice?.total != null &&
          Number(restore.previousTotal) !== Number(quote.invoice.total)
            ? ` (was $${Number(restore.previousTotal).toLocaleString()})`
            : ""}
          . Your dates are held below.
        </div>
      )}

      {quote && (
        <div className="space-y-3">
          <Invoice quote={quote} />
          {/* Honest countdown: the quote's REAL 24h price lock, not an
              invented hold. Calm text until the final hour, then live
              countdown; on expiry the quote clears for fresh pricing. */}
          <PriceLockTimer
            expiresAt={quote.expiresAt}
            onExpired={() => {
              setQuote(null);
              setMessage("That quote expired — reselect your dates and we'll price them fresh.");
            }}
          />
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="Email (saves your quote)"
            className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm text-coast-navy"
          />
        </div>
      )}
    </div>
  );
}