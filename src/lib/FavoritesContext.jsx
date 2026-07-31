import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const FavoritesContext = createContext(null);

// Logged-out: favorites live in-memory (reset on reload).
// Logged-in: persisted to the Favorite entity (RLS-scoped to own rows).
export function FavoritesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]); // [{ id?, listingId }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          // Filter to THIS user's rows explicitly. RLS lets admins read every
          // user's favorites (needed for support), so an admin's .list() would
          // return other people's rows — which once showed one user's hearts
          // to another. Ownership is asserted here, not inferred from RLS.
          const favs = await base44.entities.Favorite.filter(
            { userId: user?.id },
            "-created_date",
            500
          );
          if (!cancelled) {
            setItems((favs || []).map((f) => ({ id: f.id, listingId: f.listingId })));
          }
        } catch {
          if (!cancelled) setItems([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        setItems([]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const isFavorite = useCallback(
    (listingId) => items.some((f) => f.listingId === listingId),
    [items]
  );

  const toggle = useCallback(
    async (listingId) => {
      const existing = items.find((f) => f.listingId === listingId);
      if (isAuthenticated) {
        if (existing) {
          setItems((prev) => prev.filter((f) => f.listingId !== listingId));
          try {
            await base44.entities.Favorite.delete(existing.id);
          } catch {
            setItems((prev) => [...prev, { id: existing.id, listingId }]);
          }
        } else {
          setItems((prev) => [...prev, { listingId }]);
          try {
            const created = await base44.entities.Favorite.create({
              userId: user?.id || "",
              listingId,
            });
            setItems((prev) =>
              prev.map((f) => (f.listingId === listingId ? { id: created.id, listingId } : f))
            );
          } catch {
            setItems((prev) => prev.filter((f) => f.listingId !== listingId));
          }
        }
      } else {
        setItems((prev) =>
          existing ? prev.filter((f) => f.listingId !== listingId) : [...prev, { listingId }]
        );
      }
    },
    [items, isAuthenticated, user]
  );

  const value = { items, isFavorite, toggle, count: items.length, isAuthenticated, loading };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}