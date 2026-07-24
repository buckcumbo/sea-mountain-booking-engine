import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import InquiryForm from "@/components/forms/InquiryForm";

export default function Contact() {
  return (
    <div>
      <section className="relative overflow-hidden bg-coast-navy">
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />
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
                <span className="text-muted-foreground">123 Ocean Boulevard, North Myrtle Beach, SC 29582</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-coast-ocean" />
                <a href="tel:8435550100" className="text-muted-foreground hover:text-coast-navy">(843) 555-0100</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-coast-ocean" />
                <a href="mailto:stay@seamountainvacations.com" className="text-muted-foreground hover:text-coast-navy">
                  stay@seamountainvacations.com
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
    </div>
  );
}