import React from 'react';
import { formatarData, formatarDataHora } from '../../utils/nfUtils';

const InvoiceDetailsModal = ({ agendamento, onClose }) => {
  if (!agendamento) return null;
  
  // Função para lidar com o evento de clique no overlay
  const handleOverlayClick = (e) => {
    // Verifica se o clique foi diretamente no overlay e não em seus filhos
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  console.log("Renderizando modal para agendamento:", agendamento.id);
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Detalhes da Nota Fiscal</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-row">
            <span className="label">Número da NF:</span>
            <span className="value">{agendamento.numeroNF}</span>
          </div>
          
          {agendamento.chaveAcesso && (
            <div className="detail-row">
              <span className="label">Chave de Acesso:</span>
              <span className="value">{agendamento.chaveAcesso}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="label">Cliente:</span>
            <span className="value">{agendamento.cliente?.nome || '-'}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">CNPJ:</span>
            <span className="value">{agendamento.cliente?.cnpj || '-'}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className="value">{agendamento.status}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Volumes:</span>
            <span className="value">{agendamento.volumes}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Data:</span>
            <span className="value">
              {agendamento.ePrevisao 
                ? 'Previsão (sem data específica)' 
                : formatarData(agendamento.data)}
            </span>
          </div>
          
          {agendamento.observacoes && (
            <div className="detail-row">
              <span className="label">Observações:</span>
              <span className="value">{agendamento.observacoes}</span>
            </div>
          )}
          
          <div className="historico">
            <h4>Histórico de Status</h4>
            {agendamento.historicoStatus && agendamento.historicoStatus.length > 0 ? (
              <ul>
                {agendamento.historicoStatus.map((item, index) => (
                  <li key={index}>
                    <span className="status">{item.status}</span>
                    <span className="data">{formatarDataHora(item.timestamp)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum histórico disponível</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;