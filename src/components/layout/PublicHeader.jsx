import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Phone,
  Heart,
  Search,
  MapPin,
  Layers,
  Compass,
  CalendarDays,
  Sparkles,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AREA_LABELS } from "@/lib/availability";
import { PHONE, PHONE_TEL } from "@/lib/contact";
import { useFavorites } from "@/lib/FavoritesContext";
import { useAuth } from "@/lib/AuthContext";
import HundredCollectionBadge from "@/components/layout/HundredCollectionBadge";
import { BRAND_LOGOS } from "@/lib/brand";

// One tappable row of the mobile menu: icon + label + chevron, 44px min
// height so thumbs never miss.
function MobileRow({ to, icon: Icon, label, badge, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between py-3 active:bg-white/5 rounded-lg px-2 -mx-2"
    >
      <span className="flex items-center gap-3">
        <Icon className="w-[18px] h-[18px] text-coast-ocean" />
        {label}
        {badge > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-coast-sunset text-white text-[11px] font-semibold inline-flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      <ChevronRight className="w-4 h-4 text-white/30" />
    </Link>
  );
}

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const close = () => {
    setMobileOpen(false);
    setAreasOpen(false);
  };
  const areas = Object.entries(AREA_LABELS);
  const { count } = useFavorites();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-coast-navy text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center shrink-0" aria-label="Sea Mountain Vacations home">
          {/* Mark only — the wordmark is illegible at header size, and the
              bare mark reads bigger and cleaner. Full lockup lives in the footer. */}
          <img
            src={BRAND_LOGOS.markWhite}
            alt="Sea Mountain Vacations"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white">
          <Link to="/search" className="hover:text-coast-ocean">Find a Rental</Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 hover:text-coast-ocean outline-none">
              Areas <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {areas.map(([slug, label]) => (
                <DropdownMenuItem key={slug} asChild>
                  <Link to={`/area/${slug}`}>{label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/guides" className="hover:text-coast-ocean">Things To Do</Link>
          {isAuthenticated && <Link to="/my-trips" className="hover:text-coast-ocean">My Trips</Link>}
          <Link to="/list-your-property" className="hover:text-coast-ocean">List Your Property</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/favorites" className="relative p-2 text-white hover:text-coast-ocean" aria-label="Favorites">
            <Heart className={`w-5 h-5 ${count > 0 ? "fill-red-500 text-red-500" : ""}`} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-coast-ocean text-white text-[10px] font-semibold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <div className="hidden lg:flex items-center gap-3">
            <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-1.5 text-sm text-white">
              <Phone className="w-4 h-4" /> {PHONE}
            </a>
            <HundredCollectionBadge source="SeaMountainHeader" />
          </div>
          <Button asChild className="bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            <Link to="/search">Book Now</Link>
          </Button>
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-coast-navy px-6 pt-2 pb-6 text-[15px] font-medium text-white max-h-[calc(100dvh-72px)] overflow-y-auto">
          {/* Guest journey first: search, match, saved homes, trips. */}
          <nav aria-label="Mobile">
            <MobileRow to="/search" icon={Search} label="Find a Rental" onClick={close} />
            <MobileRow to="/match" icon={Sparkles} label="Find Your Match" onClick={close} />
            <MobileRow to="/favorites" icon={Heart} label="Favorites" badge={count} onClick={close} />
            {isAuthenticated && (
              <MobileRow to="/my-trips" icon={CalendarDays} label="My Trips" onClick={close} />
            )}

            {/* Areas collapse behind one row instead of eating half the menu. */}
            <button
              onClick={() => setAreasOpen((v) => !v)}
              aria-expanded={areasOpen}
              className="w-full flex items-center justify-between py-3 active:bg-white/5 rounded-lg px-2 -mx-2"
            >
              <span className="flex items-center gap-3">
                <MapPin className="w-[18px] h-[18px] text-coast-ocean" />
                Explore Areas
              </span>
              <ChevronDown
                className={`w-4 h-4 text-white/30 transition-transform ${areasOpen ? "rotate-180" : ""}`}
              />
            </button>
            {areasOpen && (
              <div className="pb-1">
                {areas.map(([slug, label]) => (
                  <Link
                    key={slug}
                    to={`/area/${slug}`}
                    onClick={close}
                    className="block py-2.5 pl-11 pr-2 text-white/85 active:bg-white/5 rounded-lg"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            <MobileRow to="/collections" icon={Layers} label="Collections" onClick={close} />
            <MobileRow to="/guides" icon={Compass} label="Things To Do" onClick={close} />
          </nav>

          {/* Secondary + contact, visually separated from the guest journey. */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <Link
              to="/list-your-property"
              onClick={close}
              className="flex items-center gap-3 py-2.5 px-2 -mx-2 text-sm text-white/70 active:bg-white/5 rounded-lg"
            >
              <Building2 className="w-[18px] h-[18px]" /> List Your Property
            </Link>
            <a
              href={`tel:${PHONE_TEL}`}
              className="mt-3 flex items-center justify-center gap-2 h-12 rounded-xl border border-white/25 text-sm font-semibold active:bg-white/10"
            >
              <Phone className="w-4 h-4" /> Call {PHONE}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}