import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TagInput({ tags = [], onChange, placeholder = "Type and press Enter" }) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };

  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs bg-muted border border-border rounded-full pl-2.5 pr-1 py-1"
            >
              {t}
              <button
                type="button"
                onClick={() => remove(i)}
                className="hover:text-destructive"
                aria-label={`Remove ${t}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
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
        placeholder={placeholder}
      />
    </div>
  );
}