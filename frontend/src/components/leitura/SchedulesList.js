import React from 'react';
import { formatarData } from '../../utils/nfUtils';

const SchedulesList = ({ agendamentos, loading }) => {
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  if (agendamentos.length === 0) {
    return <p>Nenhum agendamento encontrado</p>;
  }
  
  return (
    <div className="schedules-list">
      <table>
        <thead>
          <tr>
            <th>NF</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Volumes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.map(item => (
            <tr key={item.id} className={`status-${item.status.replace(/\s+/g, '-')}`}>
              <td>{item.numeroNF}</td>
              <td>{item.cliente ? item.cliente.nome : '-'}</td>
              <td>
                {item.ePrevisao 
                  ? 'Previsão' 
                  : formatarData(item.data)}
              </td>
              <td>{item.volumes}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchedulesList;