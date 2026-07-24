import React from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-coast-navy mb-2">{title}</h2>
      <p className="text-muted-foreground leading-relaxed">{children}</p>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Seo title="Privacy | Sea Mountain Vacations" path="/privacy" />
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-coast-navy mb-3">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: [TODO — Buck to set date]</p>
      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <Section title="Information We Collect">
          [TODO: Describe the personal information Sea Mountain Vacations collects — names, email,
          phone, booking details, and payment information handled via our payment processor.]
        </Section>
        <Section title="How We Use Your Information">
          [TODO: Describe how collected information is used — to process reservations, send booking
          confirmations, respond to inquiries, and improve our services.]
        </Section>
        <Section title="Sharing of Information">
          [TODO: Describe third parties with whom information is shared — payment processors, property
          management systems (Guesty), and service providers — and confirm we do not sell personal
          information.]
        </Section>
        <Section title="Data Retention &amp; Security">
          [TODO: Describe how long data is retained and the security measures in place.]
        </Section>
        <Section title="Your Rights">
          [TODO: Describe user rights regarding their personal data — access, correction, deletion — and
          how to exercise them.]
        </Section>
        <Section title="Contact">
          Questions about this policy?{" "}
          <Link to="/contact" className="text-coast-ocean hover:underline">Contact us</Link>.
        </Section>
      </div>
    </div>
  );
}