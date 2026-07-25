import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { AREA_LABELS } from "@/lib/availability";
import GuideCard from "@/components/guides/GuideCard";
import Seo from "@/components/Seo";
import HeroBackground from "@/components/HeroBackground";
import { useSiteImage } from "@/hooks/useSiteImageMap";

const CATEGORIES = ["attractions", "activities", "dining", "seasonal"];

export default function Guides() {
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState([]);
  const [area, setArea] = useState("all");
  const [category, setCategory] = useState("all");
  const heroImage = useSiteImage("hero:guides");

  useEffect(() => {
    (async () => {
      const data = await base44.entities.AreaGuide.filter(
        { type: "guide", published: true },
        "-created_date",
        500
      );
      setGuides(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      guides.filter((g) => {
        if (area !== "all" && g.area !== area) return false;
        if (category !== "all" && g.category !== category) return false;
        return true;
      }),
    [guides, area, category]
  );

  const areas = Object.entries(AREA_LABELS);

  return (
    <div>
      <Seo
        title="Things To Do on the Grand Strand | Sea Mountain Vacations"
        description="Local guides to attractions, activities, dining, and seasonal events across all six Grand Strand communities."
        path="/guides"
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <HeroBackground image={heroImage} />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold">
            Things To Do on the Grand Strand
          </h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            Local guides to attractions, activities, dining, and seasonal events across all six
            Grand Strand communities.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Chip active={area === "all"} onClick={() => setArea("all")}>All areas</Chip>
            {areas.map(([slug, label]) => (
              <Chip key={slug} active={area === slug} onClick={() => setArea(slug)}>
                {label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={category === "all"} onClick={() => setCategory("all")}>All categories</Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-coast-ocean" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground italic border border-dashed border-border rounded-xl p-10 text-center">
            No guides match your filters yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
        active
          ? "bg-coast-navy text-white border-coast-navy"
          : "bg-card text-coast-navy border-border hover:border-coast-ocean"
      }`}
    >
      {children}
    </button>
  );
}