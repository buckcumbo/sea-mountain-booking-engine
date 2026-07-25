import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AREA_CENTER_COORDS, isValidCoord } from "@/lib/availability";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from "@/lib/config";
import { loadGoogleMaps } from "@/lib/googleMaps";

// Google variant — used automatically when an API key is configured.
function GoogleLocationMap({ center, zoom, radius, className }) {
  const divRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (cancelled || !divRef.current) return;
        const g = window.google;
        const map = new g.maps.Map(divRef.current, {
          center,
          zoom,
          mapId: GOOGLE_MAPS_MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        new g.maps.Circle({
          map,
          center,
          radius,
          strokeColor: "#1e6b9e",
          strokeWeight: 1.5,
          fillColor: "#bfe0ef",
          fillOpacity: 0.55,
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [center, zoom, radius]);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-coast-foam text-sm text-muted-foreground`}>
        Map unavailable
      </div>
    );
  }
  return <div ref={divRef} className={className} />;
}

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

  if (GOOGLE_MAPS_API_KEY) {
    return (
      <GoogleLocationMap
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        radius={hasCoords ? radius : 2000}
        className={className || "w-full h-72 rounded-2xl"}
      />
    );
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