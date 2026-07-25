import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Fetches SiteImage records and returns a map of { key: { imageUrl, altText } }
// for the requested keys. Public reads (RLS open) so this works for all visitors.
// Any key without a record is simply absent from the map; callers fall back to
// their hardcoded image.
export function useSiteImageMap(keys) {
  const keyStr = keys.join("|");
  const [map, setMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.SiteImage.list("-created_date", 200);
        const lookup = {};
        for (const r of all || []) {
          if (r.key) lookup[r.key] = { imageUrl: r.imageUrl, altText: r.altText || "" };
        }
        const result = {};
        const wanted = keyStr.split("|");
        for (const k of wanted) {
          if (lookup[k]) result[k] = lookup[k];
        }
        if (!cancelled) setMap(result);
      } catch {
        if (!cancelled) setMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  return map;
}

// Convenience hook for a single key.
export function useSiteImage(key) {
  const map = useSiteImageMap([key]);
  return map[key] || null;
}