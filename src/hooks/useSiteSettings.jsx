import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Fetches SiteSetting records once per mount and returns { key: value }.
// Same shape/contract as useSiteImageMap: `ready: true` marks that the
// lookup finished so callers can hold their defaults until then without
// flashing. Missing keys are simply absent — callers supply defaults.
export function useSiteSettings(keys) {
  const keyStr = keys.join("|");
  const [map, setMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.SiteSetting.list("-created_date", 200);
        const lookup = {};
        for (const r of all || []) {
          // Newest-first list: first write wins so duplicates resolve to
          // the most recent value.
          if (r.key && lookup[r.key] === undefined) lookup[r.key] = r.value;
        }
        const result = {};
        for (const k of keyStr.split("|")) {
          if (lookup[k] !== undefined) result[k] = lookup[k];
        }
        result.ready = true;
        if (!cancelled) setMap(result);
      } catch {
        if (!cancelled) setMap({ ready: true });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  return map;
}

// Header branding settings with defaults + clamping in one place, so the
// header and the admin preview can't drift apart.
export const LOGO_SETTING_KEYS = ["header:logoVariant", "header:logoHeight"];

export function resolveLogoSettings(settings) {
  const variant = settings["header:logoVariant"] === "mark" ? "mark" : "lockup";
  const raw = Number(settings["header:logoHeight"]);
  // Clamp: below 32px the logo is unreadable, above 64px it overflows the
  // 72px header bar.
  const height = Number.isFinite(raw) && raw > 0 ? Math.min(64, Math.max(32, raw)) : 56;
  return { variant, height };
}
