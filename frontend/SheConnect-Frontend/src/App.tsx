import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import { apiFetch } from './utils/api';

import Home from './pages/Landing';
import Profile from './pages/Profile';
import SocialHub from './pages/SocialHub';
import Feed from './pages/Feed';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import CreatePostCard from './components/feed/CreatePostCard';
import { isTokenValid } from './utils/auth';
import { ThemeProvider } from './contexts/ThemeProvider';

function LandingRoute() {
  return isTokenValid() ? <Navigate to="/feed" replace /> : <Home />;
}

function AuthenticatedLayout() {
  useEffect(() => {
    let updating = false;

    async function updatePresence() {
      if (document.visibilityState !== 'visible' || updating) return;
      updating = true;
      try {
        await apiFetch<{ message: string }>('/api/users/me/presence', { method: 'PATCH' });
      } catch (error) {
        console.error('Unable to update online presence:', error);
      } finally {
        updating = false;
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void updatePresence();
    };

    void updatePresence();
    const intervalId = window.setInterval(() => void updatePresence(), 30_000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingRoute />} />
          <Route path="/auth" element={<Auth />} />

          {/* Navigation and app pages are only shown after session verification */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/create-post" element={<CreatePostCard />} />
              <Route path="/social" element={<SocialHub />} />
              <Route path="/conversations" element={<SocialHub />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
