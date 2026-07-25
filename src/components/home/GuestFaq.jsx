import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How do I book a home?",
    a: "Book directly on any listing page — pick your dates, get an exact price, and reserve. Prefer to talk it through? Use the chat widget or call (843) 890-2094.",
  },
  {
    q: "Are pets allowed?",
    a: "Most of our homes are pet-friendly, but not all — each listing specifies. The pet fee is $150 and covers up to 2 pets for your whole stay, with no size or breed limits. Bringing 3 or more? Contact our team first.",
  },
  {
    q: "What's included in the rental fee?",
    a: "Utilities, high-speed WiFi, bed linens, towels, and every amenity listed on the property page. No hidden fees.",
  },
  {
    q: "How close is the beach?",
    a: "It varies by home — some are oceanfront, others a short walk or drive. Each listing shows its distance to the sand.",
  },
  {
    q: "What's the cancellation policy?",
    a: "Policies vary by property and season. You'll see the exact policy for your home before you book.",
  },
  {
    q: "Is there a minimum age to rent?",
    a: "Typically 25, though it may vary by property.",
  },
  {
    q: "Do you offer long-term stays?",
    a: "Yes — many of our homes are available for extended stays. Contact our team to set one up.",
  },
  {
    q: "Are linens and towels provided?",
    a: "Yes. Bed linens and towels are included in every home.",
  },
  {
    q: "Are there extra fees for amenities?",
    a: "Any fees are disclosed right on the listing — what you see is what you pay.",
  },
  {
    q: "What if something goes wrong during my stay?",
    a: "Our team is available 24/7. Call or message us and we'll make it right.",
  },
  {
    q: "What is there to do in the area?",
    a: "Check out our Things to Do guides — plus every stay comes with a custom guidebook for your area.",
  },
  {
    q: "Can I check in early or check out late?",
    a: "Sometimes. Early check-in can only be confirmed the day of arrival, and late check-out the day before departure. Standard check-in is 4 PM and check-out is 10 AM.",
  },
  {
    q: "How do I get into the home?",
    a: "Every home has a smart lock. Your door code — usually the last 4 digits of your phone number — is sent close to arrival.",
  },
];

export default function GuestFaq() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-14">
      <h2 className="font-heading text-2xl md:text-3xl font-semibold text-coast-navy mb-8">
        Frequently asked questions
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
  );
}