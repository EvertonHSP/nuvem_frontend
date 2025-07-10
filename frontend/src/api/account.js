import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:5000/api';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        return Promise.reject({
          message: 'Sessão expirada ou inválida',
          code: 'SESSION_EXPIRED',
          originalError: error
        });
      }
      return Promise.reject({
        message: error.response.data?.message || 'Erro na requisição',
        code: 'API_ERROR',
        originalError: error
      });
    } else if (error.request) {
      return Promise.reject({
        message: 'Sem resposta do servidor',
        code: 'NETWORK_ERROR',
        originalError: error
      });
    }
    return Promise.reject({
      message: 'Erro ao configurar requisição',
      code: 'REQUEST_ERROR',
      originalError: error
    });
  }
);


const requestPasswordRecovery = async (email) => {
  try {
    console.log('[account.js] Requesting password recovery for:', email);
    const response = await axios.post(`${API_URL}/account/recuperar-senha`, {
      email
    });
    return response.data;
  } catch (error) {
    console.error('[account.js] Password recovery request error:', error);
    throw error;
  }
};

const validateRecoveryCode = async (email, code) => {
  try {
    console.log('[account.js] Validating recovery code for:', email);
    const response = await axios.post(`${API_URL}/account/validar-codigo-recuperacao`, {
      email,
      codigo: code
    });
    return response.data;
  } catch (error) {
    console.error('[account.js] Recovery code validation error:', error);
    throw error;
  }
};


const updatePasswordWithRecoveryToken = async (token, newPassword) => {
  try {
    console.log('[account.js] Updating password with recovery token');
    const response = await axios.post(`${API_URL}/account/atualizar-senha-recuperacao`, {
      nova_senha: newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('[account.js] Password update error:', error);
    throw error;
  }
};


const requestAccountDeletion = async (token, password) => {
  try {
    console.log('[account.js] Requesting account deletion');
    const response = await axios.post(`${API_URL}/account/excluir`, {
      password
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('[account.js] Account deletion request error:', error);
    throw error;
  }
};


const confirmAccountDeletion = async (token, code) => {
  try {
    console.log('[account.js] Confirming account deletion with 2FA code');
    const response = await axios.post(`${API_URL}/account/confirmar-exclusao`, {
      codigo: code
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('[account.js] Account deletion confirmation error:', error);
    throw error;
  }
};

const updatePassword = async (token, senhaAtual, novaSenha) => {
  try {
    console.log('[account.js] Updating password via authenticated user');
    const response = await axios.post(
      `${API_URL}/account/atualizar-senha`,
      {
        senha_atual: senhaAtual,
        nova_senha: novaSenha
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('[account.js] Authenticated password update error:', error);
    throw error;
  }
};


export default {
  requestPasswordRecovery,
  validateRecoveryCode,
  updatePasswordWithRecoveryToken,
  requestAccountDeletion,
  confirmAccountDeletion,
  updatePassword
};