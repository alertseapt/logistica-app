import React, { useState, useEffect } from 'react';
import { getAgendamentos, updateAgendamentoStatus } from '../../services/api';
import { formatarData } from '../../utils/nfUtils';
import InvoiceDetailsModal from './InvoiceDetailsModal';

const ProcessingInvoicesList = ({ refresh, onRefresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  
  useEffect(() => {
    fetchAgendamentos();
  }, [refresh]);
  
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
      // Busca agendamentos com status "recebido", "em tratativa", "a paletizar" ou "paletizado"
      const statusList = ['recebido', 'em tratativa', 'a paletizar', 'paletizado'];
      
      const promises = statusList.map(status => getAgendamentos({ status }));
      const responses = await Promise.all(promises);
      
      // Combina todos os resultados
      const combinedAgendamentos = responses.flat();
      
      // Ordena por status e data de recebimento
      const sortedAgendamentos = combinedAgendamentos.sort((a, b) => {
        // Prioriza status "recebido"
        if (a.status === 'recebido' && b.status !== 'recebido') return -1;
        if (a.status !== 'recebido' && b.status === 'recebido') return 1;
        
        // Para status iguais, ordena por data de recebimento (mais antiga primeiro)
        if (a.status === b.status) {
          const recebidoA = a.historicoStatus.find(h => h.status === 'recebido');
          const recebidoB = b.historicoStatus.find(h => h.status === 'recebido');
          
          if (!recebidoA || !recebidoB) return 0;
          
          const dataA = timestampToDate(recebidoA.timestamp);
          const dataB = timestampToDate(recebidoB.timestamp);
          
          return dataA - dataB;
        }
        
        return 0;
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
    setSelectedAgendamento(agendamento);
  };
  
  const handleCloseDetails = () => {
    setSelectedAgendamento(null);
  };
  
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="processing-invoices-list">
      <h3>Notas em Processamento</h3>
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
              </div>
              <div className="item-actions">
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