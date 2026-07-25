import { base44 } from "@/api/base44Client";

// Site event tracking — fire-and-forget analytics instrumentation.
// No PII is ever stored: no names, emails, phone numbers, or user IDs.

const SESSION_KEY = "smv_session_id";

let inMemorySessionId = null;

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage unavailable (private mode, etc.) — in-memory fallback
    if (!inMemorySessionId) {
      inMemorySessionId = generateId();
    }
    return inMemorySessionId;
  }
}

function isAdminPath() {
  return window.location.pathname.startsWith("/admin");
}

// First-touch marketing attribution. Captured once per session on landing,
// read at quote time so bookings can be tied back to the campaign.
const ATTRIBUTION_KEY = "smv_attribution";

let inMemoryAttribution = null;

export function captureAttribution() {
  try {
    if (sessionStorage.getItem(ATTRIBUTION_KEY)) return; // first touch only
  } catch {
    if (inMemoryAttribution) return;
  }

  const params = new URLSearchParams(window.location.search);
  let referrer = "";
  try {
    if (document.referrer) {
      const refHost = new URL(document.referrer).hostname;
      if (refHost && refHost !== window.location.hostname) {
        referrer = refHost;
      }
    }
  } catch {
    // malformed referrer — ignore
  }

  const attribution = {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    referrer,
  };

  // Nothing to store if the visit is direct with no UTMs
  if (!attribution.utmSource && !attribution.utmMedium && !attribution.utmCampaign && !attribution.referrer) {
    return;
  }

  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    inMemoryAttribution = attribution;
  }
}

export function getAttribution() {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return inMemoryAttribution || null;
}

// Core track function. Fire-and-forget: never throws, never blocks.
export function track(eventType, data = {}) {
  if (isAdminPath()) return;

  try {
    base44.entities.AnalyticsEvent.create({
      eventType,
      path: window.location.pathname,
      sessionId: getSessionId(),
      ...data,
    }).catch(() => {
      // silent — failed event writes must never surface to the visitor
    });
  } catch {
    // silent
  }
}

// Debounced page_view — prevents double-fires from React re-renders / StrictMode.
let lastPageView = { path: null, time: 0 };

export function trackPageView(extra = {}) {
  if (isAdminPath()) return;

  const path = window.location.pathname;
  const now = Date.now();

  // Skip if this exact path was tracked within the last 1.5 seconds
  if (lastPageView.path === path && now - lastPageView.time < 1500) return;
  lastPageView = { path, time: now };

  track("page_view", extra);
}