import React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Calendar,
  Wrench,
  Users,
  BarChart3,
  Link2,
  MapPin,
  ClipboardCheck,
  Sparkles,
  Home,
  Palette,
  Search,
  Star,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Seo from "@/components/Seo";

const EARNING_POINTS = [
  {
    icon: TrendingUp,
    title: "Smart pricing for maximum revenue",
    text: "Nightly rates optimized to market demand.",
  },
  {
    icon: Calendar,
    title: "More bookings, less vacancy",
    text: "Higher occupancy means more consistent income.",
  },
  {
    icon: Wrench,
    title: "Full-service management",
    text: "We handle everything from guest support to maintenance.",
  },
];

const TRUST_POINTS = [
  {
    icon: Users,
    title: "Backed by proven operators",
    text: "Advisors who built multi-billion-dollar hospitality, tech and real estate brands.",
  },
  {
    icon: BarChart3,
    title: "Data-driven revenue strategies",
    text: "Market analytics and pricing algorithms keep your rates competitive.",
  },
  {
    icon: Link2,
    title: "Exclusive partnerships",
    text: "Direct relationships with top booking platforms and tech providers.",
  },
  {
    icon: MapPin,
    title: "Hyper-local, globally informed",
    text: "Deep knowledge of North Myrtle Beach and the Grand Strand combined with global industry expertise.",
  },
];

const SERVICES = [
  {
    icon: ClipboardCheck,
    title: "Comprehensive management",
    text: "Hands-free passive income: we take care of everything from guest bookings to maintenance.",
  },
  {
    icon: Sparkles,
    title: "Immaculate property care",
    text: "Five-star cleanliness and guest-ready perfection, from fresh linens to pristine interiors.",
  },
  {
    icon: Wrench,
    title: "Proactive property upkeep",
    text: "Landscaping to pool care, keeping your property premium and guest-ready year-round.",
  },
  {
    icon: Home,
    title: "Turnkey property setup",
    text: "Furnishings, decor and full staging so your home is rent-ready from day one.",
  },
  {
    icon: Palette,
    title: "Renovations & interior design",
    text: "Our in-house team upgrades and styles your property to be aesthetically stunning and highly rentable.",
  },
];

const EXPERTISE = [
  {
    icon: Search,
    title: "In-depth property analysis",
    text: "We evaluate location, design potential and market fit, then provide a customized strategy.",
  },
  {
    icon: Star,
    title: "Guest experience optimization",
    text: "Seamless check-ins, five-star cleanliness and personalized communication that lead to higher reviews.",
  },
  {
    icon: Settings,
    title: "Full-service management",
    text: "Dynamic pricing, high-converting listings, maintenance, cleaning and 24/7 guest support.",
  },
];

const FAQS = [
  {
    q: "Why should I choose Sea Mountain Vacations over other property management companies?",
    a: "With our deep-rooted local expertise in the North Myrtle Beach area and our comprehensive suite of services from property acquisition to management, we offer a truly turnkey solution. Our dedication is reflected in our 2,500+ 5-star reviews across all booking platforms, ensuring your property achieves its fullest potential.",
  },
  {
    q: "What percentage do you charge for managing my property?",
    a: "Our fees are competitive and tailored to the range and depth of services you require. For a detailed quote and to understand how we can maximize your ROI, please reach out to our team.",
  },
  {
    q: "How do you ensure the quality of guests?",
    a: "We conduct a meticulous vetting process for all our guests to ensure a respectful and hassle-free rental experience for your property.",
  },
  {
    q: "Do I have to commit for a certain period if I sign up with you?",
    a: "We offer various contract options tailored to your needs. Our primary goal is to ensure flexibility and comfort for our property owners.",
  },
  {
    q: "Can I use my property for personal vacations?",
    a: "Absolutely! It's your property, and we'll coordinate with you to ensure it's available for your personal use when you desire. Just give us a heads-up in advance.",
  },
  {
    q: "How do you handle maintenance and unexpected repairs?",
    a: "We have a dedicated team for regular maintenance and any unexpected issues. With services like yard care and pool cleaning, we ensure your property is always in top condition. Any significant repairs or expenses will be communicated and approved by you before we proceed.",
  },
  {
    q: "I'm interested in buying or selling a vacation rental. How can you assist me?",
    a: "We have a network of industry-leading agents and partners who specialize in vacation rentals. Whether you're buying or selling, our experts ensure you get the best value and make informed decisions.",
  },
  {
    q: "I want to renovate my property. Can you handle that?",
    a: "Yes, we offer both interior design and renovation services. Our in-house team focuses on combining aesthetics with functionality, ensuring your property stands out in the vacation rental market.",
  },
  {
    q: "How do you determine the rental price for my property?",
    a: "We utilize data-driven strategies, considering factors like property location, size, amenities, and current market demand in the North Myrtle Beach area. Our aim is always to maximize your returns.",
  },
  {
    q: "What happens if my property is damaged by a guest?",
    a: "We take property damage seriously. Our vetting process reduces such risks, but in the rare event of damage, we'll assess the situation, communicate with you, and ensure appropriate steps are taken, including using security deposits if necessary.",
  },
];

export default function ListYourProperty() {
  return (
    <div>
      <Seo
        title="List Your Property | Sea Mountain Vacations"
        description="Unlock the full potential of your vacation rental. Higher revenue, seamless management, and industry-leading expertise from Sea Mountain Vacations."
        path="/list-your-property"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-white">
          <h1 className="font-heading text-3xl md:text-5xl font-semibold max-w-3xl leading-tight">
            Unlock the full potential of your vacation rental
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Higher revenue. Seamless management. Industry-leading expertise.
          </p>
          <Button asChild className="mt-6 bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            <a href="#cta">Get a free revenue analysis</a>
          </Button>
        </div>
      </section>

      {/* Section 1 — Earning potential */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy max-w-2xl">
          How much more could your property be earning?
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Owners earn up to 50% more with our expert revenue strategies and data-driven pricing.
        </p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {EARNING_POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6">
              <div className="w-11 h-11 rounded-full bg-coast-sand text-coast-ocean flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 — Why homeowners trust us */}
      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
            Why homeowners trust Sea Mountain Vacations
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 flex gap-4">
                <div className="w-11 h-11 rounded-full bg-coast-foam text-coast-ocean flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Services grid */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
          What we handle for you
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6">
              <div className="w-11 h-11 rounded-full bg-coast-sand text-coast-ocean flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Your property, our expertise */}
      <section className="bg-coast-sand">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
            Your property, our expertise
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {EXPERTISE.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-11 h-11 rounded-full bg-coast-foam text-coast-ocean flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-coast-navy">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
          Your questions, answered
        </h2>
        <Accordion type="single" collapsible className="bg-card border border-border rounded-2xl px-6">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="font-heading text-coast-navy">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Closing CTA */}
      <section id="cta" className="bg-coast-navy scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-white">
          <h2 className="font-heading text-2xl md:text-4xl font-semibold">
            Ready to earn more with less effort?
          </h2>
          <p className="mt-4 text-white/85">
            Property owners with Sea Mountain have increased revenue by 30-50%.
          </p>
          <Button asChild className="mt-6 bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            <Link to="/contact">Get a free revenue analysis</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}