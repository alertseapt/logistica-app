const express = require('express');
const router = express.Router();
const { agendamentosRef, clientesRef, db } = require('../config/firebase');
const { extrairNumeroNF } = require('../utils/nfUtils');
const admin = require('firebase-admin');

// Obter todos os agendamentos (com filtros opcionais)
router.get('/', async (req, res) => {
  try {
    const { status, cliente, data, mes } = req.query;
    let query = agendamentosRef;
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (cliente) {
      query = query.where('clienteId', '==', cliente);
    }
    
    if (data) {
      // Converter string de data para timestamp
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
      
      const timestampInicio = admin.firestore.Timestamp.fromDate(dataInicio);
      const timestampFim = admin.firestore.Timestamp.fromDate(dataFim);
      
      query = query.where('data', '>=', timestampInicio)
                   .where('data', '<=', timestampFim);
    }
    
    if (mes) {
      const [ano, mes] = mes.split('-');
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);
      
      const timestampInicio = admin.firestore.Timestamp.fromDate(dataInicio);
      const timestampFim = admin.firestore.Timestamp.fromDate(dataFim);
      
      query = query.where('data', '>=', timestampInicio)
                   .where('data', '<=', timestampFim);
    }
    
    const snapshot = await query.get();
    const agendamentos = [];
    
    snapshot.forEach(doc => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(agendamentos);
  } catch (error) {
    console.error('Erro ao obter agendamentos:', error);
    res.status(500).json({ error: 'Erro ao obter agendamentos' });
  }
});

// Obter agendamento por ID
router.get('/:id', async (req, res) => {
  try {
    const agendamentoDoc = await agendamentosRef.doc(req.params.id).get();
    
    if (!agendamentoDoc.exists) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    res.status(200).json({ id: agendamentoDoc.id, ...agendamentoDoc.data() });
  } catch (error) {
    console.error('Erro ao obter agendamento:', error);
    res.status(500).json({ error: 'Erro ao obter agendamento' });
  }
});

// Criar novo agendamento
router.post('/', async (req, res) => {
  try {
    const { 
      numeroNF, 
      chaveAcesso, 
      data, 
      ePrevisao, 
      volumes, 
      clienteId, 
      observacoes 
    } = req.body;
    
    // Validação dos campos obrigatórios
    if (!clienteId) {
      return res.status(400).json({ error: 'Cliente é obrigatório' });
    }
    
    if (!data && !ePrevisao) {
      return res.status(400).json({ error: 'Data ou indicação de previsão é obrigatória' });
    }
    
    // Verifica se o cliente existe
    const clienteDoc = await clientesRef.doc(clienteId).get();
    if (!clienteDoc.exists) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }
    
    const clienteData = clienteDoc.data();
    
    // Cria o agendamento com status inicial "agendado"
    const novoAgendamento = {
      numeroNF: numeroNF || extrairNumeroNF(chaveAcesso || ''),
      chaveAcesso: chaveAcesso || '',
      data: data ? admin.firestore.Timestamp.fromDate(new Date(data)) : null,
      ePrevisao: Boolean(ePrevisao),
      volumes: Number(volumes) || 0,
      clienteId,
      cliente: {
        nome: clienteData.nome,
        cnpj: clienteData.cnpj
      },
      status: 'agendado',
      observacoes: observacoes || '',
      historicoStatus: [{
        status: 'agendado',
        timestamp: admin.firestore.Timestamp.fromDate(new Date())
      }]
    };
    
    const docRef = await agendamentosRef.add(novoAgendamento);
    
    res.status(201).json({ id: docRef.id, ...novoAgendamento });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      numeroNF, 
      chaveAcesso, 
      data, 
      ePrevisao, 
      volumes, 
      clienteId, 
      observacoes 
    } = req.body;
    
    const agendamentoDoc = await agendamentosRef.doc(id).get();
    
    if (!agendamentoDoc.exists) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const agendamentoAtual = agendamentoDoc.data();
    
    const atualizacoes = {};
    
    if (numeroNF) atualizacoes.numeroNF = numeroNF;
    if (chaveAcesso) atualizacoes.chaveAcesso = chaveAcesso;
    if (data !== undefined) {
      atualizacoes.data = data ? admin.firestore.Timestamp.fromDate(new Date(data)) : null;
    }
    if (ePrevisao !== undefined) atualizacoes.ePrevisao = Boolean(ePrevisao);
    if (volumes !== undefined) atualizacoes.volumes = Number(volumes);
    if (observacoes !== undefined) atualizacoes.observacoes = observacoes;
    
    // Se o cliente mudou, atualiza as informações do cliente
    if (clienteId && clienteId !== agendamentoAtual.clienteId) {
      const clienteDoc = await clientesRef.doc(clienteId).get();
      
      if (!clienteDoc.exists) {
        return res.status(400).json({ error: 'Cliente não encontrado' });
      }
      
      const clienteData = clienteDoc.data();
      
      atualizacoes.clienteId = clienteId;
      atualizacoes.cliente = {
        nome: clienteData.nome,
        cnpj: clienteData.cnpj
      };
    }
    
    await agendamentosRef.doc(id).update(atualizacoes);
    
    // Recupera o agendamento atualizado
    const agendamentoAtualizado = await agendamentosRef.doc(id).get();
    
    res.status(200).json({ id, ...agendamentoAtualizado.data() });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// Atualizar status de um agendamento
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    // Validar se o status é permitido
    const statusPermitidos = ['agendado', 'recebido', 'em tratativa', 'a paletizar', 'paletizado', 'fechado'];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const agendamentoDoc = await agendamentosRef.doc(id).get();
    
    if (!agendamentoDoc.exists) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const agendamentoAtual = agendamentoDoc.data();
    
    // Adiciona o novo status ao histórico com timestamp do servidor
    const novoHistoricoItem = {
      status,
      timestamp: admin.firestore.Timestamp.fromDate(new Date())
    };
    
    const historicoStatus = [
      ...(agendamentoAtual.historicoStatus || []),
      novoHistoricoItem
    ];
    
    await agendamentosRef.doc(id).update({
      status,
      historicoStatus
    });
    
    // Recupera o agendamento atualizado
    const agendamentoAtualizado = await agendamentosRef.doc(id).get();
    
    res.status(200).json({ 
      id, 
      ...agendamentoAtualizado.data()
    });
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do agendamento' });
  }
});

// Deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const agendamentoDoc = await agendamentosRef.doc(id).get();
    
    if (!agendamentoDoc.exists) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    await agendamentosRef.doc(id).delete();
    
    res.status(200).json({ message: 'Agendamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    res.status(500).json({ error: 'Erro ao excluir agendamento' });
  }
});

// Buscar por número de NF ou chave de acesso
router.get('/busca/nf', async (req, res) => {
  try {
    const { termo } = req.query;
    
    if (!termo) {
      return res.status(400).json({ error: 'Termo de busca é obrigatório' });
    }
    
    const numeroNF = extrairNumeroNF(termo);
    
    // Busca por número de NF
    let query = agendamentosRef.where('numeroNF', '==', numeroNF);
    
    const snapshot = await query.get();
    const agendamentos = [];
    
    snapshot.forEach(doc => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });
    
    // Se não encontrar por número de NF, busca por chave de acesso
    if (agendamentos.length === 0 && termo.length === 44) {
      const chaveSnapshot = await agendamentosRef.where('chaveAcesso', '==', termo).get();
      
      chaveSnapshot.forEach(doc => {
        agendamentos.push({ id: doc.id, ...doc.data() });
      });
    }
    
    res.status(200).json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

module.exports = router;