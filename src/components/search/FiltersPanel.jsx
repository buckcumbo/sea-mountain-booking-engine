import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREA_LABELS, prettifyCollection } from "@/lib/availability";
import { FEATURE_FILTERS } from "@/lib/features";

const GUEST_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16];
const BED_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

export default function FiltersPanel({ filters, onChange, collections }) {
  const toggleCollection = (c) => {
    const has = filters.collections.includes(c);
    onChange({
      collections: has
        ? filters.collections.filter((x) => x !== c)
        : [...filters.collections, c],
    });
  };
  const toggleFeature = (key) => {
    const current = filters.features || [];
    const has = current.includes(key);
    onChange({
      features: has ? current.filter((x) => x !== key) : [...current, key],
    });
  };
  const budgetAny = filters.maxBudget >= 1000;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Search by name</Label>
        <Input
          type="search"
          placeholder="Know the home? Type its name"
          value={filters.query || ""}
          onChange={(e) => onChange({ query: e.target.value })}
          className="h-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Check-in</Label>
          <Input
            type="date"
            value={filters.checkIn}
            onChange={(e) => onChange({ checkIn: e.target.value })}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Check-out</Label>
          <Input
            type="date"
            value={filters.checkOut}
            min={filters.checkIn || undefined}
            onChange={(e) => onChange({ checkOut: e.target.value })}
            className="h-10"
          />
        </div>
      </div>

      {filters.checkIn && filters.checkOut && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Date flexibility</Label>
          <div className="flex gap-2">
            {[
              { v: 0, l: "Exact dates" },
              { v: 1, l: "± 1 day" },
              { v: 3, l: "± 3 days" },
            ].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ flexDays: v })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  (filters.flexDays || 0) === v
                    ? "bg-coast-navy text-white border-coast-navy"
                    : "bg-card text-coast-navy border-border hover:border-coast-ocean"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Guests</Label>
          <Select
            value={String(filters.guests)}
            onValueChange={(v) => onChange({ guests: Number(v) })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {GUEST_OPTIONS.map((g) => (
                <SelectItem key={g} value={String(g)}>
                  {g === 0 ? "Any" : `${g}+`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Area</Label>
          <Select value={filters.area} onValueChange={(v) => onChange({ area: v })}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {Object.entries(AREA_LABELS).map(([slug, label]) => (
                <SelectItem key={slug} value={slug}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Min bedrooms</Label>
        <Select
          value={String(filters.minBedrooms)}
          onValueChange={(v) => onChange({ minBedrooms: Number(v) })}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BED_OPTIONS.map((b) => (
              <SelectItem key={b} value={String(b)}>
                {b === 0 ? "Any" : `${b}+`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Top features</Label>
        <div className="flex flex-wrap gap-2">
          {FEATURE_FILTERS.map(({ key, label, icon: Icon }) => {
            const active = (filters.features || []).includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFeature(key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-coast-navy text-white border-coast-navy"
                    : "bg-card text-coast-navy border-border hover:border-coast-ocean"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Max nightly budget</Label>
        <div className="flex items-center gap-3">
          <Slider
            value={[filters.maxBudget]}
            min={100}
            max={1000}
            step={50}
            onValueChange={(v) => onChange({ maxBudget: v[0] })}
            className="flex-1"
          />
          <span className="text-sm font-medium text-coast-navy w-24 text-right">
            {budgetAny ? "Any price" : `≤ $${filters.maxBudget}`}
          </span>
        </div>
      </div>

      {collections.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Collections</Label>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => {
              const active = filters.collections.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCollection(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-coast-navy text-white border-coast-navy"
                      : "bg-card text-coast-navy border-border hover:border-coast-ocean"
                  }`}
                >
                  {prettifyCollection(c)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}