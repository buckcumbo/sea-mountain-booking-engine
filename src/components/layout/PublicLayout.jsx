import React from "react";
import { Outlet } from "react-router-dom";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

// Shared chrome for the public site (Homepage, Search, ListingDetail).
// Back-office pages (Admin, Today) are NOT wrapped in this layout.
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}