import React, { useState, useEffect } from 'react';
import { getClientes, createAgendamento } from '../../services/api';
import { extrairNumeroNF } from '../../utils/nfUtils';

const ScheduleCreationForm = ({ onRefresh }) => {
  const [input, setInput] = useState('');
  const [volumes, setVolumes] = useState('');
  const [data, setData] = useState('');
  const [ePrevisao, setEPrevisao] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  
  useEffect(() => {
    // Define a data atual como valor padrão
    const hoje = new Date().toISOString().split('T')[0];
    setData(hoje);
    
    // Carrega a lista de clientes
    fetchClientes();
  }, []);
  
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
      
      await createAgendamento(novoAgendamento);
      
      // Limpa o formulário
      setInput('');
      setVolumes('');
      setData(new Date().toISOString().split('T')[0]);
      setEPrevisao(false);
      setObservacoes('');
      
      setMensagem('Agendamento criado com sucesso');
      onRefresh();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setMensagem('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="schedule-creation-form">
      <h3>Criar Agendamento</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Número da NF ou Chave de Acesso</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
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
        
        <button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Agendamento'}
        </button>
      </form>
      
      {mensagem && <p className="mensagem">{mensagem}</p>}
    </div>
  );
};

export default ScheduleCreationForm;
