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
        await seedAllData(database);
        setDb(database);
        setDatabase(database);
        console.log('✅ قاعدة البيانات جاهزة بالكامل');
      } catch (e) { console.error('DB error:', e); }
      finally { setLoading(false); }
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
  // 1. دليل الحسابات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, type TEXT,
    parentId TEXT DEFAULT '', currency TEXT DEFAULT 'YER',
    balance REAL DEFAULT 0, isDebit INTEGER DEFAULT 1,
    isActive INTEGER DEFAULT 1,
    bankAccount TEXT DEFAULT '', walletPhone TEXT DEFAULT '', notes TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now'))
  )`);

  // 2. العملات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS currencies (
    id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL,
    symbol TEXT DEFAULT '', rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0
  )`);

  // 3. السندات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY, number TEXT, type TEXT, voucherType TEXT,
    date TEXT, sourceName TEXT, accountName TEXT,
    amount REAL DEFAULT 0, total REAL DEFAULT 0,
    description TEXT DEFAULT '', refNumber TEXT DEFAULT '',
    currency TEXT DEFAULT 'YER', exchangeRate REAL DEFAULT 1,
    localAmount REAL DEFAULT 0, status TEXT DEFAULT 'posted'
  )`);

  // 4. فواتير المبيعات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS salesInvoices (
    id TEXT PRIMARY KEY, number TEXT, date TEXT,
    customerId TEXT, customerName TEXT,
    type TEXT DEFAULT 'cash', subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0, tax REAL DEFAULT 0,
    total REAL DEFAULT 0, paid REAL DEFAULT 0,
    remaining REAL DEFAULT 0, status TEXT DEFAULT 'posted',
    currency TEXT DEFAULT 'YER', exchangeRate REAL DEFAULT 1
  )`);

  // 5. فواتير المشتريات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS purchaseInvoices (
    id TEXT PRIMARY KEY, number TEXT, date TEXT,
    supplierId TEXT, supplierName TEXT,
    type TEXT DEFAULT 'cash', subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0, total REAL DEFAULT 0,
    paid REAL DEFAULT 0, remaining REAL DEFAULT 0,
    status TEXT DEFAULT 'posted',
    currency TEXT DEFAULT 'YER', exchangeRate REAL DEFAULT 1
  )`);

  // 6. القيود المحاسبية
  await db.execAsync(`CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT, date TEXT, description TEXT, type TEXT,
    source_type TEXT, source_id TEXT,
    currency TEXT DEFAULT 'YER', exchange_rate REAL DEFAULT 1,
    original_amount REAL DEFAULT 0, base_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'posted'
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS journal_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_id INTEGER, account_id TEXT, account_name TEXT,
    debit REAL DEFAULT 0, credit REAL DEFAULT 0,
    currency TEXT DEFAULT 'YER',
    original_debit REAL DEFAULT 0, original_credit REAL DEFAULT 0,
    description TEXT
  )`);

  // 7. العملاء والموردين
  await db.execAsync(`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT,
    balance REAL DEFAULT 0, creditLimit REAL DEFAULT 0
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT,
    balance REAL DEFAULT 0
  )`);

  // 8. المخازن والأصناف
  await db.execAsync(`CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY, name TEXT, location TEXT DEFAULT ''
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY, name TEXT, code TEXT,
    unit TEXT DEFAULT 'حبة', cost REAL DEFAULT 0, price REAL DEFAULT 0,
    quantity REAL DEFAULT 0, minQuantity REAL DEFAULT 0,
    categoryId TEXT, brandId TEXT
  )`);

  // 9. وحدات وفئات وعلامات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT)`);

  // 10. المندوبين والإعدادات والإشعارات
  await db.execAsync(`CREATE TABLE IF NOT EXISTS salesReps (
    id TEXT PRIMARY KEY, name TEXT, phone TEXT DEFAULT '',
    monthlyTarget REAL DEFAULT 0, totalSales REAL DEFAULT 0
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, type TEXT, title TEXT, message TEXT,
    read INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now'))
  )`);

  console.log('✅ جميع الجداول (16 جدول) تم إنشاؤها');
}

async function seedAllData(db: SQLite.SQLiteDatabase) {
  // 51 حساب حسب القانون اليمني
  const accCount = await db.getFirstAsync("SELECT COUNT(*) as c FROM accounts WHERE isActive=1") as any;
  if (accCount?.c < 5) {
    const accounts = [
      { id:'1', code:'1', name:'الأصول', type:'أصل', parentId:'', isDebit:1 },
      { id:'11', code:'11', name:'الأصول المتداولة', type:'أصل', parentId:'1', isDebit:1 },
      { id:'111', code:'111', name:'الصندوق', type:'أصل', parentId:'11', isDebit:1 },
      { id:'112', code:'112', name:'البنوك', type:'أصل', parentId:'11', isDebit:1 },
      { id:'113', code:'113', name:'المحافظ الإلكترونية', type:'أصل', parentId:'11', isDebit:1 },
      { id:'114', code:'114', name:'العملاء', type:'أصل', parentId:'11', isDebit:1 },
      { id:'115', code:'115', name:'المخزون', type:'أصل', parentId:'11', isDebit:1 },
      { id:'116', code:'116', name:'مدينون آخرون', type:'أصل', parentId:'11', isDebit:1 },
      { id:'117', code:'117', name:'أوراق القبض', type:'أصل', parentId:'11', isDebit:1 },
      { id:'12', code:'12', name:'الأصول الثابتة', type:'أصل', parentId:'1', isDebit:1 },
      { id:'121', code:'121', name:'الأراضي', type:'أصل', parentId:'12', isDebit:1 },
      { id:'122', code:'122', name:'المباني', type:'أصل', parentId:'12', isDebit:1 },
      { id:'123', code:'123', name:'السيارات', type:'أصل', parentId:'12', isDebit:1 },
      { id:'124', code:'124', name:'الأثاث والمعدات', type:'أصل', parentId:'12', isDebit:1 },
      { id:'125', code:'125', name:'الإهلاك المتراكم', type:'أصل', parentId:'12', isDebit:0 },
      { id:'2', code:'2', name:'الخصوم', type:'خصم', parentId:'', isDebit:0 },
      { id:'21', code:'21', name:'الخصوم المتداولة', type:'خصم', parentId:'2', isDebit:0 },
      { id:'211', code:'211', name:'الموردين', type:'خصم', parentId:'21', isDebit:0 },
      { id:'212', code:'212', name:'الضرائب المستحقة', type:'خصم', parentId:'21', isDebit:0 },
      { id:'213', code:'213', name:'مصروفات مستحقة', type:'خصم', parentId:'21', isDebit:0 },
      { id:'214', code:'214', name:'دائنون آخرون', type:'خصم', parentId:'21', isDebit:0 },
      { id:'215', code:'215', name:'أوراق الدفع', type:'خصم', parentId:'21', isDebit:0 },
      { id:'22', code:'22', name:'الخصوم طويلة الأجل', type:'خصم', parentId:'2', isDebit:0 },
      { id:'221', code:'221', name:'قروض بنكية', type:'خصم', parentId:'22', isDebit:0 },
      { id:'3', code:'3', name:'حقوق الملكية', type:'ملكية', parentId:'', isDebit:0 },
      { id:'31', code:'31', name:'رأس المال', type:'ملكية', parentId:'3', isDebit:0 },
      { id:'311', code:'311', name:'رأس المال المدفوع', type:'ملكية', parentId:'31', isDebit:0 },
      { id:'312', code:'312', name:'المسحوبات الشخصية', type:'ملكية', parentId:'3', isDebit:1 },
      { id:'32', code:'32', name:'الأرباح المحتجزة', type:'ملكية', parentId:'3', isDebit:0 },
      { id:'4', code:'4', name:'الإيرادات', type:'إيراد', parentId:'', isDebit:0 },
      { id:'41', code:'41', name:'المبيعات', type:'إيراد', parentId:'4', isDebit:0 },
      { id:'411', code:'411', name:'مبيعات نقدية', type:'إيراد', parentId:'41', isDebit:0 },
      { id:'412', code:'412', name:'مبيعات آجلة', type:'إيراد', parentId:'41', isDebit:0 },
      { id:'413', code:'413', name:'مردودات المبيعات', type:'إيراد', parentId:'41', isDebit:1 },
      { id:'42', code:'42', name:'إيرادات أخرى', type:'إيراد', parentId:'4', isDebit:0 },
      { id:'421', code:'421', name:'إيرادات استثمارية', type:'إيراد', parentId:'42', isDebit:0 },
      { id:'422', code:'422', name:'أرباح فروق عملة', type:'إيراد', parentId:'42', isDebit:0 },
      { id:'5', code:'5', name:'المصروفات', type:'مصروف', parentId:'', isDebit:1 },
      { id:'51', code:'51', name:'المشتريات', type:'مصروف', parentId:'5', isDebit:1 },
      { id:'511', code:'511', name:'مشتريات بضائع', type:'مصروف', parentId:'51', isDebit:1 },
      { id:'512', code:'512', name:'مردودات المشتريات', type:'مصروف', parentId:'51', isDebit:0 },
      { id:'52', code:'52', name:'المصروفات التشغيلية', type:'مصروف', parentId:'5', isDebit:1 },
      { id:'521', code:'521', name:'رواتب وأجور', type:'مصروف', parentId:'52', isDebit:1 },
      { id:'522', code:'522', name:'إيجارات', type:'مصروف', parentId:'52', isDebit:1 },
      { id:'523', code:'523', name:'كهرباء ومياه', type:'مصروف', parentId:'52', isDebit:1 },
      { id:'524', code:'524', name:'اتصالات', type:'مصروف', parentId:'52', isDebit:1 },
      { id:'525', code:'525', name:'إهلاك', type:'مصروف', parentId:'52', isDebit:1 },
      { id:'53', code:'53', name:'المصروفات الإدارية', type:'مصروف', parentId:'5', isDebit:1 },
      { id:'54', code:'54', name:'مصاريف نقل وشحن', type:'مصروف', parentId:'5', isDebit:1 },
      { id:'55', code:'55', name:'مصاريف تسويق', type:'مصروف', parentId:'5', isDebit:1 },
      { id:'56', code:'56', name:'الزكاة', type:'مصروف', parentId:'5', isDebit:1 },
      { id:'57', code:'57', name:'الضرائب', type:'مصروف', parentId:'5', isDebit:1 },
    ];
    for (const acc of accounts) {
      await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, isDebit, balance, isActive) VALUES (?,?,?,?,?,?,0,1)', [acc.id, acc.code, acc.name, acc.type, acc.parentId, acc.isDebit]);
    }
  }

  // 3 عملات افتراضية
  const curCount = await db.getFirstAsync("SELECT COUNT(*) as c FROM currencies") as any;
  if (curCount?.c === 0) {
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c1','YER','ريال يمني','﷼',1,1]);
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c2','USD','دولار أمريكي','$',530,0]);
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c3','SAR','ريال سعودي','﷼',141,0]);
  }

  console.log('✅ 51 حساب + 3 عملات');
}

export default DatabaseContext;
