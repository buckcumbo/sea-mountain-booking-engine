import React from "react";

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
export default function VideoTour({ videoUrl, tourUrl }) {
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
    } else {
      // Not YouTube or Vimeo — treat as a direct video file URL.
      isFileVideo = true;
    }
  }

  const showVideo = !!videoUrl && (videoEmbed || isFileVideo);
  const showTour = !!tourUrl;

  if (!showVideo && !showTour) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-coast-navy">Video &amp; 3D Tour</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {showVideo && (
          <div>
            {isFileVideo ? (
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl aspect-video bg-black"
                title="Property video"
              />
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={videoEmbed}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                  title="Property video"
                />
              </div>
            )}
          </div>
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
    </section>
  );
}