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
    
    // Normaliza a data para meio-dia (12:00) para evitar problemas de fuso horário
    const normalizeDate = (dateInput) => {
      if (!dateInput) return null;
      
      let dataObj;
      
      // Se for um objeto Date
      if (dateInput instanceof Date) {
        dataObj = dateInput;
      } else {
        // Se for uma string ISO ou timestamp
        dataObj = new Date(dateInput);
      }
      
      // Se a data é inválida, retorna null
      if (isNaN(dataObj.getTime())) {
        console.warn('Data inválida:', dateInput);
        return null;
      }
      
      // Cria uma nova data às 12:00 para evitar problemas de fuso horário
      const normalizedDate = new Date(
        dataObj.getFullYear(),
        dataObj.getMonth(),
        dataObj.getDate(),
        12, 0, 0
      );
      
      return admin.firestore.Timestamp.fromDate(normalizedDate);
    };
    
    // Cria o agendamento com status inicial "agendado"
    const novoAgendamento = {
      numeroNF: numeroNF || extrairNumeroNF(chaveAcesso || ''),
      chaveAcesso: chaveAcesso || '',
      data: ePrevisao ? null : normalizeDate(data),
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
    
    console.log('Criando agendamento com data:', data, 'normalizada para:', novoAgendamento.data);
    
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
      // Normaliza a data para meio-dia para evitar problemas de fuso horário
      if (data) {
        const dataObj = new Date(data);
        const dataLocalNormalizada = new Date(
          dataObj.getFullYear(),
          dataObj.getMonth(),
          dataObj.getDate(),
          12, 0, 0
        );
        atualizacoes.data = admin.firestore.Timestamp.fromDate(dataLocalNormalizada);
      } else {
        atualizacoes.data = null;
      }
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
    
    console.log(`[DEBUG] Tentando atualizar agendamento ${id} para status "${status}"`);
    
    if (!status) {
      console.log('[DEBUG] Erro: Status não informado');
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    // Validar se o status é permitido
    const statusPermitidos = ['agendado', 'recebido', 'informado', 'em tratativa', 'a paletizar', 'paletizado', 'fechado'];
    if (!statusPermitidos.includes(status)) {
      console.log(`[DEBUG] Erro: Status "${status}" não é permitido`);
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const agendamentoDoc = await agendamentosRef.doc(id).get();
    
    if (!agendamentoDoc.exists) {
      console.log(`[DEBUG] Erro: Agendamento ${id} não encontrado`);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const agendamentoAtual = agendamentoDoc.data();
    console.log(`[DEBUG] Status atual do agendamento ${id}: "${agendamentoAtual.status}"`);
    
    // Validar regras específicas para o status "informado"
    if (status === 'informado') {
      console.log(`[DEBUG] Validando regras para status "informado"`);
      // O status "informado" só pode ser aplicado se o status atual for "recebido" ou "informado"
      if (agendamentoAtual.status !== 'recebido' && agendamentoAtual.status !== 'informado') {
        console.log(`[DEBUG] Erro: Não é possível alterar de "${agendamentoAtual.status}" para "informado"`);
        return res.status(400).json({ 
          error: `O status informado só pode ser aplicado a agendamentos com status recebido ou informado. Status atual: ${agendamentoAtual.status}` 
        });
      }
      console.log(`[DEBUG] Validação bem-sucedida para status "informado"`);
    }
    
    // Validação para transições de "informado" para outros status
    if (agendamentoAtual.status === 'informado') {
      // Permitir transições de "informado" para "em tratativa", "a paletizar" e "informado"
      const transicoesPermitidas = ['informado', 'em tratativa', 'a paletizar'];
      if (!transicoesPermitidas.includes(status)) {
        console.log(`[DEBUG] Erro: Não é possível alterar de "informado" para "${status}"`);
        return res.status(400).json({
          error: `De status informado, só é possível alterar para: ${transicoesPermitidas.join(', ')}`
        });
      }
      console.log(`[DEBUG] Transição de "informado" para "${status}" permitida`);
    }
    
    // Adiciona o novo status ao histórico com timestamp do servidor
    const timestamp = admin.firestore.Timestamp.fromDate(new Date());
    const novoHistoricoItem = {
      status,
      timestamp
    };
    
    console.log(`[DEBUG] Adicionando novo histórico: ${status} em ${timestamp.toDate()}`);
    
    const historicoStatus = [
      ...(agendamentoAtual.historicoStatus || []),
      novoHistoricoItem
    ];
    
    await agendamentosRef.doc(id).update({
      status,
      historicoStatus
    });
    
    console.log(`[DEBUG] Agendamento ${id} atualizado com sucesso para status "${status}"`);
    
    // Recupera o agendamento atualizado
    const agendamentoAtualizado = await agendamentosRef.doc(id).get();
    
    res.status(200).json({ 
      id, 
      ...agendamentoAtualizado.data()
    });
  } catch (error) {
    console.error('[DEBUG] Erro ao atualizar status do agendamento:', error);
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