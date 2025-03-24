// Arquivo api.js corrigido para o frontend
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

export const getAgendamentos = async (filters = {}) => {
  const response = await api.get('/agendamentos', { params: filters });
  return response.data;
};

export const getAgendamentoById = async (id) => {
  const response = await api.get(`/agendamentos/${id}`);
  return response.data;
};

export const createAgendamento = async (agendamento) => {
  const response = await api.post('/agendamentos', agendamento);
  return response.data;
};

export const updateAgendamento = async (id, agendamento) => {
  const response = await api.put(`/agendamentos/${id}`, agendamento);
  return response.data;
};

export const updateAgendamentoStatus = async (id, status) => {
  try {
    const response = await api.patch(`/agendamentos/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

export const deleteAgendamento = async (id) => {
  const response = await api.delete(`/agendamentos/${id}`);
  return response.data;
};

export const searchAgendamentos = async (termo) => {
  const response = await api.get('/agendamentos/busca/nf', { params: { termo } });
  return response.data;
};

export const getClientes = async () => {
  const response = await api.get('/clientes');
  return response.data;
};

export const getClienteById = async (id) => {
  const response = await api.get(`/clientes/${id}`);
  return response.data;
};

export const createCliente = async (cliente) => {
  const response = await api.post('/clientes', cliente);
  return response.data;
};

export const updateCliente = async (id, cliente) => {
  const response = await api.put(`/clientes/${id}`, cliente);
  return response.data;
};

export const deleteCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};