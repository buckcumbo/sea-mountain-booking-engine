// MOCK Breezeway clean-status lookup. Breezeway is the system of record for
// cleans — this map is a read-only stand-in until the Breezeway integration
// exists. Never editable in this app; each entry links to a placeholder URL.
const MOCK = {
  "6a63df520ec13975ca41c5b8": { status: "in progress", url: "https://breezeway.example.com/units/ocean-breeze-1204" },
  "6a63df520ec13975ca41c5b9": { status: "scheduled", url: "https://breezeway.example.com/units/salty-sunrise-304" },
  "6a63df520ec13975ca41c5ba": { status: "done", url: "https://breezeway.example.com/units/duneside-retreat" },
  "6a63df520ec13975ca41c5bb": { status: "inspected", url: "https://breezeway.example.com/units/marsh-view-villa" },
  "6a63df520ec13975ca41c5bc": { status: "scheduled", url: "https://breezeway.example.com/units/inlet-harbor-loft" },
};

export function getBreezewayStatus(listingId) {
  return (
    MOCK[listingId] || {
      status: "scheduled",
      url: `https://breezeway.example.com/units/${listingId}`,
    }
  );
}