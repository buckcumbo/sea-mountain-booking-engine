import React, { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { prettifyArea } from "@/lib/availability";

// Tracks whether the viewport is at or above the lg breakpoint (1024px).
// On smaller screens the map container is toggled via CSS (hidden/block),
// so we only mount MapContainer when it will actually be visible — mounting
// Leaflet inside a display:none container corrupts its internal panes and
// throws "Cannot read properties of undefined (reading '_leaflet_pos')".
export function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    mql.addEventListener("change", onChange);
    setIsLgUp(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isLgUp;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

// Leaflet map for the search results: a price pin per listing, auto-fit to the
// current results, with a popup (photo, name, price, link) on click. onSelect
// fires when a pin is clicked so the parent can scroll/highlight its card.
function priceLabel(price) {
  if (!price) return "•";
  if (price.hasDates && price.total != null) return `$${price.total}`;
  if (price.from != null) return `$${price.from}`;
  return "•";
}

function priceIcon(label, selected) {
  return L.divIcon({
    className: "",
    html: `<div class="coast-pin ${selected ? "coast-pin--active" : ""}">${label}</div>`,
    iconSize: [46, 26],
    iconAnchor: [23, 26],
    popupAnchor: [0, -24],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export default function MapView({ listings, prices, selectedId, onSelect, className }) {
  const isLgUp = useIsLgUp();
  const points = useMemo(
    () =>
      listings
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => ({
          listing: l,
          lat: l.latitude,
          lng: l.longitude,
          price: prices[l.id],
        })),
    [listings, prices]
  );

  const center = points[0] ? [points[0].lat, points[0].lng] : [33.7, -78.9];

  return (
    <MapContainer
      key={isLgUp ? "desktop" : "mobile"}
      center={center}
      zoom={11}
      scrollWheelZoom={false}
      className={className || "w-full h-full"}
    >
      <InvalidateOnMount />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <FitBounds points={points} />
      {points.map((p) => {
        const photo =
          p.listing.photos && p.listing.photos[0] ? p.listing.photos[0].url : null;
        return (
          <Marker
            key={p.listing.id}
            position={[p.lat, p.lng]}
            icon={priceIcon(priceLabel(p.price), selectedId === p.listing.id)}
            eventHandlers={{ click: () => onSelect && onSelect(p.listing.id) }}
            zIndexOffset={selectedId === p.listing.id ? 1000 : 0}
          >
            <Popup>
              <div className="w-44 flex flex-col gap-1.5">
                {photo && (
                  <img
                    src={photo}
                    alt={p.listing.title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                )}
                <div className="font-heading font-semibold text-sm text-coast-navy leading-tight">
                  {p.listing.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {prettifyArea(p.listing.area)} · {p.listing.sleeps} guests
                </div>
                <div className="text-sm font-semibold text-coast-ocean">
                  {p.price && p.price.from != null
                    ? `from $${p.price.from}/night`
                    : "Rates on request"}
                </div>
                <Link
                  to={`/listing/${p.listing.slug || p.listing.id}`}
                  className="mt-1 text-xs font-medium text-coast-ocean hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}