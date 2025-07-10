import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import accountApi from '../api/account';
import { useAuth } from './AuthContext';
import { clearUserSession } from '../database/usuarios';

const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(null); // null | 'requested' | 'code_validated' | 'completed'
  const [accountDeletionStep, setAccountDeletionStep] = useState(null); // null | 'requested' | 'code_sent' | 'completed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 

  const resetState = useCallback(() => {
    setRecoveryEmail('');
    setRecoveryStep(null);
    setAccountDeletionStep(null);
    setError(null);
  }, []);
  
  const requestPasswordRecovery = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await accountApi.requestPasswordRecovery(email);
      setRecoveryEmail(email);
      setRecoveryStep('requested');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to request password recovery');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateRecoveryCode = useCallback(async (code) => {
    if (!recoveryEmail) {
      setError('No recovery email found');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.validateRecoveryCode(recoveryEmail, code);
      setRecoveryStep('code_validated');
      return response.token; // Return the temporary token
    } catch (err) {
      setError(err.message || 'Invalid or expired recovery code');
      return false;
    } finally {
      setLoading(false);
    }
  }, [recoveryEmail]);

  const updatePasswordWithRecoveryToken = useCallback(async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await accountApi.updatePasswordWithRecoveryToken(token, newPassword);
      setRecoveryStep('completed');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update password');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);


  const requestAccountDeletion = useCallback(async (password) => {
    setLoading(true);
    setError(null);
    
    try {
      await accountApi.requestAccountDeletion(user.jwt_token, password);
      setAccountDeletionStep('code_sent');
      return true;
    } catch (err) {
      setError(err.message || 'Failed to request account deletion');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const confirmAccountDeletion = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.confirmAccountDeletion(user.jwt_token, code);
      if (response.logout) {
        await logout();
        await clearUserSession();
      }
      setAccountDeletionStep('completed');
      return true;
    } catch (err) {
      setError(err.message || 'Invalid confirmation code');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  const cancelAccountDeletion = useCallback(() => {
    resetState();
  }, [resetState]);

const updatePassword = useCallback(async (senhaAtual, novaSenha) => {
    if (!user || !user.jwt_token) {
        setError("Usuário não autenticado. Faça login novamente.");
        return false;
    }

    setLoading(true);
    setError(null);
    try { 
        console.log('Atualizando senha com token:', user.jwt_token);
        await accountApi.updatePassword(user.jwt_token, senhaAtual, novaSenha);
        return true;
    } catch (err) {
        setError(err.message || 'Erro ao alterar a senha');
        return false;
    } finally {
        setLoading(false);
    }
}, [user]); // ✅ Adicione `user` como dependência!


  return (
    <AccountContext.Provider
      value={{
        // State
        recoveryEmail,
        recoveryStep,
        accountDeletionStep,
        loading,
        error,
        
        // Password Recovery Methods
        requestPasswordRecovery,
        validateRecoveryCode,
        updatePasswordWithRecoveryToken,
        
        // Account Deletion Methods
        requestAccountDeletion,
        confirmAccountDeletion,
        cancelAccountDeletion,

        updatePassword,
        
        // Utilities
        resetAccountState: resetState

        
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};