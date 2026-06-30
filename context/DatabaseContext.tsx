import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

const DatabaseContext = createContext<any>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDB() {
      try {
        const database = await SQLite.openDatabaseAsync('accounting.db');
        await createTables(database);
        setDb(database);
      } catch (e) {
        console.error('Database init error:', e);
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

export function useDatabase() {
  return useContext(DatabaseContext);
}

async function createTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, type TEXT,
      parentId TEXT DEFAULT '', currency TEXT DEFAULT 'YER',
      balance REAL DEFAULT 0, isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cash_boxes (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT DEFAULT 'YER',
      balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '',
      currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
      address TEXT DEFAULT '', groupId TEXT DEFAULT '',
      currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0,
      creditLimit REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
      address TEXT DEFAULT '', currency TEXT DEFAULT 'YER',
      balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT DEFAULT '',
      unit TEXT DEFAULT 'حبة', categoryId TEXT, brandId TEXT,
      cost REAL DEFAULT 0, price REAL DEFAULT 0,
      quantity REAL DEFAULT 0, minQuantity REAL DEFAULT 0,
      warehouseId TEXT, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL,
      symbol TEXT DEFAULT '', rate REAL DEFAULT 1,
      isDefault INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT,
      totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0,
      isPosted INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journal_items (
      id TEXT PRIMARY KEY, entryId TEXT, accountId TEXT,
      debit REAL DEFAULT 0, credit REAL DEFAULT 0, description TEXT
    );
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, customerId TEXT,
      repId TEXT, type TEXT DEFAULT 'cash', subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0, total REAL DEFAULT 0, paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0, status TEXT DEFAULT 'draft',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierId TEXT,
      type TEXT DEFAULT 'cash', subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0, total REAL DEFAULT 0, paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0, status TEXT DEFAULT 'draft',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales_reps (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
      monthlyTarget REAL DEFAULT 0, commission REAL DEFAULT 0,
      totalSales REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customer_groups (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      discountPercent REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inventory_issues (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, warehouseId TEXT,
      total REAL DEFAULT 0, notes TEXT, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inventory_receipts (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, warehouseId TEXT,
      total REAL DEFAULT 0, notes TEXT, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS warehouse_transfers (
      id TEXT PRIMARY KEY, number TEXT, date TEXT,
      fromWarehouseId TEXT, toWarehouseId TEXT,
      total REAL DEFAULT 0, notes TEXT, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales_returns (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, customerId TEXT,
      invoiceId TEXT, total REAL DEFAULT 0, reason TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS purchase_returns (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierId TEXT,
      invoiceId TEXT, total REAL DEFAULT 0, reason TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS stock_counts (
      id TEXT PRIMARY KEY, date TEXT, warehouseId TEXT,
      itemId TEXT, expectedQty REAL, actualQty REAL,
      difference REAL, notes TEXT, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, type TEXT, title TEXT, message TEXT,
      read INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

export async function seedDefaultData(db: SQLite.SQLiteDatabase) {
  try {
    const currencies = await db.getAllAsync('SELECT * FROM currencies');
    if (currencies.length === 0) {
      await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c1','YER','الريال اليمني','﷼',1,1]);
      await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c2','USD','الدولار الأمريكي','$',530,0]);
      await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c3','SAR','الريال السعودي','﷼',141,0]);
    }

    const units = await db.getAllAsync('SELECT * FROM units');
    if (units.length === 0) {
      await db.runAsync("INSERT INTO units (id, name) VALUES (?,?)", ['u1','حبة']);
      await db.runAsync("INSERT INTO units (id, name) VALUES (?,?)", ['u2','كرتون']);
      await db.runAsync("INSERT INTO units (id, name) VALUES (?,?)", ['u3','كيلو']);
      await db.runAsync("INSERT INTO units (id, name) VALUES (?,?)", ['u4','لتر']);
      await db.runAsync("INSERT INTO units (id, name) VALUES (?,?)", ['u5','متر']);
    }
  } catch (e) {
    console.log('Seed data error (قد تحتاج صلاحيات):', e);
  }
}
