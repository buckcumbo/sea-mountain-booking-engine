import React from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/FavoritesContext";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

export default function HeartToggle({ listingId, listingSlug, className = "" }) {
  const { isFavorite, toggle, isAuthenticated } = useFavorites();
  const fav = isFavorite(listingId);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fav) {
      track("favorite_add", { listingSlug });
    }
    toggle(listingId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={isAuthenticated ? (fav ? "Saved to favorites" : "Save to favorites") : "Sign in to save favorites"}
      aria-label={fav ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors",
        className
      )}
    >
      <Heart className={cn("w-4 h-4", fav ? "fill-red-500 text-red-500" : "text-coast-navy")} />
    </button>
  );
}