import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated, isOffline } = useAuth();
  const location = useLocation();

  // Lista de rotas públicas relacionadas a autenticação
  const publicAuthRoutes = ['/login', '/register', '/verify-2fa', '/forgot-password'];

  if (loading) {
    return (
      <div className="loading-container">
        <div>Verificando autenticação...</div>
      </div>
    );
  }

  // Se estiver em uma rota pública de auth, permite o acesso
  if (publicAuthRoutes.includes(location.pathname)) {
    return children;
  }

  // Permite acesso offline se tiver user local
  if (isOffline && user) {
    return children;
  }

  // Redireciona para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;