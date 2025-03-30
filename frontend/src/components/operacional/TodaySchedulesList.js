import React, { useState, useEffect } from 'react';
import { getAgendamentos } from '../../services/api';
import { formatarData, timestampToDate } from '../../utils/nfUtils';
import InvoiceDetailsModal from '../administrativo/InvoiceDetailsModal';

const TodaySchedulesList = ({ refresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  
  useEffect(() => {
    fetchAgendamentos();
  }, [refresh]);
  
  const fetchAgendamentos = async () => {
    setLoading(true);
    
    try {
      // Busca agendamentos com status "agendado"
      const response = await getAgendamentos({ status: 'agendado' });
      
      // Filtra os agendamentos do dia atual
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // início do dia
      
      const agendamentosHoje = response.filter(a => {
        if (a.ePrevisao) return false;
        
        const dataAgendamento = timestampToDate(a.data);
        
        if (!dataAgendamento) return false;
        
        // Compara apenas ano, mês e dia
        return dataAgendamento.getDate() === hoje.getDate() &&
               dataAgendamento.getMonth() === hoje.getMonth() &&
               dataAgendamento.getFullYear() === hoje.getFullYear();
      });
      
      setAgendamentos(agendamentosHoje);
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
    <div className="today-schedules-list">
      <h3>Agendamentos para Hoje</h3>
      {agendamentos.length === 0 ? (
        <p>Nenhum agendamento para hoje</p>
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

export default TodaySchedulesList;