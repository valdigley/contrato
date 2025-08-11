import React from 'react';
import { useState } from 'react';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import SystemSettings from './components/SystemSettings';

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isClientMode = urlParams.get('client') === 'true';
    const editId = urlParams.get('edit');
    const isSettings = urlParams.get('settings') === 'true';
    
    if (isSettings) {
      return 'settings';
    }
    if (isClientMode || editId) {
      return 'form';
    }
    return 'list';
  });

  const handleViewChange = (view: 'list' | 'form' | 'settings') => {
    setCurrentView(view);
    // Update URL without page reload
    if (view === 'list') {
      window.history.pushState({}, '', window.location.pathname);
    } else if (view === 'settings') {
      window.history.pushState({}, '', '?settings=true');
    }
  };

  if (currentView === 'settings') {
    return <SystemSettings onBack={() => handleViewChange('list')} />;
  }

  if (currentView === 'form') {
    return <ContractForm onBackToList={() => handleViewChange('list')} />;
  }
  
  return <ContractList onNewContract={() => handleViewChange('form')} />;
}

export default App;