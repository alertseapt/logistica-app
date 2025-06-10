import React, { useState } from 'react';
import ScheduleCreationModal from '../components/administrativo/ScheduleCreationModal';
import ProcessingInvoicesList from '../components/administrativo/ProcessingInvoicesList';

const AdministrativoPage = () => {
  const [refresh, setRefresh] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  const openModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="page administrativo-page" style={{ maxWidth: '70%', margin: '0 auto' }}>
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
      
      <ProcessingInvoicesList 
        refresh={refresh} 
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default AdministrativoPage;