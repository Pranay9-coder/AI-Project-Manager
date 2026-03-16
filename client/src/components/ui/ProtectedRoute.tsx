import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'developer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { token, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-surface-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!token || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role_type !== requiredRole) {
    return <Navigate to={profile.role_type === 'manager' ? '/manager' : '/developer'} replace />;
  }

  return <>{children}</>;
}
