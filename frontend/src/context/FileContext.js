import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import fileApi from '../api/file';
import { useAuth } from './AuthContext';
import db from '../database/db';

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  // Estados principais
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 10737418240 }); // 10GB padrão
  const [loadingStates, setLoadingStates] = useState({
    files: false,
    upload: false,
    folders: false,
    delete: false
  });
  const [errors, setErrors] = useState({
    files: null,
    upload: null,
    folders: null,
    delete: null
  });

  // Novos estados para o gerenciamento de pastas
  const [currentFolderContent, setCurrentFolderContent] = useState({
    folder: null,
    subfolders: [],
    files: [],
    path: []
  });
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderError, setFolderError] = useState(null);

  const { user, isOffline } = useAuth();

  // Função para registrar logs de auditoria
  const registerAuditLog = useCallback((action, metadata = {}) => {
    console.log('[Audit Log]', {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      action,
      ip: window.REMOTE_IP || 'localhost',
      ...metadata
    });
  }, [user]);

  // Atualiza o uso de armazenamento
  const updateStorageUsage = useCallback(async () => {
    console.group('[FileContext] updateStorageUsage');
    try {
      if (isOffline) {
        const localUsed = files.reduce((sum, file) => sum + file.tamanho, 0);
        setStorageUsage(prev => ({ ...prev, used: localUsed }));
        console.log('Modo offline - usando cálculo local:', localUsed);
      } else {
        const serverData = await fileApi.getStorageUsage(user.jwt_token);
        setStorageUsage({
          used: serverData.used,
          quota: serverData.quota || storageUsage.quota
        });
        console.log('Dados do servidor:', serverData);
      }
    } catch (error) {
      console.error('Erro ao atualizar storage:', error);
    } finally {
      console.groupEnd();
    }
  }, [files, isOffline, user?.jwt_token, storageUsage.quota]);

  // Verifica quota antes de operações
  const checkStorageQuota = useCallback(async (fileSize) => {
    console.group('[FileContext] checkStorageQuota');
    try {
      await updateStorageUsage();
      const { used, quota } = storageUsage;
      const spaceNeeded = used + fileSize;

      console.log(`Verificando: ${spaceNeeded} / ${quota}`);

      if (spaceNeeded > quota) {
        const error = new Error(`Quota excedida. Disponível: ${formatBytes(quota - used)}`);
        error.code = 'QUOTA_EXCEEDED';
        error.available = quota - used;
        throw error;
      }
    } finally {
      console.groupEnd();
    }
  }, [storageUsage, updateStorageUsage]);

  // Formata bytes para leitura humana
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Carrega arquivos do usuário (manter a função original)
  const fetchUserFiles = useCallback(async (folderId = null) => {
    console.group('[FileContext] fetchUserFiles');
    
    if (!user?.jwt_token) {
      console.warn('Usuário não autenticado');
      console.groupEnd();
      return;
    }

    setLoadingStates(prev => ({ ...prev, files: true }));
    setErrors(prev => ({ ...prev, files: null }));

    try {
      console.log(`Buscando arquivos para a pasta ${folderId || 'raiz'}`);
      const response = await fileApi.getFiles(user.jwt_token, folderId);
      
      setFiles(response.data);
      await updateStorageUsage();
      
      registerAuditLog('LIST_FILES', { folderId, count: response.data.length });
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
      setErrors(prev => ({ ...prev, files: error.message }));
      
      if (isOffline) {
        console.log('Tentando carregar do cache offline...');
        const cachedFiles = await db.files.toArray();
        setFiles(cachedFiles);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, files: false }));
      console.groupEnd();
    }
  }, [user, isOffline, updateStorageUsage, registerAuditLog]);

  // Nova função para carregar conteúdo de pasta
const loadFolderContent = useCallback(async (folderId = null) => {
  console.group('[FileContext] loadFolderContent');
  console.log('Folder ID:', folderId);
  
  setFolderLoading(true);
  setFolderError(null);
  
  try {
    const response = await fileApi.listFolderContent(folderId, user.jwt_token);
    console.log('API Response:', response);
    
    if (!response.success) {
      throw new Error(response.error.message || 'Erro ao carregar pasta');
    }

    // Usa o path completo que vem da API em vez de construir manualmente
    const fullPath = response.data.path || [];
    
    console.log('Path completo da API:', fullPath);
    console.log('Dados da pasta atual:', response.data.pasta_atual);
    console.log('Subpastas:', response.data.pastas);
    console.log('Arquivos:', response.data.arquivos);

    setCurrentFolderContent({
      folder: response.data.pasta_atual,
      subfolders: response.data.pastas,
      files: response.data.arquivos,
      path: fullPath // Usa o path completo da API
    });

    console.log('Estado atualizado:', {
      folder: response.data.pasta_atual,
      subfolders: response.data.pastas,
      files: response.data.arquivos,
      path: fullPath
    });

    setFiles(response.data.arquivos);
    setCurrentFolder(folderId);

  } catch (err) {
    console.error('Erro ao carregar pasta:', err);
    setFolderError(err.message);
  } finally {
    setFolderLoading(false);
    console.groupEnd();
  }
}, [user]);


  const createFolder = async (folderName, parentFolderId = null) => {
    console.group('[FileContext] createFolder');
    setLoadingStates(prev => ({ ...prev, folders: true }));
    setFolderError(null);

    try {
      // Validação básica no client-side
      if (!folderName || folderName.trim().length === 0) {
        throw new Error('Nome da pasta não pode ser vazio');
      }

      console.log(`Criando pasta: ${folderName} dentro de ${parentFolderId || 'raiz'}`);
      
      // Chamada para a API via file.js
      const result = await fileApi.createFolder(
        folderName,
        parentFolderId,
        user.jwt_token
      );

      if (!result.success) {
        throw result.error;
      }

      console.log('Pasta criada com sucesso:', result.data);

      // Atualiza o estado das pastas
      if (parentFolderId === currentFolder || parentFolderId === currentFolderContent.folder?.id) {
        // Se criada na pasta atual, atualiza o conteúdo
        setCurrentFolderContent(prev => ({
          ...prev,
          subfolders: [...prev.subfolders, result.data.pasta]
        }));
      }

      // Atualiza a lista completa de pastas
      setFolders(prev => [...prev, result.data.pasta]);

      // Registro de auditoria
      registerAuditLog('FOLDER_CREATE', {
        folderId: result.data.pasta.id,
        parentId: parentFolderId,
        folderName: folderName
      });

      return {
        success: true,
        data: result.data,
        error: null
      };

    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      setFolderError(error.message);
      
      return {
        success: false,
        data: null,
        error: {
          message: error.message,
          code: error.code || 'FOLDER_CREATE_ERROR',
          details: error.details || null
        }
      };
    } finally {
      setLoadingStates(prev => ({ ...prev, folders: false }));
      console.groupEnd();
    }
  };


  // Upload de arquivo
  const uploadFile = async (fileData) => {
    console.group('[FileContext] uploadFile');
    setLoadingStates(prev => ({ ...prev, upload: true }));
    setErrors(prev => ({ ...prev, upload: null }));

    try {
      //await checkStorageQuota(fileData.file.size);
      const result = await fileApi.uploadFile(
        fileData.file,
        fileData.isPublic || false,
        fileData.tags || [],
        fileData.description || '',
        fileData.folderId || null,
        user.jwt_token
      );

      if (!result.success) throw result.error;

      setFiles(prev => [...prev, result.data]);
      await updateStorageUsage();
      
      registerAuditLog('UPLOAD', {
        fileId: result.data.id,
        size: fileData.file.size,
        isPublic: fileData.isPublic
      });

      return result;
    } catch (error) {
      console.error('Erro no upload:', error);
      setErrors(prev => ({ ...prev, upload: error.message }));
      return { success: false, error };
    } finally {
      setLoadingStates(prev => ({ ...prev, upload: false }));
      console.groupEnd();
    }
  };


// Download de arquivo
  const downloadFile = async (fileId) => {
    console.group('[FileContext] downloadFile');
    try {
      const result = await fileApi.downloadFile(fileId, user.jwt_token);
      registerAuditLog('DOWNLOAD', { fileId });
      return result;
    } catch (error) {
      console.error('Erro no download:', error);
      return { success: false, error };
    } finally {
      console.groupEnd();
    }
  };

  // Delete de arquivo
const deleteFile = async (fileId) => {
  console.group('[FileContext] deleteFile');
  setLoadingStates(prev => ({ ...prev, delete: true }));
  setErrors(prev => ({ ...prev, delete: null }));

  try {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) throw new Error('Arquivo não encontrado');

    const result = await fileApi.deleteFile(fileId, user.jwt_token);
    console.log(`\nerro result`, result);
    console.log(`\nerro result.success`, result.success);
    console.log(`\nerro result.error?.code`, result.error?.code);
    
    if (!result.success) {
      // Se for erro 403, retornamos a mensagem específica
      if (result.error?.code === 'FORBIDDEN') {
        throw new Error('Você não tem permissão para excluir esse arquivo');
      }
      throw result.error;
    }

    // Atualiza ambos os sistemas de estado
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setCurrentFolderContent(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
    
    await updateStorageUsage();
    registerAuditLog('DELETE', {
      fileId,
      fileName: fileToDelete.nome_original,
      size: fileToDelete.tamanho
    });

    return { ...result, message: 'Arquivo excluído com sucesso!' };
  } catch (error) {
    console.error('Erro ao deletar:', error);
    setErrors(prev => ({ ...prev, delete: error.message }));
    return { 
      success: false, 
      error,
      message: error.message || 'Erro ao excluir arquivo'
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, delete: false }));
    console.groupEnd();
  }
};

  // Efeito inicial - carrega conteúdo da raiz
  useEffect(() => {
    if (user) {
      loadFolderContent();
    }
  }, [user, loadFolderContent]);

  // Dentro do FileProvider, adicione estas funções:

// Função para compartilhar arquivo
const shareFile = async (fileId, options = {}) => {
  console.group('[FileContext] shareFile');
  try {
    if (!user?.jwt_token) {
      throw new Error('Usuário não autenticado');
    }

    const result = await fileApi.shareFile(
      fileId,
      {
        expiresAt: options.expiresAt,
        maxAccess: options.maxAccess
      },
      user.jwt_token
    );

    if (!result.success) {
      throw result.error;
    }

    registerAuditLog('SHARE_FILE', {
      fileId,
      shareUrl: result.data.share_url,
      expiresAt: result.data.expires_at,
      maxAccess: result.data.max_access
    });

    return result;
  } catch (error) {
    console.error('Erro ao compartilhar arquivo:', error);
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'SHARE_ERROR',
        details: error.details || null
      }
    };
  } finally {
    console.groupEnd();
  }
};

// Função para atualizar visibilidade do arquivo
const updateFileVisibility = async (fileId, isPublic) => {
  console.group('[FileContext] updateFileVisibility');
  try {
    if (!user?.jwt_token) {
      throw new Error('Usuário não autenticado');
    }

    const result = await fileApi.updateFileVisibility(
      fileId,
      isPublic,
      user.jwt_token
    );

    if (!result.success) {
      throw result.error;
    }

    // Atualiza o estado local do arquivo
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, publico: isPublic } : file
    ));

    // Atualiza também no currentFolderContent se estiver lá
    setCurrentFolderContent(prev => ({
      ...prev,
      files: prev.files.map(file => 
        file.id === fileId ? { ...file, publico: isPublic } : file
      )
    }));

    registerAuditLog('UPDATE_VISIBILITY', {
      fileId,
      isPublic,
      fileName: result.data.nome_arquivo
    });

    return result;
  } catch (error) {
    console.error('Erro ao atualizar visibilidade:', error);
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'VISIBILITY_ERROR',
        details: error.details || null
      }
    };
  } finally {
    console.groupEnd();
  }
};

// Função para obter informações de pré-visualização
const getFilePreviewInfo = async (fileId) => {
  console.group('[FileContext] getFilePreviewInfo');
  try {
    if (!user?.jwt_token) {
      throw new Error('Usuário não autenticado');
    }

    const result = await fileApi.getFilePreviewInfo(
      fileId,
      user.jwt_token
    );

    if (!result.success) {
      throw result.error;
    }

    return result;
  } catch (error) {
    console.error('Erro ao obter info de pré-visualização:', error);
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'PREVIEW_ERROR',
        details: error.details || null
      }
    };
  } finally {
    console.groupEnd();
  }
};

const getFilePreviewContent = async (fileId) => {
  console.group('[FileContext] getFilePreviewContent');
  try {
    if (!user?.jwt_token) {
      throw new Error('Usuário não autenticado');
    }

    const result = await fileApi.getFilePreviewContent(fileId, user.jwt_token);
    
    if (!result.success) {
      throw result.error;
    }

    // Registra log de auditoria
    registerAuditLog('FILE_PREVIEW_CONTENT', {
      fileId,
      contentType: result.headers['content-type']
    });

    return {
      ...result,
      // Adiciona informações úteis para o consumidor
      blobUrl: URL.createObjectURL(result.data),
      contentType: result.headers['content-type'],
      fileName: result.headers['content-disposition'] 
        ? result.headers['content-disposition'].split('filename=')[1] 
        : 'file'
    };
  } catch (error) {
    console.error('Erro ao obter conteúdo para pré-visualização:', error);
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'PREVIEW_CONTENT_ERROR',
        details: error.details || null
      }
    };
  } finally {
    console.groupEnd();
  }
};

const shareFolderWithUser = async (folderId, userEmail, permissions) => {
  console.group('[FileContext] shareFolderWithUser');
  setLoadingStates(prev => ({ ...prev, folders: true }));
  setFolderError(null);

  try {
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error('E-mail do usuário inválido');
    }

    console.log(`Compartilhando pasta ${folderId} com ${userEmail}`);
    
    const result = await fileApi.shareFolderWithUser(
      folderId,
      userEmail,
      permissions,
      user.jwt_token
    );

    if (!result.success) {
      throw result.error;
    }

    console.log('Pasta compartilhada com sucesso:', result.data);

    registerAuditLog('FOLDER_SHARE', {
      folderId,
      sharedWith: userEmail,
      permissions
    });

    return {
      success: true,
      data: result.data,
      error: null
    };

  } catch (error) {
    console.error('Erro ao compartilhar pasta:', error);
    setFolderError(error.message);
    
    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code || 'FOLDER_SHARE_ERROR',
        details: error.details || null
      }
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, folders: false }));
    console.groupEnd();
  }
};

const unshareFolderWithUser = async (folderId, userEmail) => {
  console.group('[FileContext] unshareFolderWithUser');
  setLoadingStates(prev => ({ ...prev, folders: true }));
  setFolderError(null);

  try {
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error('E-mail do usuário inválido');
    }

    console.log(`Removendo compartilhamento da pasta ${folderId} com ${userEmail}`);
    
    const result = await fileApi.unshareFolderWithUser(
      folderId,
      userEmail,
      user.jwt_token
    );

    if (!result.success) {
      throw result.error;
    }

    console.log('Compartilhamento removido com sucesso:', result.data);

    registerAuditLog('FOLDER_UNSHARE', {
      folderId,
      unsharedWith: userEmail
    });

    return {
      success: true,
      data: result.data,
      error: null
    };

  } catch (error) {
    console.error('Erro ao remover compartilhamento:', error);
    setFolderError(error.message);
    
    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code || 'FOLDER_UNSHARE_ERROR',
        details: error.details || null
      }
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, folders: false }));
    console.groupEnd();
  }
};

const getFolderShares = async (folderId) => {
  console.group('[FileContext] getFolderShares');
  setLoadingStates(prev => ({ ...prev, folders: true }));
  setFolderError(null);

  try {
    if (!folderId) {
      throw new Error('ID da pasta inválido');
    }

    console.log(`Buscando compartilhamentos da pasta ${folderId}...`);

    const result = await fileApi.getFolderShares(folderId, user.jwt_token);

    if (!result.success) {
      throw result.error;
    }

    console.log('Compartilhamentos encontrados:', result.data);

    return {
      success: true,
      data: result.data,
      error: null
    };

  } catch (error) {
    console.error('Erro ao buscar compartilhamentos da pasta:', error);
    setFolderError(error.message);

    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code || 'FOLDER_SHARES_FETCH_ERROR',
        details: error.details || null
      }
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, folders: false }));
    console.groupEnd();
  }
};

const deleteFolder = async (folderId) => {
  console.group('[FileContext] deleteFolder');
  setLoadingStates(prev => ({ ...prev, folders: true }));
  setFolderError(null);

  try {
    if (!folderId) {
      throw new Error('ID da pasta inválido');
    }

    console.log(`Excluindo logicamente a pasta ${folderId}...`);

    const result = await fileApi.deleteFolder(folderId, user.jwt_token);

    if (!result.success) {
      throw result.error;
    }

    console.log('Pasta marcada como excluída:', result.data);

    registerAuditLog('FOLDER_DELETE', {
      folderId,
      nome: result.data.nome_pasta,
      data_exclusao: result.data.data_exclusao
    });

    return {
      success: true,
      data: result.data,
      error: null
    };

  } catch (error) {
    console.error('Erro ao excluir pasta:', error);
    setFolderError(error.message);

    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code || 'FOLDER_DELETE_ERROR',
        details: error.details || null
      }
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, folders: false }));
    console.groupEnd();
  }
};

const renameFolder = async (folderId, newName) => {
  console.group('[FileContext] renameFolder');
  setLoadingStates(prev => ({ ...prev, folders: true }));
  setFolderError(null);

  try {
    if (!folderId || !newName?.trim()) {
      throw new Error('ID da pasta ou novo nome inválido');
    }

    console.log(`Renomeando pasta ${folderId} para "${newName}"...`);

    const result = await fileApi.renameFolder(folderId, newName, user.jwt_token);
    
    if (!result.success) {
      // Tratamento específico para erros de permissão
      if (result.error?.code === 'FORBIDDEN') {
        throw new Error('Você não tem permissão para renomear esta pasta');
      }
      // Tratamento específico para erros de conflito (nome duplicado)
      if (result.error?.code === 'CONFLICT') {
        throw new Error('Já existe uma pasta com este nome no local especificado');
      }
      throw result.error;
    }

    console.log('Pasta renomeada com sucesso:', result.data);

    // Atualiza o estado das pastas
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, nome: newName } : folder
    ));

    // Atualiza o conteúdo da pasta atual se necessário
    if (currentFolderContent?.folders) {
      setCurrentFolderContent(prev => ({
        ...prev,
        folders: prev.folders.map(folder => 
          folder.id === folderId ? { ...folder, nome: newName } : folder
        )
      }));
    }

    registerAuditLog('FOLDER_RENAME', {
      folderId,
      nome_antigo: result.data.nome_antigo,
      novo_nome: newName,
      caminho: result.data.caminho
    });

    return {
      success: true,
      data: result.data,
      error: null,
      message: 'Pasta renomeada com sucesso!'
    };

  } catch (error) {
    console.error('Erro ao renomear pasta:', error);
    setFolderError(error.message);

    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code || 'FOLDER_RENAME_ERROR',
        details: error.details || null
      }
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, folders: false }));
    console.groupEnd();
  }
};

const renameFile = async (fileId, newName, keepExtension = true) => {
  console.group('[FileContext] renameFile');
  setLoadingStates(prev => ({ ...prev, files: true }));
  setErrors(prev => ({ ...prev, rename: null }));

  try {
    if (!fileId || !newName?.trim()) {
      throw new Error('ID do arquivo ou novo nome inválido');
    }

    console.log(`Renomeando arquivo ${fileId} para "${newName}" (manter extensão: ${keepExtension})...`);

    const fileToRename = files.find(f => f.id === fileId);
    if (!fileToRename) throw new Error('Arquivo não encontrado');

    const result = await fileApi.renameFile(fileId, newName, keepExtension, user.jwt_token);
    
    if (!result.success) {
      // Tratamento específico para erros de permissão
      if (result.error?.code === 'FORBIDDEN') {
        throw new Error('Você não tem permissão para renomear este arquivo');
      }
      // Tratamento específico para erros de extensão
      if (result.error?.code === 'INVALID_EXTENSION') {
        throw new Error('Não é permitido alterar a extensão do arquivo');
      }
      // Tratamento específico para erros de conflito (nome duplicado)
      if (result.error?.code === 'CONFLICT') {
        throw new Error('Já existe um arquivo com este nome na pasta');
      }
      throw result.error;
    }

    console.log('Arquivo renomeado com sucesso:', result.data);

    // Atualiza o estado dos arquivos
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, nome: result.data.novo_nome } : file
    ));

    // Atualiza o conteúdo da pasta atual se necessário
    if (currentFolderContent?.files) {
      setCurrentFolderContent(prev => ({
        ...prev,
        files: prev.files.map(file => 
          file.id === fileId ? { ...file, nome: result.data.novo_nome } : file
        )
      }));
    }

    registerAuditLog('FILE_RENAME', {
      fileId,
      nome_antigo: result.data.nome_antigo,
      novo_nome: result.data.novo_nome,
      pasta_id: result.data.pasta_id,
      data_modificacao: result.data.data_modificacao
    });

    return {
      success: true,
      data: result.data,
      error: null,
      message: 'Arquivo renomeado com sucesso!'
    };

  } catch (error) {
    console.error('Erro ao renomear arquivo:', error);
    setErrors(prev => ({ ...prev, rename: error.message }));

    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: error.code || 'FILE_RENAME_ERROR',
        details: error.details || null
      }
    };
  } finally {
    setLoadingStates(prev => ({ ...prev, files: false }));
    console.groupEnd();
  }
};

// Atualize o objeto de valor do provider para incluir a nova função
return (
  <FileContext.Provider
    value={{
      // Estados
      files,
      folders,
      currentFolder,
      storageUsage,
      loadingStates,
      errors,
      currentFolderContent,
      folderLoading,
      folderError,
      checkStorageQuota,
      
      // Métodos
      formatBytes,
      fetchUserFiles,
      uploadFile,
      downloadFile,
      deleteFile,
      renameFile, // Adicionada aqui
      setCurrentFolder,
      updateStorageUsage,
      loadFolderContent,
      createFolder,
      deleteFolder,
      renameFolder,
      refreshFileList: fetchUserFiles,
      
      // Novos métodos
      shareFile,
      updateFileVisibility,
      getFilePreviewInfo,
      getFilePreviewContent,
      shareFolderWithUser,
      unshareFolderWithUser,
      getFolderShares,
    }}
  >
    {children}
  </FileContext.Provider>
);

};

export const useFiles = () => useContext(FileContext);