// src/pages/Account/ChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import './style/Account.css';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const { updatePassword, loading, error } = useAccount();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações locais
    if (newPassword !== confirmPassword) {
      setLocalError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLocalError('');

    // Chama a função do contexto
    const success = await updatePassword(currentPassword, newPassword);
    
    if (success) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (success) {
    return (
      <div className="password-change-success">
        <h2>Senha alterada com sucesso!</h2>
        <p>Redirecionando para a página inicial...</p>
      </div>
    );
  }

  return (
    <div className="change-password-container">
      <h2>Mudar Senha</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentPassword">Senha Atual</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="newPassword">Nova Senha (mínimo 6 caracteres)</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        
        {(localError || error) && (
          <div className="error-message">{localError || error}</div>
        )}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processando...' : 'Alterar Senha'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;