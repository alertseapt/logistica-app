import React, { useState } from 'react';
import ScheduleCreationModal from '../components/administrativo/ScheduleCreationModal';
import ProcessingInvoicesList from '../components/administrativo/ProcessingInvoicesList';

const AdministrativoPage = () => {
  const [refresh, setRefresh] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('oldest'); // 'oldest' ou 'newest'
  
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  const openModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest');
  };
  
  return (
    <div className="page administrativo-page">
      <h2>Administrativo</h2>
      
      <div className="action-buttons">
        <button className="create-button" onClick={openModal}>
          Criar Novo Agendamento
        </button>
      </div>
      
      <ScheduleCreationModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onRefresh={handleRefresh}
      />
      
      <div className="list-controls">
        <button 
          className="sort-button" 
          onClick={toggleSortOrder}
          title={sortOrder === 'oldest' ? 'Ordenar por data de recebimento mais recente' : 'Ordenar por data de recebimento mais antiga'}
        >
          {sortOrder === 'oldest' ? 'Mais antigos primeiro' : 'Mais recentes primeiro'}
        </button>
      </div>
      
      <ProcessingInvoicesList 
        refresh={refresh} 
        onRefresh={handleRefresh} 
        sortOrder={sortOrder}
      />
    </div>
  );
};

export default AdministrativoPage;