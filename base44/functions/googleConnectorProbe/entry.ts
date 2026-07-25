import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// TEMPORARY QA probe for the Google connectors (Analytics, Search Console,
// Drive). Verifies each shared-connector token works and pulls the GA4
// Measurement ID. Guarded by a one-off key; safe to delete after QA.

const PROBE_KEY = "smv-probe-7f3k9q2w";

Deno.serve(async (req) => {
  try {
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    if (payload.key !== PROBE_KEY) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const out: any = {};

    const token = async (type: string) => {
      const conn = await base44.asServiceRole.connectors.getConnection(type);
      return conn?.accessToken;
    };

    // Deep QA mode "metrics": run the exact GA4 + Search Console requests
    // that googleMetrics makes and report statuses + row counts.
    if (payload.mode === "metrics") {
      const iso = (n: number) => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - n);
        return d.toISOString().slice(0, 10);
      };
      const startDate = iso(28), endDate = iso(1);
      try {
        const tok = await token("google_analytics");
        const r = await fetch(
          "https://analyticsdata.googleapis.com/v1beta/properties/386750571:batchRunReports",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              requests: [
                { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] },
                { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 },
                { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
              ],
            }),
          },
        );
        const body = await r.json().catch(() => ({}));
        out.ga4 = {
          status: r.status,
          rowCounts: (body.reports || []).map((rep: any) => (rep.rows || []).length),
          sampleDaily: body.reports?.[0]?.rows?.slice(-2),
          sampleChannels: body.reports?.[2]?.rows?.slice(0, 3),
          error: body.error?.message,
        };
      } catch (e) { out.ga4 = { error: String(e?.message || e) }; }
      try {
        const tok = await token("google_search_console");
        const sc = async (dimensions: string[]) => {
          const r = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent("sc-domain:seamountainvacations.com")}/searchAnalytics/query`,
            { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 10 }) },
          );
          const body = await r.json().catch(() => ({}));
          return { status: r.status, rows: (body.rows || []).length, first: body.rows?.[0], error: body.error?.message };
        };
        out.sc = { totals: await sc([]), queries: await sc(["query"]), pages: await sc(["page"]) };
      } catch (e) { out.sc = { error: String(e?.message || e) }; }
      return Response.json(out);
    }

    // Deep QA mode "driveImport": download the first Drive image and re-upload
    // it through Core.UploadFile — verifies the untested backend upload path.
    if (payload.mode === "driveImport") {
      try {
        const tok = await token("googledrive");
        const auth = { Authorization: `Bearer ${tok}` };
        const list = await fetch(
          "https://www.googleapis.com/drive/v3/files?q=" +
            encodeURIComponent("mimeType contains 'image/' and trashed = false") +
            "&pageSize=1&fields=files(id,name,mimeType,size)",
          { headers: auth },
        );
        const files = (await list.json())?.files || [];
        if (!files[0]) return Response.json({ error: "no images in Drive" });
        const f = files[0];
        const media = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?alt=media`,
          { headers: auth },
        );
        if (!media.ok) return Response.json({ picked: f, downloadStatus: media.status });
        const bytes = new Uint8Array(await media.arrayBuffer());
        const file = new File([bytes], f.name, { type: f.mimeType });
        const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        return Response.json({ picked: f, downloadedBytes: bytes.length, uploaded: up });
      } catch (e) {
        return Response.json({ error: String(e?.message || e) });
      }
    }
    const gget = async (url: string, tok: string) => {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
      const body = await r.json().catch(() => ({}));
      return { status: r.status, body };
    };

    // Google Analytics: list account summaries, then data streams for the
    // seamountainvacations.com property to find the GA4 Measurement ID.
    try {
      const tok = await token("google_analytics");
      const acc = await gget("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", tok);
      const props: string[] = [];
      for (const a of acc.body?.accountSummaries || []) {
        for (const p of a.propertySummaries || []) props.push(`${p.property} ${p.displayName}`);
      }
      out.analytics = { status: acc.status, properties: props };
      const target = (acc.body?.accountSummaries || [])
        .flatMap((a: any) => a.propertySummaries || [])
        .find((p: any) => /seamountain/i.test(p.displayName || ""));
      if (target) {
        const streams = await gget(`https://analyticsadmin.googleapis.com/v1beta/${target.property}/dataStreams`, tok);
        out.analytics.streams = (streams.body?.dataStreams || []).map((s: any) => ({
          name: s.displayName,
          measurementId: s.webStreamData?.measurementId,
          uri: s.webStreamData?.defaultUri,
        }));
      }
    } catch (e) { out.analytics = { error: String(e?.message || e) }; }

    // Search Console: list verified sites.
    try {
      const tok = await token("google_search_console");
      out.searchConsole = await gget("https://www.googleapis.com/webmasters/v3/sites", tok);
    } catch (e) { out.searchConsole = { error: String(e?.message || e) }; }

    // Drive: confirm token works (list 3 files).
    try {
      const tok = await token("googledrive");
      const r = await gget("https://www.googleapis.com/drive/v3/files?pageSize=3&fields=files(id,name)", tok);
      out.drive = { status: r.status, files: r.body?.files };
    } catch (e) { out.drive = { error: String(e?.message || e) }; }

    return Response.json(out);
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
});
