// Loads the Google Maps JS API exactly once, on demand. Uses the standard
// callback pattern — Google calls our global fn when the full API (Map,
// Circle, AdvancedMarkerElement, etc.) is ready. No importLibrary fragility.
let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  if (typeof window !== "undefined" && window.google?.maps?.Map) {
    return Promise.resolve();
  }
  if (!apiKey) return Promise.reject(new Error("No Google Maps API key configured"));
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const cb = `__gmaps_cb_${Date.now()}`;
    window[cb] = () => {
      delete window[cb];
      resolve();
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${cb}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      delete window[cb];
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}