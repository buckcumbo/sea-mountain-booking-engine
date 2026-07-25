import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

// Amenities editor with add, remove, and hide/show (without deleting).
// Hidden amenities stay in the amenities array but are tracked in
// amenitiesHidden so they can be excluded from the public page.
export default function AmenitiesEditor({ amenities = [], amenitiesHidden = [], onChange }) {
  const [input, setInput] = useState("");
  const hiddenSet = new Set(amenitiesHidden);

  const add = () => {
    const v = input.trim();
    if (v && !amenities.includes(v)) {
      onChange([...amenities, v], amenitiesHidden);
    }
    setInput("");
  };

  const remove = (i) => {
    const removed = amenities[i];
    onChange(
      amenities.filter((_, idx) => idx !== i),
      amenitiesHidden.filter((a) => a !== removed)
    );
  };

  const toggleHidden = (amenity) => {
    if (hiddenSet.has(amenity)) {
      onChange(amenities, amenitiesHidden.filter((a) => a !== amenity));
    } else {
      onChange(amenities, [...amenitiesHidden, amenity]);
    }
  };

  return (
    <div className="space-y-2">
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map((a, i) => {
            const isHidden = hiddenSet.has(a);
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-xs border rounded-full pl-2.5 pr-1 py-1 ${
                  isHidden
                    ? "bg-muted/40 text-muted-foreground/50 border-border line-through"
                    : "bg-muted border-border"
                }`}
              >
                {a}
                <button
                  type="button"
                  onClick={() => toggleHidden(a)}
                  className="hover:text-coast-ocean"
                  aria-label={isHidden ? `Show ${a}` : `Hide ${a}`}
                  title={isHidden ? "Show on public page" : "Hide from public page"}
                >
                  {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="hover:text-destructive"
                  aria-label={`Remove ${a}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="Add amenity and press Enter"
      />
      <p className="text-xs text-muted-foreground">
        Click the eye icon to hide an amenity from the public page without deleting it.
      </p>
    </div>
  );
}