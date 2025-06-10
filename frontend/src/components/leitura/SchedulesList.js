import React from 'react';
import { formatarData } from '../../utils/nfUtils';

const SchedulesList = ({ agendamentos, loading, onRowClick }) => {
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  if (agendamentos.length === 0) {
    return <p>Nenhum agendamento encontrado</p>;
  }

  const getDataRecebimento = (historico) => {
    if (!historico) return '-';
    const recebido = historico.find(h => h.status === 'recebido');
    return recebido ? formatarData(recebido.timestamp) : '-';
  };
  
  return (
    <div className="schedules-list">
      <table>
        <thead>
          <tr>
            <th>NF</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Data Recebimento</th>
            <th>Volumes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.map(item => (
            <tr 
              key={item.id} 
              className={`status-${item.status.replace(/\s+/g, '-')}`}
            >
              <td className="clickable" onClick={() => onRowClick(item)}>
                {item.numeroNF}
              </td>
              <td>{item.cliente ? item.cliente.nome : '-'}</td>
              <td>
                {item.ePrevisao 
                  ? 'Previsão' 
                  : formatarData(item.data)}
              </td>
              <td>{getDataRecebimento(item.historicoStatus)}</td>
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