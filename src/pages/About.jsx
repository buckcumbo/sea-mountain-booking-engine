import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Crown, BarChart3, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";

const ADVANTAGES = [
  {
    icon: MapPin,
    text: "Founded by locals who know the Grand Strand inside and out.",
  },
  {
    icon: Crown,
    text: "Backed by industry leaders who built multi-billion-dollar hospitality brands.",
  },
  {
    icon: BarChart3,
    text: "Driven by real-time analytics and cutting-edge technology to maximize revenue.",
  },
  {
    icon: Star,
    text: "Supported by 2,500+ five-star reviews across all major booking platforms.",
  },
];

const EXPECTATIONS = [
  {
    title: "Uncompromising quality",
    text: "You deserve more than just a place to stay. Every property in our portfolio blends comfort with premium amenities, impeccable cleanliness, and a seamless stay.",
  },
  {
    title: "Commitment to service",
    text: "Your peace of mind is our top priority. Proactive service that goes beyond expectations, flawless guest experiences and maximized homeowner returns.",
  },
  {
    title: "Transparency & trust",
    text: "No hidden fees, no guesswork, no runaround. Clear pricing and open communication.",
  },
];

export default function About() {
  return (
    <div>
      <Seo
        title="About | Sea Mountain Vacations"
        description="Expertly managed, locally rooted, and designed for you. Sea Mountain Vacations delivers seamless guest stays and maximized homeowner returns on the Grand Strand."
        path="/about"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold max-w-3xl leading-tight">
            Your dream vacation, made simple.
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Expertly managed. Locally rooted. Designed for you.
          </p>
        </div>
      </section>

      {/* Intro with guest/homeowner split */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="max-w-3xl">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy">
            Your vacation, elevated. Your property, maximized.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            At Sea Mountain Vacations we believe vacations should be seamless and stress-free, not filled
            with hidden fees, check-in headaches, and unpredictable stays, and homeowners should feel
            confident their investment is in expert hands, not just another listing in a crowded market.
            That's why we do things differently.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-heading text-lg font-semibold text-coast-navy">For guests</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              We curate exceptional coastal stays with high-end amenities, local expertise, and a seamless
              experience so you can focus on making memories.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-heading text-lg font-semibold text-coast-navy">For homeowners</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              We turn properties into high-performing passive income businesses, powered by industry
              expertise, data-driven pricing, and exclusive partnerships.
            </p>
          </div>
        </div>
      </section>

      {/* Our advantage */}
      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
            Our advantage
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {ADVANTAGES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-white text-coast-ocean flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-coast-navy pt-1.5">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-muted-foreground max-w-3xl leading-relaxed">
            We aren't just another property management company — we're partners in your success, whether
            you're booking a dream vacation or optimizing your rental income.
          </p>
        </div>
      </section>

      {/* What you can expect */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
          What you can expect when you stay or partner with us
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {EXPECTATIONS.map(({ title, text }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-coast-navy">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-5 text-white">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Plan your Grand Strand getaway</h2>
            <p className="text-white/80 mt-1">Browse our rentals — or list your own with us.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-white text-coast-navy hover:bg-white/90">
              <Link to="/search">Find a rental <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link to="/list-your-property">List your property</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}