import React, { useState, useEffect, useCallback } from 'react';
import SearchInput from '../components/leitura/SearchInput';
import FilterControls from '../components/leitura/FilterControls';
import SchedulesList from '../components/leitura/SchedulesList';
import InvoiceDetailsModal from '../components/administrativo/InvoiceDetailsModal';
import { getAgendamentos } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { timestampToDate } from '../utils/nfUtils';

const LeituraPage = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalVolumes, setTotalVolumes] = useState(0);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const { ambienteChanged, resetAmbienteChanged } = useAuth();
  
  // Carrega os agendamentos iniciais e quando o ambiente muda para Leitura
  useEffect(() => {
    fetchAgendamentos();
    
    // Se a página foi carregada devido a mudança de ambiente, reset o sinalizador
    if (ambienteChanged) {
      resetAmbienteChanged();
    }
  }, [ambienteChanged]); // Adiciona ambienteChanged como dependência
  
  useEffect(() => {
    const total = filteredAgendamentos.reduce((acc, agendamento) => acc + (Number(agendamento.volumes) || 0), 0);
    setTotalVolumes(total);
  }, [filteredAgendamentos]);
  
  const fetchAgendamentos = async () => {
    setLoading(true);
    
    try {
      // Obtém todos os agendamentos
      const response = await getAgendamentos();
      
      // Log para depurar a estrutura dos dados recebidos
      console.log('Dados recebidos:', JSON.stringify(response[0]));
      
      setAgendamentos(response);
      
      // Aplica os filtros padrão (mês atual)
      const hoje = new Date();
      const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      applyDefaultFilters(response, primeiroDiaDoMes, hoje);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Aplica os filtros padrão aos agendamentos
  const applyDefaultFilters = (agendamentosList, dataInicial, dataFinal) => {
    if (!agendamentosList || agendamentosList.length === 0) return;
    
    const dataInicio = new Date(dataInicial);
    dataInicio.setHours(0, 0, 0, 0);

    const dataFim = new Date(dataFinal);
    dataFim.setHours(23, 59, 59, 999);
    
    const filtrados = agendamentosList.filter(a => {
      if (a.ePrevisao) return true;
      
      if (!a.data) return false;
      
      const dataAgendamento = timestampToDate(a.data);
      return dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
    });
    
    // Ordenar por data mais antiga
    filtrados.sort((a, b) => {
      if (a.ePrevisao && !b.ePrevisao) return 1;
      if (!a.ePrevisao && b.ePrevisao) return -1;
      if (a.ePrevisao && b.ePrevisao) return 0;
      
      const dataA = timestampToDate(a.data);
      const dataB = timestampToDate(b.data);
      return dataA - dataB;
    });
    
    setFilteredAgendamentos(filtrados);
  };
  
  const handleSearchResults = (resultados) => {
    setSearchResults(resultados.length > 0 ? resultados : null);
    
    if (resultados.length > 0) {
      setFilteredAgendamentos(resultados);
    } else {
      // Se a busca não retornou resultados, volta para os filtros normais
      if (agendamentos.length > 0) {
        const hoje = new Date();
        const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        applyDefaultFilters(agendamentos, primeiroDiaDoMes, hoje);
      } else {
        fetchAgendamentos();
      }
    }
  };
  
  const handleFilter = useCallback((filtros) => {
    let resultado = searchResults ? [...searchResults] : [...agendamentos];
    
    // Aplica filtros
    if (filtros.cliente) {
      resultado = resultado.filter(a => a.clienteId === filtros.cliente);
    }
    
    if (filtros.status) {
      if (filtros.status.length > 0) {
        resultado = resultado.filter(a => filtros.status.includes(a.status));
      } else {
        // Se nenhum status for selecionado, a lista fica vazia
        resultado = [];
      }
    }
    
    // Filtra por data
    if (filtros.dataInicial && filtros.dataFinal) {
      const dataInicio = new Date(filtros.dataInicial);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(filtros.dataFinal);
      dataFim.setHours(23, 59, 59, 999);
      
      resultado = resultado.filter(a => {
        if (a.ePrevisao) return true;
        
        if (!a.data) return false;
        
        const dataAgendamento = timestampToDate(a.data);
        return dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
      });
    }
    
    // Aplica ordenação
    switch (filtros.ordenacao) {
      case 'data_antiga':
        resultado.sort((a, b) => {
          if (a.ePrevisao && !b.ePrevisao) return 1;
          if (!a.ePrevisao && b.ePrevisao) return -1;
          if (a.ePrevisao && b.ePrevisao) return 0;
          
          const dataA = timestampToDate(a.data);
          const dataB = timestampToDate(b.data);
          return dataA - dataB;
        });
        break;
      case 'data_recente':
        resultado.sort((a, b) => {
          if (a.ePrevisao && !b.ePrevisao) return 1;
          if (!a.ePrevisao && b.ePrevisao) return -1;
          if (a.ePrevisao && b.ePrevisao) return 0;
          
          const dataA = timestampToDate(a.data);
          const dataB = timestampToDate(b.data);
          return dataB - dataA;
        });
        break;
      case 'volumes':
        resultado.sort((a, b) => b.volumes - a.volumes);
        break;
      default:
        break;
    }
    
    setFilteredAgendamentos(resultado);
  }, [agendamentos, searchResults]);
  
  const handleRowClick = (agendamento) => {
    setSelectedAgendamento(agendamento);
  };

  const closeModal = () => {
    setSelectedAgendamento(null);
  };
  
  return (
    <div className="page leitura-page" style={{ maxWidth: '70%', margin: '0 auto' }}>
      <h2>Leitura</h2>
      
      <SearchInput onSearchResults={handleSearchResults} />
      
      <FilterControls onFilter={handleFilter} />
      
      <div className="total-volumes-info">
        <p>Volumetria total: <strong>{totalVolumes}</strong></p>
      </div>
      
      {searchResults !== null && (
        <div className="search-info">
          <p>Exibindo resultados da busca ({filteredAgendamentos.length})</p>
          <button onClick={() => {
            setSearchResults(null);
            // Aplica filtros aos agendamentos gerais quando limpa a busca
            const hoje = new Date();
            const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            applyDefaultFilters(agendamentos, primeiroDiaDoMes, hoje);
          }}>
            Limpar busca
          </button>
        </div>
      )}
      
      <SchedulesList 
        agendamentos={filteredAgendamentos} 
        loading={loading}
        onRowClick={handleRowClick}
      />

      {selectedAgendamento && (
        <InvoiceDetailsModal
          isOpen={!!selectedAgendamento}
          onClose={closeModal}
          agendamento={selectedAgendamento}
          onRefresh={fetchAgendamentos}
          isLeitura={true}
        />
      )}
    </div>
  );
};

export default LeituraPage;