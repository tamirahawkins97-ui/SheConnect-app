// src/components/layout/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isTokenValid, removeToken } from '../../utils/auth';
import { apiFetch } from '../../utils/api';
import type { User } from '../../types';

 function ProtectedRoute() {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fast client-side check: token exists and isn't expired
    if (!isTokenValid()) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // 2. Server-side check: confirm token is valid in MongoDB
    async function verifyUser() {
      try {
        await apiFetch<{ message: string; user: User }>('/api/users/me');
        setIsAuthenticated(true);
      } catch (err) {
        removeToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    verifyUser();
  }, []);

  // 3. Show loading indicator while waiting for the server
  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '50vh' }}>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Verifying session...</p>
      </div>
    );
  }

  // 4. Return unauthenticated visitors to the sign-in landing page.
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 5. User is authenticated, render the requested child route
  return <Outlet />;
}

export default ProtectedRoute;