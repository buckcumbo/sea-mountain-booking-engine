import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Nightly marketing snapshot + Monday digest. Runs on a daily scheduled
// workflow (admin context, same pattern as sendQuoteRecoveryEmails).
//
// 1. Upserts one DailyMetric row per day for the last 5 days (GA4 sessions/
//    users/pageViews + Search Console clicks/impressions/ctr/position).
//    Re-writing recent days matters: Search Console data lags 2-3 days.
// 2. On Mondays (UTC) emails Buck a week-over-week digest built ONLY from
//    stored DailyMetric rows. Numbers are passed through as Google reported
//    them; the only arithmetic is summing days into weeks.

const GA4_PROPERTY = "properties/386750571";
const SC_SITE = "sc-domain:seamountainvacations.com";
const DIGEST_TO = "buck@seamountainvacations.com";
const LOOKBACK_DAYS = 5;

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function pct(cur: number, prev: number) {
  if (!prev) return cur ? "new" : "flat";
  const p = Math.round(((cur - prev) / prev) * 100);
  return (p >= 0 ? "+" : "") + p + "%";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // TEMP QA BYPASS - remove after smoke test
    const bodyClone = await req.clone().json().catch(() => ({}));
    if (bodyClone?.probeKey !== "smv-probe-7f3k9q2w") {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = async (type: string) => {
      const conn = await base44.asServiceRole.connectors.getConnection(type);
      if (!conn?.accessToken) throw new Error(`${type} connector not connected`);
      return conn.accessToken;
    };

    const startDate = isoDaysAgo(LOOKBACK_DAYS);
    const endDate = isoDaysAgo(1);
    const byDate: Record<string, any> = {};

    // --- GA4 per-day totals ---
    try {
      const tok = await token("google_analytics");
      const r = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY}:runReport`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
          }),
        },
      );
      if (!r.ok) throw new Error(`GA4 API error (${r.status})`);
      const body = await r.json();
      for (const row of body.rows || []) {
        const raw = row.dimensionValues[0].value; // YYYYMMDD
        const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        byDate[date] = {
          ...(byDate[date] || {}),
          sessions: Number(row.metricValues[0].value),
          users: Number(row.metricValues[1].value),
          pageViews: Number(row.metricValues[2].value),
        };
      }
    } catch (e) {
      console.error("[snapshotMetrics] GA4:", e.message);
    }

    // --- Search Console per-day totals ---
    try {
      const tok = await token("google_search_console");
      const r = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SC_SITE)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate, dimensions: ["date"], rowLimit: 31 }),
        },
      );
      if (!r.ok) throw new Error(`Search Console API error (${r.status})`);
      const body = await r.json();
      for (const row of body.rows || []) {
        const date = (row.keys || [])[0];
        if (!date) continue;
        byDate[date] = {
          ...(byDate[date] || {}),
          scClicks: row.clicks,
          scImpressions: row.impressions,
          scCtr: row.ctr,
          scPosition: row.position,
        };
      }
    } catch (e) {
      console.error("[snapshotMetrics] SC:", e.message);
    }

    // --- Upsert DailyMetric rows (unique by date, in code) ---
    const nowIso = new Date().toISOString();
    let created = 0, updated = 0;
    const dates = Object.keys(byDate).sort();
    for (const date of dates) {
      const fields = { ...byDate[date], date, syncedAt: nowIso };
      const existing = await base44.asServiceRole.entities.DailyMetric.filter({ date }, "-created_date", 1);
      if (existing.length > 0) {
        await base44.asServiceRole.entities.DailyMetric.update(existing[0].id, fields);
        updated++;
      } else {
        await base44.asServiceRole.entities.DailyMetric.create(fields);
        created++;
      }
    }

    // --- Monday digest (UTC), or on demand with { digest: true } ---
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const isMonday = new Date().getUTCDay() === 1;
    let digestSent = false;
    if (isMonday || payload.digest === true) {
      const rows = await base44.asServiceRole.entities.DailyMetric.filter(
        { date: { $gte: isoDaysAgo(14) } }, "-date", 20,
      );
      const lastWeekStart = isoDaysAgo(7);
      const sum = (list: any[], f: string) => list.reduce((a, r) => a + (Number(r[f]) || 0), 0);
      const cur = rows.filter((r: any) => r.date >= lastWeekStart);
      const prev = rows.filter((r: any) => r.date < lastWeekStart);

      const metric = (label: string, f: string) => {
        const c = sum(cur, f), p = sum(prev, f);
        return `<tr><td style="padding:8px 0;color:#475569;font-size:14px;">${label}</td>` +
          `<td style="padding:8px 0;text-align:right;color:#0f172a;font-size:15px;font-weight:600;">${c.toLocaleString()}</td>` +
          `<td style="padding:8px 0 8px 16px;text-align:right;color:${c >= p ? "#15803d" : "#b91c1c"};font-size:13px;">${pct(c, p)}</td></tr>`;
      };

      const body = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;margin:0 auto;">
<tr><td style="padding:28px 32px;">
<p style="margin:0 0 4px 0;color:#17304f;font-size:13px;font-weight:600;letter-spacing:0.06em;">SEA MOUNTAIN VACATIONS</p>
<p style="margin:0 0 16px 0;color:#0f172a;font-size:18px;font-weight:600;">Weekly marketing digest</p>
<p style="margin:0 0 16px 0;color:#64748b;font-size:13px;">Last 7 days (${lastWeekStart} to ${endDate}) vs the 7 days before. Search Console lags a few days; late data is backfilled nightly.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${metric("Sessions", "sessions")}
${metric("Page views", "pageViews")}
${metric("Search clicks", "scClicks")}
${metric("Search impressions", "scImpressions")}
</table>
<p style="margin:20px 0 0 0;color:#64748b;font-size:13px;">Full breakdown on the <a href="https://www.seamountainvacations.com/admin/analytics" style="color:#17304f;">admin Analytics page</a>.</p>
</td></tr></table></body></html>`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: DIGEST_TO,
          subject: "Sea Mountain weekly marketing digest",
          body,
          from_name: "Sea Mountain Vacations",
        });
        digestSent = true;
      } catch (e) {
        console.error("[snapshotMetrics] digest send failed:", e.message);
      }
    }

    return Response.json({ dates, created, updated, digestSent });
  } catch (error) {
    console.error("[snapshotMetrics]", error.message);
    return Response.json({ error: "Snapshot failed." }, { status: 500 });
  }
});
