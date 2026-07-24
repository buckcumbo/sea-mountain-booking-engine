import React from "react";
import { Link } from "react-router-dom";
import { Heart, Crown, Workflow, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUES = [
  { icon: Heart, title: "Local & Family-Run", text: "A Grand Strand family behind every stay — not a faceless management company." },
  { icon: Crown, title: "The 100 Collection Standard", text: "Every home meets our premier standard for quality, cleanliness, and comfort." },
  { icon: Workflow, title: "Guesty-Powered Operations", text: "A modern booking engine keeps calendars synced and guests cared for." },
  { icon: Users, title: "An On-the-Ground Team", text: "Local staff on call throughout your stay — help is never far away." },
];

export default function About() {
  return (
    <div>
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold">About Sea Mountain Vacations</h1>
          <p className="mt-3 text-white/85 max-w-2xl">A local, family-run vacation rental manager on the Grand Strand.</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-14">
        <div className="space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Sea Mountain Vacations is a local, family-run vacation rental manager based on the Grand
            Strand of South Carolina. For us, this coast isn't a market — it's home. We started with a
            handful of family homes and grew into a curated collection of rentals across North Myrtle
            Beach, Myrtle Beach, Surfside, Garden City, Murrells Inlet, and Pawleys Island.
          </p>
          <p>
            Every home in our program is held to the 100 Collection standard — our premier benchmark for
            quality, comfort, and cleanliness. It's the bar our own family homes are held to, and it's the
            bar every property in our collection meets. When you book with Sea Mountain, you're staying in
            a home we'd happily put our own name on.
          </p>
          <p>
            Behind the scenes, our operations are powered by Guesty — a modern booking engine that keeps
            calendars synced across channels, automates the busywork, and lets our local team focus on
            what matters: caring for homes and looking after guests. It's the technology of a big manager
            with the heart of a family business.
          </p>
        </div>
        <p className="text-xs text-muted-foreground italic mt-6">[Placeholder copy — Buck will refine.]</p>
      </section>

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <div className="w-11 h-11 rounded-full bg-white text-coast-ocean flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="rounded-2xl bg-gradient-to-br from-coast-ocean to-coast-navy aspect-[16/7] flex items-center justify-center text-white/70 text-sm">
          [ Team photo placeholder ]
        </div>
      </section>

      <section className="bg-coast-navy">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-5 text-white">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Plan your Grand Strand getaway</h2>
            <p className="text-white/80 mt-1">Browse our rentals — or list your own with us.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-white text-coast-navy hover:bg-white/90">
              <Link to="/search">Find a Rental <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link to="/list-your-property">List Your Property</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}