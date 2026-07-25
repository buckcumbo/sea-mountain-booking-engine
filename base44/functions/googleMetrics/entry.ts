import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only marketing metrics: GA4 traffic + Search Console queries for the
// admin Analytics page. Reads the shared Google connector tokens server-side;
// the frontend never sees them. Numbers are returned as Google reports them —
// no local arithmetic beyond passing values through.

const GA4_PROPERTY = "properties/386750571"; // seamountainvacations.com - GA4
const SC_SITE = "sc-domain:seamountainvacations.com";

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const days = [7, 28, 90].includes(payload.days) ? payload.days : 28;
    const startDate = isoDaysAgo(days);
    const endDate = isoDaysAgo(1); // GA/SC data for "today" is incomplete

    const token = async (type: string) => {
      const conn = await base44.asServiceRole.connectors.getConnection(type);
      if (!conn?.accessToken) throw new Error(`${type} connector not connected`);
      return conn.accessToken;
    };

    const out: any = { days, startDate, endDate };

    // --- GA4 (three reports in one batch call) ---
    try {
      const tok = await token("google_analytics");
      const r = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY}:batchRunReports`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "date" }],
                metrics: [
                  { name: "sessions" },
                  { name: "activeUsers" },
                  { name: "screenPageViews" },
                ],
                orderBys: [{ dimension: { dimensionName: "date" } }],
              },
              {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "pagePath" }],
                metrics: [{ name: "screenPageViews" }],
                orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
                limit: 10,
              },
              {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "sessionDefaultChannelGroup" }],
                metrics: [{ name: "sessions" }],
                orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                limit: 10,
              },
            ],
          }),
        },
      );
      if (!r.ok) {
        out.analytics = { error: `GA4 API error (${r.status})` };
      } else {
        const body = await r.json();
        const [byDate, byPage, bySource] = body.reports || [];
        const rows = (rep: any) => rep?.rows || [];
        out.analytics = {
          daily: rows(byDate).map((row: any) => ({
            date: row.dimensionValues[0].value, // YYYYMMDD
            sessions: Number(row.metricValues[0].value),
            users: Number(row.metricValues[1].value),
            pageViews: Number(row.metricValues[2].value),
          })),
          topPages: rows(byPage).map((row: any) => ({
            path: row.dimensionValues[0].value,
            pageViews: Number(row.metricValues[0].value),
          })),
          sources: rows(bySource).map((row: any) => ({
            channel: row.dimensionValues[0].value,
            sessions: Number(row.metricValues[0].value),
          })),
        };
      }
    } catch (e) {
      out.analytics = { error: String(e?.message || e) };
    }

    // --- Search Console (top queries, top pages, totals) ---
    try {
      const tok = await token("google_search_console");
      const scQuery = async (dimensions: string[]) => {
        const r = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SC_SITE)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 10 }),
          },
        );
        if (!r.ok) throw new Error(`Search Console API error (${r.status})`);
        const body = await r.json();
        return body.rows || [];
      };
      const [totals, queries, pages] = await Promise.all([
        scQuery([]),
        scQuery(["query"]),
        scQuery(["page"]),
      ]);
      const shape = (rows: any[]) =>
        rows.map((row) => ({
          key: (row.keys || [])[0] || "",
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }));
      out.searchConsole = {
        totals: shape(totals)[0] || null,
        topQueries: shape(queries),
        topPages: shape(pages),
      };
    } catch (e) {
      out.searchConsole = { error: String(e?.message || e) };
    }

    return Response.json(out);
  } catch (e) {
    console.error("googleMetrics failed:", e);
    return Response.json({ error: "Could not load marketing metrics." }, { status: 500 });
  }
});
