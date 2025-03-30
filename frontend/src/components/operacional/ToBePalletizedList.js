import React, { useState, useEffect } from 'react';
import { getAgendamentos, updateAgendamentoStatus } from '../../services/api';
import { formatarData, timestampToDate } from '../../utils/nfUtils';
import InvoiceDetailsModal from '../administrativo/InvoiceDetailsModal';

const ToBePalletizedList = ({ refresh, onRefresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  
  useEffect(() => {
    fetchAgendamentos();
  }, [refresh]);
  
  const fetchAgendamentos = async () => {
    setLoading(true);
    
    try {
      const response = await getAgendamentos({ status: 'a paletizar' });
      
      // Ordena por data de recebimento (mais antiga primeiro)
      const sortedAgendamentos = response.sort((a, b) => {
        const recebidoA = a.historicoStatus && a.historicoStatus.find(h => h.status === 'recebido');
        const recebidoB = b.historicoStatus && b.historicoStatus.find(h => h.status === 'recebido');
        
        if (!recebidoA || !recebidoB) return 0;
        
        const dataA = timestampToDate(recebidoA.timestamp);
        const dataB = timestampToDate(recebidoB.timestamp);
        
        if (!dataA || !dataB) return 0;
        
        return dataA - dataB;
      });
      
      setAgendamentos(sortedAgendamentos);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id, status) => {
    setLoadingActions(prev => ({ ...prev, [id]: true }));
    
    try {
      await updateAgendamentoStatus(id, status);
      setAgendamentos(agendamentos.filter(item => item.id !== id));
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
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
  
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="to-be-palletized-list">
      <h3>A Paletizar</h3>
      {agendamentos.length === 0 ? (
        <p>Nenhum agendamento a paletizar</p>
      ) : (
        <ul className="horizontal-list">
          {agendamentos.map(item => (
            <li key={item.id}>
              <div className="item-content">
                <div className="item-info-horizontal">
                  <span className="item-nf">NF: <span 
                    className="clickable" 
                    onClick={() => handleShowDetails(item)}
                  >{item.numeroNF}</span></span>
                  <span className="item-cliente">Cliente: {item.cliente.nome}</span>
                  <span className="item-volumes">Volumes: {item.volumes}</span>
                </div>
                <button 
                  onClick={() => handleUpdateStatus(item.id, 'paletizado')}
                  disabled={loadingActions[item.id]}
                  className={loadingActions[item.id] ? 'loading' : ''}
                >
                  {loadingActions[item.id] ? 'Processando...' : 'Paletizado'}
                </button>
              </div>
            </li>
          ))}
        </ul>
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

export default ToBePalletizedList;