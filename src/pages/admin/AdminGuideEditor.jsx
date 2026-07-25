import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AREA_LABELS } from "@/lib/availability";
import Seo from "@/components/Seo";
import AdminShell from "@/components/admin/AdminShell";
import GuideMarkdown from "@/components/guides/GuideMarkdown";
import ImageUploadField from "@/components/admin/ImageUploadField";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminGuideEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guide, setGuide] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const matches = await base44.entities.AreaGuide.filter(
          { type: "guide", slug },
          "-created_date",
          1
        );
        let found = matches && matches[0];
        if (!found) {
          try {
            found = await base44.entities.AreaGuide.get(slug);
          } catch {
            /* not an id */
          }
        }
        if (!found) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (cancelled) return;
        setGuide(found);
        setForm({ ...found });
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Slug is locked once the article has ever been published (or is currently
  // published — covers existing records created before everPublished existed).
  const slugLocked = !!(guide && (guide.everPublished || guide.published));

  const save = async () => {
    setSaving(true);
    try {
      const newSlug = slugLocked
        ? guide.slug
        : slugify(form.slug) || guide.slug;

      // Enforce slug uniqueness when changing.
      if (!slugLocked && newSlug !== guide.slug) {
        const existing = await base44.entities.AreaGuide.filter(
          { type: "guide", slug: newSlug },
          "-created_date",
          1
        );
        if (existing && existing.length > 0 && existing[0].id !== guide.id) {
          toast({
            title: "Slug in use",
            description: "Another guide already uses that slug.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      const patch = {
        title: form.title,
        slug: newSlug,
        area: form.area,
        body: form.body,
        heroImage: form.heroImage,
        published: !!form.published,
        everPublished: !!(guide.everPublished || form.published),
      };

      await base44.entities.AreaGuide.update(guide.id, patch);
      const updated = { ...guide, ...patch };
      setGuide(updated);
      setForm({ ...updated });
      toast({ title: "Saved", description: "Guide updated successfully." });
      if (newSlug !== slug) {
        navigate(`/admin/guides/${newSlug}`);
      }
    } catch (e) {
      toast({
        title: "Save failed",
        description: e.message || "Could not save guide.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async () => {
    if (!window.confirm("Delete this draft permanently? This cannot be undone.")) return;
    try {
      await base44.entities.AreaGuide.delete(guide.id);
      toast({ title: "Deleted", description: "Draft deleted." });
      navigate("/admin/guides");
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminShell title="Loading…" subtitle="">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (notFound || !form) {
    return (
      <AdminShell title="Not found" subtitle="">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">That guide doesn't exist.</p>
          <Button asChild variant="outline">
            <Link to="/admin/guides">Back to guides</Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={form.title || "Untitled"}
      subtitle={`Slug: ${form.slug}`}
      actions={
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </Button>
      }
    >
      <Seo
        title={`Edit: ${form.title} | Admin`}
        path={`/admin/guides/${slug}`}
        robots="noindex,nofollow"
      />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/admin/guides">
            <ArrowLeft className="w-4 h-4" /> All guides
          </Link>
        </Button>
      </div>

      {/* ARTICLE */}
      <Section title="Article">
        <Field label="Title">
          <Input
            value={form.title || ""}
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
        <Field label="Slug" className="mt-4">
          <Input
            value={form.slug || ""}
            onChange={(e) => set({ slug: e.target.value })}
            disabled={slugLocked}
            readOnly={slugLocked}
            className={slugLocked ? "bg-muted/50 text-muted-foreground" : ""}
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-muted-foreground">
              {slugLocked
                ? "Read-only — this article has been published, so its URL is permanently locked."
                : "Editable while in draft. Kebab-case, used in the public URL."}
            </p>
            {!slugLocked && (
              <button
                type="button"
                onClick={() => set({ slug: slugify(form.title) })}
                className="text-xs text-coast-ocean hover:underline shrink-0"
              >
                Generate from title
              </button>
            )}
          </div>
        </Field>
        <Field label="Area" className="mt-4">
          <select
            value={form.area}
            onChange={(e) => set({ area: e.target.value })}
            className="h-9 w-full rounded-lg border border-border bg-card text-sm px-3"
          >
            {Object.entries(AREA_LABELS).map(([s, label]) => (
              <option key={s} value={s}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* BODY */}
      <Section title="Body" note="Renders as markdown on the guide detail page.">
        <Textarea
          value={form.body || ""}
          onChange={(e) => set({ body: e.target.value })}
          rows={12}
          className="font-mono text-xs"
          placeholder={"## Heading\n\nWrite your guide in markdown…\n\n- Bullet points\n- **Bold** and *italics*"}
        />
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {showPreview && form.body && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <GuideMarkdown>{form.body}</GuideMarkdown>
            </div>
          )}
        </div>
      </Section>

      {/* HERO IMAGE */}
      <Section title="Hero Image">
        <ImageUploadField
          value={form.heroImage}
          onChange={(v) => set({ heroImage: v })}
          placeholder="Paste hero image URL…"
        />
      </Section>

      {/* PUBLISHING */}
      <Section title="Publishing">
        <div className="flex items-center gap-3">
          <Switch
            checked={!!form.published}
            onCheckedChange={(v) => set({ published: v })}
          />
          <div>
            <p className="text-sm font-medium">
              {form.published
                ? `Published — live at /guides/${form.slug}`
                : "Draft — not visible on the site"}
            </p>
            <p className="text-xs text-muted-foreground">
              {form.published
                ? "Visible on the guides hub and sitemap."
                : "Hidden from the public site. Only admins can see this article."}
            </p>
          </div>
        </div>
        {form.published && (
          <a
            href={`/guides/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-2 mt-4 hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> View live
          </a>
        )}
        {!slugLocked && (
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={deleteDraft}
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" /> Delete draft
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Drafts can be permanently deleted. Once published, this option is
              replaced by the unpublish toggle above.
            </p>
          </div>
        )}
      </Section>
    </AdminShell>
  );
}

function Section({ title, note, children }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 mb-4">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}