import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccountStore } from '../src/store/useAccountStore';
import { initializeDefaultAccounts } from '../src/services/AccountInitializer';

interface AppContextType {
  isDark: boolean;
  toggleDark: () => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  isDark: true,
  toggleDark: () => {},
  companyName: 'المحاسب الذكي',
  setCompanyName: () => {},
  refreshAllData: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [companyName, setCompanyName] = useState('المحاسب الذكي');
  const { loadAccounts } = useAccountStore();

  const toggleDark = () => setIsDark(!isDark);

  const refreshAllData = async () => {
    try {
      await initializeDefaultAccounts();
      await loadAccounts();
    } catch (e) {
      console.log('Refresh error:', e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  return (
    <AppContext.Provider value={{ isDark, toggleDark, companyName, setCompanyName, refreshAllData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
