import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta al context sea correcta

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Verificando permisos...</div>;
  }

  // 1. Si no está logueado -> Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si se requiere un rol específico y el usuario NO lo tiene -> Dashboard
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}