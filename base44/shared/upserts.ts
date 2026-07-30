// Guarded upsert helpers — enforce uniqueness in code (no DB unique index available).
// Each looks up the existing record by its natural key before insert/update.

// Editorial fields that sync must never overwrite.
const EDITORIAL_FIELDS = [
  "revaWidgetId",
  "photosManaged",
  "photos",
  "videoUrl",
  "tourUrl",
  "amenitiesHidden",
  // Admin-written promo callout + function-managed price-drop tracking:
  // sync must never overwrite or clear these.
  "promoBadge",
  "priceDropFrom",
  "priceDropAt",
  "weeklyDeal",
];

export async function upsertListingByGuestyId(base44, data) {
  const syncData = { ...data };
  for (const f of EDITORIAL_FIELDS) delete syncData[f];
  const photos = data.photos;

  const existing = await base44.asServiceRole.entities.Listing.filter(
    { guestyId: syncData.guestyId },
    "-created_date",
    1,
  );
  if (existing.length > 0) {
    const current = existing[0];
    // When photos have been manually curated, never overwrite them from sync.
    if (current.photosManaged === true) {
      return await base44.asServiceRole.entities.Listing.update(current.id, syncData);
    }
    return await base44.asServiceRole.entities.Listing.update(
      current.id,
      photos ? { ...syncData, photos } : syncData,
    );
  }
  return await base44.asServiceRole.entities.Listing.create(
    photos ? { ...syncData, photos } : syncData,
  );
}

export async function upsertCalendarDay(base44, data) {
  const existing = await base44.asServiceRole.entities.CalendarDay.filter(
    { listingId: data.listingId, date: data.date },
    "-created_date",
    1,
  );
  if (existing.length > 0) {
    return await base44.asServiceRole.entities.CalendarDay.update(existing[0].id, data);
  }
  return await base44.asServiceRole.entities.CalendarDay.create(data);
}

export async function upsertGuestProfileByEmail(base44, data) {
  const existing = await base44.asServiceRole.entities.GuestProfile.filter(
    { email: data.email },
    "-created_date",
    1,
  );
  if (existing.length > 0) {
    return await base44.asServiceRole.entities.GuestProfile.update(existing[0].id, data);
  }
  return await base44.asServiceRole.entities.GuestProfile.create(data);
}

// Upsert a Reservation by its Guesty id. Undefined fields are stripped so they
// are not written as nulls. Used by the webhook receiver for reservation sync.
export async function upsertReservationByGuestyId(base44, data) {
  const clean: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  const existing = await base44.asServiceRole.entities.Reservation.filter(
    { guestyId: clean.guestyId },
    "-created_date",
    1,
  );
  if (existing.length > 0) {
    const updates = { ...clean };
    delete updates.guestyId; // natural key — never changed on update
    return await base44.asServiceRole.entities.Reservation.update(existing[0].id, updates);
  }
  return await base44.asServiceRole.entities.Reservation.create(clean);
}