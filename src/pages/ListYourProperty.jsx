import React from "react";
import { TrendingUp, Sparkles, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryForm from "@/components/forms/InquiryForm";
import Seo from "@/components/Seo";

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Revenue management that works",
    text: "Dynamic pricing and occupancy optimization tuned to the Grand Strand market — so your home earns more, season after season.",
  },
  {
    icon: Sparkles,
    title: "Care & cleaning, handled",
    text: "Our on-the-ground ops team manages turnovers, maintenance, and guest issues — your home is cared for like it's our own.",
  },
  {
    icon: Megaphone,
    title: "Direct-booking marketing",
    text: "A polished listing on our direct-booking site plus the major channels — no booking fees on direct reservations.",
  },
];

const STEPS = [
  { n: 1, title: "Tell us about your property", text: "Share your address and a few details — we'll review and reach out within one business day." },
  { n: 2, title: "Get a rental projection", text: "We'll prepare a tailored revenue projection and onboarding plan for your home." },
  { n: 3, title: "We list & manage", text: "Once you approve, we handle photography, listing, pricing, cleaning, and guest communication end to end." },
];

export default function ListYourProperty() {
  return (
    <div>
      <Seo
        title="List Your Property | Sea Mountain Vacations"
        description="Grand Strand property management that pays for itself — local, family-run, and obsessed with occupancy. Get a free rental projection."
        path="/list-your-property"
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold max-w-3xl leading-tight">
            Grand Strand Property Management That Pays For Itself
          </h1>
          <p className="mt-4 text-white/85 max-w-2xl">
            Local, family-run, and obsessed with occupancy. Let us turn your coastal home into a
            worry-free income property.
          </p>
          <Button asChild className="mt-6 bg-white text-coast-navy hover:bg-white/90">
            <a href="#inquiry">Get a Free Projection</a>
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-6">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-card border border-border rounded-2xl p-6">
            <div className="w-11 h-11 rounded-full bg-coast-sand text-coast-ocean flex items-center justify-center mb-4">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{text}</p>
          </div>
        ))}
      </section>

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="font-heading text-2xl font-semibold text-coast-navy mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, text }) => (
              <div key={n} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-9 h-9 rounded-full bg-coast-navy text-white flex items-center justify-center font-heading font-semibold mb-4">
                  {n}
                </div>
                <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="inquiry" className="max-w-3xl mx-auto px-6 py-16 scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy">
            Tell us about your property
          </h2>
          <p className="text-muted-foreground mt-2">
            Fill out the form and we'll be in touch within one business day.
          </p>
        </div>
        <InquiryForm type="property-management" showPropertyAddress submitLabel="Request a Projection" />
      </section>
    </div>
  );
}