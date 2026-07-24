import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import AreaGrid from "@/components/home/AreaGrid";
import FeaturedRentals from "@/components/home/FeaturedRentals";
import ReviewStrip from "@/components/home/ReviewStrip";
import { Receipt, MapPin, Tag } from "lucide-react";

function Section({ title, subtitle, children }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-7">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy">{title}</h2>
        {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const WHY = [
  { icon: Receipt, title: "No booking fees", text: "Book direct and skip the marketplace service fees — the price you see is the price you pay." },
  { icon: MapPin, title: "A local team", text: "Our Grand Strand-based team knows every home and is on call throughout your stay." },
  { icon: Tag, title: "Best direct rates", text: "Direct bookings unlock our lowest rates and exclusive offers on 100 Collection homes." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await base44.entities.Listing.list("-created_date", 100);
      const f = all.filter((l) => l.featured);
      setFeatured((f.length ? f : all).slice(0, 4));
      const revs = await base44.entities.Review.filter({ published: true }, "-stayDate", 3);
      setReviews(revs || []);
    })();
  }, []);

  return (
    <div>
      <Hero />

      <Section title="Browse by Collection" subtitle="From oceanfront retreats to budget-friendly getaways, find the perfect fit.">
        <CollectionGrid />
      </Section>

      <Section title="Explore Our Areas" subtitle="Six distinct communities along the Grand Strand — each with its own coastal character.">
        <AreaGrid />
      </Section>

      <Section title="Featured Rentals" subtitle="Hand-picked stays from our 100 Collection.">
        <FeaturedRentals listings={featured} />
      </Section>

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-8">
          {WHY.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-white text-coast-ocean flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <Section title="What our guests say" subtitle="Real reviews from recent Grand Strand stays.">
          <ReviewStrip reviews={reviews} />
        </Section>
      )}
    </div>
  );
}