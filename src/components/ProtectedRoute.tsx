import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const normalizedUserRole = user.role.replace(/[_-]/g, ' ').trim().toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.replace(/[_-]/g, ' ').trim().toLowerCase());
    
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <Outlet />;
}
