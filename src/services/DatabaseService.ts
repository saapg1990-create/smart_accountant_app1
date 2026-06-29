import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('accountant.db');
  await initTables();
  return db;
}

async function initTables() {
  if (!db) return;
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, type TEXT,
      currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, parentId TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cashBoxes (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT DEFAULT 'YER',
      balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '',
      currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
      address TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0,
      creditLimit REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
      address TEXT DEFAULT '', currency TEXT DEFAULT 'YER', balance REAL DEFAULT 0,
      creditLimit REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, unit TEXT DEFAULT 'قطعة',
      category TEXT DEFAULT '', costPrice REAL DEFAULT 0, salePrice REAL DEFAULT 0,
      quantity REAL DEFAULT 0, minQuantity REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, symbol TEXT DEFAULT '',
      rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journalEntries (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT,
      totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS salesInvoices (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, customerName TEXT,
      type TEXT DEFAULT 'cash', total REAL DEFAULT 0, paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS purchaseInvoices (
      id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierName TEXT,
      type TEXT DEFAULT 'cash', total REAL DEFAULT 0, paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS salesReps (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
      monthlyTarget REAL DEFAULT 0, totalSales REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, type TEXT, title TEXT, message TEXT,
      read INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT, code TEXT);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY, number TEXT, type TEXT, voucherType TEXT, date TEXT,
      sourceName TEXT, accountName TEXT, amount REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS inventoryIssues (id TEXT PRIMARY KEY, number TEXT, date TEXT, warehouseName TEXT, totalAmount REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS inventoryReceipts (id TEXT PRIMARY KEY, number TEXT, date TEXT, warehouseName TEXT, totalAmount REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS warehouseTransfers (id TEXT PRIMARY KEY, number TEXT, date TEXT, fromName TEXT, toName TEXT);
    CREATE TABLE IF NOT EXISTS salesReturns (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerName TEXT, totalAmount REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS purchaseReturns (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierName TEXT, totalAmount REAL DEFAULT 0);
  `);
}

// Seed البيانات الافتراضية
export async function seedDefaultData() {
  if (!db) await getDatabase();
  if (!db) return;
  
  const currencies = await db.getAllAsync('SELECT * FROM currencies');
  if (currencies.length === 0) {
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c1','YER','ريال يمني','﷼',1,1]);
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c2','USD','دولار أمريكي','$',530,0]);
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c3','SAR','ريال سعودي','ر.س',141,0]);
  }
}

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  if (!db) await getDatabase();
  if (!db) return [];
  return db.getAllAsync(sql, params);
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  if (!db) await getDatabase();
  if (!db) return;
  await db.runAsync(sql, params);
}

export default { getDatabase, query, execute, seedDefaultData };
