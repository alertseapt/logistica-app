import React, { useState } from 'react';
import { searchAgendamentos, updateAgendamentoStatus, updateAgendamento } from '../../services/api';
import { extrairNumeroNF, formatarData } from '../../utils/nfUtils';
import InvoiceDetailsModal from '../administrativo/InvoiceDetailsModal';

const InvoiceKeyInput = ({ onRefresh }) => {
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  
  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      setLoading(true);
      setMensagem('');
      
      try {
        const agendamentos = await searchAgendamentos(chaveAcesso);
        
        // Filtra apenas agendamentos com status "agendado"
        const agendadosResultados = agendamentos.filter(a => a.status === 'agendado');
        
        setResultados(agendadosResultados);
        
        if (agendadosResultados.length === 0) {
          const numeroNF = extrairNumeroNF(chaveAcesso);
          setMensagem(`Nota ${numeroNF} não agendada`);
        }
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        setMensagem('Erro ao buscar agendamentos');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleReceberNota = async (id, agendamento) => {
    setLoadingActions(prev => ({ ...prev, [id]: true }));
    
    try {
      // Verificar se é uma chave de acesso (44 dígitos) e se o agendamento ainda não tem chave
      if (chaveAcesso.length === 44 && /^\d+$/.test(chaveAcesso) && 
          (!agendamento.chaveAcesso || agendamento.chaveAcesso.length === 0)) {
        
        // Primeiro atualiza a chave de acesso
        await updateAgendamento(id, { chaveAcesso });
        console.log(`Chave de acesso ${chaveAcesso} adicionada ao agendamento ${id}`);
      }
      
      // Depois altera o status para recebido
      await updateAgendamentoStatus(id, 'recebido');
      
      // Atualiza a lista de resultados
      setResultados(resultados.filter(item => item.id !== id));
      
      // Limpa o campo de chave de acesso
      setChaveAcesso('');
      
      // Notifica que a nota foi recebida
      setMensagem('Nota recebida com sucesso');
      
      // Atualiza a tela principal
      onRefresh();
    } catch (error) {
      console.error('Erro ao receber nota:', error);
      setMensagem(`Erro ao receber nota: ${error.message}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
    }
  };
  
  const handleShowDetails = (agendamento) => {
    setSelectedAgendamento(agendamento);
  };
  
  const handleCloseDetails = () => {
    setSelectedAgendamento(null);
  };
  
  return (
    <div className="invoice-key-input">
      <h3>Chave de Acesso da Nota Fiscal</h3>
      <input
        type="text"
        value={chaveAcesso}
        onChange={(e) => setChaveAcesso(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Digite a chave de acesso da NF..."
        disabled={loading}
      />
      
      {loading && <p>Carregando...</p>}
      
      {mensagem && <p className="mensagem">{mensagem}</p>}
      
      {resultados.length > 0 && (
        <div className="resultados">
          <h4>Agendamentos encontrados:</h4>
          <ul>
            {resultados.map(item => (
              <li key={item.id}>
                <span>NF: <span 
                  className="clickable" 
                  onClick={() => handleShowDetails(item)}
                >{item.numeroNF}</span></span>
                <span>Cliente: {item.cliente.nome}</span>
                <span>Data: {formatarData(item.data)}</span>
                <button 
                  onClick={() => handleReceberNota(item.id, item)}
                  disabled={loadingActions[item.id]}
                  className={loadingActions[item.id] ? 'loading' : ''}
                >
                  {loadingActions[item.id] ? 'Processando...' : 'Receber'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {selectedAgendamento && (
        <InvoiceDetailsModal
          agendamento={selectedAgendamento}
          onClose={handleCloseDetails}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default InvoiceKeyInput;