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
