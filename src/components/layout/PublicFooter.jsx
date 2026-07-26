import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";
import { AREA_LABELS } from "@/lib/availability";
import { PHONE, PHONE_TEL, EMAIL, ADDRESS } from "@/lib/contact";
import HundredCollectionBadge from "@/components/layout/HundredCollectionBadge";
import { BRAND_LOGOS } from "@/lib/brand";

// Real profile URLs go here; empty string = icon doesn't render. No dead
// href="#" buttons on a live booking site.
const SOCIAL_LINKS = [
  { icon: Facebook, url: "", label: "Facebook" },
  { icon: Instagram, url: "", label: "Instagram" },
  { icon: Twitter, url: "", label: "Twitter" },
].filter((s) => s.url);

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="font-heading font-semibold mb-3">{title}</h3>
      <ul className="space-y-1 text-sm text-white/70">
        {links.map(({ to, label }) => (
          <li key={to}>
            {/* py-1.5 keeps rows comfortably tappable on phones */}
            <Link to={to} className="inline-block py-1 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PublicFooter() {
  const areas = Object.entries(AREA_LABELS);
  return (
    <footer className="bg-coast-navy text-white">
      <div className="max-w-7xl mx-auto px-6 pt-12 flex items-center justify-between gap-4 flex-wrap">
        <Link to="/" className="inline-block" aria-label="Sea Mountain Vacations home">
          <img
            src={BRAND_LOGOS.lockupWhite}
            alt="Sea Mountain Vacations"
            className="w-[144px] h-auto"
          />
        </Link>
        <HundredCollectionBadge source="SeaMountainFooter" />
      </div>

      {/* Two columns on phones (no mile-long stack), four on desktop. */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <FooterCol
          title="Explore"
          links={[
            { to: "/search", label: "Find a Rental" },
            { to: "/match", label: "Find Your Match" },
            { to: "/collections", label: "Collections" },
            { to: "/guides", label: "Things To Do" },
            { to: "/favorites", label: "Favorites" },
          ]}
        />
        <FooterCol
          title="Areas"
          links={areas.map(([slug, label]) => ({ to: `/area/${slug}`, label }))}
        />
        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/list-your-property", label: "List Your Property" },
            { to: "/my-trips", label: "My Trips" },
          ]}
        />

        {/* Contact spans the full row on phones so tap targets stay big. */}
        <div className="col-span-2 lg:col-span-1">
          <h3 className="font-heading font-semibold mb-3">Contact</h3>
          <div className="text-sm text-white/70 space-y-2.5">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {ADDRESS}
            </p>
            <p>
              <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-2 py-1 hover:text-white">
                <Phone className="w-4 h-4" /> {PHONE}
              </a>
            </p>
            <p>
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 py-1 hover:text-white break-all">
                <Mail className="w-4 h-4 shrink-0" /> {EMAIL}
              </a>
            </p>
          </div>
          {SOCIAL_LINKS.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              {SOCIAL_LINKS.map(({ icon: Icon, url, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legal lives in the bottom bar — two links don't earn a column. */}
      <div className="border-t border-white/10 py-4 px-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-white/50">
        <span>© {new Date().getFullYear()} Sea Mountain Vacations. All rights reserved.</span>
        <span className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-white/80">Privacy</Link>
          <Link to="/terms" className="hover:text-white/80">Terms</Link>
        </span>
      </div>
    </footer>
  );
}
