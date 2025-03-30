import React, { useState } from 'react';
import InvoiceKeyInput from '../components/operacional/InvoiceKeyInput';
import ToBePalletizedList from '../components/operacional/ToBePalletizedList';
import TodaySchedulesList from '../components/operacional/TodaySchedulesList';
import ForecastsList from '../components/operacional/ForecastsList';

const OperacionalPage = () => {
  const [refresh, setRefresh] = useState(0);
  
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  return (
    <div className="page operacional-page">
      <h2>Operacional</h2>
      
      <InvoiceKeyInput onRefresh={handleRefresh} />
      
      <div className="top-lists-container">
        <ToBePalletizedList refresh={refresh} onRefresh={handleRefresh} />
        <TodaySchedulesList refresh={refresh} />
      </div>
      
      <div className="bottom-list-container">
        <ForecastsList refresh={refresh} />
      </div>
    </div>
  );
};

export default OperacionalPage;