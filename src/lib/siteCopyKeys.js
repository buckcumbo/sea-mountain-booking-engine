// Registry of every admin-editable text on the site. The default is the
// text shipping in code today — a SiteCopy record only exists once an admin
// changes something, and deleting the record resets to this default. The
// admin editor renders straight from this registry, so adding a field here
// is all it takes to make new text editable.
export const SITE_COPY_GROUPS = [
  {
    page: "Homepage — Hero",
    fields: [
      {
        key: "home:hero:title",
        label: "Headline",
        hint: "Keep under ~70 characters so it holds 2–3 lines on phones",
        default: "Vacation Rentals in North Myrtle Beach & the Grand Strand",
      },
      {
        key: "home:hero:subhead",
        label: "Subheadline",
        multiline: true,
        default:
          "Stay in one of our 100 Collection homes along the South Carolina coast: oceanfront, channel, and poolside escapes managed by a local on-the-ground team.",
      },
      {
        key: "home:hero:videoLabel",
        label: "Video button label",
        default: "Watch the tour",
      },
    ],
  },
  {
    page: "Homepage — Sections",
    fields: [
      { key: "home:collections:title", label: "Collections section title", default: "Browse by Collection" },
      {
        key: "home:collections:subtitle",
        label: "Collections section subtitle",
        multiline: true,
        default: "From oceanfront retreats to budget-friendly getaways, find the perfect fit.",
      },
      { key: "home:areas:title", label: "Areas section title", default: "Explore Our Areas" },
      {
        key: "home:areas:subtitle",
        label: "Areas section subtitle",
        multiline: true,
        default: "Six distinct communities along the Grand Strand, each with its own coastal character.",
      },
      { key: "home:hundred:title", label: "100 Collection section title", default: "The 100 Collection™" },
      {
        key: "home:hundred:subtitle",
        label: "100 Collection section subtitle",
        multiline: true,
        default:
          "The 100 Collection independently evaluates vacation rentals, awarding its exclusive imprint to properties that deliver the highest standard of hospitality in each unique location. These Sea Mountain homes met that standard. They don't settle for less than 100%.",
      },
      { key: "home:deals:title", label: "Weekly deals section title", default: "A Week at the Beach, Easy on the Budget" },
      {
        key: "home:deals:subtitle",
        label: "Weekly deals section subtitle",
        multiline: true,
        default:
          "The lowest nightly rates in our lineup right now — room to stay the whole week.",
      },
      { key: "home:new:title", label: "Just Added section title", default: "Just Added" },
      {
        key: "home:new:subtitle",
        label: "Just Added section subtitle",
        default: "The newest homes to join our Grand Strand lineup.",
      },
      { key: "home:video:title", label: "Video section title", default: "Take a Look Around" },
      {
        key: "home:video:subtitle",
        label: "Video section subtitle",
        default: "A quick tour of what staying with us actually looks like.",
      },
      { key: "home:reviews:title", label: "Reviews section title", default: "What Our Guests Say" },
      {
        key: "home:reviews:subtitle",
        label: "Reviews section subtitle",
        default: "Verified reviews from our recent guests.",
      },
    ],
  },
  {
    page: "Homepage — Matchmaker Banner",
    fields: [
      { key: "home:match:title", label: "Banner headline", default: "Can't decide? Play matchmaker." },
      {
        key: "home:match:subtitle",
        label: "Banner subtext",
        multiline: true,
        default:
          "Swipe through our homes — right to save, left to pass — until you find the one.",
      },
      { key: "home:match:button", label: "Banner button", default: "Find your match →" },
    ],
  },
  {
    page: "Homepage — Why Book Direct",
    fields: [
      { key: "home:why1:title", label: "Card 1 title", default: "No booking fees" },
      {
        key: "home:why1:text",
        label: "Card 1 text",
        multiline: true,
        default:
          "Book direct and skip the marketplace service fees. The price you see is the price you pay.",
      },
      { key: "home:why2:title", label: "Card 2 title", default: "A local team" },
      {
        key: "home:why2:text",
        label: "Card 2 text",
        multiline: true,
        default:
          "Our Grand Strand-based team knows every home and is on call throughout your stay.",
      },
      { key: "home:why3:title", label: "Card 3 title", default: "Best direct rates" },
      {
        key: "home:why3:text",
        label: "Card 3 text",
        multiline: true,
        default:
          "Direct bookings unlock our lowest rates and exclusive offers on 100 Collection homes.",
      },
    ],
  },
  {
    page: "Search Page",
    fields: [
      { key: "search:hero:title", label: "Hero headline", default: "Find a Vacation Rental" },
      {
        key: "search:hero:subhead",
        label: "Hero subheadline",
        multiline: true,
        default:
          "Search oceanfront condos, beach houses, and pet-friendly stays across the Grand Strand.",
      },
    ],
  },
  {
    page: "Collections Page",
    fields: [
      { key: "collections:hero:title", label: "Hero headline", default: "Browse by Collection" },
      {
        key: "collections:hero:subhead",
        label: "Hero subheadline",
        multiline: true,
        default: "From oceanfront retreats to budget-friendly getaways, find the perfect fit.",
      },
    ],
  },
];

// Flat { key: default } used by the hook to guarantee no key ever renders empty.
export const SITE_COPY_DEFAULTS = Object.fromEntries(
  SITE_COPY_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default]))
);
