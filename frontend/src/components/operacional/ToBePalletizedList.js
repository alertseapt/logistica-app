import React, { useState, useEffect } from 'react';
import { getAgendamentos, updateAgendamentoStatus } from '../../services/api';
import { formatarData, timestampToDate } from '../../utils/nfUtils';

const ToBePalletizedList = ({ refresh, onRefresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
    try {
      await updateAgendamentoStatus(id, status);
      setAgendamentos(agendamentos.filter(item => item.id !== id));
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
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
        <ul>
          {agendamentos.map(item => (
            <li key={item.id}>
              <span>NF: {item.numeroNF}</span>
              <span>Cliente: {item.cliente.nome}</span>
              <span>Volumes: {item.volumes}</span>
              <button onClick={() => handleUpdateStatus(item.id, 'paletizado')}>
                Paletizado
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ToBePalletizedList;