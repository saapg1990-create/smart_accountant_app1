import { useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';

let db: any = null;
const getDB = async () => {
  if (!db) db = await SQLite.openDatabaseAsync('accounting.db');
  return db;
};

export function useDataLoader() {
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (tableName: string, orderBy = 'name') => {
    setLoading(true);
    try {
      const database = await getDB();
      return await database.getAllAsync(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
    } catch (e) {
      console.log(`Error loading ${tableName}:`, e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { load, loading };
}
