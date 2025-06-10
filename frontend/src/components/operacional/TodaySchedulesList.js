import React, { useState, useEffect } from 'react';
import { getAgendamentos } from '../../services/api';
import { formatarData, timestampToDate } from '../../utils/nfUtils';

const TodaySchedulesList = ({ refresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
  
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="today-schedules-list">
      <h3>Agendamentos para Hoje</h3>
      {agendamentos.length === 0 ? (
        <p>Nenhum agendamento para hoje</p>
      ) : (
        <div className="agendamentos-container">
          {agendamentos.map(item => (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex',
                alignItems: 'center',
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaySchedulesList;