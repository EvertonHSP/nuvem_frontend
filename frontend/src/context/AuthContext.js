import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/auth';
import { saveUserSession, getCurrentUser, clearUserSession } from '../database/usuarios';
import db from '../database/db'; 

const AuthContext = createContext();
const PUBLIC_AUTH_ROUTES = [
  '/login',
  '/register',
  '/verify-2fa',
  '/forgot-password',
  '/verify-register'
];
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
      const updateNetworkStatus = () => {
        setIsOffline(!navigator.onLine);
      };

      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);
      updateNetworkStatus(); // Verificar status inicial

      return () => {
        window.removeEventListener('online', updateNetworkStatus);
        window.removeEventListener('offline', updateNetworkStatus);
      };
    }, []);

  
  const checkSession = async (jwtToken) => {
    try {
      const response = await authApi.getProfile(jwtToken);
      return {
        isValid: true,
        userData: response
      };
    } catch (error) {
      // Erro de autenticação (token inválido/expirado)
      if (error.code === 'SESSION_EXPIRED' || error.response?.status === 401) {
        return { isValid: false };
      }
      
      // Erro de rede (offline)
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('NETWORK_ERROR');
      }
      
      // Outros erros de API
      console.error('Erro ao verificar sessão:', error);
      throw error;
    }
  };

  
  const handleLogout = useCallback(async () => {
    try {
      if (user?.jwt_token && !isOffline) {
        await authApi.logout(user.jwt_token);
      }
    } catch (error) {
      console.error('Erro no logout API:', error);
    } finally {
      try {
        await clearUserSession();
        setUser(null);
        setIsOffline(false);
        navigate('/login');
      } catch (dbError) {
        console.error('Erro ao limpar sessão:', dbError);
      }
    }
  }, [user?.jwt_token, isOffline, navigate]);

  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!db.isOpen()) {
          await db.open();
        }

        const storedUser = await getCurrentUser();
        
        // Verifica se a rota atual não é uma rota pública de autenticação
        const currentPath = window.location.pathname;
        const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(route => 
          currentPath.startsWith(route)
        );

        // Só verifica a sessão se tiver um token e não estiver em uma rota pública
        if (storedUser?.jwt_token && !isPublicAuthRoute) {
          try {
            const { isValid, userData } = await checkSession(storedUser.jwt_token);
            
            if (isValid) {
              const updatedUser = {
                ...storedUser,
                ...userData
              };
              setUser(updatedUser);
              await saveUserSession(updatedUser);
            } else {
              await handleLogout();
            }
          } catch (error) {
            if (error.message === 'NETWORK_ERROR') {
              setIsOffline(true);
              setUser(storedUser);
              await handleLogout();
            } else {
              await handleLogout();
            }
          }
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [navigate, handleLogout]);


  const register = async (email, password, nome) => {
    try {
      const response = await authApi.register(email, password, nome);
      console.log('Resposta do registro:', response.data);
      
      if (response.data.access_token) {
        const tempUserData = {
          id: `temp_${email}`, // ID temporário baseado no email
          email: email,
          nome: nome,
          foto_perfil: '',
          jwt_token: response.data.access_token
        };
        
        await saveUserSession(tempUserData);
        setUser(tempUserData);
      }
      
      return response.status;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const verifyRegister = async (email, code) => {
    try {
      // 1. Recupera o token temporário armazenado
      const userSession = await getCurrentUser();
      const tempToken = userSession?.jwt_token;
      
      if (!tempToken) {
        throw new Error('Token temporário não encontrado');
      }

      console.log('Token temporário recuperado:', tempToken ? '***' : null);

      // 2. Passa o token na chamada da API
      const response = await authApi.verifyRegister(email, code, tempToken);
      
      console.log('Resposta completa:', response);
      
      const responseData = response.data || response;
      
      if (!responseData.access_token || !responseData.user_id) {
        console.error('Estrutura inesperada:', responseData);
        throw new Error('Dados essenciais faltando na resposta');
      }

      const userData = {
        id: responseData.user_id || responseData.id,
        email: responseData.email || email,
        nome: responseData.nome || 'Usuário',
        foto_perfil: responseData.foto_perfil || '',
        jwt_token: responseData.access_token
      };

      console.log('Dados do usuário preparados:', userData);
      
      await saveUserSession(userData);
      setUser(userData);
      
      return { success: true };

    } catch (error) {
      console.error('Erro na verificação:', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      throw new Error(error.response?.data?.message || 'Falha na verificação do código');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const verifyLogin = async (email, code) => {
    try {
      const response = await authApi.verifyLogin(email, code);
      console.log('AuthContext: Resposta da API:', response.data);
      console.log("AuthContext: Resposta da API:", response);
      
      if (!response || !response.access_token || !response.user_id) {
        console.error('Estrutura de resposta inválida:', response);
        throw new Error('Resposta da API em formato inválido');
      }

      const userData = {
        id: response.user_id,
        email: response.email || email, 
        nome: response.nome || 'Usuário',
        foto_perfil: response.foto_perfil || '',
        jwt_token: response.access_token
      };

      console.log('Dados do usuário:', userData);
      
      await saveUserSession(userData);
      setUser(userData);
      
      return { success: true };

    } catch (error) {
      console.error('Erro no verifyLogin:', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      throw new Error(error.response?.data?.message || 'Falha na verificação 2FA');
    }
  };

  const refreshSession = async () => {
    if (!user?.jwt_token) return false;
    
    try {
      const { isValid, userData } = await checkSession(user.jwt_token);
      if (isValid) {
        const updatedUser = {
          ...user,
          ...userData
        };
        setUser(updatedUser);
        await saveUserSession(updatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh session error:', error);
      return false;
    }
  };

return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOffline,
        isAuthenticated: !!user?.jwt_token,
        register,
        verifyRegister,
        login,
        verifyLogin,
        logout: handleLogout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);