import React, { useState, useEffect, useRef } from 'react';
import { getClientes, createAgendamento, updateAgendamentoStatus } from '../../services/api';
import { extrairNumeroNF } from '../../utils/nfUtils';

const ScheduleCreationModal = ({ isOpen, onClose, onRefresh }) => {
  const [input, setInput] = useState('');
  const [volumes, setVolumes] = useState('');
  const [data, setData] = useState('');
  const [ePrevisao, setEPrevisao] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [marcarRecebido, setMarcarRecebido] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  
  // Ref para o input da NF
  const inputRef = useRef(null);
  
  useEffect(() => {
    // Define a data atual como valor padrão
    const hoje = new Date().toISOString().split('T')[0];
    setData(hoje);
    
    // Carrega a lista de clientes
    fetchClientes();
    
    // Foca no input quando o modal abre
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const fetchClientes = async () => {
    try {
      const clientesList = await getClientes();
      setClientes(clientesList);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clienteId) {
      setMensagem('Cliente é obrigatório');
      return;
    }
    
    if (!ePrevisao && !data) {
      setMensagem('Data é obrigatória quando não é previsão');
      return;
    }
    
    setLoading(true);
    setMensagem('');
    
    try {
      // Processa o número da NF ou chave de acesso
      const numeroNF = extrairNumeroNF(input);
      const chaveAcesso = input.length === 44 ? input : '';
      
      const novoAgendamento = {
        numeroNF,
        chaveAcesso,
        data: ePrevisao ? null : data,
        ePrevisao,
        volumes: Number(volumes) || 0,
        clienteId,
        observacoes
      };
      
      const response = await createAgendamento(novoAgendamento);
      
      // Se a opção estiver marcada, alterar status para recebido
      if (marcarRecebido && response.id) {
        await updateAgendamentoStatus(response.id, 'recebido');
        setMensagem('Agendamento criado e marcado como recebido');
      } else {
        setMensagem('Agendamento criado com sucesso');
      }
      
      // Limpa o formulário
      setInput('');
      setVolumes('');
      setData(new Date().toISOString().split('T')[0]);
      setEPrevisao(false);
      setClienteId('');
      setObservacoes('');
      setMarcarRecebido(false);
      
      onRefresh();
      
      // Foca no input de NF novamente
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setMensagem('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Criar Agendamento</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Número da NF ou Chave de Acesso</label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
                ref={inputRef}
              />
            </div>
            
            <div className="form-group">
              <label>Volumes</label>
              <input
                type="number"
                value={volumes}
                onChange={(e) => setVolumes(e.target.value)}
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label>Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={ePrevisao}
                  onChange={(e) => setEPrevisao(e.target.checked)}
                />
                É previsão (sem data específica)
              </label>
            </div>
            
            {!ePrevisao && (
              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required={!ePrevisao}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows="3"
              />
            </div>
            
            <div className="form-group" style={{marginTop: "15px", marginBottom: "15px"}}>
              <div style={{display: "flex", alignItems: "center"}}>
                <input
                  type="checkbox"
                  id="marcarRecebido"
                  checked={marcarRecebido}
                  onChange={(e) => setMarcarRecebido(e.target.checked)}
                  style={{width: "auto", marginRight: "10px"}}
                />
                <label htmlFor="marcarRecebido">
                  Marcar como recebido automaticamente
                </label>
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="confirm-button">
                {loading ? 'Criando...' : 'Criar Agendamento'}
              </button>
            </div>
          </form>
          
          {mensagem && <p className="mensagem">{mensagem}</p>}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCreationModal;