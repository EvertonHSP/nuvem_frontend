import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:5000/api';

const listFolderContent = async (folderId = null, token) => {
  try {
    const url = folderId 
      ? `${API_URL}/folders/${folderId}`
      : `${API_URL}/folders`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      withCredentials: true
    });

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao listar conteúdo da pasta';
    let errorCode = 'FOLDER_CONTENT_ERROR';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        errorCode = 'FOLDER_NOT_FOUND';
        errorMessage = 'Pasta não encontrada';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};


const createFolder = async (folderName, parentFolderId = null, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/pastas/create`,
      {
        nome: folderName,
        pasta_pai_id: parentFolderId || null
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao criar pasta';
    let errorCode = 'FOLDER_CREATE_ERROR';
    
    if (error.response) {
      if (error.response.status === 400) {
        errorCode = 'INVALID_NAME';
        errorMessage = 'Nome da pasta inválido';
      } else if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        errorCode = 'PARENT_NOT_FOUND';
        errorMessage = 'Pasta pai não encontrada';
      } else if (error.response.status === 409) {
        errorCode = 'FOLDER_EXISTS';
        errorMessage = 'Já existe uma pasta com este nome';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const deleteFolder = async (folderId, token) => {
  console.log('⏳ [deleteFolder] INICIANDO - folderId:', folderId);
  
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Força o Axios a tratar todos os status como resposta, não como erro
      validateStatus: function(status) {
        return true; // Aceita qualquer status code
      }
    };

    console.log('🛫 Enviando DELETE para:', `${API_URL}/pastas/${folderId}/delete`);
    const response = await axios.delete(`${API_URL}/pastas/${folderId}/delete`, config);

    console.log('📡 Resposta HTTP:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Tratamento manual do status 403
    if (response.status === 403) {
      console.log('🚫 ERRO 403 DETECTADO!');
      return {
        success: false,
        error: {
          message: response.data?.message || 'Você não tem permissão para excluir esta pasta',
          code: 'FORBIDDEN',
          status: 403,
          details: response.data?.details || null
        }
      };
    }

    // Tratamento para outros códigos de erro
    if (response.status >= 400) {
      return {
        success: false,
        error: {
          message: response.data?.message || `Erro HTTP ${response.status}`,
          code: 'HTTP_ERROR',
          status: response.status,
          details: response.data?.details || null
        }
      };
    }

    // Sucesso (2xx)
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('💣 ERRO CRÍTICO:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: {
        message: 'Falha na comunicação com o servidor',
        code: 'NETWORK_ERROR',
        details: error.response?.data || null
      }
    };
  }
};


const uploadFile = async (file, isPublic = false, tags = [], description = '', folderId = null, token) => {
  console.group('--------------------[uploadFile] Iniciando upload - Log completo--------------------');
  console.log('🔐 JWT completo enviado:', token);
  try {
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_public', isPublic);
    
    if (tags && tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    if (description) {
      formData.append('description', description);
    }
    
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'  // Adicione esta linha
      },
      withCredentials: true  // Importante para cookies/sessões
    });

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    // Tratamento padrão de erros (similar ao auth.js)
    let errorMessage = 'Erro ao enviar arquivo';
    let errorCode = 'UPLOAD_ERROR';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 413) {
        errorCode = 'FILE_TOO_LARGE';
        errorMessage = 'Arquivo excede o tamanho máximo permitido';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};


const downloadFile = async (fileId, token) => {
  try {
    const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    });

    // Extrair o nome do arquivo (fallback caso header não venha)
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'arquivo';

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    // Criar um link e simular o clique
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Erro ao baixar arquivo',
        code: 'DOWNLOAD_ERROR',
        details: error.response?.data || null
      }
    };
  }
};


const deleteFile = async (fileId, token) => {
  console.log('⏳ [deleteFile] INICIANDO - fileId:', fileId);
  
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Força o Axios a tratar todos os status como resposta, não como erro
      validateStatus: function(status) {
        return true; // Aceita qualquer status code
      }
    };

    console.log('🛫 Enviando DELETE para:', `${API_URL}/files/${fileId}/delete`);
    const response = await axios.delete(`${API_URL}/files/${fileId}/delete`, config);

    console.log('📡 Resposta HTTP:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Tratamento manual do status 403
    if (response.status === 403) {
      console.log('🚫 ERRO 403 DETECTADO!');
      return {
        success: false,
        error: {
          message: response.data?.message || 'Você não tem permissão para excluir esse arquivo',
          code: 'FORBIDDEN',
          status: 403
        }
      };
    }

    // Tratamento para outros códigos de erro
    if (response.status >= 400) {
      return {
        success: false,
        error: {
          message: response.data?.message || `Erro HTTP ${response.status}`,
          code: 'HTTP_ERROR',
          status: response.status
        }
      };
    }

    // Sucesso (2xx)
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('💣 ERRO CRÍTICO:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: {
        message: 'Falha na comunicação com o servidor',
        code: 'NETWORK_ERROR'
      }
    };
  }
};


const shareFile = async (fileId, options = {}, token) => {
  try {
    const { expiresAt, maxAccess } = options;
    
    const response = await axios.post(
      `${API_URL}/files/share/${fileId}`,
      {
        expira_em: expiresAt,
        max_acessos: maxAccess
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao gerar link de compartilhamento';
    let errorCode = 'SHARE_ERROR';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        errorCode = 'FILE_NOT_FOUND';
        errorMessage = 'Arquivo não encontrado ou acesso negado';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const updateFileVisibility = async (fileId, isPublic, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}/files/${fileId}/visibility`,
      { is_public: isPublic },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao alterar visibilidade do arquivo';
    let errorCode = 'VISIBILITY_ERROR';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        errorCode = 'FILE_NOT_FOUND';
        errorMessage = 'Arquivo não encontrado ou acesso negado';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const getFilePreviewInfo = async (fileId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/files/${fileId}/preview`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao obter informações de pré-visualização';
    let errorCode = 'PREVIEW_INFO_ERROR';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        errorCode = 'FILE_NOT_FOUND';
        errorMessage = 'Arquivo não encontrado ou acesso negado';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const getFilePreviewContent = async (fileId, token) => {
  try {
    const response = await axios.get(`${API_URL}/files/${fileId}/preview-content`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*' // Aceita qualquer tipo de conteúdo
      },
      responseType: 'blob', // Importante para receber binários
      withCredentials: true
    });

    // Retorna o objeto response completo para ser processado posteriormente
    return {
      success: true,
      rawResponse: response,
      headers: response.headers,
      status: response.status,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao obter conteúdo para pré-visualização';
    let errorCode = 'PREVIEW_CONTENT_ERROR';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        errorCode = 'FILE_NOT_FOUND';
        errorMessage = 'Arquivo não encontrado ou acesso negado';
      } else if (error.response.status === 400) {
        errorCode = 'PREVIEW_NOT_AVAILABLE';
        errorMessage = 'Pré-visualização não disponível para este tipo de arquivo';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      rawResponse: error.response,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const shareFolderWithUser = async (folderId, userEmail, permissions = {}, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/pastas/${folderId}/share`,
      {
        email_usuario: userEmail,
        permissao_editar: permissions.edit || false,
        permissao_excluir: permissions.delete || false,
        permissao_compartilhar: permissions.share || false
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao compartilhar pasta';
    let errorCode = 'FOLDER_SHARE_ERROR';
    
    if (error.response) {
      if (error.response.status === 400) {
        errorCode = 'INVALID_EMAIL';
        errorMessage = 'Formato de e-mail inválido';
      } else if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        if (error.response.data.message.includes('Usuário não encontrado')) {
          errorCode = 'USER_NOT_FOUND';
          errorMessage = 'Usuário com este e-mail não encontrado';
        } else {
          errorCode = 'FOLDER_NOT_FOUND';
          errorMessage = 'Pasta não encontrada ou sem permissão';
        }
      } else if (error.response.status === 409) {
        errorCode = 'ALREADY_SHARED';
        errorMessage = 'Pasta já compartilhada com este usuário';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const unshareFolderWithUser = async (folderId, userEmail, token) => {
  try {
    const response = await axios.delete(
      `${API_URL}/pastas/${folderId}/unshare`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
          email_usuario: userEmail
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao remover compartilhamento da pasta';
    let errorCode = 'FOLDER_UNSHARE_ERROR';
    
    if (error.response) {
      if (error.response.status === 400) {
        errorCode = 'INVALID_EMAIL';
        errorMessage = 'Formato de e-mail inválido';
      } else if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou inválida';
      } else if (error.response.status === 404) {
        if (error.response.data.message.includes('Usuário não encontrado')) {
          errorCode = 'USER_NOT_FOUND';
          errorMessage = 'Usuário com este e-mail não encontrado';
        } else if (error.response.data.message.includes('Compartilhamento não encontrado')) {
          errorCode = 'SHARE_NOT_FOUND';
          errorMessage = 'Compartilhamento não encontrado para este usuário';
        } else {
          errorCode = 'FOLDER_NOT_FOUND';
          errorMessage = 'Pasta não encontrada ou sem permissão';
        }
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const getFolderShares = async (folderId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/pastas/${folderId}/shares`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      }
    );

    return {
      success: true,
      data: response.data.compartilhamentos,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Erro ao listar compartilhamentos da pasta';
    let errorCode = 'FOLDER_SHARE_LIST_ERROR';

    if (error.response) {
      if (error.response.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Sessão expirada ou não autenticada';
      } else if (error.response.status === 404) {
        errorCode = 'FOLDER_NOT_FOUND';
        errorMessage = 'Pasta não encontrada ou sem permissão';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    }

    return {
      success: false,
      data: null,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data || null
      }
    };
  }
};

const renameFolder = async (folderId, newName, token) => {
  console.log('⏳ [renameFolder] INICIANDO - folderId:', folderId, 'newName:', newName);
  
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: function(status) {
        return true; // Aceita qualquer status code
      }
    };

    const payload = {
      nome: newName
    };

    console.log('🛫 Enviando PUT para:', `${API_URL}/pastas/${folderId}/rename`);
    const response = await axios.put(`${API_URL}/pastas/${folderId}/rename`, payload, config);

    console.log('📡 Resposta HTTP:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Tratamento manual do status 403
    if (response.status === 403) {
      console.log('🚫 ERRO 403 DETECTADO!');
      return {
        success: false,
        error: {
          message: response.data?.message || 'Você não tem permissão para renomear esta pasta',
          code: 'FORBIDDEN',
          status: 403,
          details: response.data?.details || null
        }
      };
    }

    // Tratamento para status 409 (Conflito - nome já existe)
    if (response.status === 409) {
      return {
        success: false,
        error: {
          message: response.data?.message || 'Já existe uma pasta com este nome no local especificado',
          code: 'CONFLICT',
          status: 409,
          details: response.data?.details || null
        }
      };
    }

    // Tratamento para outros códigos de erro
    if (response.status >= 400) {
      return {
        success: false,
        error: {
          message: response.data?.message || `Erro HTTP ${response.status}`,
          code: 'HTTP_ERROR',
          status: response.status,
          details: response.data?.details || null
        }
      };
    }

    // Sucesso (2xx)
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('💣 ERRO CRÍTICO:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: {
        message: 'Falha na comunicação com o servidor',
        code: 'NETWORK_ERROR',
        details: error.response?.data || null
      }
    };
  }
};

const renameFile = async (fileId, newName, keepExtension, token) => {
  console.log('⏳ [renameFile] INICIANDO - fileId:', fileId, 'newName:', newName, 'keepExtension:', keepExtension);
  
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: function(status) {
        return true; // Aceita qualquer status code
      }
    };

    const payload = {
      novo_nome: newName,
      manter_extensao: keepExtension
    };

    console.log('🛫 Enviando PUT para:', `${API_URL}/files/${fileId}/rename`);
    const response = await axios.put(`${API_URL}/files/${fileId}/rename`, payload, config);

    console.log('📡 Resposta HTTP:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Tratamento manual do status 403
    if (response.status === 403) {
      console.log('🚫 ERRO 403 DETECTADO!');
      return {
        success: false,
        error: {
          message: response.data?.message || 'Você não tem permissão para renomear este arquivo',
          code: 'FORBIDDEN',
          status: 403,
          details: response.data?.details || null
        }
      };
    }

    // Tratamento para status 400 (Bad Request - extensão inválida)
    if (response.status === 400) {
      return {
        success: false,
        error: {
          message: response.data?.message || 'Não é permitido alterar a extensão do arquivo',
          code: 'INVALID_EXTENSION',
          status: 400,
          details: response.data?.details || null
        }
      };
    }

    // Tratamento para status 409 (Conflito - nome já existe)
    if (response.status === 409) {
      return {
        success: false,
        error: {
          message: response.data?.message || 'Já existe um arquivo com este nome na pasta',
          code: 'CONFLICT',
          status: 409,
          details: response.data?.details || null
        }
      };
    }

    // Tratamento para outros códigos de erro
    if (response.status >= 400) {
      return {
        success: false,
        error: {
          message: response.data?.message || `Erro HTTP ${response.status}`,
          code: 'HTTP_ERROR',
          status: response.status,
          details: response.data?.details || null
        }
      };
    }

    // Sucesso (2xx)
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('💣 ERRO CRÍTICO:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: {
        message: 'Falha na comunicação com o servidor',
        code: 'NETWORK_ERROR',
        details: error.response?.data || null
      }
    };
  }
};

// Atualize o export default para incluir a nova função
export default {
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile, // Adicionada aqui
  listFolderContent,
  createFolder,
  shareFile,
  updateFileVisibility,
  getFilePreviewInfo,
  getFilePreviewContent,
  shareFolderWithUser,
  unshareFolderWithUser,
  getFolderShares,
  deleteFolder,
  renameFolder
};

