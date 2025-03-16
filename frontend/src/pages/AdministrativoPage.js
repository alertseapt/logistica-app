import React, { useState } from 'react';
import ScheduleCreationForm from '../components/administrativo/ScheduleCreationForm';
import ProcessingInvoicesList from '../components/administrativo/ProcessingInvoicesList';

const AdministrativoPage = () => {
  const [refresh, setRefresh] = useState(0);
  
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  return (
    <div className="page administrativo-page">
      <h2>Administrativo</h2>
      
      <ScheduleCreationForm onRefresh={handleRefresh} />
      
      <ProcessingInvoicesList refresh={refresh} onRefresh={handleRefresh} />
    </div>
  );
};

export default AdministrativoPage;
