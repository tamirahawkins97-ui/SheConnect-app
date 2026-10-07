// src/components/layout/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isTokenValid, removeToken } from '../../utils/auth';
import { apiFetch } from '../../utils/api';
import type { User } from '../../types';

function ProtectedRoute() {
  const location = useLocation();
  const tokenValid = isTokenValid();
  const [loading, setLoading] = useState<boolean>(tokenValid);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (!tokenValid) return;

    async function verifyUser() {
      try {
        await apiFetch<{ message: string; user: User }>('/api/users/me');
        setIsAuthenticated(true);
      } catch {
        removeToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    verifyUser();
  }, [tokenValid]);

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
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // 5. User is authenticated, render the requested child route
  return <Outlet />;
}

export default ProtectedRoute;