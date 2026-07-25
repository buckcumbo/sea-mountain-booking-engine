import React from "react";
import { Clock } from "lucide-react";

// Renders the invoice EXACTLY as returned by createQuote. No price math here.
const fmtMoney = (n) => `$${Number(n || 0)}`;

export default function Invoice({ quote }) {
  const inv = quote.invoice;
  const mock = quote.mock === true;

  return (
    <div className="space-y-3">
      {mock && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 text-amber-700 px-3 py-2 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          Sample pricing: live quotes coming soon
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between">
          <span className="font-heading font-semibold text-coast-navy text-sm">Your quote</span>
          <span className="text-xs text-muted-foreground">
            {inv.nights} night{inv.nights === 1 ? "" : "s"} · {inv.guests} guest{inv.guests === 1 ? "" : "s"}
          </span>
        </div>
        <div className="divide-y divide-border">
          {inv.lineItems.map((li, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-muted-foreground">{li.label}</span>
              <span className="font-medium text-coast-navy">{fmtMoney(li.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-sm bg-muted/30">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-coast-navy">{fmtMoney(inv.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-heading font-semibold text-coast-navy">Total</span>
          <span className="font-heading font-semibold text-coast-navy text-lg">{fmtMoney(inv.total)}</span>
        </div>
      </div>
    </div>
  );
}