import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminShell from "@/components/admin/AdminShell";
import Seo from "@/components/Seo";
import { useToast } from "@/components/ui/use-toast";
import { SITE_IMAGE_GROUPS } from "@/lib/siteImageKeys";

export default function AdminImages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [byKey, setByKey] = useState({});
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.SiteImage.list("-created_date", 200);
      const map = {};
      const d = {};
      for (const r of all || []) {
        map[r.key] = r;
        d[r.key] = { imageUrl: r.imageUrl || "", altText: r.altText || "" };
      }
      setByKey(map);
      setDrafts(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setDraft = (key, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { imageUrl: "", altText: "" }), ...patch },
    }));
  };

  const onUpload = async (key, file) => {
    if (!file) return;
    setBusy((b) => ({ ...b, [key]: "upload" }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDraft(key, { imageUrl: file_url });
      toast({ title: "Image uploaded", description: "Save to publish." });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setBusy((b) => ({ ...b, [key]: null }));
    }
  };

  const onSave = async (key) => {
    const draft = drafts[key] || { imageUrl: "", altText: "" };
    if (!draft.imageUrl) {
      toast({ title: "Add an image first", variant: "destructive" });
      return;
    }
    setBusy((b) => ({ ...b, [key]: "save" }));
    try {
      const existing = byKey[key];
      if (existing) {
        await base44.entities.SiteImage.update(existing.id, {
          imageUrl: draft.imageUrl,
          altText: draft.altText || "",
        });
      } else {
        const created = await base44.entities.SiteImage.create({
          key,
          imageUrl: draft.imageUrl,
          altText: draft.altText || "",
        });
        setByKey((m) => ({ ...m, [key]: created }));
      }
      toast({ title: "Saved", description: key });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setBusy((b) => ({ ...b, [key]: null }));
    }
  };

  return (
    <AdminShell title="Site Images" subtitle="Page heroes and card photos">
      <Seo title="Site Images | Admin" path="/admin/images" robots="noindex,nofollow" />
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-10">
          {SITE_IMAGE_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="font-heading text-lg font-semibold mb-4">{group.title}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map((item) => (
                  <ImageRow
                    key={item.key}
                    label={item.label}
                    itemKey={item.key}
                    draft={drafts[item.key]}
                    busy={busy[item.key]}
                    onUpload={(file) => onUpload(item.key, file)}
                    onAltChange={(v) => setDraft(item.key, { altText: v })}
                    onSave={() => onSave(item.key)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function ImageRow({ label, itemKey, draft, busy, onUpload, onAltChange, onSave }) {
  const url = draft?.imageUrl || "";
  const alt = draft?.altText || "";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex gap-4">
        <div className="w-24 h-20 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {url ? (
            <img src={url} alt={alt || label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground font-mono break-all">{itemKey}</div>
          <div className="mt-2">
            <label className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer">
              {busy === "upload" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Input
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Alt text"
          className="h-9"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={onSave} disabled={busy === "save" || !url} size="sm">
          {busy === "save" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}