import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin/staff Today board data. Returns arrivals, departures, same-day turns,
// and unpaid balances for a given date (default: today, Eastern Time). Each
// item resolves the listing title/area and guest info via lookups.
const FLAG_TURN = "same-day-turn";
const FLAG_UNPAID = "unpaid-balance";

function todayEastern() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  return fmt.format(new Date());
}

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    // Staff run the ops board day-to-day; admin is not required (the /today
    // route already admits both roles — this gate must match it).
    if (user.role !== "admin" && user.role !== "staff") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const date = payload.date || todayEastern();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return Response.json({ error: "Invalid date (use yyyy-MM-dd)" }, { status: 400 });
    }
    const endDate = addDays(String(date), 7);

    const [arrivalsRes, departuresRes, unpaidRes] = await Promise.all([
      base44.asServiceRole.entities.Reservation.filter({ checkIn: String(date) }, "-checkIn", 500),
      base44.asServiceRole.entities.Reservation.filter({ checkOut: String(date) }, "-checkOut", 500),
      base44.asServiceRole.entities.Reservation.filter(
        { checkIn: { $gte: String(date), $lte: endDate } },
        "-checkIn",
        1000,
      ),
    ]);

    const arrivals = Array.isArray(arrivalsRes) ? arrivalsRes : [];
    const departures = Array.isArray(departuresRes) ? departuresRes : [];
    const unpaidCandidates = Array.isArray(unpaidRes) ? unpaidRes : [];

    const isCanceled = (r: any) => String(r.status || "").toLowerCase().includes("cancel");

    const activeArrivals = arrivals.filter((r) => !isCanceled(r));
    const activeDepartures = departures.filter((r) => !isCanceled(r));

    // Resolve listings + guests for the items we will return.
    const allListings = await base44.asServiceRole.entities.Listing.list("-created_date", 1000);
    const listingMap: Record<string, any> = {};
    for (const l of (Array.isArray(allListings) ? allListings : [])) listingMap[l.id] = l;

    const guestMap: Record<string, any> = {};
    const neededGuests = new Set<string>();
    for (const r of [...activeArrivals, ...activeDepartures, ...unpaidCandidates]) {
      if (r.guestProfileId) neededGuests.add(String(r.guestProfileId));
    }
    if (neededGuests.size > 0) {
      const allGuests = await base44.asServiceRole.entities.GuestProfile.list("-created_date", 5000);
      for (const g of (Array.isArray(allGuests) ? allGuests : [])) guestMap[g.id] = g;
    }

    const shape = (r: any) => {
      const listing = listingMap[r.listingId] || null;
      const guest = r.guestProfileId ? (guestMap[r.guestProfileId] || null) : null;
      return {
        id: r.id,
        listingId: r.listingId,
        guestProfileId: r.guestProfileId,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        paymentStatus: r.paymentStatus,
        balanceDue: r.balanceDue,
        flags: Array.isArray(r.flags) ? r.flags : [],
        listing: listing ? { title: listing.title, area: listing.area } : null,
        guest: guest ? { firstName: guest.firstName, lastName: guest.lastName, email: guest.email, phone: guest.phone } : null,
      };
    };

    const shapedArrivals = activeArrivals.map(shape);
    const shapedDepartures = activeDepartures.map(shape);
    const sameDayTurns = shapedArrivals.filter((r) => r.flags.includes(FLAG_TURN));
    const unpaidBalances = unpaidCandidates
      .filter((r) => !isCanceled(r) && ((Number(r.balanceDue) || 0) > 0 || (Array.isArray(r.flags) && r.flags.includes(FLAG_UNPAID))))
      .map(shape);

    return Response.json({
      date: String(date),
      arrivals: shapedArrivals,
      departures: shapedDepartures,
      sameDayTurns,
      unpaidBalances,
    });
  } catch (error) {
    console.error("[getTodayBoard]", error.message);
    return Response.json({ error: "Could not load the board. Please try again." }, { status: 500 });
  }
});