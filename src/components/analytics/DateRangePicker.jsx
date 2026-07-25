import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "custom", label: "Custom" },
];

export default function DateRangePicker({ preset, customStart, customEnd, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            variant={preset === p.key ? "default" : "outline"}
            size="sm"
            onClick={() => onChange({ preset: p.key })}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => onChange({ customStart: e.target.value })}
            className="w-auto h-8 text-sm"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => onChange({ customEnd: e.target.value })}
            className="w-auto h-8 text-sm"
          />
        </div>
      )}
    </div>
  );
}