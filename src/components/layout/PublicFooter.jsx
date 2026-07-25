import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";
import { AREA_LABELS } from "@/lib/availability";
import { PHONE, PHONE_TEL, EMAIL, ADDRESS } from "@/lib/contact";
import HundredCollectionBadge from "@/components/layout/HundredCollectionBadge";
import { BRAND_LOGOS } from "@/lib/brand";

export default function PublicFooter() {
  const areas = Object.entries(AREA_LABELS);
  return (
    <footer className="bg-coast-navy text-white">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <Link to="/" className="inline-block" aria-label="Sea Mountain Vacations — home">
          <img
            src={BRAND_LOGOS.lockupWhite}
            alt="Sea Mountain Vacations"
            className="w-[144px] h-auto"
          />
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="font-heading font-semibold mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/search" className="hover:text-white">Find a Rental</Link></li>
            {areas.map(([slug, label]) => (
              <li key={slug}>
                <Link to={`/area/${slug}`} className="hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/list-your-property" className="hover:text-white">List Your Property</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading font-semibold mb-3">Contact</h3>
          <div className="text-sm text-white/70 space-y-2">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {ADDRESS}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> <a href={`tel:${PHONE_TEL}`} className="hover:text-white">{PHONE}</a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> <a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a>
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Social link"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <div className="mt-4">
            <HundredCollectionBadge source="SeaMountainFooter" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Sea Mountain Vacations. All rights reserved.
      </div>
    </footer>
  );
}