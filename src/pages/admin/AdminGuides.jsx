import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prettifyArea, AREA_LABELS } from "@/lib/availability";
import Seo from "@/components/Seo";
import AdminShell from "@/components/admin/AdminShell";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminGuides() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await base44.entities.AreaGuide.filter(
        { type: "guide" },
        "-updated_date",
        500
      );
      setGuides(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return guides.filter((g) => {
      if (
        q &&
        !(g.title || "").toLowerCase().includes(q) &&
        !(g.slug || "").toLowerCase().includes(q)
      )
        return false;
      if (area !== "all" && g.area !== area) return false;
      if (status === "published" && !g.published) return false;
      if (status === "draft" && g.published) return false;
      return true;
    });
  }, [guides, search, area, status]);

  const createDraft = async () => {
    setCreating(true);
    try {
      const baseSlug = "untitled-article";
      let slug = baseSlug;
      let n = 2;
      while (true) {
        const existing = await base44.entities.AreaGuide.filter(
          { type: "guide", slug },
          "-created_date",
          1
        );
        if (!existing || existing.length === 0) break;
        slug = `${baseSlug}-${n}`;
        n++;
      }
      const draft = await base44.entities.AreaGuide.create({
        type: "guide",
        title: "Untitled Article",
        slug,
        area: "myrtle-beach",
        published: false,
        everPublished: false,
        body: "",
        heroImage: "",
        category: "general",
      });
      navigate(`/admin/guides/${draft.slug}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <AdminShell
      title="Guide Editor"
      subtitle={`${guides.length} total articles`}
      actions={
        <Button onClick={createDraft} disabled={creating}>
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New article
        </Button>
      }
    >
      <Seo title="Guide Editor | Admin" path="/admin/guides" robots="noindex,nofollow" />

      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or slug…"
            className="pl-9"
          />
        </div>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card text-sm px-3"
        >
          <option value="all">All areas</option>
          {Object.entries(AREA_LABELS).map(([s, label]) => (
            <option key={s} value={s}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card text-sm px-3"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Hero</th>
                <th className="text-left font-medium px-4 py-3">Title</th>
                <th className="text-left font-medium px-4 py-3">Slug</th>
                <th className="text-left font-medium px-4 py-3">Area</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No articles match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => navigate(`/admin/guides/${g.slug || g.id}`)}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      <div className="w-12 h-10 rounded bg-muted overflow-hidden">
                        {g.heroImage && (
                          <img
                            src={g.heroImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{g.title}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{g.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {prettifyArea(g.area)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                          g.published
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {g.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(g.updated_date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}