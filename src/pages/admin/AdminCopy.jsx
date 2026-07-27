import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminShell from "@/components/admin/AdminShell";
import Seo from "@/components/Seo";
import { useToast } from "@/components/ui/use-toast";
import { SITE_COPY_GROUPS } from "@/lib/siteCopyKeys";
import { invalidateSiteCopy } from "@/hooks/useSiteCopy";

// Site Copy editor. Every field ships with a code default; a SiteCopy
// record exists only for text that's been changed. "Reset" deletes the
// record so the code default takes over again.
export default function AdminCopy() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [byKey, setByKey] = useState({}); // key -> record
  const [drafts, setDrafts] = useState({}); // key -> current textarea value
  const [saving, setSaving] = useState(false);

  const fieldsByKey = useMemo(() => {
    const m = {};
    for (const g of SITE_COPY_GROUPS) for (const f of g.fields) m[f.key] = f;
    return m;
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.SiteCopy.list("-created_date", 500);
      const map = {};
      for (const r of all || []) {
        if (r.key && !map[r.key]) map[r.key] = r;
      }
      setByKey(map);
      const d = {};
      for (const key of Object.keys(fieldsByKey)) {
        d[key] = map[key]?.value ?? fieldsByKey[key].default;
      }
      setDrafts(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dirty = differs from what's effectively live (override, else default).
  const liveValue = (key) => byKey[key]?.value ?? fieldsByKey[key].default;
  const dirtyKeys = Object.keys(fieldsByKey).filter(
    (key) => (drafts[key] ?? "") !== liveValue(key)
  );

  const onSaveAll = async () => {
    if (dirtyKeys.length === 0) return;
    setSaving(true);
    let ok = 0;
    const next = { ...byKey };
    for (const key of dirtyKeys) {
      const value = (drafts[key] ?? "").trim();
      try {
        const existing = byKey[key];
        if (value === "" || value === fieldsByKey[key].default) {
          // Back to default: remove the override record entirely.
          if (existing) {
            await base44.entities.SiteCopy.delete(existing.id);
            delete next[key];
          }
          setDrafts((d) => ({ ...d, [key]: fieldsByKey[key].default }));
        } else if (existing) {
          await base44.entities.SiteCopy.update(existing.id, { value });
          next[key] = { ...existing, value };
        } else {
          next[key] = await base44.entities.SiteCopy.create({ key, value });
        }
        ok++;
      } catch {
        toast({ title: `Couldn't save "${fieldsByKey[key].label}"`, variant: "destructive" });
      }
    }
    setByKey(next);
    setSaving(false);
    invalidateSiteCopy();
    if (ok > 0) {
      toast({
        title: `Saved ${ok} change${ok === 1 ? "" : "s"}`,
        description: "Live pages pick up new copy on their next load.",
      });
    }
  };

  const onReset = (key) => {
    setDrafts((d) => ({ ...d, [key]: fieldsByKey[key].default }));
  };

  return (
    <AdminShell title="Site Copy" subtitle="Headlines, subheads, and section text across the site">
      <Seo title="Site Copy | Admin" path="/admin/copy" robots="noindex,nofollow" />
      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 bg-background/90 backdrop-blur border-b border-border mb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {dirtyKeys.length === 0
            ? "All changes saved"
            : `${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? "" : "s"}`}
        </span>
        <Button onClick={onSaveAll} disabled={dirtyKeys.length === 0 || saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save all changes
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
        </div>
      ) : (
        <div className="space-y-8">
          {SITE_COPY_GROUPS.map((group) => (
            <section key={group.page}>
              <h2 className="font-heading font-semibold text-coast-navy mb-3">{group.page}</h2>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                {group.fields.map((f) => {
                  const value = drafts[f.key] ?? "";
                  const overridden = !!byKey[f.key];
                  const dirty = value !== liveValue(f.key);
                  return (
                    <div key={f.key} className="p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-coast-navy">
                          {f.label}
                          {overridden && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-coast-ocean bg-coast-ocean/10 rounded-full px-1.5 py-0.5">
                              edited
                            </span>
                          )}
                          {dirty && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-600 bg-amber-500/10 rounded-full px-1.5 py-0.5">
                              unsaved
                            </span>
                          )}
                        </label>
                        {(overridden || dirty) && value !== f.default && (
                          <button
                            onClick={() => onReset(f.key)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-coast-navy"
                            title="Restore the original text (save to apply)"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset to original
                          </button>
                        )}
                      </div>
                      {f.multiline ? (
                        <textarea
                          value={value}
                          onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                          rows={3}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      ) : (
                        <Input
                          value={value}
                          onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                        />
                      )}
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{f.hint || ""}</span>
                        <span>{value.length} chars</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
