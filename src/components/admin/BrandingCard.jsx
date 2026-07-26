import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BRAND_LOGOS } from "@/lib/brand";
import { resolveLogoSettings } from "@/hooks/useSiteSettings";

const VARIANTS = [
  { value: "lockup", label: "Logo + wordmark", src: BRAND_LOGOS.lockupWhite },
  { value: "mark", label: "Mark only", src: BRAND_LOGOS.markWhite },
];

// Admin control for the public header logo: which brand asset renders and
// how tall. Saves to SiteSetting (header:logoVariant / header:logoHeight);
// PublicHeader reads the same keys via useSiteSettings.
export default function BrandingCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState({}); // key -> record
  const [variant, setVariant] = useState("lockup");
  const [height, setHeight] = useState(56);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.SiteSetting.list("-created_date", 100);
        const byKey = {};
        for (const r of all || []) {
          if (r.key && !byKey[r.key]) byKey[r.key] = r;
        }
        setRows(byKey);
        const resolved = resolveLogoSettings({
          "header:logoVariant": byKey["header:logoVariant"]?.value,
          "header:logoHeight": byKey["header:logoHeight"]?.value,
        });
        setVariant(resolved.variant);
        setHeight(resolved.height);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upsert = async (key, value) => {
    const existing = rows[key];
    if (existing) {
      await base44.entities.SiteSetting.update(existing.id, { value });
      return existing;
    }
    const created = await base44.entities.SiteSetting.create({ key, value });
    setRows((r) => ({ ...r, [key]: created }));
    return created;
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await upsert("header:logoVariant", variant);
      await upsert("header:logoHeight", String(height));
      toast({ title: "Branding saved", description: "The header updates on next page load." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-coast-ocean" />
      </div>
    );
  }

  const previewSrc = variant === "mark" ? BRAND_LOGOS.markWhite : BRAND_LOGOS.lockupWhite;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-heading font-semibold text-coast-navy mb-1">Header Branding</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Choose which logo the site header shows and how large it renders.
      </p>

      {/* Live preview on the real header color, at the real header height. */}
      <div className="rounded-xl bg-coast-navy h-[72px] flex items-center px-6 mb-5">
        <img
          src={previewSrc}
          alt="Header logo preview"
          style={{ height: `${height}px` }}
          className="w-auto object-contain"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {VARIANTS.map((v) => (
          <button
            key={v.value}
            onClick={() => setVariant(v.value)}
            aria-pressed={variant === v.value}
            className={`rounded-xl border p-4 flex flex-col items-center gap-3 transition-colors ${
              variant === v.value
                ? "border-coast-ocean ring-2 ring-coast-ocean/30 bg-coast-ocean/5"
                : "border-border hover:border-coast-ocean/50"
            }`}
          >
            <span className="bg-coast-navy rounded-lg px-4 py-3 flex items-center justify-center h-16">
              <img src={v.src} alt={v.label} className="h-10 w-auto object-contain" />
            </span>
            <span className="text-sm font-medium text-coast-navy">{v.label}</span>
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-coast-navy mb-1">
        Logo size — {height}px
      </label>
      <input
        type="range"
        min={32}
        max={64}
        step={2}
        value={height}
        onChange={(e) => setHeight(Number(e.target.value))}
        className="w-full accent-coast-ocean"
      />
      <div className="flex justify-between text-xs text-muted-foreground mb-5">
        <span>32px</span>
        <span>64px (header is 72px tall)</span>
      </div>

      <Button onClick={onSave} disabled={saving} className="bg-coast-navy hover:bg-coast-navy-soft text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
        Save branding
      </Button>
    </div>
  );
}
