// Guarded upsert helpers — enforce uniqueness in code (no DB unique index available).
// Each looks up the existing record by its natural key before insert/update.

export async function upsertListingByGuestyId(base44, data) {
  const existing = await base44.asServiceRole.entities.Listing.filter(
    { guestyId: data.guestyId },
    "-created_date",
    1,
  );
  if (existing.length > 0) {
    return await base44.asServiceRole.entities.Listing.update(existing[0].id, data);
  }
  return await base44.asServiceRole.entities.Listing.create(data);
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