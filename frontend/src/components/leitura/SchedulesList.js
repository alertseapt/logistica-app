import React, { useState } from 'react';
import { formatarData, formatarDataHora } from '../../utils/nfUtils';
import InvoiceDetailsModal from '../administrativo/InvoiceDetailsModal';

const SchedulesList = ({ agendamentos, loading }) => {
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  
  const handleShowDetails = (agendamento) => {
    setSelectedAgendamento(agendamento);
  };
  
  const handleCloseDetails = () => {
    setSelectedAgendamento(null);
  };
  
  // Helper function to get the received date and time
  const getDataRecebimento = (historicoStatus) => {
    if (!historicoStatus || !Array.isArray(historicoStatus)) return '-';
    
    const recebido = historicoStatus.find(h => h.status === 'recebido');
    if (!recebido) return '-';
    
    return formatarDataHora(recebido.timestamp);
  };
  
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
            <th>Recebido em</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.map(item => (
            <tr key={item.id} className={`status-${item.status.replace(/\s+/g, '-')}`}>
              <td>
                <span 
                  className="clickable" 
                  onClick={() => handleShowDetails(item)}
                >
                  {item.numeroNF}
                </span>
              </td>
              <td>{item.cliente ? item.cliente.nome : '-'}</td>
              <td>
                {item.ePrevisao 
                  ? 'Previsão' 
                  : formatarData(item.data)}
              </td>
              <td>{item.volumes}</td>
              <td>{item.status}</td>
              <td>{getDataRecebimento(item.historicoStatus)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {selectedAgendamento && (
        <InvoiceDetailsModal
          agendamento={selectedAgendamento}
          onClose={handleCloseDetails}
          onRefresh={() => {}} // No refresh function needed here
        />
      )}
    </div>
  );
};

export default SchedulesList;