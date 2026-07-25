import React from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AREA_CENTER_COORDS, isValidCoord } from "@/lib/availability";

// Map for a listing detail page. When valid coordinates are present, shows a
// ~300m circle centered on the home. When coordinates are missing/invalid,
// falls back to the listing's area center at a wider zoom — never returns null.
export default function LocationMap({ latitude, longitude, area, radius = 300, className }) {
  const hasCoords = isValidCoord(latitude, longitude);
  let center;
  let zoom;
  if (hasCoords) {
    center = [latitude, longitude];
    zoom = 14;
  } else {
    const fallback = AREA_CENTER_COORDS[area] || AREA_CENTER_COORDS["myrtle-beach"];
    center = [fallback.lat, fallback.lng];
    zoom = 11;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className || "w-full h-72 rounded-2xl"}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Circle
        center={center}
        radius={hasCoords ? radius : 2000}
        pathOptions={{
          color: "#1e6b9e",
          weight: 1.5,
          fillColor: "#bfe0ef",
          fillOpacity: 0.55,
        }}
      />
    </MapContainer>
  );
}