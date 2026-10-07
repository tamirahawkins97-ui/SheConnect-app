import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';

import Home from './pages/Landing';
import Profile from './pages/Profile';
import SocialHub from './pages/SocialHub';
import Feed from './pages/Feed';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import CreatePostCard from './components/feed/CreatePostCard';

function AuthenticatedLayout() {
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
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
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
  );
}

export default App;
