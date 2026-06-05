import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FloatingAiChat } from '../ai/FloatingAiChat';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If specified, only users with one of these roles can access the route */
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show a loading spinner while validating the session
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0A0F1A',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(34,197,94,0.2)',
            borderTop: '3px solid #22C55E',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User is logged in but doesn't have the right role.
    // Redirect them to their appropriate dashboard instead of a 403 page.
    const roleRoute = user.role === 'admin' ? '/admin' : user.role === 'lecturer' ? '/lecturer' : '/dashboard';
    return <Navigate to={roleRoute} replace />;
  }

  return (
    <>
      {children}
      <FloatingAiChat />
    </>
  );
};
