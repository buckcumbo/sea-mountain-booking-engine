// Loads the Google Maps JS API exactly once, on demand, via the standard
// callback pattern. `libraries=marker` is REQUIRED: AdvancedMarkerElement is
// not part of the core API, and the callback only guarantees the libraries
// listed in the script URL. Omitting it is exactly the bug that made the map
// view fall back — core loaded, `google.maps.marker` undefined, pin creation
// threw.
let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  // Ready means marker library ready — checking `Map` alone is not enough.
  if (typeof window !== "undefined" && window.google?.maps?.marker?.AdvancedMarkerElement) {
    return Promise.resolve();
  }
  if (!apiKey) return Promise.reject(new Error("No Google Maps API key configured"));
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    // A previous visit may have loaded core maps without the marker library
    // (stale bundle, partial load). importLibrary can finish the job without
    // injecting a duplicate script tag.
    if (window.google?.maps?.importLibrary) {
      window.google.maps
        .importLibrary("marker")
        .then(() => resolve())
        .catch((e) => {
          loadPromise = null;
          reject(e);
        });
      return;
    }
    const cb = `__gmaps_cb_${Date.now()}`;
    window[cb] = () => {
      delete window[cb];
      resolve();
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=marker&callback=${cb}`;
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
