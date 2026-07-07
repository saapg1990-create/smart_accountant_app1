import * as SQLite from 'expo-sqlite';
import { roundYER } from '../utils/moneyHelper';

let db: any = null;

const getDB = async () => {
  if (!db) db = await SQLite.openDatabaseAsync('accounting.db');
  return db;
};

/**
 * تهيئة جداول العملات
 */
export const initCurrencyTables = async () => {
  const database = await getDB();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT DEFAULT '',
      rate REAL DEFAULT 1,
      isDefault INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS currency_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_id TEXT NOT NULL,
      rate REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (currency_id) REFERENCES currencies(id)
    );
    
    -- إضافة العملات الافتراضية
    INSERT OR IGNORE INTO currencies (id, code, name, symbol, rate, isDefault) VALUES ('c1','YER','الريال اليمني','﷼',1,1);
    INSERT OR IGNORE INTO currencies (id, code, name, symbol, rate, isDefault) VALUES ('c2','USD','الدولار الأمريكي','$',530,0);
    INSERT OR IGNORE INTO currencies (id, code, name, symbol, rate, isDefault) VALUES ('c3','SAR','الريال السعودي','﷼',141,0);
  `);
};

/**
 * جلب سعر الصرف الحالي لعملة
 */
export const getExchangeRate = async (currencyCode: string): Promise<number> => {
  const database = await getDB();
  const result = await database.getFirstAsync(
    'SELECT rate FROM currencies WHERE code = ?',
    [currencyCode]
  );
  return (result as any)?.rate || 1;
};

/**
 * تحديث سعر الصرف
 */
export const updateExchangeRate = async (currencyCode: string, newRate: number): Promise<void> => {
  const database = await getDB();
  await database.runAsync(
    'UPDATE currencies SET rate = ?, updatedAt = datetime("now") WHERE code = ?',
    [newRate, currencyCode]
  );
  // حفظ في سجل الأسعار
  await database.runAsync(
    'INSERT INTO currency_rates (currency_id, rate, date) VALUES (?, ?, date("now"))',
    [currencyCode, newRate]
  );
};

/**
 * تحويل المبلغ للريال اليمني
 */
export const convertToYER = (amount: number, currencyCode: string): { amountYER: number; rate: number } => {
  // هذه دالة متزامنة - تستخدم مع البيانات المحملة مسبقاً
  return { amountYER: 0, rate: 0 };
};

/**
 * حقن قيد مع دعم العملات المتعددة
 * هذا هو قلب النظام المحاسبي
 */
export const injectCurrencyEntry = async (params: {
  type: string;
  date: string;
  description: string;
  debitAccountId: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountName: string;
  amountForeign: number;
  currencyCode: string;
  exchangeRate: number;
  sourceType?: string;
  sourceId?: string;
}): Promise<{ success: boolean; journalNumber?: string; amountYER?: number; error?: string }> => {
  try {
    const database = await getDB();
    
    // ✅ تحويل المبلغ للريال اليمني
    const amountYER = roundYER(params.amountForeign * params.exchangeRate);
    const amountForeign = roundYER(params.amountForeign);
    
    if (amountYER <= 0) {
      return { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };
    }

    // ✅ التحقق من وجود الحسابات
    const debitAcc = await database.getFirstAsync('SELECT id FROM accounts WHERE id = ? AND isActive = 1', [params.debitAccountId]);
    const creditAcc = await database.getFirstAsync('SELECT id FROM accounts WHERE id = ? AND isActive = 1', [params.creditAccountId]);
    
    if (!debitAcc || !creditAcc) {
      return { success: false, error: 'أحد الحسابات غير موجود' };
    }

    return await database.withTransactionAsync(async () => {
      // 1. إنشاء رأس القيد
      const journalNumber = `JE-${params.type}-${Date.now().toString(36).toUpperCase()}`;
      
      const journalResult = await database.runAsync(
        `INSERT INTO journal_entries 
         (number, date, description, type, source_type, source_id, 
          currency, exchange_rate, original_amount, base_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted')`,
        [
          journalNumber, params.date, params.description, params.type,
          params.sourceType || 'manual', params.sourceId || '',
          params.currencyCode, params.exchangeRate, amountForeign, amountYER
        ]
      );
      const journalId = journalResult.lastInsertRowId;

      // 2. الطرف المدين (بالمبلغ المحول للريال)
      await database.runAsync(
        `INSERT INTO journal_details 
         (journal_id, account_id, account_name, debit, credit,
          currency, original_debit, original_credit, description)
         VALUES (?, ?, ?, ?, 0, ?, ?, 0, ?)`,
        [journalId, params.debitAccountId, params.debitAccountName, amountYER,
         params.currencyCode, amountForeign, `مدين: ${params.description}`]
      );

      // 3. الطرف الدائن
      await database.runAsync(
        `INSERT INTO journal_details 
         (journal_id, account_id, account_name, debit, credit,
          currency, original_debit, original_credit, description)
         VALUES (?, ?, ?, 0, ?, ?, 0, ?, ?)`,
        [journalId, params.creditAccountId, params.creditAccountName, amountYER,
         params.currencyCode, amountForeign, `دائن: ${params.description}`]
      );

      // 4. تحديث أرصدة الحسابات بالريال اليمني
      await database.runAsync(
        'UPDATE accounts SET balance = round(balance + ?, 2) WHERE id = ?',
        [amountYER, params.debitAccountId]
      );
      await database.runAsync(
        'UPDATE accounts SET balance = round(balance - ?, 2) WHERE id = ?',
        [amountYER, params.creditAccountId]
      );

      console.log(`✅ ${params.currencyCode} ${amountForeign} → ${amountYER} ﷼ | ${journalNumber}`);
      return { success: true, journalNumber, amountYER };
    });

  } catch (error: any) {
    console.error('❌ فشل الترحيل:', error);
    return { success: false, error: error.message };
  }
};

/**
 * تسوية فروق العملة (نهاية الشهر)
 */
export const settleCurrencyDifferences = async (date: string): Promise<void> => {
  const database = await getDB();
  
  // جلب العملات غير الريال
  const currencies = await database.getAllAsync(
    "SELECT * FROM currencies WHERE code != 'YER'"
  );
  
  for (const currency of currencies) {
    // جلب الحسابات المرتبطة بهذه العملة
    const accounts = await database.getAllAsync(
      'SELECT * FROM accounts WHERE currency = ?',
      [(currency as any).code]
    );
    
    // هنا يتم حساب فروق العملة وإنشاء قيد تسوية
    console.log(`تسوية عملة: ${(currency as any).code}`);
  }
};
