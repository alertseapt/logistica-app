import React, { useState, useEffect } from 'react';
import { formatarData, formatarDataHora } from '../../utils/nfUtils';
import { updateAgendamento, updateAgendamentoStatus, deleteAgendamento, getClientes } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const InvoiceDetailsModal = ({ agendamento, onClose, onRefresh }) => {
  const { ambiente } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    numeroNF: agendamento?.numeroNF || '',
    chaveAcesso: agendamento?.chaveAcesso || '',
    volumes: agendamento?.volumes || 0,
    observacoes: agendamento?.observacoes || '',
    clienteId: agendamento?.clienteId || '',
    data: agendamento?.data ? new Date(formatarData(agendamento.data).split('/').reverse().join('-')) : new Date(),
    ePrevisao: agendamento?.ePrevisao || false
  });
  
  const [clientes, setClientes] = useState([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [showStatusButtons, setShowStatusButtons] = useState(false);
  const [loadingActions, setLoadingActions] = useState({});
  
  // Refs for client search
  const clienteSearchRef = React.useRef(null);
  const suggestionsRef = React.useRef(null);
  
  useEffect(() => {
    // Show status buttons in administrativo and leitura environments
    setShowStatusButtons(ambiente === 'administrativo' || ambiente === 'leitura');
    
    // Load client list when editing mode is activated
    if (isEditing) {
      fetchClientes();
      
      // Set initial client search value to current client name
      const currentClient = agendamento?.cliente?.nome || '';
      setClienteSearch(currentClient);
    }
    
    // Add event listener for closing suggestions when clicking outside
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ambiente, agendamento, isEditing]);
  
  // Filter clients when search term changes
  useEffect(() => {
    if (clienteSearch.trim() === '') {
      setFilteredClientes([]);
      return;
    }
    
    const lowerCaseSearch = clienteSearch.toLowerCase();
    const filtered = clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(lowerCaseSearch) ||
      cliente.cnpj.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredClientes(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [clienteSearch, clientes]);
  
  const handleClickOutside = (event) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        clienteSearchRef.current && !clienteSearchRef.current.contains(event.target)) {
      setShowSuggestions(false);
    }
  };
  
  const fetchClientes = async () => {
    try {
      const clientesList = await getClientes();
      setClientes(clientesList);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };
  
  const handleSelectCliente = (cliente) => {
    setClienteSearch(cliente.nome);
    setEditedData(prev => ({
      ...prev,
      clienteId: cliente.id
    }));
    setShowSuggestions(false);
  };
  
  if (!agendamento) return null;
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'volumes') {
      setEditedData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else if (type === 'checkbox') {
      setEditedData(prev => ({
        ...prev,
        [name]: checked
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
      // Prepare data for submission
      const dataToSubmit = {
        ...editedData,
        data: editedData.ePrevisao ? null : editedData.data
      };
      
      await updateAgendamento(agendamento.id, dataToSubmit);
      setMensagem('Informações atualizadas com sucesso!');
      setIsEditing(false);
      
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
  
  const handleUpdateStatus = async (status) => {
    // Set loading for this specific action
    setLoadingActions(prev => ({ ...prev, [status]: true }));
    
    try {
      await updateAgendamentoStatus(agendamento.id, status);
      setMensagem(`Status atualizado para ${status} com sucesso!`);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setMensagem(`Erro ao atualizar status: ${error.response?.data?.error || error.message}`);
    } finally {
      // Clear loading state for this action
      setLoadingActions(prev => ({ ...prev, [status]: false }));
    }
  };
  
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    setDeleting(true);
    setMensagem('');
    
    try {
      await deleteAgendamento(agendamento.id);
      setMensagem('Agendamento excluído com sucesso!');
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
        if (onRefresh) {
          onRefresh();
        }
      }, 1500);
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      setMensagem('Erro ao excluir agendamento');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };
  
  // Show all status options regardless of current status
  const getStatusButtons = () => {
    // All possible status options
    const allStatuses = [
      'agendado', 
      'recebido', 
      'informado', 
      'em tratativa', 
      'a paletizar', 
      'paletizado', 
      'fechado'
    ];
    
    // Filter out the current status
    return allStatuses
      .filter(status => status !== agendamento.status)
      .map(status => (
        <button 
          key={status} 
          onClick={() => handleUpdateStatus(status)}
          className={`${status === 'informado' ? 'informado-button' : ''} ${loadingActions[status] ? 'loading' : ''}`}
          disabled={loadingActions[status]}
        >
          {loadingActions[status] 
            ? `Alterando para ${status}...` 
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ));
  };
  
  // Allow editing in both administrativo and leitura environments
  const canEdit = ambiente === 'administrativo' || ambiente === 'leitura';
  
  // Format date for input field
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Detalhes da Nota Fiscal</h3>
          <div className="modal-actions-header">
            {canEdit && !isEditing && (
              <button 
                className="edit-button" 
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            )}
            {isEditing && (
              <button 
                className="cancel-edit-button" 
                onClick={() => {
                  setIsEditing(false);
                  setEditedData({
                    numeroNF: agendamento.numeroNF || '',
                    chaveAcesso: agendamento.chaveAcesso || '',
                    volumes: agendamento.volumes || 0,
                    observacoes: agendamento.observacoes || '',
                    clienteId: agendamento.clienteId || '',
                    data: agendamento.data ? new Date(formatarData(agendamento.data).split('/').reverse().join('-')) : new Date(),
                    ePrevisao: agendamento.ePrevisao || false
                  });
                  setClienteSearch(agendamento?.cliente?.nome || '');
                  setMensagem('');
                }}
              >
                Cancelar Edição
              </button>
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
              
              <div className="form-group autocomplete-container">
                <label>Cliente:</label>
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    if (e.target.value.trim() === '') {
                      setEditedData(prev => ({...prev, clienteId: ''}));
                    }
                  }}
                  onFocus={() => {
                    if (clienteSearch.trim() !== '' && filteredClientes.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Digite o nome ou CNPJ do cliente"
                  ref={clienteSearchRef}
                />
                
                {showSuggestions && (
                  <div className="suggestions" ref={suggestionsRef}>
                    {filteredClientes.map(cliente => (
                      <div 
                        key={cliente.id} 
                        className="suggestion-item"
                        onClick={() => handleSelectCliente(cliente)}
                      >
                        <div className="suggestion-name">{cliente.nome}</div>
                        <div className="suggestion-cnpj">{cliente.cnpj}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {editedData.clienteId && clienteSearch && (
                  <div className="selected-cliente">
                    Cliente selecionado: {clientes.find(c => c.id === editedData.clienteId)?.nome || clienteSearch}
                  </div>
                )}
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
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="ePrevisao"
                    checked={editedData.ePrevisao}
                    onChange={handleInputChange}
                  />
                  É previsão (sem data específica)
                </label>
              </div>
              
              {!editedData.ePrevisao && (
                <div className="form-group">
                  <label>Data:</label>
                  <input
                    type="date"
                    name="data"
                    value={formatDateForInput(editedData.data)}
                    onChange={handleInputChange}
                    required={!editedData.ePrevisao}
                  />
                </div>
              )}
              
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
              
              <div className="edit-actions">
                <button 
                  className={`save-button ${saving ? 'loading' : ''}`}
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                
                {canEdit && (
                  <button 
                    className={`delete-button ${deleting ? 'loading' : ''}`}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting 
                      ? (confirmDelete ? 'Excluindo...' : 'Processando...') 
                      : (!confirmDelete ? 'Excluir Agendamento' : 'Confirmar Exclusão')}
                  </button>
                )}
              </div>
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
              
              {/* Status action buttons */}
              {showStatusButtons && (
                <div className="status-actions">
                  <h4>Ações de Status</h4>
                  <div className="status-buttons">
                    {getStatusButtons()}
                  </div>
                </div>
              )}
              
              {/* Delete button removed from view mode */}
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
          
          {mensagem && <p className="mensagem">{mensagem}</p>}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;