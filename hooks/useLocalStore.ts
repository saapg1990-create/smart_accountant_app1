import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../context/DatabaseContext';

export function useLocalTable<T>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const { db } = useDatabase();

  const loadAll = useCallback(async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync(`SELECT * FROM ${tableName} ORDER BY 1`);
      setData(result as T[]);
    } catch (e) { console.log(`Load ${tableName}:`, e); }
  }, [db, tableName]);

  const add = useCallback(async (item: Partial<T>): Promise<string | null> => {
    if (!db) return null;
    try {
      const itemData = item as any;
      const id = itemData.id || (tableName + '-' + Date.now());
      const keys: string[] = [];
      const values: any[] = [];
      Object.entries(itemData).forEach(([key, value]) => {
        if (key !== 'id') { keys.push(key); values.push(value); }
      });
      if (keys.length === 0) return null;
      const placeholders = keys.map(() => '?').join(',');
      await db.runAsync(`INSERT INTO ${tableName} (id, ${keys.join(',')}) VALUES (?, ${placeholders})`, [id, ...values]);
      await loadAll();
      return id;
    } catch (e) { console.log(`Add ${tableName}:`, e); return null; }
  }, [db, tableName, loadAll]);

  const remove = useCallback(async (id: string): Promise<void> => {
    if (!db) return;
    await db.runAsync(`DELETE FROM ${tableName} WHERE id=?`, [id]);
    await loadAll();
  }, [db, tableName, loadAll]);

  const update = useCallback(async (id: string, updates: Partial<T>): Promise<void> => {
    if (!db) return;
    const keys = Object.keys(updates as any);
    if (keys.length === 0) return;
    const setClause = keys.map(k => `${k}=?`).join(',');
    const values = keys.map(k => (updates as any)[k]);
    await db.runAsync(`UPDATE ${tableName} SET ${setClause} WHERE id=?`, [...values, id]);
    await loadAll();
  }, [db, tableName, loadAll]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return { data, loading: false, add, remove, update, reload: loadAll };
}

export class LocalStore {
  private static instance: LocalStore;
  static getInstance(): LocalStore {
    if (!LocalStore.instance) LocalStore.instance = new LocalStore();
    return LocalStore.instance;
  }
  async getAll(table: string): Promise<any[]> { return []; }
  async add(table: string, item: any): Promise<string | null> { return null; }
}
