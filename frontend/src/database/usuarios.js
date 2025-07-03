import db from './db';
import { encryptData, decryptData } from '../utils/encryption';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-secret-key';

export const saveUserSession = async (userData) => {
  try {
    const encryptedToken = encryptData(userData.jwt_token, SECRET_KEY);
    
    // Se o ID for nulo, usar o email como chave temporária ou gerar um ID temporário
    const idToSave = userData.id || `temp_${userData.email}`;
    
    await db.usuarios_cache.put({
      id: idToSave, // Garante que nunca será null
      email: userData.email,
      nome: userData.nome,
      foto_perfil: userData.foto_perfil || '',
      jwt_token: encryptedToken
    });
    
    return true;
  } catch (error) {
    console.error('Error saving user session:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
 
    if (db.isOpen() === false) {
      await db.open();
    }
    
    const user = await db.usuarios_cache.limit(1).first();
    if (!user) return null;
    
    const decryptedToken = decryptData(user.jwt_token, SECRET_KEY);
    
    return {
      ...user,
      jwt_token: decryptedToken
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    
    if (error.name === 'DatabaseClosedError') {
      await db.open();
      return getCurrentUser(); // Chama recursivamente
    }
    return null;
  }
};

export const clearUserSession = async () => {
  try {
    await db.usuarios_cache.clear();
    return true;
  } catch (error) {
    console.error('Error clearing user session:', error);
    return false;
  }
};