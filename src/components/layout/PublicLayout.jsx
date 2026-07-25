import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { trackPageView } from "@/lib/analytics";

// Shared chrome for the public site (Homepage, Search, ListingDetail).
// Back-office pages (Admin, Today) are NOT wrapped in this layout.
export default function PublicLayout() {
  const location = useLocation();

  // Fire a debounced page_view on every public route change.
  // Admin routes are excluded by trackPageView internally.
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return (
    <div className="brand-scope min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}