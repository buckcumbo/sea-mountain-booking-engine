import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Compass } from "lucide-react";
import AreaGuideHero from "@/components/area/AreaGuideHero";

// Public area page. Reads ONLY Listing + AreaGuide. No external calls, no price math.
export default function AreaGuidePage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState(null);
  const [listings, setListings] = useState([]);
  const [guides, setGuides] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setGuide(null);
      try {
        // Public read returns only published records (RLS).
        const matches = await base44.entities.AreaGuide.filter(
          { type: "area", slug, published: true },
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

        const [areaListings, areaGuides] = await Promise.all([
          base44.entities.Listing.filter({ area: found.area }, "-created_date", 500),
          base44.entities.AreaGuide.filter(
            { type: "guide", area: found.area, published: true },
            "-created_date",
            100
          ),
        ]);
        if (cancelled) return;
        setListings(areaListings || []);
        setGuides(areaGuides || []);
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
        <h1 className="font-heading text-2xl font-semibold text-coast-navy mb-2">
          Area not found
        </h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find a guide for that area. It may not be published yet.
        </p>
        <Link to="/search" className="text-coast-ocean hover:underline text-sm">
          Browse all rentals instead
        </Link>
      </div>
    );
  }

  return <AreaGuideHero guide={guide} listings={listings} guides={guides} />;
}