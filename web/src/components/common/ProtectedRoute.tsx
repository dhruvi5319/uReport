import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

type PermissionLevel = 'staff' | 'public' | 'anonymous';
const RANK: Record<PermissionLevel, number> = { anonymous: 0, public: 1, staff: 2 };

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: PermissionLevel;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'public' }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRole !== 'anonymous') {
    const userRank = RANK[user.role] ?? 0;
    const required = RANK[requiredRole] ?? 0;
    if (userRank < required) return <Navigate to="/tickets" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
