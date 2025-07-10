// src/pages/Account/DeleteAccount.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import './style/Account.css';

const DeleteAccount = () => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { requestAccountDeletion, confirmAccountDeletion } = useAccount();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmation !== 'DELETAR CONTA') {
      setError('Digite exatamente "DELETAR CONTA" para confirmar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Primeiro passo: solicitar exclusão com a senha
      await requestAccountDeletion(password);
      
      // Segundo passo: confirmar com o código 2FA (simulado aqui)
      const code = prompt('Digite o código de confirmação enviado para seu email:');
      if (code) {
        await confirmAccountDeletion(code);
        await logout();
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Erro ao deletar conta');
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-container">
      <h2>Deletar Conta</h2>
      <p className="warning-message">
        ATENÇÃO: Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">Digite sua senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmation">
            Digite <strong>DELETAR CONTA</strong> para confirmar
          </label>
          <input
            type="text"
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          disabled={loading}
          className="delete-button"
        >
          {loading ? 'Processando...' : 'Deletar Conta Permanentemente'}
        </button>
      </form>
    </div>
  );
};

export default DeleteAccount;