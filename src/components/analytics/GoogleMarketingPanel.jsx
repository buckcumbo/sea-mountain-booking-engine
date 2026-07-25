import { useEffect, useState } from "react";
import { Loader2, TrendingUp, MousePointerClick, Eye, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Google marketing data (GA4 + Search Console) pulled server-side via the
// googleMetrics backend function. Shown only to admins on /admin/analytics.
// Data reflects the production domain (www.seamountainvacations.com), so it
// stays thin until the new site launches there.

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

function fmtDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-muted/40 rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-heading text-2xl font-semibold text-coast-navy">{value}</div>
    </div>
  );
}

function MiniBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.sessions));
  return (
    <div className="flex items-end gap-[3px] h-24">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 min-w-[2px] bg-primary/70 rounded-t hover:bg-primary transition-colors"
          style={{ height: `${Math.max(3, (d.sessions / max) * 100)}%` }}
          title={`${fmtDate(d.date)}: ${d.sessions} sessions`}
        />
      ))}
    </div>
  );
}

function ScTable({ rows, keyLabel }) {
  if (!rows?.length) {
    return <p className="text-sm text-muted-foreground py-4">No data in this range yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground border-b border-border">
          <th className="py-2 pr-2 font-medium">{keyLabel}</th>
          <th className="py-2 pr-2 font-medium text-right">Clicks</th>
          <th className="py-2 pr-2 font-medium text-right">Impressions</th>
          <th className="py-2 font-medium text-right">Avg pos</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-b border-border/50 last:border-0">
            <td className="py-2 pr-2 truncate max-w-[220px]" title={r.key}>
              {r.key.replace("https://www.seamountainvacations.com", "") || "/"}
            </td>
            <td className="py-2 pr-2 text-right">{r.clicks}</td>
            <td className="py-2 pr-2 text-right">{r.impressions}</td>
            <td className="py-2 text-right">{r.position?.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function GoogleMarketingPanel() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await base44.functions.invoke("googleMetrics", { days });
        if (alive) setData(res.data);
      } catch {
        if (alive) setError("Could not load Google marketing data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [days]);

  const ga = data?.analytics;
  const sc = data?.searchConsole;
  const gaTotals = (ga?.daily || []).reduce(
    (acc, d) => ({
      sessions: acc.sessions + d.sessions,
      users: acc.users + d.users,
      pageViews: acc.pageViews + d.pageViews,
    }),
    { sessions: 0, users: 0, pageViews: 0 },
  );

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-heading font-semibold text-coast-navy">Google Marketing</h3>
          <p className="text-xs text-muted-foreground">
            GA4 & Search Console for www.seamountainvacations.com (production domain)
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                days === r.days
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive py-4">{error}</p>
      ) : (
        <div className="space-y-6">
          {ga?.error ? (
            <p className="text-sm text-muted-foreground">Google Analytics: {ga.error}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={TrendingUp} label="Sessions" value={gaTotals.sessions.toLocaleString()} />
                <StatCard icon={Eye} label="Page views" value={gaTotals.pageViews.toLocaleString()} />
                <StatCard icon={MousePointerClick} label="Search clicks" value={(sc?.totals?.clicks ?? 0).toLocaleString()} />
                <StatCard icon={Search} label="Impressions" value={(sc?.totals?.impressions ?? 0).toLocaleString()} />
              </div>

              <div>
                <h4 className="text-sm font-medium text-coast-navy mb-2">Sessions per day</h4>
                {ga?.daily?.length ? (
                  <MiniBars data={ga.daily} />
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    No GA4 traffic in this range yet. The tag only fires on the production domain.
                  </p>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-coast-navy mb-2">Top pages (GA4)</h4>
                  {ga?.topPages?.length ? (
                    <ul className="text-sm divide-y divide-border/50">
                      {ga.topPages.map((p) => (
                        <li key={p.path} className="flex justify-between gap-2 py-2">
                          <span className="truncate" title={p.path}>{p.path}</span>
                          <span className="text-muted-foreground shrink-0">{p.pageViews.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No page data yet.</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-coast-navy mb-2">Traffic sources (GA4)</h4>
                  {ga?.sources?.length ? (
                    <ul className="text-sm divide-y divide-border/50">
                      {ga.sources.map((s) => (
                        <li key={s.channel} className="flex justify-between gap-2 py-2">
                          <span>{s.channel}</span>
                          <span className="text-muted-foreground">{s.sessions.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No source data yet.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {sc?.error ? (
            <p className="text-sm text-muted-foreground">Search Console: {sc.error}</p>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-coast-navy mb-2">Top search queries</h4>
                <ScTable rows={sc?.topQueries} keyLabel="Query" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-coast-navy mb-2">Top pages in search</h4>
                <ScTable rows={sc?.topPages} keyLabel="Page" />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
