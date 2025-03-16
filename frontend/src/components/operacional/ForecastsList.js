import React, { useState, useEffect } from 'react';
import { getAgendamentos } from '../../services/api';

const ForecastsList = ({ refresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
  
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="forecasts-list">
      <h3>Previsões de Entrega</h3>
      {agendamentos.length === 0 ? (
        <p>Nenhuma previsão de entrega</p>
      ) : (
        <ul>
          {agendamentos.map(item => (
            <li key={item.id}>
              <span>NF: {item.numeroNF}</span>
              <span>Cliente: {item.cliente.nome}</span>
              <span>Volumes: {item.volumes}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ForecastsList;
