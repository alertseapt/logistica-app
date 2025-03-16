import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import OperacionalPage from './pages/OperacionalPage';
import AdministrativoPage from './pages/AdministrativoPage';
import LeituraPage from './pages/LeituraPage';
import './styles/App.css';

const AppContent = () => {
  const { ambiente } = useAuth();
  
  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {ambiente === 'operacional' && <OperacionalPage />}
        {ambiente === 'administrativo' && <AdministrativoPage />}
        {ambiente === 'leitura' && <LeituraPage />}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;