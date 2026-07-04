import * as SQLite from "expo-sqlite";

let dbInstance: any = null;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("accounting.db");
    await db.runAsync("DROP TABLE IF EXISTS currencies");
    await createAllTables(dbInstance);
    const { seedDefaultData } = await import("./seed");
    await seedDefaultData();("accounting.db");
    await db.runAsync("DROP TABLE IF EXISTS currencies");
    await createAllTables(dbInstance);
  }
  return dbInstance;
}

async function createAllTables(db: any) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, type TEXT, parentId TEXT DEFAULT '', balance REAL DEFAULT 0, isActive INTEGER DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0, creditLimit REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, unitName TEXT, groupName TEXT, brandName TEXT, warehouseName TEXT, cost REAL DEFAULT 0, price REAL DEFAULT 0, quantity REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS cashBoxes (id TEXT PRIMARY KEY, name TEXT NOT NULL, balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS banks (id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, symbol TEXT DEFAULT '', rate REAL DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS journal_items (id TEXT PRIMARY KEY, entryId TEXT, accountId TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, description TEXT)`,
    `CREATE TABLE IF NOT EXISTS salesInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerId TEXT, customerName TEXT, total REAL DEFAULT 0, paid REAL DEFAULT 0, remaining REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS purchaseInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierId TEXT, supplierName TEXT, total REAL DEFAULT 0, paid REAL DEFAULT 0, remaining REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS vouchers (id TEXT PRIMARY KEY, number TEXT, type TEXT, date TEXT, sourceName TEXT, accountName TEXT, amount REAL DEFAULT 0)`,
  ];
  for (const sql of tables) { try { await db.runAsync(sql); } catch(e) {} }
}

export async function query(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return db.getAllAsync(sql, params);
}

export async function execute(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return db.runAsync(sql, params);
}

// استدعاء البيانات الافتراضية
import { seedDefaultData } from './seed';
setTimeout(() => seedDefaultData(), 500);
