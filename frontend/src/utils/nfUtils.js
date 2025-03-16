export const extrairNumeroNF = (input) => {
  if (!input) return '';
  
  // Verifica se é chave de acesso (44 dígitos)
  if (input.length === 44 && /^\d+$/.test(input)) {
    // Extrai número da NF da chave de acesso (posições 26 a 34)
    const numeroNF = input.substring(25, 34);
    // Remove zeros à esquerda
    return numeroNF.replace(/^0+/, '');
  }
  
  // Caso não seja chave de acesso, remove caracteres não numéricos
  const numeros = input.replace(/\D/g, '');
  // Remove zeros à esquerda
  return numeros.replace(/^0+/, '');
};

// Função robusta para converter qualquer formato de timestamp para Date
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // Verificar se é um objeto com propriedade toDate() (formato nativo do Firestore)
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Verificar se é um objeto com propriedades seconds e nanoseconds (formato Firestore)
    if (timestamp && typeof timestamp === 'object' && 
        timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    }
    
    // Verificar se é um objeto com propriedade _seconds e _nanoseconds (formato alternativo)
    if (timestamp && typeof timestamp === 'object' && 
        timestamp._seconds !== undefined && timestamp._nanoseconds !== undefined) {
      return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
    }
    
    // Se é um número (timestamp em milissegundos)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    // Se for uma string ISO de data ou objeto Date já
    return new Date(timestamp);
  } catch (error) {
    console.error('Erro ao converter timestamp:', error, timestamp);
    return null;
  }
};

export const formatarData = (date) => {
  if (!date) return '-';
  
  try {
    // Converte para Date usando nossa função robusta
    const dataConvertida = timestampToDate(date);
    
    // Verifica se a data é válida
    if (!dataConvertida || isNaN(dataConvertida.getTime())) {
      console.warn('Data inválida:', date);
      return '-';
    }
    
    return dataConvertida.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return '-';
  }
};

export const formatarDataHora = (date) => {
  if (!date) return '-';
  
  try {
    // Converte para Date usando nossa função robusta
    const dataConvertida = timestampToDate(date);
    
    // Verifica se a data é válida
    if (!dataConvertida || isNaN(dataConvertida.getTime())) {
      console.warn('Data/hora inválida:', date);
      return '-';
    }
    
    return `${dataConvertida.toLocaleDateString('pt-BR')} ${dataConvertida.toLocaleTimeString('pt-BR')}`;
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error, date);
    return '-';
  }
};