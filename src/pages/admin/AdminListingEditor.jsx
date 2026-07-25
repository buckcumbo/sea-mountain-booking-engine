import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, Save, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AREA_LABELS } from "@/lib/availability";
import { COLLECTIONS, slugifyCollection } from "@/lib/collections";
import Seo from "@/components/Seo";
import AdminShell from "@/components/admin/AdminShell";
import ListingMarkdown from "@/components/listing/ListingMarkdown";
import TagInput from "@/components/admin/TagInput";
import PhotoManager from "@/components/admin/PhotoManager";
import SleepsWhereEditor from "@/components/admin/SleepsWhereEditor";

export default function AdminListingEditor() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [listing, setListing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const matches = await base44.entities.Listing.filter({ slug }, "-created_date", 1);
        let found = matches && matches[0];
        if (!found) {
          try {
            found = await base44.entities.Listing.get(slug);
          } catch {
            /* not an id */
          }
        }
        if (!found) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (cancelled) return;
        setListing(found);
        setForm(cloneEditable(found));
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

  const toggleCollection = (collSlug) => {
    const exists = form.collections.some((c) => slugifyCollection(c) === collSlug);
    if (exists) {
      setForm((f) => ({
        ...f,
        collections: f.collections.filter((c) => slugifyCollection(c) !== collSlug),
      }));
    } else {
      setForm((f) => ({ ...f, collections: [...f.collections, collSlug] }));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        title: form.title,
        area: form.area,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        sleeps: Number(form.sleeps) || 0,
        petFriendly: !!form.petFriendly,
        amenities: form.amenities,
        storyCopy: form.storyCopy,
        photos: form.photos.map((p, i) => ({ ...p, order: i })),
        photosManaged: true,
        collections: form.collections,
        featured: !!form.featured,
        beachWalkMinutes: form.beachWalkMinutes ? Number(form.beachWalkMinutes) : null,
        sleepsWhere: form.sleepsWhere,
        active: form.active !== false,
        revaWidgetId: form.revaWidgetId || null,
      };
      await base44.entities.Listing.update(listing.id, patch);
      setListing({ ...listing, ...patch });
      toast({ title: "Saved", description: "Listing updated successfully." });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e.message || "Could not save listing.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
          <p className="text-muted-foreground mb-4">That listing doesn't exist.</p>
          <Button asChild variant="outline">
            <Link to="/admin/listings">Back to listings</Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={form.title}
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
        path={`/admin/listings/${slug}`}
        robots="noindex,nofollow"
      />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/admin/listings">
            <ArrowLeft className="w-4 h-4" /> All listings
          </Link>
        </Button>
      </div>

      {/* PROPERTY FACTS */}
      <Section title="Property Facts" note="Synced from PMS starting Sept — edits may be overwritten by sync.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title">
            <Input value={form.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Area">
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
          <Field label="Bedrooms">
            <Input
              type="number"
              value={form.bedrooms ?? 0}
              onChange={(e) => set({ bedrooms: e.target.value })}
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              type="number"
              value={form.bathrooms ?? 0}
              onChange={(e) => set({ bathrooms: e.target.value })}
            />
          </Field>
          <Field label="Sleeps">
            <Input
              type="number"
              value={form.sleeps ?? 0}
              onChange={(e) => set({ sleeps: e.target.value })}
            />
          </Field>
          <Field label="Pet-friendly">
            <div className="flex items-center h-9">
              <Switch
                checked={!!form.petFriendly}
                onCheckedChange={(v) => set({ petFriendly: v })}
              />
            </div>
          </Field>
        </div>
        <Field label="Amenities" className="mt-4">
          <TagInput
            tags={form.amenities}
            onChange={(amenities) => set({ amenities })}
            placeholder="e.g. Pool, WiFi, Hot tub"
          />
        </Field>
      </Section>

      {/* SLUG */}
      <Section title="Slug">
        <Field label="URL slug (read-only — URLs are stable once published)">
          <Input
            value={form.slug || ""}
            readOnly
            className="bg-muted/50 text-muted-foreground"
          />
        </Field>
      </Section>

      {/* DESCRIPTION */}
      <Section title="Description" note="Renders as markdown on the listing detail page.">
        <Textarea
          value={form.storyCopy || ""}
          onChange={(e) => set({ storyCopy: e.target.value })}
          rows={10}
          className="font-mono text-xs"
          placeholder={"## About this stay\n- Bullet points supported\n- **Bold** and *italics*"}
        />
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {showPreview && form.storyCopy && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <ListingMarkdown>{form.storyCopy}</ListingMarkdown>
            </div>
          )}
        </div>
      </Section>

      {/* PHOTOS */}
      <Section title="Photos" note="First photo is the hero image on cards and detail pages. Saving reindexes order and protects your photos from being overwritten by sync.">
        <PhotoManager photos={form.photos} onChange={(photos) => set({ photos })} />
      </Section>

      {/* COLLECTIONS & EDITORIAL */}
      <Section title="Collections & Editorial">
        <Field label="Collections">
          <div className="flex flex-wrap gap-2">
            {COLLECTIONS.map((c) => {
              const active = form.collections.some(
                (col) => slugifyCollection(col) === c.slug
              );
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleCollection(c.slug)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {active && <Star className="w-3 h-3" />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Featured">
            <div className="flex items-center h-9">
              <Switch
                checked={!!form.featured}
                onCheckedChange={(v) => set({ featured: v })}
              />
            </div>
          </Field>
          <Field label="Beach walk (minutes)">
            <Input
              type="number"
              value={form.beachWalkMinutes ?? ""}
              onChange={(e) => set({ beachWalkMinutes: e.target.value })}
              placeholder="e.g. 5"
            />
          </Field>
        </div>
        <Field label="Sleeping arrangements" className="mt-4">
          <SleepsWhereEditor
            items={form.sleepsWhere}
            onChange={(sleepsWhere) => set({ sleepsWhere })}
          />
        </Field>
        <Field label="Reva Widget ID" className="mt-4">
          <Input
            value={form.revaWidgetId || ""}
            onChange={(e) => set({ revaWidgetId: e.target.value })}
            placeholder="e.g. 959b0dfd-c95f-4730-9f81-522a32ad120e"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Paste the widget ID from your Reva embed code (the UUID after /widgets/)
          </p>
        </Field>
      </Section>

      {/* STATUS */}
      <Section title="Status">
        <div className="flex items-center gap-3">
          <Switch
            checked={form.active !== false}
            onCheckedChange={(v) => set({ active: v })}
          />
          <div>
            <p className="text-sm font-medium">
              {form.active !== false ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-muted-foreground">
              {form.active !== false
                ? "Visible on search, collections, and homepage."
                : "Hidden from public pages. The detail URL still resolves with an 'unavailable' state."}
            </p>
          </div>
        </div>
      </Section>
    </AdminShell>
  );
}

function cloneEditable(l) {
  return {
    ...l,
    amenities: [...(l.amenities || [])],
    collections: [...(l.collections || [])],
    photos: (l.photos || []).map((p) => ({ ...p })),
    sleepsWhere: (l.sleepsWhere || []).map((s) => ({ ...s })),
  };
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