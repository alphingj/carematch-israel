import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './pages/Layout';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const JobBoard = lazy(() => import('./pages/JobBoard'));
const CreateJob = lazy(() => import('./pages/CreateJob'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  const isEmailAdmin = user.emailVerified && (user.email === 'alphingj@gmail.com' || user.email === 'alphingrowthchannel@gmail.com');
  if (!isEmailAdmin && (!profile || !profile.onboardingCompleted)) return <Navigate to="/onboarding" />;
  
  return <Component />;
}

function OnboardingRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  const isEmailAdmin = user.emailVerified && (user.email === 'alphingj@gmail.com' || user.email === 'alphingrowthchannel@gmail.com');
  if (isEmailAdmin || profile?.onboardingCompleted) return <Navigate to="/jobs" />;
  
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  const isEmailAdmin = user.emailVerified && (user.email === 'alphingj@gmail.com' || user.email === 'alphingrowthchannel@gmail.com');
  const isRoleAdmin = profile?.role === 'admin';
  
  if (!isEmailAdmin && !isRoleAdmin) return <Navigate to="/" />;
  return <Component />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <Home />
                </Suspense>
              } />
              <Route path="onboarding" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <OnboardingRoute component={Onboarding} />
                </Suspense>
              } />
              <Route path="jobs" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <ProtectedRoute component={JobBoard} />
                </Suspense>
              } />
              <Route path="jobs/create" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <ProtectedRoute component={CreateJob} />
                </Suspense>
              } />
              <Route path="jobs/:id" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <ProtectedRoute component={JobDetail} />
                </Suspense>
              } />
              <Route path="profile" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <ProtectedRoute component={Profile} />
                </Suspense>
              } />
              <Route path="admin" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <AdminRoute component={Admin} />
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                  <NotFound />
                </Suspense>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
