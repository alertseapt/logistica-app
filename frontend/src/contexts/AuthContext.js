import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [ambiente, setAmbiente] = useState('operacional');
  const [ambienteChanged, setAmbienteChanged] = useState(false);
  
  const changeAmbiente = (novoAmbiente) => {
    // Se estiver mudando para o ambiente de leitura, sinaliza a mudança
    if (novoAmbiente === 'leitura') {
      setAmbienteChanged(true);
    }
    setAmbiente(novoAmbiente);
  };
  
  // Redefine o sinalizador após ele ser usado
  const resetAmbienteChanged = () => {
    setAmbienteChanged(false);
  };
  
  return (
    <AuthContext.Provider value={{ 
      ambiente, 
      changeAmbiente, 
      ambienteChanged, 
      resetAmbienteChanged 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);