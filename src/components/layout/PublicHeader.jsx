import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AREA_LABELS } from "@/lib/availability";

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const areas = Object.entries(AREA_LABELS);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-heading text-lg font-bold text-coast-navy">
          Sea Mountain <span className="text-coast-ocean">Vacations</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-coast-navy">
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
          <Link to="/list-your-property" className="hover:text-coast-ocean">List Your Property</Link>
        </nav>

        <div className="flex items-center gap-3">
          <a href="tel:8435550100" className="hidden md:inline-flex items-center gap-1.5 text-sm text-coast-navy">
            <Phone className="w-4 h-4" /> (843) 555-0100
          </a>
          <Button asChild className="bg-coast-navy hover:bg-coast-navy-soft text-white">
            <Link to="/search">Book Now</Link>
          </Button>
          <button
            className="lg:hidden p-2 text-coast-navy"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white px-6 py-4 space-y-3 text-sm font-medium text-coast-navy">
          <Link to="/search" onClick={close} className="block">Find a Rental</Link>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Areas</div>
            <div className="grid grid-cols-2 gap-1">
              {areas.map(([slug, label]) => (
                <Link key={slug} to={`/area/${slug}`} onClick={close} className="block py-0.5">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/guides" onClick={close} className="block">Things To Do</Link>
          <Link to="/list-your-property" onClick={close} className="block">List Your Property</Link>
          <a href="tel:8435550100" className="inline-flex items-center gap-1.5 pt-1">
            <Phone className="w-4 h-4" /> (843) 555-0100
          </a>
        </div>
      )}
    </header>
  );
}