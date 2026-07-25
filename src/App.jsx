import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Admin from '@/pages/Admin';
import Today from '@/pages/Today';
import AdminListings from '@/pages/admin/AdminListings';
import AdminListingEditor from '@/pages/admin/AdminListingEditor';
import AdminGuard from '@/components/admin/AdminGuard';
import Home from '@/pages/Home';
import PublicLayout from '@/components/layout/PublicLayout';
import Search from '@/pages/Search';
import ListingDetail from '@/pages/ListingDetail';
import AreaGuidePage from '@/pages/AreaGuidePage';
import Guides from '@/pages/Guides';
import GuideDetail from '@/pages/GuideDetail';
import CollectionsIndex from '@/pages/CollectionsIndex';
import CollectionDetail from '@/pages/CollectionDetail';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import ListYourProperty from '@/pages/ListYourProperty';
import SpecialOffers from '@/pages/SpecialOffers';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Favorites from '@/pages/Favorites';
import MyTrips from '@/pages/MyTrips';
import MyTripDetail from '@/pages/MyTripDetail';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
      <Route path="/admin/listings" element={<AdminGuard><AdminListings /></AdminGuard>} />
      <Route path="/admin/listings/:slug" element={<AdminGuard><AdminListingEditor /></AdminGuard>} />
      <Route path="/today" element={<Today />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <FavoritesProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/listing/:slug" element={<ListingDetail />} />
              <Route path="/area/:slug" element={<AreaGuidePage />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideDetail />} />
              <Route path="/collections" element={<CollectionsIndex />} />
              <Route path="/collections/:slug" element={<CollectionDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/list-your-property" element={<ListYourProperty />} />
              <Route path="/special-offers" element={<SpecialOffers />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/my-trips" element={<MyTrips />} />
              <Route path="/my-trips/:reservationId" element={<MyTripDetail />} />
            </Route>
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}

export default App