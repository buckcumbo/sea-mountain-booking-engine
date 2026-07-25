import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Compass } from "lucide-react";
import GuideMarkdown from "@/components/guides/GuideMarkdown";
import { Button } from "@/components/ui/button";
import { prettifyArea } from "@/lib/availability";
import GuideCard from "@/components/guides/GuideCard";
import Seo from "@/components/Seo";
import { buildArticleJsonLd, buildFaqJsonLd } from "@/lib/seo";
import { track } from "@/lib/analytics";

export default function GuideDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState(null);
  const [more, setMore] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setGuide(null);
      try {
        const matches = await base44.entities.AreaGuide.filter(
          { type: "guide", slug, published: true },
          "-created_date",
          1
        );
        const found = matches && matches[0];
        if (!found) {
          if (!cancelled) setLoading(false);
          return;
        }
        if (cancelled) return;
        setGuide(found);
        track("guide_view");
        const related = await base44.entities.AreaGuide.filter(
          { type: "guide", area: found.area, published: true },
          "-created_date",
          100
        );
        if (cancelled) return;
        setMore((related || []).filter((g) => g.id !== found.id).slice(0, 3));
      } catch {
        if (!cancelled) setGuide(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-coast-sand flex items-center justify-center mb-5">
          <Compass className="w-7 h-7 text-coast-ocean" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-coast-navy mb-2">Guide not found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find that guide. It may not be published yet.
        </p>
        <Link to="/guides" className="text-coast-ocean hover:underline text-sm">
          Browse all things to do
        </Link>
      </div>
    );
  }

  const areaName = prettifyArea(guide.area);

  return (
    <div>
      <Seo
        title={`${guide.title} | Sea Mountain Vacations`}
        description={guide.excerpt || ""}
        path={`/guides/${slug}`}
        ogType="article"
        ogImage={guide.heroImage || undefined}
        jsonLd={[buildArticleJsonLd(guide), buildFaqJsonLd(guide)].filter(Boolean)}
      />
      <section className="relative overflow-hidden bg-coast-navy">
        {guide.heroImage && (
          <img
            src={guide.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy/50 to-coast-navy/80" />
        <div className="relative max-w-3xl mx-auto px-6 py-16 text-white">
          <div className="flex items-center gap-2 text-sm text-white/80 mb-3">
            <Link to={`/area/${guide.area}`} className="hover:text-white">{areaName}</Link>
            <span>·</span>
            <span className="capitalize">{guide.category}</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight">
            {guide.title}
          </h1>
          {guide.excerpt && <p className="mt-3 text-white/85">{guide.excerpt}</p>}
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-14">
        {guide.body && <GuideMarkdown>{guide.body}</GuideMarkdown>}
      </article>

      {more.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-10">
          <h2 className="font-heading text-2xl font-semibold text-coast-navy mb-7">
            More things to do in {areaName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {more.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-coast-navy">Explore {areaName}</h2>
            <p className="text-muted-foreground mt-1">
              Discover rentals and more things to do in the area.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-coast-ocean text-coast-ocean">
              <Link to={`/area/${guide.area}`}>Area guide</Link>
            </Button>
            <Button asChild className="bg-coast-navy hover:bg-coast-navy-soft text-white">
              <Link to={`/search?area=${guide.area}`}>Find a Rental</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}