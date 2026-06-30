import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { setDatabase } from '../src/store/useAccountStore';

const DatabaseContext = createContext<any>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDB() {
      try {
        const database = await SQLite.openDatabaseAsync('accounting.db');
        await createTables(database);
        await seedMainAccounts(database);
        setDb(database);
        setDatabase(database);
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
      id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, type TEXT,
      parentId TEXT DEFAULT '', currency TEXT DEFAULT 'YER',
      balance REAL DEFAULT 0, isActive INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cashBoxes (id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS banks (id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', groupId TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, creditLimit REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT DEFAULT '', unit TEXT DEFAULT 'حبة', categoryId TEXT, brandId TEXT, cost REAL DEFAULT 0, price REAL DEFAULT 0, quantity REAL DEFAULT 0, minQuantity REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, symbol TEXT DEFAULT '', rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0, isPosted INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS journal_items (id TEXT PRIMARY KEY, entryId TEXT, accountId TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, description TEXT);
    CREATE TABLE IF NOT EXISTS salesInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerId TEXT, type TEXT DEFAULT 'cash', subtotal REAL DEFAULT 0, tax REAL DEFAULT 0, total REAL DEFAULT 0, paid REAL DEFAULT 0, remaining REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS purchaseInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierId TEXT, type TEXT DEFAULT 'cash', subtotal REAL DEFAULT 0, total REAL DEFAULT 0, paid REAL DEFAULT 0, remaining REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS salesReps (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', monthlyTarget REAL DEFAULT 0, totalSales REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT, title TEXT, message TEXT, read INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
  `);
}

async function seedMainAccounts(db: SQLite.SQLiteDatabase) {
  try {
    const existing = await db.getAllAsync("SELECT * FROM accounts WHERE parentId = '' AND isActive = 1");
    if (existing.length >= 5) return; // موجودة مسبقاً

    const mainAccounts = [
      { id: 'acc-assets', code: '1', name: 'الأصول', type: 'أصل', balance: 0 },
      { id: 'acc-liabilities', code: '2', name: 'الخصوم', type: 'خصم', balance: 0 },
      { id: 'acc-equity', code: '3', name: 'حقوق الملكية', type: 'ملكية', balance: 0 },
      { id: 'acc-revenues', code: '4', name: 'الإيرادات', type: 'إيراد', balance: 0 },
      { id: 'acc-expenses', code: '5', name: 'المصروفات', type: 'مصروف', balance: 0 },
    ];

    for (const acc of mainAccounts) {
      await db.runAsync(
        'INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isActive) VALUES (?,?,?,?,?,?,?,1)',
        [acc.id, acc.code, acc.name, acc.type, '', 'YER', acc.balance]
      );
    }

    // إضافة حسابات فرعية أساسية
    const subAccounts = [
      { id: 'acc-cash', code: '11', name: 'الصندوق', type: 'أصل', parentId: 'acc-assets' },
      { id: 'acc-banks', code: '12', name: 'البنوك', type: 'أصل', parentId: 'acc-assets' },
      { id: 'acc-customers', code: '13', name: 'العملاء', type: 'أصل', parentId: 'acc-assets' },
      { id: 'acc-inventory', code: '14', name: 'المخزون', type: 'أصل', parentId: 'acc-assets' },
      { id: 'acc-suppliers', code: '21', name: 'الموردين', type: 'خصم', parentId: 'acc-liabilities' },
      { id: 'acc-tax', code: '22', name: 'الضرائب المستحقة', type: 'خصم', parentId: 'acc-liabilities' },
      { id: 'acc-capital', code: '31', name: 'رأس المال', type: 'ملكية', parentId: 'acc-equity' },
      { id: 'acc-sales', code: '41', name: 'المبيعات', type: 'إيراد', parentId: 'acc-revenues' },
      { id: 'acc-purchases', code: '51', name: 'المشتريات', type: 'مصروف', parentId: 'acc-expenses' },
      { id: 'acc-salaries', code: '52', name: 'الرواتب والأجور', type: 'مصروف', parentId: 'acc-expenses' },
      { id: 'acc-rent', code: '53', name: 'الإيجارات', type: 'مصروف', parentId: 'acc-expenses' },
    ];

    for (const acc of subAccounts) {
      await db.runAsync(
        'INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isActive) VALUES (?,?,?,?,?,?,?,1)',
        [acc.id, acc.code, acc.name, acc.type, acc.parentId, 'YER', 0]
      );
    }

    console.log('✅ تم إنشاء الحسابات الرئيسية والفرعية الأساسية');
  } catch (e) {
    console.log('Seed accounts error:', e);
  }
}
