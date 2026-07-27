import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmtMoney = (n) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtNum = (n) => (n == null ? "—" : Number(n).toLocaleString());
const fmtPct = (n) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

function Kpi({ label, value }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-heading text-xl font-semibold text-coast-navy mt-1">{value}</div>
    </div>
  );
}

// Email campaign metrics from Klaviyo, shown under the Meta section on the
// Marketing page. Activates when KLAVIYO_API_KEY exists in Secrets.
export default function KlaviyoPanel({ days }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const [data, setData] = useState(null);

  const load = useCallback(async (d) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("klaviyoMetrics", { days: d });
      const body = res?.data ?? res;
      if (body?.notConfigured) setNotConfigured(true);
      else if (body?.error) setError(body.error);
      else setData(body);
    } catch (e) {
      setError(e?.message || "Couldn't reach Klaviyo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-semibold text-coast-navy flex items-center gap-2">
          <Mail className="w-4 h-4 text-coast-ocean" /> Email — Klaviyo
          {days === 28 && !notConfigured && (
            <span className="text-xs font-normal text-muted-foreground">(30-day window)</span>
          )}
        </h2>
        {!notConfigured && !loading && (
          <Button variant="outline" size="sm" onClick={() => load(days)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-5 h-5 animate-spin text-coast-ocean" />
        </div>
      ) : notConfigured ? (
        <div className="bg-card border border-border rounded-2xl p-5 max-w-2xl text-sm text-muted-foreground">
          <span className="font-medium text-coast-navy">Connect Klaviyo:</span> in Klaviyo go to{" "}
          <span className="text-coast-navy">Settings → Account → API keys</span>, create a{" "}
          <span className="text-coast-navy">private key</span> with read access to Campaigns and
          Metrics, then add it as{" "}
          <code className="text-xs bg-muted px-1 rounded">KLAVIYO_API_KEY</code> in the Base44
          dashboard → Secrets and reload.
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm max-w-2xl">
          {error}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Kpi label="Campaigns sent" value={fmtNum(data.aggregate.campaignsSent)} />
            <Kpi label="Recipients" value={fmtNum(data.aggregate.recipients)} />
            <Kpi label="Open rate" value={fmtPct(data.aggregate.openRate)} />
            <Kpi label="Click rate" value={fmtPct(data.aggregate.clickRate)} />
          </div>
          {data.aggregate.hasRevenue && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <Kpi label="Orders attributed" value={fmtNum(data.aggregate.conversions)} />
              <Kpi label="Revenue attributed" value={fmtMoney(data.aggregate.revenue)} />
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-3 py-3">Sent</th>
                  <th className="px-3 py-3">Recipients</th>
                  <th className="px-3 py-3">Open rate</th>
                  <th className="px-3 py-3">Click rate</th>
                  {data.aggregate.hasRevenue && <th className="px-3 py-3">Revenue</th>}
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-coast-navy">{c.name}</td>
                    <td className="px-3 py-3">{fmtDate(c.sendTime)}</td>
                    <td className="px-3 py-3">{fmtNum(c.recipients)}</td>
                    <td className="px-3 py-3">{fmtPct(c.openRate)}</td>
                    <td className="px-3 py-3">{fmtPct(c.clickRate)}</td>
                    {data.aggregate.hasRevenue && (
                      <td className="px-3 py-3">{fmtMoney(c.revenue)}</td>
                    )}
                  </tr>
                ))}
                {data.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No email campaigns sent in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
