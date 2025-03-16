import React, { useState } from 'react';
import { searchAgendamentos } from '../../services/api';

const SearchInput = ({ onSearchResults }) => {
  const [termo, setTermo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    if (!termo.trim()) return;
    
    setLoading(true);
    
    try {
      const resultados = await searchAgendamentos(termo);
      onSearchResults(resultados);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      alert('Erro ao buscar agendamentos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="search-input">
      <input
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Buscar por número de NF ou chave de acesso..."
        disabled={loading}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  );
};

export default SearchInput;