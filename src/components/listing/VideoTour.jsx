import React, { useState, useEffect } from "react";
import { Play, X } from "lucide-react";

// People paste full embed snippets (<iframe src="...">) as often as bare
// URLs — accept both by pulling the src out of any pasted HTML.
function extractUrl(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  const m = v.match(/src\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : v;
}

// Extract a YouTube embed URL from various YouTube link formats.
function getYouTubeEmbed(url) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Extract a Vimeo embed URL from various Vimeo link formats.
function getVimeoEmbed(url) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

// "Video & 3D Tour" section for the public listing detail page.
// Renders nothing when both videoUrl and tourUrl are empty.
export default function VideoTour({ videoUrl, tourUrl, poster }) {
  videoUrl = extractUrl(videoUrl);
  tourUrl = extractUrl(tourUrl);
  // The video opens big: inline we show a poster + play button, and the
  // actual player loads in a full-screen lightbox only when asked for.
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e) => e.key === "Escape" && setPlaying(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [playing]);

  if (!videoUrl && !tourUrl) return null;

  let videoEmbed = null;
  let isFileVideo = false;

  if (videoUrl) {
    const yt = getYouTubeEmbed(videoUrl);
    const vm = getVimeoEmbed(videoUrl);
    if (yt) {
      videoEmbed = yt;
    } else if (vm) {
      videoEmbed = vm;
    } else if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(videoUrl)) {
      // A direct video file — native player.
      isFileVideo = true;
    } else {
      // Any other page URL (Covey Media, Matterport-style hosts, …) —
      // treat as an embeddable player and iframe it. Paste the src from
      // the provider's embed code into the Video URL field.
      videoEmbed = videoUrl;
    }
  }

  const showVideo = !!videoUrl && (videoEmbed || isFileVideo);
  const showTour = !!tourUrl;

  if (!showVideo && !showTour) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-coast-navy">
        {showVideo && showTour ? "Video & 3D Tour" : showVideo ? "Video Tour" : "3D Tour"}
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {showVideo && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group relative aspect-video rounded-xl overflow-hidden bg-coast-navy text-left"
            aria-label="Play video tour"
          >
            {poster && (
              <img
                src={poster}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-coast-navy/70 to-coast-navy/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center group-hover:bg-coast-sunset group-hover:border-coast-sunset transition-colors">
                <Play className="w-6 h-6 text-white fill-current ml-0.5" />
              </span>
              <span className="text-white text-sm font-medium">Play video tour</span>
            </div>
          </button>
        )}
        {showTour && (
          <div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={tourUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                frameBorder="0"
                title="3D virtual tour"
              />
            </div>
          </div>
        )}
      </div>

      {playing && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPlaying(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Video tour"
        >
          <button
            onClick={() => setPlaying(false)}
            aria-label="Close video"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {isFileVideo ? (
              <video src={videoUrl} controls autoPlay className="absolute inset-0 w-full h-full" title="Video tour" />
            ) : (
              <iframe
                src={videoEmbed}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                frameBorder="0"
                title="Video tour"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}