import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { prettifyArea, AREA_LABELS } from "@/lib/availability";
import { COLLECTIONS, slugifyCollection } from "@/lib/collections";
import Seo from "@/components/Seo";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminListings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [collection, setCollection] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await base44.entities.Listing.list("-created_date", 500);
      setListings(data);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return listings.filter((l) => {
      if (
        q &&
        !(l.title || "").toLowerCase().includes(q) &&
        !(l.slug || "").toLowerCase().includes(q)
      )
        return false;
      if (area !== "all" && l.area !== area) return false;
      if (status === "active" && l.active === false) return false;
      if (status === "inactive" && l.active !== false) return false;
      if (collection !== "all") {
        const has = (l.collections || []).some(
          (c) => slugifyCollection(c) === collection
        );
        if (!has) return false;
      }
      return true;
    });
  }, [listings, search, area, collection, status]);

  return (
    <AdminShell title="Listing Editor" subtitle={`${listings.length} total listings`}>
      <Seo title="Listing Editor | Admin" path="/admin/listings" robots="noindex,nofollow" />
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
          {Object.entries(AREA_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card text-sm px-3"
        >
          <option value="all">All collections</option>
          {COLLECTIONS.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card text-sm px-3"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Photo</th>
                <th className="text-left font-medium px-4 py-3">Title</th>
                <th className="text-left font-medium px-4 py-3">Slug</th>
                <th className="text-left font-medium px-4 py-3">Area</th>
                <th className="text-right font-medium px-4 py-3">B/B/S</th>
                <th className="text-left font-medium px-4 py-3">Collections</th>
                <th className="text-center font-medium px-4 py-3">Featured</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No listings match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => navigate(`/admin/listings/${l.slug || l.id}`)}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      <div className="w-12 h-10 rounded bg-muted overflow-hidden">
                        {l.photos && l.photos[0] && (
                          <img
                            src={l.photos[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{l.title}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{l.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{prettifyArea(l.area)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {l.bedrooms}/{l.bathrooms}/{l.sleeps}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(l.collections || []).slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-muted border border-border rounded-full px-1.5 py-0.5"
                          >
                            {c}
                          </span>
                        ))}
                        {(l.collections || []).length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{l.collections.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {l.featured ? (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 inline" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                          l.active !== false
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {l.active !== false ? "Active" : "Inactive"}
                      </span>
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