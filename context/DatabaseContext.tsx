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
        await createAllTables(database);
        await seedAccounts(database);
        await seedCurrencies(database);
        await seedCurrencies(database);
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

export function useDatabase() { return useContext(DatabaseContext); }

async function createAllTables(db: SQLite.SQLiteDatabase) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, type TEXT, parentId TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, isActive INTEGER DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS cashBoxes (id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS banks (id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, creditLimit REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT DEFAULT '', unit TEXT DEFAULT 'حبة', cost REAL DEFAULT 0, price REAL DEFAULT 0, quantity REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, symbol TEXT DEFAULT '', rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0, isPosted INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS journal_items (id TEXT PRIMARY KEY, entryId TEXT, accountId TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, description TEXT)`,
    `CREATE TABLE IF NOT EXISTS salesInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerId TEXT, type TEXT DEFAULT 'cash', total REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS purchaseInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierId TEXT, type TEXT DEFAULT 'cash', total REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS vouchers (id TEXT PRIMARY KEY, number TEXT, type TEXT, voucherType TEXT, date TEXT, sourceName TEXT, accountName TEXT, amount REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS salesReps (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  ];

  for (const sql of tables) {
    try { await db.runAsync(sql); } catch(e) {}
  }
}

async function seedAccounts(db: SQLite.SQLiteDatabase) {
  try {
    const count = await db.getAllAsync("SELECT COUNT(*) as c FROM accounts WHERE isActive=1 AND parentId = ''");
    if (count[0]?.c > 0) return;

    const mains = [['1','1','الأصول','أصل',''],['2','2','الخصوم','خصم',''],['3','3','حقوق الملكية','ملكية',''],['4','4','الإيرادات','إيراد',''],['5','5','المصروفات','مصروف','']];
    for (const m of mains) {
      await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, balance, isActive) VALUES (?,?,?,?,?,0,1)', m);
    }
    const subs = [['11','11','الأصول المتداولة','أصل','1'],['12','12','الأصول الثابتة','أصل','1'],['21','21','الخصوم المتداولة','خصم','2'],['31','31','رأس المال','ملكية','3'],['41','41','المبيعات','إيراد','4'],['51','51','المشتريات','مصروف','5']];
    for (const s of subs) {
      await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, balance, isActive) VALUES (?,?,?,?,?,0,1)', s);
    }
    const grands = [['111','111','الصندوق','أصل','11'],['112','112','البنوك','أصل','11'],['113','113','المحافظ الإلكترونية','أصل','11'],['114','114','العملاء','أصل','11'],['115','115','المخزون','أصل','11'],['211','211','الموردين','خصم','21'],['212','212','الضرائب المستحقة','خصم','21'],['311','311','رأس المال المدفوع','ملكية','31'],['411','411','مبيعات نقدية','إيراد','41'],['511','511','مشتريات بضائع','مصروف','51'],['512','512','رواتب وأجور','مصروف','51'],['513','513','إيجارات','مصروف','51']];
    for (const g of grands) {
      await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, balance, isActive) VALUES (?,?,?,?,?,0,1)', g);
    }
  } catch(e) { console.log('Seed error:', e); }
}

async function seedCurrencies(db: SQLite.SQLiteDatabase) {
  const count = await db.getAllAsync("SELECT COUNT(*) as c FROM currencies");
  if (count[0]?.c > 0) return;
  const currencies = [
    ['c1','YER','الريال اليمني','﷼',1,1],
    ['c2','USD','الدولار الأمريكي','$',530,0],
    ['c3','SAR','الريال السعودي','﷼',141,0],
    ['c4','EUR','اليورو','€',580,0],
  ];
  for (const c of currencies) {
    await db.runAsync('INSERT OR IGNORE INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)', c);
  }
}
