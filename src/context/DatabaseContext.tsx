import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { setDatabase } from '../store/useAccountStore';
import { seedDefaultData } from '../db/seed';

const DatabaseContext = createContext<any>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDB() {
      try {
        const database = await SQLite.openDatabaseAsync('accounting.db');
        await createAllTables(database);
        await seedDefaultData();
        setDb(database);
        setDatabase(database);
      } catch (e) {
        console.error('DB error:', e);
      } finally {
        setLoading(false);
      }
    }
    initDB();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, loading }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() { return useContext(DatabaseContext); }

async function createAllTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, code TEXT, name TEXT, type TEXT, parentId TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, isDebit INTEGER DEFAULT 1, isActive INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, symbol TEXT, rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS vouchers (id TEXT PRIMARY KEY, number TEXT, type TEXT, voucherType TEXT, date TEXT, sourceName TEXT, accountName TEXT, amount REAL DEFAULT 0, status TEXT DEFAULT 'posted');
    CREATE TABLE IF NOT EXISTS salesInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerId TEXT, type TEXT DEFAULT 'cash', total REAL DEFAULT 0, paid REAL DEFAULT 0, status TEXT DEFAULT 'posted');
    CREATE TABLE IF NOT EXISTS purchaseInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierId TEXT, type TEXT DEFAULT 'cash', total REAL DEFAULT 0, paid REAL DEFAULT 0, status TEXT DEFAULT 'posted');
    CREATE TABLE IF NOT EXISTS journal_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT, date TEXT, description TEXT, type TEXT, base_amount REAL DEFAULT 0, status TEXT DEFAULT 'posted');
    CREATE TABLE IF NOT EXISTS journal_details (id INTEGER PRIMARY KEY AUTOINCREMENT, journal_id INTEGER, account_id TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT, balance REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT, balance REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT, location TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT, code TEXT, unit TEXT DEFAULT 'حبة', cost REAL DEFAULT 0, price REAL DEFAULT 0, quantity REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  `);
}

export default DatabaseContext;
