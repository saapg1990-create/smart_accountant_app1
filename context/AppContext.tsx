import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccountStore } from '../src/store/useAccountStore';
import { initializeDefaultAccounts } from '../src/services/AccountInitializer';
import { eventBus, EVENTS } from '../src/services/EventBus';

interface AppContextType {
  isDark: boolean;
  toggleDark: () => void;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  isDark: true, toggleDark: () => {}, refreshAllData: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const { loadAccounts } = useAccountStore();

  const toggleDark = () => setIsDark(!isDark);

  const refreshAllData = async () => {
    await initializeDefaultAccounts();
    await loadAccounts();
  };

  useEffect(() => {
    refreshAllData();
    // الاستماع لأحداث التحديث العامة
    const unsubscribe = eventBus.on(EVENTS.REFRESH_ALL, () => {
      refreshAllData();
    });
    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider value={{ isDark, toggleDark, refreshAllData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
