import React, { createContext, useContext, useState } from 'react';

const DatabaseContext = createContext<any>({ db: null, loading: false });

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <DatabaseContext.Provider value={{ db: 'local', loading: false }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
