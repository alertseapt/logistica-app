import React, { useState, useEffect } from 'react';
import { getClientes } from '../../services/api';

const statusOptions = ['agendado', 'recebido', 'informado', 'em tratativa', 'a paletizar', 'paletizado', 'fechado'];
const statusLabels = {
  'agendado': 'Agendado',
  'recebido': 'Recebido',
  'informado': 'Informado',
  'em tratativa': 'Em Tratativa',
  'a paletizar': 'A Paletizar',
  'paletizado': 'Paletizado',
  'fechado': 'Fechado'
};

const FilterControls = ({ onFilter }) => {
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [cliente, setCliente] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusOptions);
  const [ordenacao, setOrdenacao] = useState('data_antiga');
  const [clientes, setClientes] = useState([]);
  
  useEffect(() => {
    // Define as datas padrão
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    setDataInicial(primeiroDiaDoMes.toISOString().split('T')[0]);
    setDataFinal(hoje.toISOString().split('T')[0]);
    
    // Carrega a lista de clientes
    fetchClientes();
    
  }, []);

  useEffect(() => {
    // Aplica os filtros sempre que um estado de filtro mudar
    if (dataInicial && dataFinal) {
      const filtros = {
        dataInicial,
        dataFinal,
        cliente: cliente || undefined,
        status: selectedStatus,
        ordenacao
      };
      onFilter(filtros);
    }
  }, [dataInicial, dataFinal, cliente, selectedStatus, ordenacao, onFilter]);

  const fetchClientes = async () => {
    try {
      const clientesList = await getClientes();
      // Ordena os clientes em ordem alfabética
      clientesList.sort((a, b) => a.nome.localeCompare(b.nome));
      setClientes(clientesList);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleStatusChange = (statusValue) => {
    setSelectedStatus(prev => 
      prev.includes(statusValue) 
        ? prev.filter(s => s !== statusValue) 
        : [...prev, statusValue]
    );
  };

  const smallInputStyle = {
    padding: '4px 8px',
    fontSize: '0.875rem',
    height: 'auto',
    width: 'fit-content'
  };
  
  return (
    <div className="filter-container">
      <div className="main-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'center' }}>
        <div className="filter-group">
          <label style={{ marginRight: '5px' }}>Data Inicial</label>
          <input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} style={smallInputStyle} />
        </div>
        <div className="filter-group">
          <label style={{ marginRight: '5px' }}>Data Final</label>
          <input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} style={smallInputStyle} />
        </div>
        
        <div className="filter-group">
          <label style={{ marginRight: '5px' }}>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)} style={smallInputStyle}>
            <option value="">Todos</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label style={{ marginRight: '5px' }}>Ordenar por</label>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={smallInputStyle}>
            <option value="data_antiga">Data mais antiga</option>
            <option value="data_recente">Data mais recente</option>
            <option value="volumes">Volumes (maior para menor)</option>
          </select>
        </div>
      </div>

      <div className="status-buttons-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '10px', justifyContent: 'center' }}>
        {statusOptions.map(s => (
          <button 
            key={s} 
            onClick={() => handleStatusChange(s)}
            style={{ 
              opacity: selectedStatus.includes(s) ? 1 : 0.3,
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedStatus.includes(s) ? '#007bff' : '#f0f0f0',
              color: selectedStatus.includes(s) ? 'white' : 'black',
              fontWeight: selectedStatus.includes(s) ? 'bold' : 'normal',
            }}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterControls;