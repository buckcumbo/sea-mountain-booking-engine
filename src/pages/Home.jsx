import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import AreaGrid from "@/components/home/AreaGrid";
import FeaturedRentals from "@/components/home/FeaturedRentals";

import NewRentals from "@/components/home/NewRentals";
import { Link } from "react-router-dom";
import { Receipt, MapPin, Tag } from "lucide-react";
import Seo from "@/components/Seo";
import { buildLocalBusinessJsonLd, DEFAULT_DESCRIPTION } from "@/lib/seo";
import { buildCalendarMap } from "@/lib/availability";
import { listingMatchesCollection } from "@/lib/collections";

function Section({ title, subtitle, viewAllTo, children }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy">{title}</h2>
          {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
        </div>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-sm text-coast-ocean hover:underline shrink-0 mt-1">
            View all →
          </Link>
        )}
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
  const [newest, setNewest] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});

  useEffect(() => {
    (async () => {
      const [all, days] = await Promise.all([
        base44.entities.Listing.list("-created_date", 100),
        base44.entities.CalendarDay.list("-created_date", 5000),
      ]);
      const f = all.filter((l) => listingMatchesCollection(l, "the-100-collection") && l.active !== false);
      setFeatured(f.slice(0, 4));
      setNewest(all.filter((l) => l.active !== false).slice(0, 4));
      setCalendarMap(buildCalendarMap(days));

    })();
  }, []);

  return (
    <div>
      <Seo
        title="Sea Mountain Vacations | North Myrtle Beach & Grand Strand Vacation Rentals"
        description={DEFAULT_DESCRIPTION}
        path="/"
        jsonLd={buildLocalBusinessJsonLd()}
      />
      <Hero />

      <Section title="Browse by Collection" subtitle="From oceanfront retreats to budget-friendly getaways, find the perfect fit.">
        <CollectionGrid />
      </Section>

      <Section title="Explore Our Areas" subtitle="Six distinct communities along the Grand Strand — each with its own coastal character.">
        <AreaGrid />
      </Section>

      <Section
        title="The 100 Collection™"
        subtitle="The 100 Collection independently evaluates vacation rentals, awarding its exclusive imprint to properties that deliver the highest standard of hospitality in each unique location. These Sea Mountain homes met that standard — they don't settle for less than 100%."
        viewAllTo="/collections/the-100-collection"
      >
        <FeaturedRentals listings={featured} calendarMap={calendarMap} />
      </Section>

      <Section title="New to the Collection" subtitle="The latest additions to our Grand Strand rentals.">
        <NewRentals listings={newest} calendarMap={calendarMap} />
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

      <Section title="What Our Guests Say" subtitle="Verified reviews from our recent guests.">
        <div className="w-full">
          <iframe
            src="https://embed.joinreva.com/widgets/959b0dfd-c95f-4730-9f81-522a32ad120e"
            loading="lazy"
            width="100%"
            height="1400"
            frameBorder="0"
            className="w-full block"
            style={{ border: 0, minHeight: 1400 }}
            title="Guest Reviews"
          />
        </div>
      </Section>
    </div>
  );
}