// Loads the Google Maps JS API exactly once, on demand. No npm dependency —
// the official script tag pattern, promisified.
let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  if (typeof window !== "undefined" && window.google?.maps?.marker) {
    return Promise.resolve();
  }
  if (!apiKey) return Promise.reject(new Error("No Google Maps API key configured"));
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
    script.async = true;
    // With loading=async, google.maps.* classes don't exist until their
    // libraries are imported — touching maps.Map before this line was a
    // guaranteed crash (blank page).
    script.onload = async () => {
      try {
        await window.google.maps.importLibrary("maps");
        await window.google.maps.importLibrary("marker");
        resolve();
      } catch (e) {
        loadPromise = null;
        reject(e);
      }
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}