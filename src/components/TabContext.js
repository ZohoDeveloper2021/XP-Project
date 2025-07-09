// src/context/TabContext.js
import { createContext, useContext, useState } from 'react';

const TabContext = createContext();

export const TabProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('Leads');
  const tabs = ['Leads', 'Contacts', 'Accounts', 'Deals'];
  
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab, tabs }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
};