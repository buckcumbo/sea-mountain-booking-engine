import React, { useEffect, useRef, useState, useMemo } from "react";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from "@/lib/config";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { prettifyArea, isValidCoord, AREA_CENTER_COORDS } from "@/lib/availability";

// Google Maps search view (activates when GOOGLE_MAPS_API_KEY is set).
// Three marker types, all honest about data quality:
//   - price pill: a listing with its own valid coordinates
//   - "N homes" pill: multiple listings sharing near-identical coordinates
//     (import artifacts) — grouped instead of rendering a fake-precision stack
//   - "N in <Area>" pill: listings with no valid coordinates, shown at the
//     area's center until real lat/lng arrives from the Guesty sync
function priceLabel(price) {
  if (!price) return "•";
  if (price.hasDates && price.total != null) return `$${price.total}`;
  if (price.from != null) return `$${price.from}`;
  return "•";
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function infoHtml(listing, price, photo) {
  const url = `/listing/${esc(listing.slug || listing.id)}`;
  const priceLine =
    price && price.from != null
      ? `from $${Number(price.from)}/night`
      : price && price.hasDates && price.total != null
        ? `$${Number(price.total)} total`
        : "Rates on request";
  return `<div style="width:176px;display:flex;flex-direction:column;gap:6px;font-family:inherit;">
    ${photo ? `<img src="${esc(photo)}" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:8px;"/>` : ""}
    <div style="font-weight:600;font-size:13px;color:#17304f;line-height:1.25;">${esc(listing.title)}</div>
    <div style="font-size:11px;color:#64748b;">${esc(prettifyArea(listing.area))} · sleeps ${esc(listing.sleeps)}</div>
    <div style="font-size:13px;font-weight:600;color:#1e6b9e;">${priceLine}</div>
    <a href="${url}" style="font-size:12px;font-weight:500;color:#1e6b9e;">View details →</a>
  </div>`;
}

export default function GoogleMapView({ listings, prices, selectedId, onSelect, className }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const infoRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const { singles, stacks, areaGroups } = useMemo(() => {
    const valid = [];
    const areaMap = new Map();
    for (const l of listings) {
      if (isValidCoord(l.latitude, l.longitude)) {
        valid.push(l);
      } else {
        const arr = areaMap.get(l.area) || [];
        arr.push(l);
        areaMap.set(l.area, arr);
      }
    }
    // ~100m grid: listings landing in the same cell are a "stack".
    const byCell = new Map();
    for (const l of valid) {
      const key = `${l.latitude.toFixed(3)},${l.longitude.toFixed(3)}`;
      const arr = byCell.get(key) || [];
      arr.push(l);
      byCell.set(key, arr);
    }
    const singles = [];
    const stacks = [];
    for (const arr of byCell.values()) {
      if (arr.length <= 2) singles.push(...arr);
      else stacks.push(arr);
    }
    return { singles, stacks, areaGroups: [...areaMap.entries()] };
  }, [listings]);

  useEffect(() => {
    if (!ready || !divRef.current) return;
    try {
    const g = window.google;
    if (!mapRef.current) {
      mapRef.current = new g.maps.Map(divRef.current, {
        center: { lat: 33.7, lng: -78.9 },
        zoom: 11,
        mapId: GOOGLE_MAPS_MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });
      infoRef.current = new g.maps.InfoWindow();
    }
    const map = mapRef.current;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    const bounds = new g.maps.LatLngBounds();
    let hasBounds = false;

    const addPill = ({ lat, lng, text, active, onClick }) => {
      const el = document.createElement("div");
      el.className = `coast-pin${active ? " coast-pin--active" : ""}`;
      el.textContent = text;
      const marker = new g.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        content: el,
        zIndex: active ? 1000 : 1,
      });
      if (onClick) marker.addListener("click", onClick);
      markersRef.current.push(marker);
    };

    for (const l of singles) {
      const pos = { lat: l.latitude, lng: l.longitude };
      bounds.extend(pos);
      hasBounds = true;
      const photo = l.photos && l.photos[0] ? l.photos[0].url : null;
      addPill({
        ...pos,
        text: priceLabel(prices[l.id]),
        active: selectedId === l.id,
        onClick: () => {
          if (onSelect) onSelect(l.id);
          infoRef.current.setContent(infoHtml(l, prices[l.id], photo));
          infoRef.current.setPosition(pos);
          infoRef.current.open({ map });
        },
      });
    }

    for (const arr of stacks) {
      const pos = { lat: arr[0].latitude, lng: arr[0].longitude };
      bounds.extend(pos);
      hasBounds = true;
      addPill({
        ...pos,
        text: `${arr.length} homes`,
        onClick: () => {
          map.panTo(pos);
          map.setZoom(Math.min((map.getZoom() || 11) + 2, 16));
        },
      });
    }

    for (const [area, arr] of areaGroups) {
      const c = AREA_CENTER_COORDS[area];
      if (!c) continue;
      bounds.extend({ lat: c.lat, lng: c.lng });
      hasBounds = true;
      addPill({
        lat: c.lat,
        lng: c.lng,
        text: `${arr.length} in ${prettifyArea(area)}`,
        onClick: () => {
          map.panTo({ lat: c.lat, lng: c.lng });
          map.setZoom(12);
        },
      });
    }

    if (hasBounds) map.fitBounds(bounds, 44);
    } catch (e) {
      // A map failure must never blank the page — degrade to the fallback.
      console.error("[GoogleMapView]", e);
      setFailed(true);
    }
  }, [ready, singles, stacks, areaGroups, prices, selectedId, onSelect]);

  if (failed) {
    return (
      <div className={`${className || "w-full h-full"} flex items-center justify-center bg-coast-foam text-sm text-muted-foreground px-6 text-center`}>
        The map couldn't load. Browse the list, or call us and we'll talk you through the neighborhoods.
      </div>
    );
  }

  return <div ref={divRef} className={className || "w-full h-full"} />;
}