import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only Meta (Facebook/Instagram) ads dashboard backend.
// Reads META_ACCESS_TOKEN (Business Manager system-user token with ads_read +
// ads_management) and META_AD_ACCOUNT_ID (numeric, with or without "act_")
// from secrets — the frontend never sees the token. Money numbers are passed
// through exactly as Meta reports them.
//
// Modes:
//   { mode: "overview", days: 7|28|90 }             — account KPIs + campaign list
//   { mode: "updateCampaign", campaignId, status? , dailyBudget? }
//       status: "ACTIVE" | "PAUSED"; dailyBudget in DOLLARS (converted to cents)

const GRAPH = "https://graph.facebook.com/v23.0";
const PRESETS: Record<number, string> = { 7: "last_7d", 28: "last_28d", 90: "last_90d" };

function accountPath() {
  const raw = (Deno.env.get("META_AD_ACCOUNT_ID") || "").trim();
  if (!raw) return null;
  return raw.startsWith("act_") ? raw : `act_${raw}`;
}

async function graph(path: string, token: string, init?: RequestInit) {
  const url = `${GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface Meta's message but never the token.
    const msg = body?.error?.message || `Meta API error (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

// Pull purchases + purchase value out of Meta's actions arrays.
function extractPurchases(insights: any) {
  const find = (arr: any[], type: string) =>
    (arr || []).find((a) => a.action_type === type)?.value;
  const purchases =
    find(insights?.actions, "omni_purchase") ?? find(insights?.actions, "purchase");
  const value =
    find(insights?.action_values, "omni_purchase") ?? find(insights?.action_values, "purchase");
  return {
    purchases: purchases != null ? Number(purchases) : null,
    purchaseValue: value != null ? Number(value) : null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const token = (Deno.env.get("META_ACCESS_TOKEN") || "").trim();
    const account = accountPath();
    if (!token || !account) {
      // Not an error — the admin UI renders its setup guide off this flag.
      return Response.json({ notConfigured: true });
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const mode = payload.mode || "overview";

    if (mode === "updateCampaign") {
      const id = String(payload.campaignId || "");
      if (!/^\d+$/.test(id)) {
        return Response.json({ error: "Invalid campaignId" }, { status: 400 });
      }
      const params = new URLSearchParams();
      if (payload.status === "ACTIVE" || payload.status === "PAUSED") {
        params.set("status", payload.status);
      }
      if (payload.dailyBudget != null) {
        const dollars = Number(payload.dailyBudget);
        if (!Number.isFinite(dollars) || dollars < 1 || dollars > 100000) {
          return Response.json({ error: "Daily budget must be between $1 and $100,000" }, { status: 400 });
        }
        params.set("daily_budget", String(Math.round(dollars * 100))); // cents
      }
      if ([...params.keys()].length === 0) {
        return Response.json({ error: "Nothing to update" }, { status: 400 });
      }
      const result = await graph(`${id}?${params.toString()}`, token, { method: "POST" });
      return Response.json({ ok: true, result });
    }

    // --- overview ---
    const days = [7, 28, 90].includes(payload.days) ? payload.days : 28;
    const preset = PRESETS[days];
    const insightFields = "spend,impressions,clicks,ctr,cpc,actions,action_values";

    const [accountRes, campaignsRes] = await Promise.all([
      graph(`${account}/insights?date_preset=${preset}&fields=${insightFields}`, token),
      graph(
        `${account}/campaigns?fields=name,status,effective_status,objective,daily_budget,lifetime_budget,` +
          `insights.date_preset(${preset}){${insightFields}}&limit=100`,
        token
      ),
    ]);

    const acct = accountRes?.data?.[0] || {};
    const acctPurch = extractPurchases(acct);
    const account_summary = {
      spend: acct.spend != null ? Number(acct.spend) : 0,
      impressions: acct.impressions != null ? Number(acct.impressions) : 0,
      clicks: acct.clicks != null ? Number(acct.clicks) : 0,
      ctr: acct.ctr != null ? Number(acct.ctr) : null,
      cpc: acct.cpc != null ? Number(acct.cpc) : null,
      ...acctPurch,
    };

    const campaigns = (campaignsRes?.data || []).map((c: any) => {
      const ins = c.insights?.data?.[0] || {};
      const p = extractPurchases(ins);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        effectiveStatus: c.effective_status,
        objective: c.objective,
        // Meta stores budgets in cents.
        dailyBudget: c.daily_budget != null ? Number(c.daily_budget) / 100 : null,
        lifetimeBudget: c.lifetime_budget != null ? Number(c.lifetime_budget) / 100 : null,
        spend: ins.spend != null ? Number(ins.spend) : 0,
        impressions: ins.impressions != null ? Number(ins.impressions) : 0,
        clicks: ins.clicks != null ? Number(ins.clicks) : 0,
        ctr: ins.ctr != null ? Number(ins.ctr) : null,
        cpc: ins.cpc != null ? Number(ins.cpc) : null,
        ...p,
      };
    });

    return Response.json({ days, account: account_summary, campaigns });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Meta request failed" }, { status: 500 });
  }
});
