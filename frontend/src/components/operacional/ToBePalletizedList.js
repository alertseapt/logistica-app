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
        <div className="agendamentos-container">
          {agendamentos.map(item => (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            >
              <span>NF: {item.numeroNF}</span>
              <span>{item.cliente.nome}</span>
              <span>VOL: {item.volumes}</span>
              <button 
                onClick={() => handleUpdateStatus(item.id, 'paletizado')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Paletizado
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToBePalletizedList;