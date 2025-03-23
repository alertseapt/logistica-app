import React, { useState, useEffect } from 'react';
import { getAgendamentos, updateAgendamentoStatus } from '../../services/api';
import { formatarData } from '../../utils/nfUtils';
import InvoiceDetailsModal from './InvoiceDetailsModal';

const ProcessingInvoicesList = ({ refresh, onRefresh }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  
  useEffect(() => {
    fetchAgendamentos();
  }, [refresh]);
  
  // Função auxiliar para converter timestamp para Date
  const timestampToDate = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      // Formato específico com _seconds e _nanoseconds
      if (timestamp && typeof timestamp === 'object' && 
          (timestamp._seconds !== undefined || timestamp.seconds !== undefined)) {
        
        // Obter seconds do objeto, dependendo do formato
        const seconds = timestamp._seconds !== undefined ? timestamp._seconds : timestamp.seconds;
        
        // Verificar se é um timestamp futuro (válido até 31/12/2024)
        const currentYear = new Date().getFullYear();
        const maxValidTimestamp = new Date(`${currentYear+1}-01-01`).getTime() / 1000;
        
        if (seconds > maxValidTimestamp) {
          console.warn('Data futura inválida detectada:', timestamp);
          return null;
        }
        
        return new Date(seconds * 1000);
      }
      
      // Se já for uma data ou string de data
      const date = new Date(timestamp);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Formato de data inválido:', timestamp);
        return null;
      }
      
      return date;
    } catch (error) {
      console.error('Erro ao converter timestamp:', error, timestamp);
      return null;
    }
  };
  
  // Função para verificar se uma data é válida
  const isValidDate = (date) => {
    return date && !isNaN(date.getTime());
  };
  
  const fetchAgendamentos = async () => {
    setLoading(true);
    
    try {
      // Busca agendamentos com status "recebido", "informado", "em tratativa", "a paletizar" ou "paletizado"
      const statusList = ['recebido', 'informado', 'em tratativa', 'a paletizar', 'paletizado'];
      
      const promises = statusList.map(status => getAgendamentos({ status }));
      const responses = await Promise.all(promises);
      
      // Combina todos os resultados
      const combinedAgendamentos = responses.flat();
      
      // Verifica se cada agendamento tem um status de recebimento no histórico
      const agendamentosComData = combinedAgendamentos.map(agendamento => {
        const recebido = agendamento.historicoStatus?.find(h => h.status === 'recebido');
        const dataRecebimento = recebido ? timestampToDate(recebido.timestamp) : null;
        return {
          ...agendamento,
          dataRecebimento
        };
      });
      
      // Filtra agendamentos sem data de recebimento
      const comDataRecebimento = agendamentosComData.filter(a => isValidDate(a.dataRecebimento));
      const semDataRecebimento = agendamentosComData.filter(a => !isValidDate(a.dataRecebimento));
      
      // Ordena os agendamentos com data de recebimento (mais antigo primeiro)
      const ordenados = comDataRecebimento.sort((a, b) => {
        return a.dataRecebimento - b.dataRecebimento;
      });
      
      // Combina os ordenados com os sem data de recebimento
      const sortedAgendamentos = [...ordenados, ...semDataRecebimento];
      
      console.log("Agendamentos ordenados por data de recebimento:");
      sortedAgendamentos.forEach(a => {
        if (isValidDate(a.dataRecebimento)) {
          console.log(`NF: ${a.numeroNF || 'Sem NF'}, Status: ${a.status}, Data recebimento: ${a.dataRecebimento.toLocaleDateString()}`);
        } else {
          console.log(`NF: ${a.numeroNF || 'Sem NF'}, Status: ${a.status}, Sem data de recebimento válida`);
        }
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
      console.log(`Tentando atualizar agendamento ${id} para status ${status}`);
      await updateAgendamentoStatus(id, status);
      await fetchAgendamentos();
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      if (error.response) {
        console.error('Resposta do servidor:', error.response.data);
      }
      alert(`Erro ao atualizar status: ${error.message || 'Falha na requisição'}`);
    }
  };
  
  const handleShowDetails = (agendamento) => {
    console.log("Abrindo detalhes do agendamento:", agendamento.id);
    setSelectedAgendamento(agendamento);
  };
  
  const handleCloseDetails = () => {
    setSelectedAgendamento(null);
  };
  
  const getDataRecebimento = (historicoStatus) => {
    if (!historicoStatus || !Array.isArray(historicoStatus)) return '-';
    
    const recebido = historicoStatus.find(h => h.status === 'recebido');
    if (!recebido) return '-';
    
    return formatarData(recebido.timestamp);
  };

  // Verifica se a NF deve ficar destacada em vermelho
  const isNFHighlighted = (item) => {
    // Verifica se não tem volume ou volume é zero
    const semVolume = !item.volumes || item.volumes === 0;
    
    // Verifica se não tem chave de acesso
    const semChaveAcesso = !item.chaveAcesso || item.chaveAcesso.trim() === '';
    
    return semVolume || semChaveAcesso;
  };
  
  if (loading) {
    return <p>Carregando...</p>;
  }
  
  return (
    <div className="processing-invoices-list">
      <h3>Notas em Processamento</h3>
      <p className="sorting-info">Ordenado por data de recebimento (mais antiga primeiro)</p>
      {agendamentos.length === 0 ? (
        <p>Nenhuma nota em processamento</p>
      ) : (
        <ul>
          {agendamentos.map(item => (
            <li key={item.id} className={`status-${item.status.replace(/\s+/g, '-')}`}>
              <div className="item-info">
                <span className="status">{item.status}</span>
                <span 
                  className={`numero-nf clickable ${isNFHighlighted(item) ? 'highlighted-nf' : ''}`}
                  onClick={() => handleShowDetails(item)}
                >
                  NF: {item.numeroNF || 'Sem NF'}
                </span>
                <span>Cliente: {item.cliente?.nome || 'Sem cliente'}</span>
                <span className="data-recebimento">
                  Recebido em: {getDataRecebimento(item.historicoStatus)}
                </span>
              </div>
              <div className="item-actions">
                {(item.status === 'recebido' || item.status === 'informado') && (
                  <button onClick={() => handleUpdateStatus(item.id, 'informado')}
                    className="status-button informado-button">
                    Informado
                  </button>
                )}
                
                {(item.status === 'recebido' || item.status === 'informado') && (
                  <button onClick={() => handleUpdateStatus(item.id, 'em tratativa')}>
                    Em Tratativa
                  </button>
                )}
                
                {(item.status === 'recebido' || item.status === 'em tratativa' || item.status === 'informado') && (
                  <button onClick={() => handleUpdateStatus(item.id, 'a paletizar')}>
                    A Paletizar
                  </button>
                )}
                
                {item.status === 'paletizado' && (
                  <button onClick={() => handleUpdateStatus(item.id, 'fechado')}>
                    Finalizar
                  </button>
                )}
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

export default ProcessingInvoicesList;