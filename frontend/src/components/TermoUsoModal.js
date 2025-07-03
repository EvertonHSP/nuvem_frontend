// TermoUsoModal.js
import React from 'react';
import './style/TermoUsoModal.css';

const TermoUsoModal = ({ conteudo, versao, onAccept, onReject }) => {
  if (!conteudo) {
    return (
      <div className="termo-modal-overlay">
        <div className="termo-modal-container">
          <div className="termo-modal-content">
            <p>Os termos de uso não estão disponíveis no momento.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="termo-modal-overlay">
      <div className="termo-modal-container">
        <div className="termo-modal-header">
          <h2>Termos de Uso (v{versao})</h2>
        </div>
        
        <div className="termo-modal-content">
          <iframe 
            srcDoc={conteudo}
            title="Termos de Uso"
            style={{
              width: '100%',
              height: '400px',
              border: 'none',
              backgroundColor: 'white'
            }}
          />
        </div>
        
        <div className="termo-modal-footer">
          <button className="termo-reject-btn" onClick={onReject}>
            Recusar
          </button>
          <button className="termo-accept-btn" onClick={onAccept}>
            Aceitar Termos
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermoUsoModal;