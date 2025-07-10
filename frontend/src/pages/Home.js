import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';
import './style/home.css';
import { 
  FiFolder, FiImage, FiFileText, FiFile, FiGrid, FiSliders,
  FiFilm, FiFileMinus, FiDownload, FiTrash2, FiLink, FiEye, FiEyeOff, FiEdit
} from 'react-icons/fi';
import logoPng from './style/logo.png';
//import logoSvg from './style/logo.svg';

// Componente para ícones de tipos de arquivo
const FileIcon = ({ type }) => {
  const iconMap = {
    // Pastas
    'folder': <FiFolder className="file-icon folder" size={20} />,
    
    // Imagens
    'image/': <FiImage className="file-icon image" size={20} />,
    
    // Vídeos (novo)
    'video/': <FiFilm className="file-icon video" size={20} />,
    
    // PDFs
    'application/pdf': <FiFileText className="file-icon pdf" size={20} />,
    
    // Documentos
    'text/': <FiFileText className="file-icon document" size={20} />,
    'application/msword': <FiFileText className="file-icon document" size={20} />,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FiFileText className="file-icon document" size={20} />,
    
    // Planilhas
    'application/vnd.ms-excel': <FiGrid className="file-icon spreadsheet" size={20} />,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FiGrid className="file-icon spreadsheet" size={20} />,
    
    // Apresentações
    'application/vnd.ms-powerpoint': <FiSliders className="file-icon presentation" size={20} />,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': <FiSliders className="file-icon presentation" size={20} />,
    
    // Compactados
    'application/zip': <FiFileMinus className="file-icon archive" size={20} />,
    'application/x-rar-compressed': <FiFileMinus className="file-icon archive" size={20} />,
    'application/x-7z-compressed': <FiFileMinus className="file-icon archive" size={20} />,
    
    // Padrão
    'default': <FiFile className="file-icon" size={20} />
  };

  const icon = Object.entries(iconMap).find(([key]) => 
    key.endsWith('/') ? type?.startsWith(key) : type === key
  )?.[1] || iconMap.default;

  return icon;
};
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
}

const Home = () => {
  const { user } = useAuth();
  const { 
    currentFolderContent, 
    loadFolderContent,
    uploadFile, 
    loadingStates,
    downloadFile,
    deleteFile,
    shareFile,
    updateFileVisibility,
    getFilePreviewContent,
    createFolder,
    getFolderShares,
    shareFolderWithUser,    // Adicione esta
    unshareFolderWithUser,
    deleteFolder,
    renameFolder,
    renameFile
  } = useFiles();
  
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const fileInputRef = useRef(null);
  const uploadMenuRef = useRef(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showShareFolderModal, setShowShareFolderModal] = useState(false);
  const [sharedEmails, setSharedEmails] = useState([]);
  const [newShareEmail, setNewShareEmail] = useState('');
  const [sharePermissions, setSharePermissions] = useState({
    edit: false,
    delete: false,
    share: false
  });
  const [renameFolderName, setRenameFolderName] = useState('');
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFileName, setRenameFileName] = useState('');
  const [showRenameFileModal, setShowRenameFileModal] = useState(false);
  const [keepExtension, setKeepExtension] = useState(true);
  const [reloadingModal, setReloadingModal] = useState(false);
  // Carrega os arquivos ao montar o componente
  useEffect(() => {
    if (user) {
      loadFolderContent();
    }
  }, [user, loadFolderContent]);


  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

useEffect(() => {
  console.log('Current path:', currentFolderContent.path);
}, [currentFolderContent.path]);

const handleDeleteFile = async (fileId) => {
  if (!selectedFile) return;
  
  if (!window.confirm(`Tem certeza que deseja excluir o arquivo "${selectedFile.nome}"?`)) {
    return;
  }
  
  try {
    const result = await deleteFile(selectedFile.id);
    
    if (result.success) {
      // Sucesso - mostra mensagem padrão
      alert(result.message || 'Arquivo excluído com sucesso!');
      loadFolderContent(currentFolderContent.folder?.id || null);
      setSelectedFile(null);
    } else {
      // Erro - mostra mensagem específica
      alert(result.message || 'Erro ao excluir arquivo');
    }
  } catch (error) {
    console.error('Erro ao excluir arquivo pppppppppp:', error);
    alert(error.message || 'Erro ao excluir arquivo');
  }
};

const handleFolderClick = (folder) => {
  const now = Date.now();
  const doubleClickThreshold = 300;
  
  if (lastClickTime && (now - lastClickTime) < doubleClickThreshold) {
    // Double click - navega para a pasta
    loadFolderContent(folder.id);
    setSelectedFolder(null);
  } else {
    // Single click - seleciona pasta
    setSelectedFolder(folder.id === selectedFolder?.id ? null : folder);
    setSelectedFile(null); // Limpa seleção de arquivo
  }
  
  setLastClickTime(now);
};

const handleOpenShareModal = async () => {
  if (!selectedFolder) return;
  console.log('\n\nIniciando busca por compartilhamentos da pasta:', selectedFolder.id);
  try {
    const result = await getFolderShares(selectedFolder.id);
    console.log('Resposta da API getFolderShares:', result);
    
    if (result.success) {
      console.log('Dados recebidos:', result.data);
      // CORREÇÃO AQUI: usar result.data diretamente em vez de result.data.compartilhamentos
      setSharedEmails(result.data || []);
      setShowShareFolderModal(true);
    } else {
      alert(result.error.message || 'Erro ao carregar compartilhamentos');
    }
  } catch (error) {
    console.error('Erro ao abrir modal de compartilhamento:', error);
    alert('Erro ao carregar compartilhamentos');
  }
};

const handleShareFolder = async () => {
  if (!newShareEmail || !selectedFolder) return;
  
  try {
    // Fecha o modal temporariamente
    setShowShareFolderModal(false);
    setReloadingModal(true); // Mostra um indicador de carregamento
    
    const result = await shareFolderWithUser(
      selectedFolder.id,
      newShareEmail,
      sharePermissions
    );
    
    if (result.success) {
      // Atualiza a lista de compartilhamentos
      const sharesResult = await getFolderShares(selectedFolder.id);
      
      if (sharesResult.success) {
        setSharedEmails(sharesResult.data.compartilhamentos || []);
        
        // Atualiza o estado local da pasta compartilhada
        loadFolderContent(currentFolderContent.folder?.id || null, true).then(() => {
          // Força uma nova renderização dos itens
          setSelectedFolder(prev => {
            const updatedFolder = currentFolderContent.subfolders.find(f => f.id === prev?.id);
            return updatedFolder ? {...updatedFolder} : null;
          });
        });
      }
      
      setNewShareEmail('');
    } else {
      setShowShareFolderModal(true); // Reabre se houve erro
      alert(result.error.message || 'Erro ao compartilhar pasta');
    }
  } catch (error) {
    console.error('Erro ao compartilhar pasta:', error);
    setShowShareFolderModal(true); // Reabre se houve erro
    alert('Erro ao compartilhar pasta');
  } finally {
    setReloadingModal(false);
  }
};

const handleUnshareFolder = async (shareId, email) => {
  if (!selectedFolder) return;
  
  try {
    setReloadingModal(true); // Mostra o indicador de carregamento
    
    const result = await unshareFolderWithUser(selectedFolder.id, email);
    
    if (result.success) {
      // Atualiza a lista de compartilhamentos
      const sharesResult = await getFolderShares(selectedFolder.id);
      if (sharesResult.success) {
        setSharedEmails(sharesResult.data.compartilhamentos || []);
      }
      
      // Atualiza o estado local da pasta
      loadFolderContent(currentFolderContent.folder?.id || null, true).then(() => {
        // Força uma nova renderização dos itens
        setSelectedFolder(prev => {
          const updatedFolder = currentFolderContent.subfolders.find(f => f.id === prev?.id);
          return updatedFolder ? {...updatedFolder} : null;
        });
      });
      
      alert('Compartilhamento removido com sucesso!');
    } else {
      alert(result.error.message || 'Erro ao remover compartilhamento');
    }
  } catch (error) {
    console.error('Erro ao remover compartilhamento:', error);
    alert('Erro ao remover compartilhamento');
  } finally {
    setReloadingModal(false); // Esconde o indicador de carregamento
  }
};

const handleDeleteFolder = async () => {
  if (!selectedFolder) return;
  
  if (!window.confirm(`Tem certeza que deseja excluir a pasta "${selectedFolder.nome}"?`)) {
    return;
  }
  
  try {
    // Você precisará implementar deleteFolder no seu contexto
    const result = await deleteFolder(selectedFolder.id);
    
    if (result.success) {
      loadFolderContent(currentFolderContent.folder?.id || null);
      setSelectedFolder(null);
      alert('Pasta excluída com sucesso!');
    } else {
      alert(result.error.message || 'Erro ao excluir pasta');
    }
  } catch (error) {
    console.error('Erro ao excluir pasta:', error);
    alert('Erro ao excluir pasta');
  }
};

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await uploadFile({
      file,
      isPublic: false,
      tags: [],
      description: '',
      folderId: currentFolderContent.folder?.id || null
    });

    if (result.success) {
      loadFolderContent(currentFolderContent.folder?.id || null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Por favor, insira um nome para a pasta');
      return;
    }

    try {
      const parentFolderId = currentFolderContent.folder?.id || null;
      const result = await createFolder(newFolderName, parentFolderId);

      if (result.success) {
        setNewFolderName('');
        setShowCreateFolderModal(false);
        // Recarrega o conteúdo da pasta atual
        loadFolderContent(parentFolderId);
      } else {
        alert(result.error.message || 'Erro ao criar pasta');
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      alert('Ocorreu um erro ao criar a pasta');
    }
  };

  const handleFileClick = (file) => {
    const now = Date.now();
    const doubleClickThreshold = 300; // 300ms para considerar double click
    
    if (lastClickTime && (now - lastClickTime) < doubleClickThreshold) {
      // Double click - abrir preview
      handlePreview(file);
      setSelectedFile(null); // Limpa seleção após abrir preview
    } else {
      // Single click - seleciona arquivo
      setSelectedFile(file.id === selectedFile?.id ? null : file);
    }
    
    setLastClickTime(now);
  };


 const handlePreview = async (file) => {
  try {
    const result = await getFilePreviewContent(file.id);
    
    if (result.success) {
      setPreviewContent({
        file_id: file.id,
        file_name: file.nome,
        file_size: file.tamanho || 0, // Garante que tenha um valor padrão
        file_type: file.tipo || file.tipo_mime,
        blobUrl: result.blobUrl,
        contentType: result.contentType
      });
      setShowPreviewModal(true);
    } else {
      setPreviewContent({
        file_id: file.id,
        file_name: file.nome,
        file_size: file.tamanho || 0,
        file_type: file.tipo || file.tipo_mime,
        contentType: file.tipo || file.tipo_mime,
        previewError: true
      });
      setShowPreviewModal(true);
    }
  } catch (error) {
    console.error('Erro ao tentar visualizar arquivo:', error);
    setPreviewContent({
      file_id: file.id,
      file_name: file.nome,
      file_size: file.tamanho || 0,
      file_type: file.tipo || file.tipo_mime,
      contentType: file.tipo || file.tipo_mime,
      previewError: true
    });
    setShowPreviewModal(true);
  }
};

  const handleGenerateLink = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await shareFile(selectedFile.id, {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        maxAccess: 10
      });
      
      if (result.success) {
        // Copia o link para a área de transferência
        navigator.clipboard.writeText(result.data.share_url);
        alert('Link copiado para a área de transferência!');
      } else {
        alert(`Erro: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      alert('Erro ao gerar link de compartilhamento');
    }
  };



const handleRenameFolder = async () => {
  if (!selectedFolder || !renameFolderName.trim()) return;
  
  try {
    const result = await renameFolder(selectedFolder.id, renameFolderName);
    
    if (result.success) {
      setRenameFolderName('');
      setShowRenameFolderModal(false);
      setSelectedFolder(null);
      loadFolderContent(currentFolderContent.folder?.id || null);
      alert('Pasta renomeada com sucesso!');
    } else {
      alert(result.error.message || 'Erro ao renomear pasta');
    }
  } catch (error) {
    console.error('Erro ao renomear pasta:', error);
    alert('Erro ao renomear pasta');
  }
};

const handleRenameFile = async () => {
  if (!selectedFile || !renameFileName.trim()) return;
  
  try {
    const result = await renameFile(selectedFile.id, renameFileName, keepExtension);
    
    if (result.success) {
      setRenameFileName('');
      setShowRenameFileModal(false);
      setSelectedFile(null);
      loadFolderContent(currentFolderContent.folder?.id || null);
      alert('Arquivo renomeado com sucesso!');
    } else {
      alert(result.error.message || 'Erro ao renomear arquivo');
    }
  } catch (error) {
    console.error('Erro ao renomear arquivo:', error);
    alert('Erro ao renomear arquivo');
  }
};

  // Alternar visibilidade do arquivo
  const toggleFileVisibility = async () => {
    if (!selectedFile) return;
    
    try {
      const newVisibility = !selectedFile.publico;
      const result = await updateFileVisibility(selectedFile.id, newVisibility);
      
      if (result.success) {
        // Atualiza o arquivo selecionado com o novo status
        setSelectedFile({ ...selectedFile, publico: newVisibility });
      } else {
        alert(`Erro: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Erro ao alterar visibilidade:', error);
      alert('Erro ao alterar visibilidade do arquivo');
    }
  };

  // Agrupa arquivos por tipo

const groupFilesByType = () => {
  
  if (!currentFolderContent || !currentFolderContent.files) {
    console.warn('currentFolderContent ou files está vazio');
    return {
      pastas: [],
      videos: [],
      imagens: [],
      documentos: [],
      planilhas: [],
      apresentacoes: [],
      pdfs: [],
      compactados: [],
      outros: []
    };
  }
  const groups = {
    pastas: currentFolderContent.subfolders,
    videos: [], 
    imagens: [],
    documentos: [],
    planilhas: [],
    apresentacoes: [],
    pdfs: [],
    compactados: [],
    outros: []
  };
  
  currentFolderContent.files.forEach(file => {
    const tipo = file.tipo || file.tipo_mime; // Usa tipo ou tipo_mime
    

    if (!tipo) {
      groups.outros.push(file);
      return;
    }

    if (tipo.startsWith('image/')) {
      groups.imagens.push(file);
    } else if (tipo.startsWith('video/')) { // Novo caso para vídeos
      groups.videos.push(file);
    } else if (tipo === 'application/pdf') {
      groups.pdfs.push(file);
    } else if (
      tipo.startsWith('text/') || 
      tipo.includes('word') ||
      tipo.includes('document') ||
      tipo === 'application/msword' ||
      tipo === 'application/rtf' ||
      tipo.includes('opendocument.text')
    ) {
      groups.documentos.push(file);
    } else if (
      tipo.includes('sheet') ||
      tipo.includes('excel') ||
      tipo.includes('spreadsheet') ||
      tipo === 'application/vnd.ms-excel' ||
      tipo.includes('opendocument.spreadsheet')
    ) {
      groups.planilhas.push(file);
    } else if (
      tipo.includes('presentation') ||
      tipo.includes('powerpoint') ||
      tipo === 'application/vnd.ms-powerpoint' ||
      tipo.includes('opendocument.presentation')
    ) {
      groups.apresentacoes.push(file);
    } else if (
      tipo.includes('zip') ||
      tipo.includes('rar') ||
      tipo.includes('7z') ||
      tipo.includes('compressed') ||
      tipo.includes('tar') ||
      tipo.includes('gzip')
    ) {
      groups.compactados.push(file);
    } else {
      groups.outros.push(file);
    }
  });
  
  return groups;
};


// Modifique a renderização dos arquivos para usar handleFileClick
// Modifique a renderização dos arquivos para incluir a informação do dono quando compartilhado
const renderFileItem = (file) => ( 
  <div 
    key={file.id} 
    className={`file-item ${file.id === selectedFile?.id ? 'selected' : ''}`}
    onClick={() => handleFileClick(file)}
  >
    <div className="file-item-content">
      <FileIcon type={file.tipo || file.tipo_mime} />
      <span className="file-name">{file.nome}</span>
      
      {/* Mostra "meu" ou email do dono se for arquivo compartilhado */}
      {file.compartilhada_direta_indireta && file.dono && (
        <div className="file-owner-info">
          <span className="owner-email">
            {file.dono.id === user.id ? "meu" : 
             (file.dono.email?.slice(0, 35) + (file.dono.email?.length > 35 ? "..." : ""))}
          </span>
        </div>
      )}
      
      {/* Badge de status público/privado */}
      {file.publico ? (
        <span className="public-badge">Público</span>
      ) : (
        <span className="public-badge private">Privado</span>
      )}
    </div>
  </div>
);

  
const fileGroups = groupFilesByType();


return (
  <div className="drive-container">
    <header className="drive-header">
      <div className="user-info">
          <img src={logoPng} alt="Drive Logo" className="drive-logo" />
          {user && <span className="user-email">{user.email}</span>}
      </div>

      
      <div className="actions-container" ref={uploadMenuRef}>
        <button 
          className="upload-btn"
          onClick={() => setShowUploadMenu(!showUploadMenu)}
          disabled={loadingStates.upload}
        >
          {loadingStates.upload ? 'Enviando...' : '+'}
        </button>

        {showUploadMenu && (
          <div className="upload-menu">
            <button onClick={() => fileInputRef.current.click()}>
              Enviar Arquivo
            </button>

            <button onClick={() => {
                setShowCreateFolderModal(true);
                setShowUploadMenu(false);
              }}>
                Criar Pasta
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    </header>

    <main className="drive-content">

      {/* Barra de ações para arquivo selecionado */}
      {selectedFile && (
        <>
          <div className={`file-action-bar ${selectedFile ? 'visible' : ''}`}>
            <button onClick={() => downloadFile(selectedFile.id)} title="Download">
              <FiDownload size={18} />
            </button>
            
            <button 
              onClick={() => {
                setRenameFileName(selectedFile.nome.split('.')[0]); // Remove a extensão para o campo de input
                setShowRenameFileModal(true);
              }} 
              title="Renomear"
            >
                <FiEdit size={18} />
            </button>

            <button 
              onClick={() => handleDeleteFile(selectedFile.id)} 
              title="Excluir" 
              className="danger"
            >
              <FiTrash2 size={18} />
            </button>
            
            <button onClick={handleGenerateLink} title="Gerar link de compartilhamento">
              <FiLink size={18} />
            </button>
            
            <button 
              onClick={toggleFileVisibility}
              title={selectedFile.publico ? 'Tornar privado' : 'Tornar público'}
            >
              {selectedFile.publico ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
            
            <button 
              onClick={() => handlePreview(selectedFile)}
              title="Visualizar"
            >
              <FiEye size={18} />
            </button>
          </div>
          <div 
            className="file-action-bar-overlay" 
            onClick={(e) => {
// Só fecha se clicar diretamente na overlay, não em elementos filhos
                if (e.target === e.currentTarget) {
                  setSelectedFile(null);
                }
            }}
          />
        </>
      )}

      
      {/* Breadcrumb de navegação */}
      <div className="breadcrumb">
        {currentFolderContent.path?.map((item, index, array) => (
          <React.Fragment key={item.id || 'root'}>
            <span 
              onClick={() => {
                // Não navega se for o último item (pasta atual)
                if (index < array.length - 1) {
                  loadFolderContent(item.id);
                  setSelectedFile(null);
                }
              }}
              className={`breadcrumb-item ${index === array.length - 1 ? 'current' : ''}`}
            >
              {item.name}
            </span>
            {index < array.length - 1 && (
              <span className="breadcrumb-separator"> &gt; </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {fileGroups.pastas.length > 0 && (
        <div className="file-section">
          <h3>Pastas</h3>
          <div className="files-grid">
            {fileGroups.pastas.map(folder => (
              <div key={folder.id}>
                <div 
                  className={`file-item folder ${folder.id === selectedFolder?.id ? 'selected' : ''}`}
                  onClick={() => handleFolderClick(folder)}
                >
                  <FileIcon type="folder" />
                  <span className="file-name">{folder.nome}</span>
                  
                  {(folder.compartilhada || folder.herdada) && (
                    <div className="folder-sharing-info">
                      {folder.compartilhada ? (
                        <span className="sharing-badge" data-status="shared">Compartilhada</span>
                      ) : (
                        <span className="sharing-badge" data-status="inherited">Herdada</span>
                      )}
                      <span className="sharing-detail">
                        {folder.dono && folder.dono.id === user.id 
                          ? "meu" 
                          : (folder.dono?.email || folder.dono?.nome || "").slice(0, 35) + ((folder.dono?.email?.length > 35 || folder.dono?.nome?.length > 35) ? "..." : "")
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFolder && (
        <>
          <div className={`file-action-bar ${selectedFolder ? 'visible' : ''}`}>
            <button 
              onClick={() => {
                setRenameFolderName(selectedFolder.nome);
                setShowRenameFolderModal(true);
              }} 
              title="Renomear"
            >
              <FiEdit size={18} /> {/* Adicione o ícone FiEdit no import */}
            </button>

            <button onClick={() => handleDeleteFolder()} title="Excluir" className="danger">
              <FiTrash2 size={18} />
            </button>
            
            <button onClick={handleOpenShareModal} title="Compartilhar pasta">
              <FiLink size={18} />
            </button>
            
            {/* Adicione mais ações conforme necessário */}
          </div>
          <div 
            className="file-action-bar-overlay" 
            onClick={() => setSelectedFolder(null)}
          />
        </>
      )}

      {showShareFolderModal && selectedFolder && (
        <div className="modal-overlay" onClick={() => setShowShareFolderModal(false)}>
          <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Compartilhar pasta: {selectedFolder.nome}</h3>
            {reloadingModal && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Atualizando informações...</p>
              </div>
            )}
            <div className="shared-users-list">
              <h4>Compartilhado com:</h4>
              {sharedEmails.length > 0 ? (
                <ul>
                  {sharedEmails.map(share => (
                    <li key={share.compartilhamento_id}>
                      <span>{share.email}</span>
                      <button 
                        onClick={() => handleUnshareFolder(share.compartilhamento_id, share.email)}
                        className="unshare-btn"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Esta pasta não está compartilhada com ninguém</p>
              )}
            </div>
            
            <div className="share-new-user">
              <h4>Compartilhar com novo usuário:</h4>
              <input
                type="email"
                value={newShareEmail}
                onChange={(e) => setNewShareEmail(e.target.value)}
                placeholder="Digite o e-mail do usuário"
              />
              
              <div className="permissions-section">
                <label>
                  <input
                    type="checkbox"
                    checked={sharePermissions.edit}
                    onChange={(e) => {
                      const canEdit = e.target.checked;
                      setSharePermissions({
                        edit: canEdit,
                        delete: canEdit,  // Delete espelha o edit
                        share: canEdit    // Share espelha o edit
                      });
                    }}
                  />
                  Permitir edição (renomear/compartilhar/excluir)
                </label>
              </div>
              
              <button 
                onClick={handleShareFolder}
                disabled={!newShareEmail || loadingStates.folders}
                className="share-btn"
              >
                {loadingStates.folders ? 'Compartilhando...' : 'Compartilhar'}
              </button>
            </div>
            
            <button 
              onClick={() => setShowShareFolderModal(false)}
              className="close-modal-btn"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Lista de PDFs */}
      {fileGroups.pdfs.length > 0 && (
        <div className="file-section">
          <h3>PDFs</h3>
          <div className="files-grid">
            {fileGroups.pdfs.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Lista de Documentos */}
      {fileGroups.documentos.length > 0 && (
        <div className="file-section">
          <h3>Documentos</h3>
          <div className="files-grid">
            {fileGroups.documentos.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Lista de Imagens */}
      {fileGroups.imagens.length > 0 && (
        <div className="file-section">
          <h3>Imagens</h3>
          <div className="files-grid">
            {fileGroups.imagens.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Lista de Planilhas */}
      {fileGroups.planilhas.length > 0 && (
        <div className="file-section">
          <h3>Planilhas</h3>
          <div className="files-grid">
            {fileGroups.planilhas.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Lista de Apresentações */}
      {fileGroups.apresentacoes.length > 0 && (
        <div className="file-section">
          <h3>Apresentações</h3>
          <div className="files-grid">
            {fileGroups.apresentacoes.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Lista de Arquivos Compactados */}
      {fileGroups.compactados.length > 0 && (
        <div className="file-section">
          <h3>Arquivos Compactados</h3>
          <div className="files-grid">
            {fileGroups.compactados.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Lista de Vídeos */}
      {fileGroups.videos.length > 0 && (
        <div className="file-section">
          <h3>Vídeos</h3>
          <div className="files-grid">
            {fileGroups.videos.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Outros arquivos */}
      {fileGroups.outros.length > 0 && (
        <div className="file-section">
          <h3>Outros Arquivos</h3>
          <div className="files-grid">
            {fileGroups.outros.map(renderFileItem)}
          </div>
        </div>
      )}

      {/* Mensagem quando não há arquivos */}
      {Object.values(fileGroups).every(group => 
        Array.isArray(group) ? group.length === 0 : true
      ) && (
        <div className="empty-folder">
          <p>Esta pasta está vazia</p>
        </div>
      )}


      {/* Modal de Preview */}
      {showPreviewModal && previewContent && (
        <div className="modal-overlay preview-modal" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content preview-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewContent.file_name}</h3>
              <div className="file-info">
                <span>Tipo: {previewContent.contentType}</span>
                <span>Tamanho: {formatFileSize(previewContent.file_size)}</span>
              </div>
              <button 
                onClick={() => {
                  setShowPreviewModal(false);
                  if (previewContent.blobUrl) {
                    URL.revokeObjectURL(previewContent.blobUrl);
                  }
                }}
                className="close-btn"
              >
                &times;
              </button>
            </div>
            
            <div className="preview-body">
              {previewContent.previewError ? (
                <div className="unsupported-file">
                  <div className="unsupported-message">
                    <FiFile size={200} className="unsupported-icon" />
                    <h4>Visualização não disponível</h4>
                    <p>Este tipo de arquivo não pode ser visualizado no navegador.</p>
                    <p>Tamanho: {formatFileSize(previewContent.file_size)}</p>
                  </div>
                </div>
              ) : previewContent.contentType.startsWith('image/') ? (
                <div className="preview-container image-container">
                  <img 
                    src={previewContent.blobUrl} 
                    alt={previewContent.file_name}
                    className="preview-image"
                  />
                </div>
              ) : previewContent.contentType === 'application/pdf' ? (
                <div className="preview-container pdf-container">
                  <embed 
                    src={previewContent.blobUrl} 
                    type="application/pdf"
                    className="preview-pdf"
                  />
                </div>
              ) : previewContent.contentType.startsWith('video/') ? (
                <div className="preview-container video-container">
                  <video controls autoPlay className="preview-video">
                    <source src={previewContent.blobUrl} type={previewContent.contentType} />
                    Seu navegador não suporta a reprodução de vídeos.
                  </video>
                </div>
              ) : previewContent.contentType.startsWith('text/') ? (
                <div className="preview-container text-container">
                  <iframe 
                    src={previewContent.blobUrl}
                    title={previewContent.file_name}
                    className="preview-iframe"
                  />
                </div>
              ) : (
                <div className="unsupported-file">
                  <div className="unsupported-message">
                    <FiFile size={100} className="unsupported-icon" />
                    <h4>Visualização não disponível</h4>
                    <p>Este tipo de arquivo não pode ser visualizado no navegador.</p>
                    <p>Tamanho: {formatFileSize(previewContent.file_size)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="preview-footer">
              <button 
                onClick={() => downloadFile(previewContent.file_id)}
                className="download-btn"
              >
                <FiDownload /> Baixar Arquivo
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameFolderModal && selectedFolder && (
        <div className="modal-overlay" onClick={() => setShowRenameFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Renomear Pasta</h3>
            <p>Renomeando: {selectedFolder.nome}</p>
            
            <input
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Novo nome da pasta"
              autoFocus
            />
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowRenameFolderModal(false)}
                className="cancel-btn"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRenameFolder}
                disabled={loadingStates.folders || !renameFolderName.trim()}
                className="confirm-btn"
              >
                {loadingStates.folders ? 'Renomeando...' : 'Renomear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameFileModal && selectedFile && (
        <div className="modal-overlay" onClick={() => setShowRenameFileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Renomear Arquivo</h3>
            <p>Renomeando: {selectedFile.nome}</p>
            
            <input
              type="text"
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value)}
              placeholder="Novo nome do arquivo"
              autoFocus
            />
            
            <div className="checkbox-container">
              <label>
                <input
                  type="checkbox"
                  checked={keepExtension}
                  onChange={() => setKeepExtension(!keepExtension)}
                />
                Manter extensão original (.{selectedFile.nome.split('.').pop()})
              </label>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowRenameFileModal(false)}
                className="cancel-btn"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRenameFile}
                disabled={loadingStates.files || !renameFileName.trim()}
                className="confirm-btn"
              >
                {loadingStates.files ? 'Renomeando...' : 'Renomear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação de pasta (mantido igual) */}
      {showCreateFolderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Criar Nova Pasta</h3>
            <p>
              {currentFolderContent.folder 
                ? `Dentro de: ${currentFolderContent.folder.nome}`
                : 'Na raiz do seu drive'}
            </p>
            
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              autoFocus
            />
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowCreateFolderModal(false)}
                className="cancel-btn"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateFolder}
                disabled={loadingStates.folders}
                className="confirm-btn"
              >
                {loadingStates.folders ? 'Criando...' : 'Criar Pasta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);}
export default Home;