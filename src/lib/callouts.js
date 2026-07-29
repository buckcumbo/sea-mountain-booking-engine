// Honest marketing callouts. The brand rule: interest/scarcity/price claims
// appear only when literally true from our own data.

const DROP_BADGE_DAYS = 14;

// A price drop is showable while: recorded by refreshFromRates, still lower
// than the recorded old rate, and fresh (within 14 days).
export function activePriceDrop(listing) {
  if (!listing?.priceDropAt || !listing?.priceDropFrom) return null;
  const from = Number(listing.priceDropFrom);
  const now = Number(listing.fromRate);
  if (!(from > 0) || !(now > 0) || now >= from) return null;
  const at = new Date(listing.priceDropAt).getTime();
  if (!Number.isFinite(at)) return null;
  if (Date.now() - at > DROP_BADGE_DAYS * 24 * 60 * 60 * 1000) return null;
  return { from, now };
}
