import React, { useState, useEffect } from 'react';
import { getAgendamentos } from '../../services/api';
import InvoiceDetailsModal from '../administrativo/InvoiceDetailsModal';

const ForecastsList = ({ refresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  
  useEffect(() => {
    fetchAgendamentos();
  }, [refresh]);
  
  const fetchAgendamentos = async () => {
    setLoading(true);
    
    try {
      const response = await getAgendamentos({ status: 'agendado' });
      
      // Filtra apenas agendamentos que são previsões (sem data específica)
      const previsoes = response.filter(a => a.ePrevisao === true);
      
      setAgendamentos(previsoes);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
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
    <div className="forecasts-list">
      <h3>Previsões de Entrega</h3>
      {agendamentos.length === 0 ? (
        <p>Nenhuma previsão de entrega</p>
      ) : (
        <ul className="horizontal-list">
          {agendamentos.map(item => (
            <li key={item.id}>
              <div className="item-info-horizontal">
                <span className="item-nf">NF: <span 
                  className="clickable" 
                  onClick={() => handleShowDetails(item)}
                >{item.numeroNF}</span></span>
                <span className="item-cliente">Cliente: {item.cliente.nome}</span>
                <span className="item-volumes">Volumes: {item.volumes}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {selectedAgendamento && (
        <InvoiceDetailsModal
          agendamento={selectedAgendamento}
          onClose={handleCloseDetails}
          onRefresh={fetchAgendamentos}
        />
      )}
    </div>
  );
};

export default ForecastsList;