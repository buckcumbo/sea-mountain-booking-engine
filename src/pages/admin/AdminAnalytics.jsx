import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import Seo from "@/components/Seo";
import AdminShell from "@/components/admin/AdminShell";
import DateRangePicker from "@/components/analytics/DateRangePicker";
import SummaryCards from "@/components/analytics/SummaryCards";
import TrafficChart from "@/components/analytics/TrafficChart";
import TopItemsTable from "@/components/analytics/TopItemsTable";
import SearchInsights from "@/components/analytics/SearchInsights";
import BookingsPlaceholder from "@/components/analytics/BookingsPlaceholder";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toDateString(d) {
  return d.toISOString().split("T")[0];
}

function daysBetween(start, end) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [listings, setListings] = useState([]);
  const [guides, setGuides] = useState([]);
  const [preset, setPreset] = useState("7d");
  const [customStart, setCustomStart] = useState(
    toDateString(new Date(Date.now() - 6 * 86400000))
  );
  const [customEnd, setCustomEnd] = useState(toDateString(new Date()));

  // Single fetch — all data loaded once, aggregated client-side.
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [evts, lsts, gds] = await Promise.all([
        base44.entities.AnalyticsEvent.list("-created_date", 5000),
        base44.entities.Listing.list("-created_date", 500),
        base44.entities.AreaGuide.filter({ published: true }, "-created_date", 500),
      ]);
      setEvents(evts || []);
      setListings(lsts || []);
      setGuides(gds || []);
      setLoading(false);
    })();
  }, []);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (preset === "7d") {
      return { rangeStart: startOfDay(new Date(Date.now() - 6 * 86400000)), rangeEnd: endOfDay(new Date()) };
    }
    if (preset === "30d") {
      return { rangeStart: startOfDay(new Date(Date.now() - 29 * 86400000)), rangeEnd: endOfDay(new Date()) };
    }
    return {
      rangeStart: startOfDay(new Date(customStart)),
      rangeEnd: endOfDay(new Date(customEnd)),
    };
  }, [preset, customStart, customEnd]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.created_date);
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [events, rangeStart, rangeEnd]);

  const summary = useMemo(() => {
    const counts = { page_view: 0, listing_view: 0, search: 0, guide_view: 0, favorite_add: 0, inquiry_submit: 0 };
    const sessions = new Set();
    filtered.forEach((e) => {
      if (counts[e.eventType] !== undefined) counts[e.eventType]++;
      if (e.sessionId) sessions.add(e.sessionId);
    });
    counts.sessions = sessions.size;
    return counts;
  }, [filtered]);

  const traffic = useMemo(() => {
    const days = daysBetween(rangeStart, rangeEnd);
    const byDay = {};
    filtered
      .filter((e) => e.eventType === "page_view")
      .forEach((e) => {
        const key = toDateString(new Date(e.created_date));
        byDay[key] = (byDay[key] || 0) + 1;
      });
    return days.map((d) => ({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: byDay[toDateString(d)] || 0,
    }));
  }, [filtered, rangeStart, rangeEnd]);

  const topListings = useMemo(() => {
    const counts = {};
    filtered
      .filter((e) => e.eventType === "listing_view")
      .forEach((e) => {
        if (e.listingSlug) counts[e.listingSlug] = (counts[e.listingSlug] || 0) + 1;
      });
    const listingMap = {};
    listings.forEach((l) => { if (l.slug) listingMap[l.slug] = l; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => ({
        slug,
        title: listingMap[slug]?.title || slug,
        href: `/listing/${slug}`,
        count,
      }));
  }, [filtered, listings]);

  const topGuides = useMemo(() => {
    const counts = {};
    filtered
      .filter((e) => e.eventType === "guide_view")
      .forEach((e) => {
        const slug = e.path?.replace("/guides/", "");
        if (slug) counts[slug] = (counts[slug] || 0) + 1;
      });
    const guideMap = {};
    guides.forEach((g) => { if (g.slug) guideMap[g.slug] = g; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => ({
        slug,
        title: guideMap[slug]?.title || slug,
        href: `/guides/${slug}`,
        count,
      }));
  }, [filtered, guides]);

  const searchInsights = useMemo(() => {
    const areaCounts = {};
    const collectionCounts = {};
    filtered
      .filter((e) => e.eventType === "search")
      .forEach((e) => {
        const params = e.searchParams || {};
        if (params.area) {
          areaCounts[params.area] = (areaCounts[params.area] || 0) + 1;
        }
        if (Array.isArray(params.collections)) {
          params.collections.forEach((c) => {
            collectionCounts[c] = (collectionCounts[c] || 0) + 1;
          });
        }
      });
    const toList = (obj) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, count]) => ({ label, count }));
    return { areaCounts: toList(areaCounts), collectionCounts: toList(collectionCounts) };
  }, [filtered]);

  return (
    <AdminShell title="Analytics" subtitle="Site traffic & engagement">
      <Seo title="Analytics | Admin" path="/admin/analytics" robots="noindex,nofollow" />
      <div className="mb-6">
        <DateRangePicker
          preset={preset}
          customStart={customStart}
          customEnd={customEnd}
          onChange={({ preset: p, customStart: cs, customEnd: ce }) => {
            if (p !== undefined) setPreset(p);
            if (cs !== undefined) setCustomStart(cs);
            if (ce !== undefined) setCustomEnd(ce);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          <SummaryCards counts={summary} />

          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-coast-navy mb-4">Traffic Over Time</h3>
            <TrafficChart data={traffic} />
          </section>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-heading font-semibold text-coast-navy">Top Listings by Views</h3>
              </div>
              <TopItemsTable items={topListings} emptyMessage="No listing views in this range yet." />
            </section>

            <section className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-heading font-semibold text-coast-navy">Top Guides by Views</h3>
              </div>
              <TopItemsTable items={topGuides} emptyMessage="No guide views in this range yet." />
            </section>
          </div>

          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-coast-navy mb-4">Search Insights</h3>
            <SearchInsights
              areaCounts={searchInsights.areaCounts}
              collectionCounts={searchInsights.collectionCounts}
            />
          </section>

          <section>
            <BookingsPlaceholder />
          </section>
        </div>
      )}
    </AdminShell>
  );
}