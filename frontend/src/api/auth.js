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

const register = async (email, password, nome) => {
  try {
    console.log('[auth.js] Register - Dados enviados para /auth/register:', {
      email,
      password: '***', // Não logamos a senha por segurança
      nome
    });

    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      nome
    });

    console.log('[auth.js] Register - Resposta recebida:', {
      status: response.status,
      data: response.data
    });

    return response;
  } catch (error) {
    console.error('[auth.js] Register - Erro na requisição:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

const verifyRegister = async (email, code, tempToken) => {
  try {
    console.log('[auth.js] VerifyRegister - Dados enviados para /auth/verify-register:', {
      email,
      code,
      tempToken: tempToken ? '***' : null // Logamos apenas a presença do token por segurança
    });

    const response = await axios.post(`${API_URL}/auth/verify-register`, {
      email,
      codigo: code
    }, {
      headers: {
        'Authorization': `Bearer ${tempToken}`
      }
    });

    console.log('[auth.js] VerifyRegister - Resposta recebida:', {
      status: response.status,
      data: response.data
    });

    return response;
  } catch (error) {
    console.error('[auth.js] VerifyRegister - Erro na requisição:', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
};


const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const verifyLogin = async (email, code) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-login`, {
      email,
      codigo: code
    });
    console.log("auth.js: Resposta da API:", response);
    console.log("auth.js: Resposta da API:", response.data);
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Resposta da API inválida');
    }

    return response.data;
  } catch (error) {
    
    if (error.response?.data?.error === "Código 2FA inválido") {
      error.message = "Código de verificação inválido";
    }
    throw error;
  }
};

const logout = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/auth/logout`, null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const refreshToken = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  register,
  verifyRegister,
  login,
  verifyLogin,
  logout,
  getProfile,
  refreshToken
};