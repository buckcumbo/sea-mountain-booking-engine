import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(0);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-coast-navy">
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover fade-in"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-coast-navy/50 via-coast-navy/40 to-coast-navy/75" />
      <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 text-white">
        <h1 className="font-heading text-3xl md:text-5xl font-semibold max-w-3xl leading-tight">
          Vacation Rentals in North Myrtle Beach &amp; the Grand Strand
        </h1>
        <p className="mt-4 text-white/85 max-w-xl">
          Stay in one of our 100 Collection homes along the South Carolina coast: oceanfront,
          channel, and poolside escapes managed by a local on-the-ground team.
        </p>
        <form
          onSubmit={submit}
          className="mt-8 bg-white rounded-2xl shadow-xl p-3 flex flex-col md:flex-row md:items-end gap-3 max-w-3xl"
        >
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-muted-foreground">Check-in</label>
            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-11" />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-muted-foreground">Check-out</label>
            <Input
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(e) => setCheckOut(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-muted-foreground">Guests</label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="0">Any</option>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((g) => (
                <option key={g} value={g}>{g}+</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="h-11 px-6 bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            <SearchIcon className="w-4 h-4 mr-1.5" /> Search
          </Button>
        </form>
      </div>
    </section>
  );
}