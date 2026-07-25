import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useFavorites } from "@/lib/FavoritesContext";
import { getPassedListings, addPassedListing, removePassedListing, clearPassedListings } from "@/lib/passedListings";
import { buildCalendarMap, computeListingPrice, prettifyArea } from "@/lib/availability";
import { track } from "@/lib/analytics";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, X, Undo2, MapPin, BedDouble, Bath, Users, ArrowRight, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";

// Find Your Match — swipe through homes Tinder-style. Right saves to
// favorites, left hides the home from search until the guest brings it back.
// Every swipe is tracked, so we learn what guests actually want.
const SWIPE_THRESHOLD = 120;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchGame() {
  const navigate = useNavigate();
  const { isFavorite, toggle, count } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  const [history, setHistory] = useState([]); // [{ listing, action }]
  const [likes, setLikes] = useState(0);
  const [exitDirection, setExitDirection] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [all, days] = await Promise.all([
          base44.entities.Listing.list("-created_date", 500),
          base44.entities.CalendarDay.list("-created_date", 5000),
        ]);
        const passed = new Set(getPassedListings());
        const candidates = (all || []).filter(
          (l) => l.active !== false && !passed.has(l.id) && !isFavorite(l.id)
        );
        // Featured homes surface early, the rest is shuffled — every session
        // deals a different deck.
        const featured = shuffle(candidates.filter((l) => l.featured));
        const rest = shuffle(candidates.filter((l) => !l.featured));
        setDeck([...featured, ...rest]);
        setCalendarMap(buildCalendarMap(days || []));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = deck[0];
  const upNext = deck.slice(1, 3);

  const swipe = useCallback(
    (direction) => {
      if (!current) return;
      setExitDirection(direction);
      if (direction > 0) {
        toggle(current.id); // save to favorites
        setLikes((n) => n + 1);
        track("match_like", { listingSlug: current.slug });
        setHistory((h) => [...h, { listing: current, action: "like" }]);
      } else {
        addPassedListing(current.id);
        track("match_pass", { listingSlug: current.slug });
        setHistory((h) => [...h, { listing: current, action: "pass" }]);
      }
      setDeck((d) => d.slice(1));
    },
    [current, toggle]
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      const last = h[h.length - 1];
      if (!last) return h;
      if (last.action === "like") {
        toggle(last.listing.id); // un-favorite
        setLikes((n) => Math.max(0, n - 1));
      } else {
        removePassedListing(last.listing.id);
      }
      setDeck((d) => [last.listing, ...d]);
      return h.slice(0, -1);
    });
  }, [toggle]);

  // Keyboard: ← pass, → like, Z undo.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") swipe(-1);
      if (e.key === "ArrowRight") swipe(1);
      if (e.key.toLowerCase() === "z") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [swipe, undo]);

  const restart = () => {
    clearPassedListings();
    window.location.reload();
  };

  return (
    <div className="bg-coast-foam min-h-screen">
      <Seo
        title="Find Your Match | Sea Mountain Vacations"
        description="Swipe through our beach homes and find the one. Right to save it, left to let it go."
        path="/match"
      />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
        <div className="text-center mb-4">
          <h1 className="font-heading text-2xl font-semibold text-coast-navy">Find your match</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Swipe right to save a home, left to let it go.
          </p>
        </div>

        {likes > 0 && (
          <Link
            to="/favorites"
            className="mx-auto mb-3 inline-flex items-center gap-1.5 text-xs font-medium bg-coast-navy text-white rounded-full px-3 py-1.5 hover:bg-coast-navy/90"
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> {count} saved — see your matches
          </Link>
        )}

        <div className="relative flex-1" style={{ minHeight: 480 }}>
          {loading ? (
            <Skeleton className="absolute inset-0 rounded-3xl" />
          ) : current ? (
            <>
              {/* Depth stack */}
              {upNext.map((l, i) => (
                <div
                  key={l.id}
                  className="absolute inset-0 bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
                  style={{
                    transform: `scale(${1 - (i + 1) * 0.04}) translateY(${(i + 1) * 12}px)`,
                    zIndex: 2 - i,
                    opacity: 1 - (i + 1) * 0.25,
                  }}
                >
                  {l.photos?.[0]?.url && (
                    <Image src={l.photos[0].url} alt="" fittingType="fill" className="absolute inset-0 w-full h-full" />
                  )}
                </div>
              ))}
              <AnimatePresence>
                <SwipeCard
                  key={current.id}
                  listing={current}
                  price={computeListingPrice(current, calendarMap, "", "")}
                  onSwipe={swipe}
                  exitDirection={exitDirection}
                />
              </AnimatePresence>
            </>
          ) : (
            <EndScreen likes={likes} onRestart={restart} onSeeMatches={() => navigate("/favorites")} />
          )}
        </div>

        {current && !loading && (
          <div className="flex items-center justify-center gap-5 mt-5">
            <button
              onClick={() => swipe(-1)}
              aria-label="Pass on this home"
              className="w-16 h-16 rounded-full bg-card border-2 border-border shadow-md flex items-center justify-center text-coast-navy hover:border-destructive hover:text-destructive transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              aria-label="Undo last swipe"
              className="w-11 h-11 rounded-full bg-card border border-border shadow flex items-center justify-center text-muted-foreground hover:text-coast-navy disabled:opacity-40 transition-colors"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => swipe(1)}
              aria-label="Save this home"
              className="w-16 h-16 rounded-full bg-coast-sunset shadow-md flex items-center justify-center text-white hover:bg-coast-sunset-deep transition-colors"
            >
              <Heart className="w-7 h-7 fill-current" />
            </button>
          </div>
        )}

        {current && !loading && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            {deck.length} {deck.length === 1 ? "home" : "homes"} left · tap the photo for more pictures
          </p>
        )}
      </main>
    </div>
  );
}

function SwipeCard({ listing, price, onSwipe, exitDirection }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-14, 14]);
  const likeOpacity = useTransform(x, [40, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40], [1, 0]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = (listing.photos || []).slice(0, 6);
  const photo = photos[photoIdx] || photos[0];
  const dragging = useRef(false);

  const cyclePhoto = () => {
    if (dragging.current || photos.length < 2) return;
    setPhotoIdx((i) => (i + 1) % photos.length);
  };

  return (
    <motion.div
      className="absolute inset-0 bg-card rounded-3xl border border-border shadow-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={() => { dragging.current = true; }}
      onDragEnd={(_, info) => {
        setTimeout(() => { dragging.current = false; }, 50);
        if (info.offset.x > SWIPE_THRESHOLD) onSwipe(1);
        else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe(-1);
      }}
      initial={{ scale: 0.96, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: exitDirection > 0 ? 500 : -500,
        rotate: exitDirection > 0 ? 20 : -20,
        opacity: 0,
        transition: { duration: 0.25 },
      }}
    >
      <div className="absolute inset-0" onClick={cyclePhoto}>
        {photo?.url && (
          <Image src={photo.url} alt={listing.title} fittingType="fill" className="absolute inset-0 w-full h-full pointer-events-none" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
      </div>

      {photos.length > 1 && (
        <div className="absolute top-3 inset-x-4 flex gap-1 pointer-events-none">
          {photos.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/35"}`} />
          ))}
        </div>
      )}

      {/* Stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-6 rotate-[-12deg] border-4 border-emerald-400 text-emerald-400 font-heading font-bold text-2xl px-3 py-1 rounded-lg pointer-events-none"
      >
        SAVED
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-8 right-6 rotate-[12deg] border-4 border-red-400 text-red-400 font-heading font-bold text-2xl px-3 py-1 rounded-lg pointer-events-none"
      >
        PASS
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-white pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-white/85 mb-1">
          <MapPin className="w-3.5 h-3.5" /> {prettifyArea(listing.area)}
          {listing.petFriendly && <span className="bg-white/20 rounded-full px-2 py-0.5">Pet-friendly</span>}
        </div>
        <h2 className="font-heading text-2xl font-semibold leading-tight">{listing.title}</h2>
        <div className="flex items-center gap-4 text-sm text-white/90 mt-1.5">
          <span className="inline-flex items-center gap-1"><BedDouble className="w-4 h-4" /> {listing.bedrooms}</span>
          <span className="inline-flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.bathrooms}</span>
          <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" /> Sleeps {listing.sleeps}</span>
          {price?.from != null && (
            <span className="ml-auto font-medium">From ${Math.round(price.from)}/night</span>
          )}
        </div>
        <Link
          to={`/listing/${listing.slug || listing.id}`}
          className="pointer-events-auto inline-flex items-center gap-1 text-xs text-white/80 underline underline-offset-2 mt-2 hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          View full details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

function EndScreen({ likes, onRestart, onSeeMatches }) {
  return (
    <div className="absolute inset-0 bg-card rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center text-center p-8">
      <div className="w-14 h-14 rounded-full bg-coast-sand flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-coast-ocean" />
      </div>
      {likes > 0 ? (
        <>
          <h2 className="font-heading text-xl font-semibold text-coast-navy mb-1">
            That's every home — and you found {likes} {likes === 1 ? "match" : "matches"}.
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your saved homes are waiting. Pick your dates and make it official.
          </p>
          <Button onClick={onSeeMatches} className="bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            See your matches
          </Button>
          <button onClick={onRestart} className="text-xs text-muted-foreground underline mt-4 hover:text-coast-navy">
            Start over (bring back homes you passed on)
          </button>
        </>
      ) : (
        <>
          <h2 className="font-heading text-xl font-semibold text-coast-navy mb-1">
            You've seen every home.
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tough crowd. Want another look? Second impressions win people over all the time.
          </p>
          <Button onClick={onRestart} className="bg-coast-sunset hover:bg-coast-sunset-deep text-white">
            Start over
          </Button>
        </>
      )}
    </div>
  );
}