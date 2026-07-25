import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SleepsWhereEditor({ items = [], onChange }) {
  const update = (i, field, value) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { room: "", beds: "" }]);

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={it.room || ""}
            onChange={(e) => update(i, "room", e.target.value)}
            placeholder="Room (e.g. Master bedroom)"
            className="h-9"
          />
          <Input
            value={it.beds || ""}
            onChange={(e) => update(i, "beds", e.target.value)}
            placeholder="Beds (e.g. King + Twin)"
            className="h-9"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded shrink-0"
            aria-label="Remove row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" onClick={add} variant="outline" size="sm">
        <Plus className="w-4 h-4" /> Add room
      </Button>
    </div>
  );
}