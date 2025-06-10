import React, { useState } from 'react';
import InvoiceKeyInput from '../components/operacional/InvoiceKeyInput';
import ToBePalletizedList from '../components/operacional/ToBePalletizedList';
import TodaySchedulesList from '../components/operacional/TodaySchedulesList';

const OperacionalPage = () => {
  const [refresh, setRefresh] = useState(0);
  
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  return (
    <div className="page operacional-page" style={{ maxWidth: '70%', margin: '0 auto' }}>
      <h2>Operacional</h2>
      
      <InvoiceKeyInput onRefresh={handleRefresh} />
      
      <div className="lists-container" style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <ToBePalletizedList refresh={refresh} onRefresh={handleRefresh} />
        </div>
        <div style={{ flex: 1 }}>
          <TodaySchedulesList refresh={refresh} />
        </div>
      </div>
    </div>
  );
};

export default OperacionalPage;