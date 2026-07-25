import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, ImageOff, HardDrive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

// Browse image files in the connected Google Drive and import a selection.
// Import happens server-side (driveImages backend function) which re-uploads
// each file to Base44 storage and returns permanent URLs via onImported.

export default function DrivePickerDialog({ open, onOpenChange, onImported }) {
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState("");

  const load = useCallback(async (searchTerm, pageToken) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("driveImages", {
        op: "list",
        search: searchTerm || undefined,
        pageToken: pageToken || undefined,
      });
      const data = res.data || {};
      setFiles((prev) => (pageToken ? [...prev, ...(data.files || [])] : data.files || []));
      setNextPageToken(data.nextPageToken || null);
    } catch {
      setError("Could not browse Google Drive.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setSearch("");
      load("");
    }
  }, [open, load]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      return next;
    });
  };

  const doImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("driveImages", {
        op: "import",
        fileIds: Array.from(selected),
      });
      const { imported = [], failed = [] } = res.data || {};
      if (imported.length > 0) onImported(imported);
      if (failed.length > 0) {
        setError(`${failed.length} file(s) could not be imported.`);
      } else {
        onOpenChange(false);
      }
    } catch {
      setError("Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-coast-navy">
            <HardDrive className="w-4 h-4" /> Import from Google Drive
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(search);
          }}
          className="flex gap-2"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images by file name..."
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Search">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="max-h-[50vh] overflow-y-auto">
          {loading && files.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <ImageOff className="w-6 h-6" />
              <p className="text-sm">No images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {files.map((f) => {
                const isSelected = selected.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={`relative rounded-lg overflow-hidden border-2 text-left transition-colors ${
                      isSelected ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    title={f.name}
                  >
                    {f.thumbnailLink ? (
                      <img
                        src={f.thumbnailLink}
                        alt={f.name}
                        referrerPolicy="no-referrer"
                        className="w-full aspect-square object-cover bg-muted"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <ImageOff className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="block text-[11px] truncate px-1.5 py-1 bg-card">
                      {f.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {nextPageToken && !loading && (
            <div className="flex justify-center py-3">
              <Button variant="outline" size="sm" onClick={() => load(search, nextPageToken)}>
                Load more
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected (max 10)` : "Select up to 10 images"}
          </p>
          <Button onClick={doImport} disabled={selected.size === 0 || importing}>
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Importing...
              </>
            ) : (
              "Import selected"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
