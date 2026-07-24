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

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Seo title="Terms | Sea Mountain Vacations" path="/terms" />
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-coast-navy mb-3">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: [TODO — Buck to set date]</p>
      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <Section title="Acceptance of Terms">
          [TODO: Describe that by accessing the site or booking a reservation, the guest agrees to these
          terms.]
        </Section>
        <Section title="Reservations &amp; Payment">
          [TODO: Describe booking process, deposit and balance due dates, accepted payment methods, and
          cancellation/refund policy.]
        </Section>
        <Section title="Check-in &amp; House Rules">
          [TODO: Describe check-in/check-out times, occupancy limits, pet policy, and property-specific
          house rules.]
        </Section>
        <Section title="Cancellations &amp; Refunds">
          [TODO: Describe the cancellation window, refund schedule, and any non-refundable fees.]
        </Section>
        <Section title="Liability &amp; Damages">
          [TODO: Describe guest responsibility for property damage, the security deposit, and limitation
          of liability.]
        </Section>
        <Section title="Contact">
          Questions about these terms?{" "}
          <Link to="/contact" className="text-coast-ocean hover:underline">Contact us</Link>.
        </Section>
      </div>
    </div>
  );
}