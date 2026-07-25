import React from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Approximate-location map for a listing detail page. Shows a ~300m circle
// centered on the listing's coordinates — never an exact-address marker.
export default function LocationMap({ latitude, longitude, radius = 300, className }) {
  if (latitude == null || longitude == null) return null;
  const center = [latitude, longitude];
  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={false}
      className={className || "w-full h-72 rounded-2xl"}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Circle
        center={center}
        radius={radius}
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