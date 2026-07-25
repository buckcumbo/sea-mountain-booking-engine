import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, AlertTriangle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PhotoManager({ photos = [], onChange }) {
  const [newUrl, setNewUrl] = useState("");
  const [broken, setBroken] = useState(() => new Set());

  const move = (i, dir) => {
    const next = [...photos];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (i) => onChange(photos.filter((_, idx) => idx !== i));

  const updateCaption = (i, caption) =>
    onChange(photos.map((p, idx) => (idx === i ? { ...p, caption } : p)));

  const add = () => {
    const url = newUrl.trim();
    if (!url) return;
    onChange([...photos, { url, caption: "", order: photos.length }]);
    setNewUrl("");
  };

  const markBroken = (url, isBroken) => {
    setBroken((prev) => {
      const next = new Set(prev);
      if (isBroken) next.add(url);
      else next.delete(url);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No photos yet. Add an image URL below.</p>
      )}
      <div className="space-y-3">
        {photos.map((p, i) => {
          const isBroken = broken.has(p.url);
          return (
            <div
              key={i}
              className={`flex gap-3 items-start bg-card border rounded-xl p-3 ${
                isBroken ? "border-destructive/50" : "border-border"
              }`}
            >
              <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={p.url}
                  alt={p.caption || ""}
                  className="w-full h-full object-cover"
                  onError={() => markBroken(p.url, true)}
                  onLoad={() => markBroken(p.url, false)}
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 text-[10px] font-semibold bg-coast-navy text-white px-1.5 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5" /> HERO
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {isBroken && (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3" /> Image failed to load — check the URL
                  </div>
                )}
                <Input
                  value={p.caption || ""}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Caption (optional)"
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground truncate">{p.url}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  className="p-1.5 hover:bg-muted rounded disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded"
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Paste image URL…"
        />
        <Button type="button" onClick={add} variant="outline" className="shrink-0">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
    </div>
  );
}