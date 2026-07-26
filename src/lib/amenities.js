// Guest-facing amenity curation. The raw Hospitable/Guesty amenity list is
// ~70 items of table stakes (kitchen, washer, tv, iron…) that bury the ones
// guests actually choose a home for. We show ONLY the highlights below — an
// allow-list, so new generic amenities from future syncs stay hidden without
// another cleanup pass. Per-listing amenitiesHidden still wins as an override.
//
// Order = display priority (pool-type first, then outdoor, fun, practical).
export const HIGHLIGHT_AMENITIES = [
  ["pool", "Pool"],
  ["heated_pool", "Heated pool"],
  ["jacuzzi", "Hot tub"],
  ["beachfront", "Beachfront"],
  ["beach_access", "Walk to beach"],
  ["waterfront", "Waterfront"],
  ["bbq_area", "Grill"],
  ["outdoor_kitchen", "Outdoor kitchen"],
  ["fire_pit", "Fire pit"],
  ["fireplace", "Fireplace"],
  ["alfresco_shower", "Outdoor shower"],
  ["home_theater", "Movie theater"],
  ["theme_room", "Theme room"],
  ["pool_table", "Pool table"],
  ["arcade_machine", "Arcade games"],
  ["game_console", "Game console"],
  ["ping_pong_table", "Ping pong"],
  ["mini_golf", "Putting green"],
  ["life_size_games", "Life-size games"],
  ["playroom", "Game room"],
  ["playground", "Playground"],
  ["gym", "Gym"],
  ["sauna", "Sauna"],
  ["hammock", "Hammock"],
  ["kayak", "Kayaks"],
  ["bicycle", "Bikes"],
  ["boat_slip", "Boat slip"],
  ["beach_essentials", "Beach gear"],
  ["sound_system", "Sound system"],
  ["ev_charger", "EV charger"],
  ["elevator", "Elevator"],
  ["wheelchair_accessible", "Wheelchair accessible"],
  ["single_level_home", "Single-level home"],
  ["resort_access", "Resort access"],
  ["laptop_friendly_workspace", "Laptop-friendly workspace"],
];

const LABEL_BY_KEY = new Map(HIGHLIGHT_AMENITIES);
const PRIORITY = new Map(HIGHLIGHT_AMENITIES.map(([k], i) => [k, i]));

export function amenityLabel(key) {
  return (
    LABEL_BY_KEY.get(key) ||
    String(key).replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

// Highlights for a listing: allow-listed, per-listing hidden removed,
// priority-ordered, deduped. Returns [{ key, label }].
export function curatedAmenities(listing) {
  const hidden = new Set(listing?.amenitiesHidden || []);
  const seen = new Set();
  return (listing?.amenities || [])
    .filter((a) => LABEL_BY_KEY.has(a) && !hidden.has(a) && !seen.has(a) && seen.add(a))
    .sort((a, b) => PRIORITY.get(a) - PRIORITY.get(b))
    .map((key) => ({ key, label: amenityLabel(key) }));
}
