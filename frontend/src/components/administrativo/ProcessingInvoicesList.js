import React, { useState, useEffect } from 'react';
import { getAgendamentos, updateAgendamentoStatus } from '../../services/api';
import { formatarData } from '../../utils/nfUtils';
import InvoiceDetailsModal from './InvoiceDetailsModal';

const ProcessingInvoicesList = ({ refresh, onRefresh, sortOrder = 'oldest' }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  
  useEffect(() => {
    fetchAgendamentos();
  }, [refresh, sortOrder]);
  
  // Função auxiliar para converter timestamp para Date
  const timestampToDate = (timestamp) => {
    if (!timestamp) return null;
    
    // Se for um objeto Timestamp do Firestore
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Se já for uma data ou string de data
    return new Date(timestamp);
  };
  
  const fetchAgendamentos = async () => {
    setLoading(true);
    
    try {
      // Busca agendamentos com status "recebido", "informado", "em tratativa", "a paletizar" ou "paletizado"
      const statusList = ['recebido', 'informado', 'em tratativa', 'a paletizar', 'paletizado'];
      
      const promises = statusList.map(status => getAgendamentos({ status }));
      const responses = await Promise.all(promises);
      
      // Combina todos os resultados
      const combinedAgendamentos = responses.flat();
      
      // Ordena por data de recebimento conforme a preferência do usuário
      const sortedAgendamentos = combinedAgendamentos.sort((a, b) => {
        // Primeiro verifica se ambos têm histórico de status
        if (!a.historicoStatus || !b.historicoStatus) return 0;
        
        // Encontra o evento de recebimento no histórico
        const recebidoA = a.historicoStatus.find(h => h.status === 'recebido');
        const recebidoB = b.historicoStatus.find(h => h.status === 'recebido');
        
        // Se um tem status recebido e outro não, o que tem vem primeiro
        if (recebidoA && !recebidoB) return -1;
        if (!recebidoA && recebidoB) return 1;
        
        // Se nenhum tem status recebido, mantém ordem atual
        if (!recebidoA && !recebidoB) return 0;
        
        // Ambos têm status recebido, compara timestamps
        const dataA = timestampToDate(recebidoA.timestamp);
        const dataB = timestampToDate(recebidoB.timestamp);
        
        if (!dataA || !dataB) return 0;
        
        // Ordena por data de recebimento conforme sortOrder
        return sortOrder === 'oldest' 
          ? dataA - dataB  // Mais antigos primeiro
          : dataB - dataA; // Mais recentes primeiro
      });
      
      setAgendamentos(sortedAgendamentos);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAgendamentoStatus(id, status);
      await fetchAgendamentos();
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };
  
  const handleShowDetails = (agendamento) => {
    console.log("Abrindo detalhes do agendamento:", agendamento.id);
    setSelectedAgendamento(agendamento);
  };
  
  const handleCloseDetails = () => {
    setSelectedAgendamento(null);
  };
  
  const getDataRecebimento = (historicoStatus) => {
    if (!historicoStatus || !Array.isArray(historicoStatus)) return '-';
    
    const recebido = historicoStatus.find(h => h.status === 'recebido');
    if (!recebido) return '-';
    
    return formatarData(recebido.timestamp);
  };
  
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="processing-invoices-list">
      <h3>Notas em Processamento {sortOrder === 'newest' && '(Mais recentes primeiro)'}</h3>
      {agendamentos.length === 0 ? (
        <p>Nenhuma nota em processamento</p>
      ) : (
        <ul>
          {agendamentos.map(item => (
            <li key={item.id} className={`status-${item.status.replace(/\s+/g, '-')}`}>
              <div className="item-info">
                <span className="status">{item.status}</span>
                <span 
                  className="numero-nf clickable"
                  onClick={() => handleShowDetails(item)}
                >
                  NF: {item.numeroNF}
                </span>
                <span>Cliente: {item.cliente.nome}</span>
                <span className="data-recebimento">
                  Recebido em: {getDataRecebimento(item.historicoStatus)}
                </span>
              </div>
              <div className="item-actions">
                {(item.status === 'recebido' || item.status === 'informado') && (
                  <button onClick={() => handleUpdateStatus(item.id, 'informado')}
                    className="status-button informado-button">
                    Informado
                  </button>
                )}
                
                {item.status === 'recebido' && (
                  <button onClick={() => handleUpdateStatus(item.id, 'em tratativa')}>
                    Em Tratativa
                  </button>
                )}
                
                {(item.status === 'recebido' || item.status === 'em tratativa') && (
                  <button onClick={() => handleUpdateStatus(item.id, 'a paletizar')}>
                    A Paletizar
                  </button>
                )}
                
                {item.status === 'paletizado' && (
                  <button onClick={() => handleUpdateStatus(item.id, 'fechado')}>
                    Finalizar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {selectedAgendamento && (
        <InvoiceDetailsModal
          agendamento={selectedAgendamento}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default ProcessingInvoicesList;