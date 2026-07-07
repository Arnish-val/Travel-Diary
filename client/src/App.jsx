import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PageShell from '@/components/layout/PageShell';
import useAuth from '@/hooks/useAuth';

// Lazy-loaded pages for code splitting
const HomePage          = lazy(() => import('@/pages/HomePage'));
const LoginPage         = lazy(() => import('@/pages/LoginPage'));
const RegisterPage      = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'));
const MapExplorerPage   = lazy(() => import('@/pages/MapExplorerPage'));
const SearchPage        = lazy(() => import('@/pages/SearchPage'));
const PlanningPage      = lazy(() => import('@/pages/PlanningPage'));
const ProfilePage       = lazy(() => import('@/pages/ProfilePage'));
const TripDetailPage    = lazy(() => import('@/pages/TripDetailPage'));
const AddEditTripPage   = lazy(() => import('@/pages/AddEditTripPage'));
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'));
const SocialFeedPage    = lazy(() => import('@/pages/SocialFeedPage'));
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
    <span className="spinner" style={{ width: 40, height: 40 }} />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#14b8a6', secondary: '#1e1e2e' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e1e2e' } },
        }}
      />
      <PageShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicOnlyRoute><HomePage /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/trips/new" element={<ProtectedRoute><AddEditTripPage /></ProtectedRoute>} />
            <Route path="/trips/:id" element={<ProtectedRoute><TripDetailPage /></ProtectedRoute>} />
            <Route path="/trips/:id/edit" element={<ProtectedRoute><AddEditTripPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapExplorerPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/plan" element={<ProtectedRoute><PlanningPage /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><SocialFeedPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageShell>
    </BrowserRouter>
  );
};

export default App;
