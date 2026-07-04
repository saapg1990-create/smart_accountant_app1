import * as SQLite from "expo-sqlite";

let dbInstance: any = null;

export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("accounting.db");
    await createAllTables(dbInstance);
    await seedAll(dbInstance);
  }
  return dbInstance;
}

async function createAllTables(db: any) {
  const tables = [
    "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, type TEXT, parentId TEXT DEFAULT '', balance REAL DEFAULT 0, isActive INTEGER DEFAULT 1)",
    "CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, phone TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, code TEXT, name TEXT NOT NULL, unitName TEXT, cost REAL DEFAULT 0, price REAL DEFAULT 0, quantity REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS cashBoxes (id TEXT PRIMARY KEY, name TEXT NOT NULL, balance REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS banks (id TEXT PRIMARY KEY, name TEXT NOT NULL, accountNumber TEXT DEFAULT '', balance REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS ewallets (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', balance REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT NOT NULL, symbol TEXT DEFAULT '', rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, totalDebit REAL DEFAULT 0, totalCredit REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS journal_items (id TEXT PRIMARY KEY, entryId TEXT, accountId TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, description TEXT)",
    "CREATE TABLE IF NOT EXISTS salesInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, customerName TEXT, total REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS purchaseInvoices (id TEXT PRIMARY KEY, number TEXT, date TEXT, supplierName TEXT, total REAL DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS vouchers (id TEXT PRIMARY KEY, number TEXT, date TEXT, description TEXT, amount REAL DEFAULT 0, sourceName TEXT, accountName TEXT, type TEXT)",
    "CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS salesReps (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '')",
    "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)",
  ];
  for (const sql of tables) { try { await db.runAsync(sql); } catch(e) {} }
}

async function seedAll(db: any) {
  try {
    const count = await db.getAllAsync("SELECT COUNT(*) as c FROM accounts");
    await db.runAsync("DELETE FROM accounts");
    if (false) { console.log('الحسابات موجودة مسبقاً:', count[0].c); return; }
  } catch(e) {}

  console.log('📋 جاري إنشاء الحسابات...');
  
  const l1 = [
    ["1","1","الاصول","اصل",""],["2","2","الخصوم","خصم",""],["3","3","حقوق الملكية","ملكية",""],
    ["4","4","الايرادات","ايراد",""],["5","5","المصروفات","مصروف",""],
  ];
  for (const a of l1) await db.runAsync("INSERT INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,0)", a);
  
  const l2 = [
    ["11","11","الاصول المتداولة","اصل","1"],["12","12","الاصول الثابتة","اصل","1"],
    ["21","21","الخصوم المتداولة","خصم","2"],["22","22","الخصوم طويلة الاجل","خصم","2"],
    ["31","31","راس المال","ملكية","3"],["32","32","الارباح المحتجزة","ملكية","3"],
    ["41","41","المبيعات","ايراد","4"],["51","51","المشتريات","مصروف","5"],
    ["52","52","المصاريف الادارية","مصروف","5"],["53","53","المصاريف التشغيلية","مصروف","5"],
  ];
  for (const a of l2) await db.runAsync("INSERT INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,0)", a);

  const l3 = [
    ["111","111","الصندوق","اصل","11"],["112","112","البنوك","اصل","11"],["113","113","المحافظ","اصل","11"],
    ["114","114","العملاء","اصل","11"],["115","115","المخزون","اصل","11"],["116","116","اوراق القبض","اصل","11"],
    ["121","121","مباني وعقارات","اصل","12"],["122","122","سيارات","اصل","12"],["123","123","اثاث","اصل","12"],
    ["211","211","الموردين","خصم","21"],["212","212","الضرائب","خصم","21"],["213","213","اوراق الدفع","خصم","21"],
    ["221","221","قروض بنكية","خصم","22"],
    ["311","311","راس المال المدفوع","ملكية","31"],["312","312","المسحوبات","ملكية","31"],
    ["321","321","ارباح مدورة","ملكية","32"],
    ["411","411","مبيعات نقدية","ايراد","41"],["412","412","مبيعات اجلة","ايراد","41"],["413","413","ايرادات اخرى","ايراد","41"],
    ["511","511","مشتريات بضائع","مصروف","51"],
    ["521","521","رواتب واجور","مصروف","52"],["522","522","ايجارات","مصروف","52"],["523","523","كهرباء ومياه","مصروف","52"],
    ["531","531","دعاية واعلان","مصروف","53"],["532","532","صيانة","مصروف","53"],["533","533","مصاريف نقل","مصروف","53"],
    ["214","214","دائنون متنوعون","خصم","21"],["215","215","مدينون متنوعون","اصل","11"],
  ];
  for (const a of l3) await db.runAsync("INSERT INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,0)", a);
  
  try {
    const curCount = await db.getAllAsync("SELECT COUNT(*) as c FROM currencies");
    if (curCount[0]?.c === 0) {
      const cur = [["c1","YER","ريال يمني","ر.ي",1,1],["c2","USD","دولار","$",530,0],["c3","SAR","ريال سعودي","ر.س",141,0]];
      for (const c of cur) await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", c);
    }
  } catch(e) {}
  
  console.log('✅ 5 + 10 + 28 = 43 حساب + 3 عملات');
}

export async function query(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return db.getAllAsync(sql, params);
}

export async function execute(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return db.runAsync(sql, params);
}
