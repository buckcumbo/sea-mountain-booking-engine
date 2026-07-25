import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Tag, CalendarCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import InquiryForm from "@/components/forms/InquiryForm";
import Seo from "@/components/Seo";
import { buildLocalBusinessJsonLd } from "@/lib/seo";
import { PHONE, PHONE_TEL, EMAIL, ADDRESS } from "@/lib/contact";
import HeroBackground from "@/components/HeroBackground";
import { useSiteImage } from "@/hooks/useSiteImageMap";

const DIRECT_BENEFITS = [
  {
    icon: Tag,
    title: "Best rates",
    text: "Our direct prices are the lowest you'll find for our homes.",
  },
  {
    icon: CalendarCheck,
    title: "Priority access",
    text: "First pick of dates, upgrades, and early check-in requests.",
  },
  {
    icon: Users,
    title: "Personal service",
    text: "A local team that knows every home: before, during, and after your stay.",
  },
];

export default function Contact() {
  const heroImage = useSiteImage("hero:contact");
  return (
    <div>
      <Seo
        title="Contact | Sea Mountain Vacations"
        description="Questions about a stay, a booking, or a property? Our Grand Strand team is here to help."
        path="/contact"
        jsonLd={buildLocalBusinessJsonLd()}
      />
      <section className="relative overflow-hidden bg-coast-navy">
        <HeroBackground image={heroImage} />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold">Contact Us</h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            Questions about a stay, a booking, or a property? Our Grand Strand team is here to help.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-coast-navy mb-3">Get in touch</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-coast-ocean shrink-0" />
                <span className="text-muted-foreground">{ADDRESS}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-coast-ocean" />
                <a href={`tel:${PHONE_TEL}`} className="text-muted-foreground hover:text-coast-navy">{PHONE}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-coast-ocean" />
                <a href={`mailto:${EMAIL}`} className="text-muted-foreground hover:text-coast-navy">
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-coast-sand p-5 text-sm text-muted-foreground">
            <p className="font-medium text-coast-navy">Office hours</p>
            <p className="mt-1">Monday–Sunday, 8:00 AM – 6:00 PM ET</p>
            <p className="mt-1">After-hours support available for in-stay guests.</p>
          </div>
        </div>
        <InquiryForm type="contact" submitLabel="Send Message" />
      </section>

      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-3">
            Why book direct
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Booking directly with us gets you the best rates on every home, with no third-party fees.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {DIRECT_BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-11 h-11 rounded-full bg-white text-coast-ocean flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{text}</p>
              </div>
            ))}
          </div>
          <Button asChild className="mt-8 bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            <Link to="/search">Find a rental</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}