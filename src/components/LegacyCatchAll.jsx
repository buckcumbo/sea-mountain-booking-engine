import { useLocation, Navigate, Link } from "react-router-dom";
import { resolveLegacyPath } from "@/lib/legacyRedirects";
import PageNotFound from "@/lib/PageNotFound";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import Seo from "@/components/Seo";

function GonePage() {
  return (
    <>
      <Seo
        title="Page Removed | Sea Mountain Vacations"
        path="/removed"
        robots="noindex,nofollow"
      />
      <div className="min-h-screen flex flex-col bg-white">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-7xl font-light text-slate-300">410</h1>
              <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-medium text-slate-800">
                This page has been removed
              </h2>
              <p className="text-slate-600 leading-relaxed">
                The content you're looking for is no longer available.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Go Home
              </Link>
              <Link
                to="/search"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Browse Rentals
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

export default function LegacyCatchAll() {
  const location = useLocation();
  const result = resolveLegacyPath(location.pathname);
  if (result?.to) return <Navigate to={result.to} replace />;
  if (result?.gone) return <GonePage />;
  return <PageNotFound />;
}