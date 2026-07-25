import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Reusable upload-or-link field for admin image URL inputs. Keeps the URL input
// working for pasted links, adds a file-picker upload via Core.UploadFile,
// shows a thumbnail preview, an uploading spinner, a friendly error on failure,
// and a broken-image note for bad pasted URLs.
export default function ImageUploadField({ value, onChange, placeholder = "Paste image URL…" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [broken, setBroken] = useState(false);

  const pick = () => {
    setUploadError("");
    fileRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBroken(false);
      onChange(file_url);
    } catch (err) {
      setUploadError(err?.message || "Upload failed. Try again or paste a URL instead.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-4 items-start">
      <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-muted shrink-0 border border-border flex items-center justify-center">
        {value ? (
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setBroken(true)}
            onLoad={() => setBroken(false)}
          />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        {(uploadError || (broken && value)) && (
          <div className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3" /> {uploadError || "Image failed to load — check the URL"}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={value || ""}
            onChange={(e) => {
              setBroken(false);
              setUploadError("");
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pick}
            disabled={uploading}
            className="shrink-0"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading…" : "Upload photo"}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>
    </div>
  );
}