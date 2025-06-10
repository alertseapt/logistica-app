import React, { useState, useEffect } from 'react';
import { formatarData, formatarDataHora } from '../../utils/nfUtils';
import { updateAgendamento, deleteAgendamento, getClientes } from '../../services/api';

const InvoiceDetailsModal = ({ agendamento, onClose, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    numeroNF: agendamento?.numeroNF || '',
    chaveAcesso: agendamento?.chaveAcesso || '',
    volumes: agendamento?.volumes || 0,
    observacoes: agendamento?.observacoes || '',
    clienteId: agendamento?.clienteId || ''
  });
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [clientes, setClientes] = useState([]);
  
  useEffect(() => {
    if (isEditing) {
      fetchClientes();
    }
  }, [isEditing]);

  const fetchClientes = async () => {
    try {
      const clientesList = await getClientes();
      clientesList.sort((a, b) => a.nome.localeCompare(b.nome));
      setClientes(clientesList);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };
  
  if (!agendamento) return null;
  
  // Função para lidar com o evento de clique no overlay
  const handleOverlayClick = (e) => {
    // Verifica se o clique foi diretamente no overlay e não em seus filhos
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Converter volumes para número
    if (name === 'volumes') {
      setEditedData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSaveChanges = async () => {
    setSaving(true);
    setMensagem('');
    
    try {
      await updateAgendamento(agendamento.id, editedData);
      setMensagem('Informações atualizadas com sucesso!');
      setIsEditing(false);
      
      // Notifica o componente pai para atualizar a lista
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      setMensagem('Erro ao atualizar informações');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      try {
        await deleteAgendamento(agendamento.id);
        onRefresh();
        onClose();
      } catch (error) {
        console.error('Erro ao excluir nota fiscal:', error);
        alert('Erro ao excluir nota fiscal');
      }
    }
  };

  console.log("Renderizando modal para agendamento:", agendamento.id);
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Detalhes da Nota Fiscal</h3>
          <div className="modal-actions-header">
            {!isEditing ? (
              <button 
                className="edit-button" 
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            ) : (
              <>
                <button 
                  className="cancel-edit-button" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData({
                      numeroNF: agendamento.numeroNF || '',
                      chaveAcesso: agendamento.chaveAcesso || '',
                      volumes: agendamento.volumes || 0,
                      observacoes: agendamento.observacoes || '',
                      clienteId: agendamento.clienteId || ''
                    });
                    setMensagem('');
                  }}
                >
                  Cancelar Edição
                </button>
                <button 
                  className="delete-button" 
                  onClick={handleDelete}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Excluir
                </button>
              </>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="modal-body">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Número da NF:</label>
                <input
                  type="text"
                  name="numeroNF"
                  value={editedData.numeroNF}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Chave de Acesso:</label>
                <input
                  type="text"
                  name="chaveAcesso"
                  value={editedData.chaveAcesso}
                  onChange={handleInputChange}
                  placeholder="Informe a chave de acesso"
                />
              </div>

              <div className="form-group">
                <label>Cliente:</label>
                <select
                  name="clienteId"
                  value={editedData.clienteId}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Volumes:</label>
                <input
                  type="number"
                  name="volumes"
                  value={editedData.volumes}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Observações:</label>
                <textarea
                  name="observacoes"
                  value={editedData.observacoes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Observações adicionais"
                />
              </div>
              
              <button 
                className="save-button" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              
              {mensagem && <p className="mensagem">{mensagem}</p>}
            </div>
          ) : (
            <>
              <div className="detail-row">
                <span className="label">Número da NF:</span>
                <span className="value">{agendamento.numeroNF || '-'}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Chave de Acesso:</span>
                <span className="value">{agendamento.chaveAcesso || '-'}</span>
              </div>
              
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
                <span className="value">{agendamento.volumes !== undefined ? agendamento.volumes : '-'}</span>
              </div>
              
              <div className="detail-row">
                <span className="label">Data:</span>
                <span className="value">
                  {agendamento.ePrevisao 
                    ? 'Previsão (sem data específica)' 
                    : formatarData(agendamento.data)}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="label">Observações:</span>
                <span className="value">{agendamento.observacoes || '-'}</span>
              </div>
            </>
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