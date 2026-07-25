import React from "react";

// Renders a page hero background. When a SiteImage record exists for the page,
// shows the uploaded photo with a legible gradient overlay. Otherwise renders
// the default gradient exactly as before, so pages with no image are unchanged.
export default function HeroBackground({ image }) {
  if (image?.imageUrl) {
    return (
      <>
        <img
          src={image.imageUrl}
          alt={image.altText || ""}
          className="absolute inset-0 w-full h-full object-cover fade-in"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-coast-navy/50 to-coast-navy/75" />
      </>
    );
  }
  return <div className="absolute inset-0 bg-gradient-to-b from-coast-navy-soft to-coast-navy" />;
}