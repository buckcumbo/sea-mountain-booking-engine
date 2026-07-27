import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  Megaphone,
  Pause,
  Play,
  Pencil,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminShell from "@/components/admin/AdminShell";
import Seo from "@/components/Seo";
import { useToast } from "@/components/ui/use-toast";

const fmtMoney = (n) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtNum = (n) => (n == null ? "—" : Number(n).toLocaleString());
const fmtPct = (n) => (n == null ? "—" : `${Number(n).toFixed(2)}%`);

function Kpi({ label, value }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-heading text-xl font-semibold text-coast-navy mt-1">{value}</div>
    </div>
  );
}

// Setup guide shown until META_ACCESS_TOKEN + META_AD_ACCOUNT_ID exist in
// the app's Secrets. Everything else on this page needs no code changes
// once those are added.
function SetupGuide() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-coast-sand flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-coast-ocean" />
        </div>
        <h2 className="font-heading font-semibold text-coast-navy">Connect your Meta ad account</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        This dashboard reads campaigns and KPIs straight from Meta's Marketing API. It
        activates as soon as two secrets exist — no code changes needed.
      </p>
      <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
        <li>
          In <span className="text-coast-navy font-medium">Meta Business Settings → Users → System users</span>,
          create (or reuse) an admin system user and click <span className="text-coast-navy font-medium">Generate token</span>.
          Grant <code className="text-xs bg-muted px-1 rounded">ads_read</code> and{" "}
          <code className="text-xs bg-muted px-1 rounded">ads_management</code>, assign your ad account, and choose a
          non-expiring (60-day+) token.
        </li>
        <li>
          Find your ad account ID in <span className="text-coast-navy font-medium">Ads Manager</span> — the number after{" "}
          <code className="text-xs bg-muted px-1 rounded">act=</code> in the URL.
        </li>
        <li>
          In the <span className="text-coast-navy font-medium">Base44 dashboard → Settings → Secrets</span>, add{" "}
          <code className="text-xs bg-muted px-1 rounded">META_ACCESS_TOKEN</code> and{" "}
          <code className="text-xs bg-muted px-1 rounded">META_AD_ACCOUNT_ID</code>, then reload this page.
        </li>
      </ol>
    </div>
  );
}

function StatusBadge({ campaign }) {
  const s = campaign.effectiveStatus || campaign.status;
  const styles =
    s === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-700"
      : s === "PAUSED" || s === "CAMPAIGN_PAUSED"
        ? "bg-amber-500/10 text-amber-700"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles}`}>
      {String(s || "").replaceAll("_", " ").toLowerCase()}
    </span>
  );
}

export default function AdminMarketing() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [budgetDraft, setBudgetDraft] = useState("");

  const load = useCallback(async (d) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("metaAds", { mode: "overview", days: d });
      const body = res?.data ?? res;
      if (body?.notConfigured) {
        setNotConfigured(true);
      } else if (body?.error) {
        setError(body.error);
      } else {
        setData(body);
      }
    } catch (e) {
      setError(e?.message || "Couldn't reach Meta");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const updateCampaign = async (campaign, patch, confirmText) => {
    // Real ad dollars: nothing changes without an explicit confirm.
    if (!window.confirm(confirmText)) return;
    setBusyId(campaign.id);
    try {
      const res = await base44.functions.invoke("metaAds", {
        mode: "updateCampaign",
        campaignId: campaign.id,
        ...patch,
      });
      const body = res?.data ?? res;
      if (body?.error) throw new Error(body.error);
      toast({ title: "Campaign updated" });
      await load(days);
    } catch (e) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
      setEditingId(null);
    }
  };

  const roas =
    data?.account?.purchaseValue != null && data?.account?.spend > 0
      ? (data.account.purchaseValue / data.account.spend).toFixed(2)
      : null;

  return (
    <AdminShell title="Marketing" subtitle="Meta ad campaigns, spend, and KPIs">
      <Seo title="Marketing | Admin" path="/admin/marketing" robots="noindex,nofollow" />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
        </div>
      ) : notConfigured ? (
        <SetupGuide />
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm max-w-2xl">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={() => load(days)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[7, 28, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`h-9 px-4 text-sm font-medium ${
                    days === d ? "bg-coast-navy text-white" : "bg-card text-muted-foreground"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => load(days)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Kpi label="Spend" value={fmtMoney(data.account.spend)} />
            <Kpi label="Impressions" value={fmtNum(data.account.impressions)} />
            <Kpi label="Clicks" value={fmtNum(data.account.clicks)} />
            <Kpi label="CTR" value={fmtPct(data.account.ctr)} />
            <Kpi label="Avg. CPC" value={fmtMoney(data.account.cpc)} />
            <Kpi label="Purchases" value={fmtNum(data.account.purchases)} />
            <Kpi label="Purchase value" value={fmtMoney(data.account.purchaseValue)} />
            <Kpi label="ROAS" value={roas != null ? `${roas}x` : "—"} />
          </div>

          <h2 className="font-heading font-semibold text-coast-navy mb-3">
            Campaigns ({data.campaigns.length})
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Daily budget</th>
                  <th className="px-3 py-3">Spend</th>
                  <th className="px-3 py-3">Clicks</th>
                  <th className="px-3 py-3">CTR</th>
                  <th className="px-3 py-3">Purchases</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => {
                  const active = (c.effectiveStatus || c.status) === "ACTIVE";
                  const busy = busyId === c.id;
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-coast-navy">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {String(c.objective || "").replaceAll("OUTCOME_", "").toLowerCase()}
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadge campaign={c} /></td>
                      <td className="px-3 py-3">
                        {editingId === c.id ? (
                          <span className="inline-flex items-center gap-1">
                            <Input
                              value={budgetDraft}
                              onChange={(e) => setBudgetDraft(e.target.value)}
                              className="h-8 w-24"
                              type="number"
                              min="1"
                            />
                            <button
                              className="p-1 text-emerald-600"
                              onClick={() =>
                                updateCampaign(
                                  c,
                                  { dailyBudget: Number(budgetDraft) },
                                  `Set "${c.name}" daily budget to $${budgetDraft}?`
                                )
                              }
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-muted-foreground" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            {c.dailyBudget != null
                              ? fmtMoney(c.dailyBudget)
                              : c.lifetimeBudget != null
                                ? `${fmtMoney(c.lifetimeBudget)} lifetime`
                                : "ad-set level"}
                            {c.dailyBudget != null && (
                              <button
                                className="p-0.5 text-muted-foreground hover:text-coast-navy"
                                onClick={() => {
                                  setEditingId(c.id);
                                  setBudgetDraft(String(c.dailyBudget));
                                }}
                                aria-label="Edit daily budget"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">{fmtMoney(c.spend)}</td>
                      <td className="px-3 py-3">{fmtNum(c.clicks)}</td>
                      <td className="px-3 py-3">{fmtPct(c.ctr)}</td>
                      <td className="px-3 py-3">{fmtNum(c.purchases)}</td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            updateCampaign(
                              c,
                              { status: active ? "PAUSED" : "ACTIVE" },
                              active
                                ? `Pause "${c.name}"? It stops delivering immediately.`
                                : `Resume "${c.name}"? It starts spending again.`
                            )
                          }
                        >
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : active ? (
                            <>
                              <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 mr-1" /> Resume
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {data.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No campaigns in this ad account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Numbers come straight from Meta's Marketing API for the selected window. Budget and
            status changes apply to the live ad account immediately after you confirm.
          </p>
        </>
      ) : null}
    </AdminShell>
  );
}
