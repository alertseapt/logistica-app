import React, { useState, useEffect } from 'react';
import { getClientes } from '../../services/api';

const FilterControls = ({ onFilter }) => {
  const [mes, setMes] = useState('');
  const [cliente, setCliente] = useState('');
  const [status, setStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_antiga');
  const [clientes, setClientes] = useState([]);
  
  useEffect(() => {
    // Define o mês atual como padrão
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    setMes(mesAtual);
    
    // Carrega a lista de clientes
    fetchClientes();
    
    // Aplica filtros iniciais
    applyFilters();
  }, []);
  
  const fetchClientes = async () => {
    try {
      const clientesList = await getClientes();
      setClientes(clientesList);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };
  
  const applyFilters = () => {
    const filtros = {
      mes,
      cliente: cliente || undefined,
      status: status || undefined,
      ordenacao
    };
    
    onFilter(filtros);
  };
  
  // Gera lista de meses para o select (6 meses anteriores até 3 meses futuros)
  const getMesesOptions = () => {
    const options = [];
    const hoje = new Date();
    
    for (let i = -6; i <= 3; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const value = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const label = `${data.toLocaleString('pt-BR', { month: 'long' })} ${data.getFullYear()}`;
      
      options.push({ value, label });
    }
    
    return options;
  };
  
  return (
    <div className="filter-controls">
      <div className="filter-options">
        <div className="filter-group">
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(e.target.value)}>
            {getMesesOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option value="">Todos</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="recebido">Recebido</option>
            <option value="em tratativa">Em Tratativa</option>
            <option value="a paletizar">A Paletizar</option>
            <option value="paletizado">Paletizado</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Ordenar por</label>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
            <option value="data_antiga">Data mais antiga</option>
            <option value="data_recente">Data mais recente</option>
            <option value="volumes">Volumes (maior para menor)</option>
          </select>
        </div>
      </div>
      
      <div className="filter-actions">
        <button className="filter-button" onClick={applyFilters}>
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default FilterControls;