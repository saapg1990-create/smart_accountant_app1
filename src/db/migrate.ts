import { getDatabase } from './database';

export async function migrateDatabase() {
  const db = await getDatabase();
  
  const migrations = [
    // إضافة عمود bankAccount
    "ALTER TABLE accounts ADD COLUMN bankAccount TEXT DEFAULT ''",
    // إضافة عمود walletPhone
    "ALTER TABLE accounts ADD COLUMN walletPhone TEXT DEFAULT ''",
    // إضافة عمود notes
    "ALTER TABLE accounts ADD COLUMN notes TEXT DEFAULT ''",
    // إضافة عمود currency
    "ALTER TABLE accounts ADD COLUMN currency TEXT DEFAULT 'YER'",
    // جدول أرصدة العملات
    `CREATE TABLE IF NOT EXISTS account_currencies (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance REAL DEFAULT 0,
      rate REAL DEFAULT 1,
      UNIQUE(accountId, currency)
    )`,
    // إضافة أعمدة للسندات
    "ALTER TABLE vouchers ADD COLUMN voucherType TEXT DEFAULT 'cash'",
    "ALTER TABLE vouchers ADD COLUMN currency TEXT DEFAULT 'YER'",
    "ALTER TABLE vouchers ADD COLUMN exchangeRate REAL DEFAULT 1",
    "ALTER TABLE vouchers ADD COLUMN refNumber TEXT DEFAULT ''",
    "ALTER TABLE vouchers ADD COLUMN localAmount REAL DEFAULT 0",
    // إضافة أعمدة لفواتير المبيعات
    "ALTER TABLE salesInvoices ADD COLUMN itemName TEXT DEFAULT ''",
    "ALTER TABLE salesInvoices ADD COLUMN qty REAL DEFAULT 0",
    "ALTER TABLE salesInvoices ADD COLUMN price REAL DEFAULT 0",
    // إضافة أعمدة لفواتير المشتريات
    "ALTER TABLE purchaseInvoices ADD COLUMN itemName TEXT DEFAULT ''",
    "ALTER TABLE purchaseInvoices ADD COLUMN qty REAL DEFAULT 0",
    "ALTER TABLE purchaseInvoices ADD COLUMN cost REAL DEFAULT 0",
    // إضافة أعمدة للأصناف
    "ALTER TABLE items ADD COLUMN groupName TEXT DEFAULT ''",
    "ALTER TABLE items ADD COLUMN warehouseName TEXT DEFAULT ''",
    // إضافة عمود location للمخازن
    "ALTER TABLE warehouses ADD COLUMN location TEXT DEFAULT ''",
  ];

  for (const sql of migrations) {
    try {
      await db.runAsync(sql);
      console.log('✅', sql.substring(0, 50));
    } catch (e) {
      // العمود موجود مسبقاً - تجاهل
    }
  }
  
  console.log('✅ تم تحديث جميع الأعمدة');
}
