import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

// Admin editor for the video URL (YouTube/Vimeo/uploaded file) and 3D tour URL
// (Matterport/iGuide). Calls onChange with a partial patch object.
export default function VideoTourEditor({ videoUrl, tourUrl, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (file_url) onChange({ videoUrl: file_url });
    } catch (e) {
      setUploadError(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Video URL</Label>
        <div className="flex gap-2">
          <Input
            value={videoUrl || ""}
            onChange={(e) => onChange({ videoUrl: e.target.value })}
            placeholder="YouTube or Vimeo link"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Paste a YouTube or Vimeo link, or upload a video file (MP4, WebM).
        </p>
        {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">3D Tour URL</Label>
        <Input
          value={tourUrl || ""}
          onChange={(e) => onChange({ tourUrl: e.target.value })}
          placeholder="Matterport or iGuide embed link"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Paste the share/embed link from Matterport or iGuide.
        </p>
      </div>
    </div>
  );
}