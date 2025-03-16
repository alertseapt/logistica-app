import React, { useState } from 'react';
import { searchAgendamentos, updateAgendamentoStatus } from '../../services/api';
import { extrairNumeroNF, formatarData } from '../../utils/nfUtils';

const InvoiceKeyInput = ({ onRefresh }) => {
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      setLoading(true);
      setMensagem('');
      
      try {
        const agendamentos = await searchAgendamentos(chaveAcesso);
        
        // Filtra apenas agendamentos com status "agendado"
        const agendadosResultados = agendamentos.filter(a => a.status === 'agendado');
        
        setResultados(agendadosResultados);
        
        if (agendadosResultados.length === 0) {
          const numeroNF = extrairNumeroNF(chaveAcesso);
          setMensagem(`Nota ${numeroNF} não agendada`);
        }
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        setMensagem('Erro ao buscar agendamentos');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleReceberNota = async (id) => {
    try {
      await updateAgendamentoStatus(id, 'recebido');
      setResultados(resultados.filter(item => item.id !== id));
      onRefresh();
    } catch (error) {
      console.error('Erro ao receber nota:', error);
      alert('Erro ao receber nota');
    }
  };
  
  return (
    <div className="invoice-key-input">
      <h3>Chave de Acesso da Nota Fiscal</h3>
      <input
        type="text"
        value={chaveAcesso}
        onChange={(e) => setChaveAcesso(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Digite a chave de acesso da NF..."
        disabled={loading}
      />
      
      {loading && <p>Carregando...</p>}
      
      {mensagem && <p className="mensagem">{mensagem}</p>}
      
      {resultados.length > 0 && (
        <div className="resultados">
          <h4>Agendamentos encontrados:</h4>
          <ul>
            {resultados.map(item => (
              <li key={item.id}>
                <span>NF: {item.numeroNF}</span>
                <span>Cliente: {item.cliente.nome}</span>
                <span>Data: {formatarData(item.data)}</span>
                <button onClick={() => handleReceberNota(item.id)}>
                  Receber
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InvoiceKeyInput;