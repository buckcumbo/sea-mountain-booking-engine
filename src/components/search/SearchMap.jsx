import React from "react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import GoogleMapView from "@/components/search/GoogleMapView";
import MapView from "@/components/search/MapView";

// Map provider switch: Google Maps when an API key is configured
// (src/lib/config.js), Leaflet/OpenStreetMap otherwise. Same props either way.
export default function SearchMap(props) {
  return GOOGLE_MAPS_API_KEY ? <GoogleMapView {...props} /> : <MapView {...props} />;
}