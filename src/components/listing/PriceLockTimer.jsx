import { useEffect, useState } from "react";
import { Lock, TimerReset } from "lucide-react";

// Honest checkout timer: counts down the REAL Guesty quote expiry (24h price
// lock), never an invented hold. Calm while there's plenty of time — a quiet
// "price locked until…" line — and only becomes a live countdown inside the
// final hour. On expiry it tells the truth and lets the caller re-quote.
const HOUR = 60 * 60 * 1000;

function fmtUntil(ts) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today.getTime() + 24 * HOUR);
  if (sameDay) return `until ${time} today`;
  if (d.toDateString() === tomorrow.toDateString()) return `until ${time} tomorrow`;
  return `until ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

function fmtCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PriceLockTimer({ expiresAt, onExpired }) {
  const [now, setNow] = useState(() => Date.now());
  const expiry = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const remaining = expiry - now;
  const ticking = Number.isFinite(expiry) && remaining <= HOUR && remaining > 0;

  useEffect(() => {
    if (!Number.isFinite(expiry)) return;
    // Tick every second only inside the final hour; once a minute before that.
    const interval = setInterval(() => setNow(Date.now()), ticking ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [expiry, ticking]);

  useEffect(() => {
    if (Number.isFinite(expiry) && remaining <= 0 && onExpired) onExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  if (!Number.isFinite(expiry)) return null;

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
        <TimerReset className="w-3.5 h-3.5" />
        This quote expired — reselect dates and we'll price it fresh.
      </div>
    );
  }

  if (ticking) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-coast-navy bg-coast-sand rounded-lg px-2.5 py-1.5">
        <Lock className="w-3.5 h-3.5 text-coast-ocean" />
        Price locked for {fmtCountdown(remaining)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="w-3.5 h-3.5 text-coast-ocean" />
      This price is locked {fmtUntil(expiry)}
    </div>
  );
}
