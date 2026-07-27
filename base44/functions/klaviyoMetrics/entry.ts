import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only Klaviyo email campaign metrics for the Marketing page.
// Reads KLAVIYO_API_KEY (private key, pk_...) from secrets — never sent to
// the browser. Numbers are passed through exactly as Klaviyo reports them.
//
// { days: 7|28|90 } → { aggregate, campaigns } or { notConfigured: true }

const BASE = "https://a.klaviyo.com/api";
const REVISION = "2024-10-15";
const TIMEFRAMES: Record<number, string> = {
  7: "last_7_days",
  28: "last_30_days", // Klaviyo has no 28-day preset; the UI labels this 30d
  90: "last_90_days",
};
const STATISTICS = [
  "recipients",
  "opens_unique",
  "open_rate",
  "clicks_unique",
  "click_rate",
  "conversions",
  "conversion_value",
];

async function kfetch(key: string, path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Klaviyo-API-Key ${key}`,
      revision: REVISION,
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.errors?.[0]?.detail || `Klaviyo API error (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const key = (Deno.env.get("KLAVIYO_API_KEY") || "").trim();
    if (!key) return Response.json({ notConfigured: true });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const days = [7, 28, 90].includes(payload.days) ? payload.days : 28;

    // Conversion metric: prefer Placed Order (real revenue attribution);
    // fall back to Opened Email so the report endpoint still works on
    // accounts without a commerce integration.
    const metrics = await kfetch(key, "/metrics/?page[size]=100");
    const all = metrics?.data || [];
    const placedOrder = all.find((m: any) => m?.attributes?.name === "Placed Order");
    const openedEmail = all.find((m: any) => m?.attributes?.name === "Opened Email");
    const conversionMetricId = placedOrder?.id || openedEmail?.id || all[0]?.id;
    if (!conversionMetricId) {
      return Response.json({ error: "No metrics found in this Klaviyo account yet" }, { status: 500 });
    }
    const hasRevenue = !!placedOrder;

    // Per-campaign performance report.
    const report = await kfetch(key, "/campaign-values-reports/", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "campaign-values-report",
          attributes: {
            timeframe: { key: TIMEFRAMES[days] },
            statistics: STATISTICS,
            conversion_metric_id: conversionMetricId,
          },
        },
      }),
    });

    const rows = report?.data?.attributes?.results || [];

    // Names/status/send time for the campaigns in the report.
    const campaignsRes = await kfetch(
      key,
      `/campaigns/?filter=${encodeURIComponent("equals(messages.channel,'email')")}&page[size]=100&sort=-created_at`
    );
    const infoById: Record<string, any> = {};
    for (const c of campaignsRes?.data || []) {
      infoById[c.id] = {
        name: c.attributes?.name,
        status: c.attributes?.status,
        sendTime: c.attributes?.send_time,
      };
    }

    const campaigns = rows
      .map((r: any) => {
        const id = r?.groupings?.campaign_id;
        const s = r?.statistics || {};
        return {
          id,
          name: infoById[id]?.name || id,
          status: infoById[id]?.status || null,
          sendTime: infoById[id]?.sendTime || null,
          recipients: s.recipients ?? null,
          openRate: s.open_rate != null ? s.open_rate * 100 : null,
          clickRate: s.click_rate != null ? s.click_rate * 100 : null,
          opens: s.opens_unique ?? null,
          clicks: s.clicks_unique ?? null,
          conversions: hasRevenue ? (s.conversions ?? null) : null,
          revenue: hasRevenue ? (s.conversion_value ?? null) : null,
        };
      })
      .sort((a: any, b: any) => String(b.sendTime || "").localeCompare(String(a.sendTime || "")));

    // Aggregate KPIs across the reported campaigns.
    const sum = (f: string) => campaigns.reduce((t: number, c: any) => t + (Number(c[f]) || 0), 0);
    const recipients = sum("recipients");
    const aggregate = {
      campaignsSent: campaigns.length,
      recipients,
      opens: sum("opens"),
      clicks: sum("clicks"),
      openRate: recipients > 0 ? (sum("opens") / recipients) * 100 : null,
      clickRate: recipients > 0 ? (sum("clicks") / recipients) * 100 : null,
      conversions: hasRevenue ? sum("conversions") : null,
      revenue: hasRevenue ? sum("revenue") : null,
      hasRevenue,
    };

    return Response.json({ days, aggregate, campaigns });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Klaviyo request failed" }, { status: 500 });
  }
});
