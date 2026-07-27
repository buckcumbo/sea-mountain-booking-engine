import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { SITE_COPY_DEFAULTS } from "@/lib/siteCopyKeys";

// One fetch per page load, shared by every component that calls the hook —
// Hero, Home sections, and the header can all read copy without stacking
// list calls. Overrides layer on top of code defaults, so a missing or
// deleted record can never leave a blank headline.
let cachePromise = null;

function fetchOverrides() {
  if (!cachePromise) {
    cachePromise = base44.entities.SiteCopy.list("-created_date", 500)
      .then((all) => {
        const map = {};
        for (const r of all || []) {
          // Newest-first: first hit wins if duplicates ever exist.
          if (r.key && map[r.key] === undefined) map[r.key] = r.value;
        }
        return map;
      })
      .catch(() => {
        cachePromise = null; // allow retry on next mount
        return {};
      });
  }
  return cachePromise;
}

// Admin editor calls this after saving so public pages re-fetch fresh copy.
export function invalidateSiteCopy() {
  cachePromise = null;
}

export function useSiteCopy() {
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetchOverrides().then((map) => {
      if (!cancelled) setOverrides(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // t("home:hero:title") — override if set, code default otherwise. Renders
  // the default immediately (no blank flash) and swaps in the override when
  // the fetch lands.
  const t = (key) => {
    const v = overrides[key];
    return v !== undefined && v !== "" ? v : SITE_COPY_DEFAULTS[key] ?? "";
  };
  return { t };
}
