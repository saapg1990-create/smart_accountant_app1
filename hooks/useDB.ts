import { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { genId } from '../db/database';

// Hook عام للتعامل مع أي جدول
export function useTable<T>(tableName: string) {
  const { db } = useDatabase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const rows = await db.getAllAsync<any>(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      setData(rows.map(mapRow));
    } catch (e) {
      console.log(`Load ${tableName} error:`, e);
    }
    setLoading(false);
  };

  const add = async (item: Partial<T>) => {
    if (!db) return;
    const id = genId();
    const keys = Object.keys(item as any);
    const values = Object.values(item as any);
    const placeholders = keys.map(() => '?').join(',');
    
    await db.runAsync(
      `INSERT INTO ${tableName} (id, ${keys.join(',')}) VALUES (?, ${placeholders})`,
      [id, ...values]
    );
    await loadAll();
    return id;
  };

  const remove = async (id: string) => {
    if (!db) return;
    await db.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    await loadAll();
  };

  const update = async (id: string, updates: Partial<T>) => {
    if (!db) return;
    const keys = Object.keys(updates as any);
    const values = Object.values(updates as any);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    
    await db.runAsync(
      `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    await loadAll();
  };

  useEffect(() => {
    loadAll();
  }, [db]);

  return { data, loading, add, remove, update, reload: loadAll };
}

function mapRow(row: any): any {
  const mapped: any = {};
  for (const key in row) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    mapped[camelKey] = row[key];
  }
  return mapped;
}
