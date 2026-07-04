import * as SQLite from "expo-sqlite";

let dbInstance: any = null;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("accounting.db");
    await createAllTables(dbInstance);
    setTimeout(async () => {
      try {
        const count = await dbInstance.getAllAsync("SELECT COUNT(*) as c FROM accounts");
        if (count[0]?.c === 0) await seedAll(dbInstance);
      } catch(e) {}
    }, 1000);
  }
  return dbInstance;
}

async function createAllTables(db: any) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, type TEXT, parentId TEXT DEFAULT '', balance REAL DEFAULT 0, isActive INTEGER DEFAULT 1)`,
    `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, unitName TEXT, cost REAL DEFAULT 0, price REAL DEFAULT 0, quantity REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS cashBoxes (id TEXT PRIMARY KEY, name TEXT NOT NULL, balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS banks (id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '', balance REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, symbol TEXT DEFAULT '', rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS journal_items (id TEXT PRIMARY KEY, entryId TEXT, accountId TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, description TEXT)`,
    `CREATE TABLE IF NOT EXISTS salesInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerName TEXT, total REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS purchaseInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierName TEXT, total REAL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS vouchers (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, amount REAL DEFAULT 0, sourceName TEXT, accountName TEXT)`,
    `CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS salesReps (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  ];
  for (const sql of tables) { try { await db.runAsync(sql); } catch(e) {} }
}

async function seedAll(db: any) {
  const accounts = [
    ['1','1','الأصول','أصل',''],['2','2','الخصوم','خصم',''],['3','3','حقوق الملكية','ملكية',''],['4','4','الإيرادات','إيراد',''],['5','5','المصروفات','مصروف',''],
    ['11','11','الأصول المتداولة','أصل','1'],['111','111','الصندوق','أصل','11'],['112','112','البنوك','أصل','11'],['113','113','المحافظ','أصل','11'],['114','114','العملاء','أصل','11'],
    ['21','21','الخصوم المتداولة','خصم','2'],['211','211','الموردين','خصم','21'],
    ['31','31','رأس المال','ملكية','3'],['41','41','المبيعات','إيراد','4'],
    ['51','51','المشتريات','مصروف','5'],['52','52','مصاريف إدارية','مصروف','5'],
  ];
  for (const a of accounts) await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,0)', a);
  
  const currencies = [['c1','YER','ريال يمني','﷼',1,1],['c2','USD','دولار','$',530,0],['c3','SAR','ريال سعودي','﷼',141,0]];
  for (const c of currencies) await db.runAsync('INSERT OR IGNORE INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)', c);
}

export async function query(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return db.getAllAsync(sql, params);
}

export async function execute(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return db.runAsync(sql, params);
}
