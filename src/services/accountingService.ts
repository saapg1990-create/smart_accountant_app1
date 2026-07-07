import * as SQLite from 'expo-sqlite';
import { roundYER } from '@utils/moneyHelper';

let db: any = null;

export const initAccountingDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('accounting.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'manual',
        currency TEXT DEFAULT 'YER',
        exchange_rate REAL DEFAULT 1,
        original_amount REAL DEFAULT 0,
        base_amount REAL DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS journal_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journal_id INTEGER NOT NULL,
        account_id TEXT NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        currency TEXT DEFAULT 'YER',
        original_debit REAL DEFAULT 0,
        original_credit REAL DEFAULT 0,
        FOREIGN KEY (journal_id) REFERENCES journal_entries(id)
      );
    `);
    return true;
  } catch (error) {
    console.error('❌ فشل تهيئة قاعدة البيانات:', error);
    return false;
  }
};

/**
 * ترحيل محاسبي مع دعم العملات المتعددة
 */
export const injectJournalEntryWithCurrency = async (
  transactionType: string,
  date: string,
  description: string,
  debitAccountId: string,
  creditAccountId: string,
  amount: number,
  currency: string = 'YER',
  exchangeRate: number = 1
): Promise<boolean> => {
  try {
    if (!db) {
      const initialized = await initAccountingDB();
      if (!initialized) return false;
    }

    // ✅ تحويل المبلغ للريال اليمني (العملة الأساسية)
    const amountInYER = roundYER(amount * exchangeRate);
    const originalAmount = roundYER(amount);
    
    if (amountInYER <= 0) {
      console.error('❌ المبلغ يجب أن يكون أكبر من صفر');
      return false;
    }

    // ✅ التحقق من وجود الحسابات
    const debitAccount = await db.getFirstAsync('SELECT id FROM accounts WHERE id = ? AND isActive = 1', [debitAccountId]);
    const creditAccount = await db.getFirstAsync('SELECT id FROM accounts WHERE id = ? AND isActive = 1', [creditAccountId]);
    
    if (!debitAccount || !creditAccount) {
      console.error('❌ أحد الحسابات غير موجود أو غير نشط');
      return false;
    }

    await db.withTransactionAsync(async () => {
      // 1. إدخال رأس القيد مع معلومات العملة
      const result = await db.runAsync(
        `INSERT INTO journal_entries (date, description, type, currency, exchange_rate, original_amount, base_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [date, description, transactionType, currency, exchangeRate, originalAmount, amountInYER]
      );
      const journalId = result.lastInsertRowId;

      // 2. الطرف المدين (بالريال اليمني)
      await db.runAsync(
        `INSERT INTO journal_details (journal_id, account_id, debit, credit, currency, original_debit, original_credit) 
         VALUES (?, ?, ?, 0, ?, ?, 0)`,
        [journalId, debitAccountId, amountInYER, currency, originalAmount]
      );

      // 3. الطرف الدائن (بالريال اليمني)
      await db.runAsync(
        `INSERT INTO journal_details (journal_id, account_id, debit, credit, currency, original_debit, original_credit) 
         VALUES (?, ?, 0, ?, ?, 0, ?)`,
        [journalId, creditAccountId, amountInYER, currency, originalAmount]
      );

      // 4. تحديث أرصدة الحسابات بالريال اليمني
      await db.runAsync('UPDATE accounts SET balance = round(balance + ?, 2) WHERE id = ?', [amountInYER, debitAccountId]);
      await db.runAsync('UPDATE accounts SET balance = round(balance - ?, 2) WHERE id = ?', [amountInYER, creditAccountId]);
    });

    console.log(`✅ ترحيل: ${transactionType} | ${originalAmount} ${currency} → ${amountInYER} ﷼`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في الترحيل المحاسبي:', error);
    return false;
  }
};

/**
 * ترحيل بسيط (للتوافق مع الكود القديم)
 */
export const injectJournalEntry = async (
  transactionType: string,
  date: string,
  description: string,
  debitAccountId: string,
  creditAccountId: string,
  amount: number
): Promise<boolean> => {
  return injectJournalEntryWithCurrency(transactionType, date, description, debitAccountId, creditAccountId, amount, 'YER', 1);
};

export const getJournalEntries = async (limit = 50) => {
  try {
    if (!db) await initAccountingDB();
    return await db.getAllAsync(
      `SELECT je.*, jd.account_id, jd.debit, jd.credit, jd.currency, jd.original_debit, jd.original_credit 
       FROM journal_entries je 
       JOIN journal_details jd ON je.id = jd.journal_id 
       ORDER BY je.date DESC LIMIT ?`,
      [limit]
    );
  } catch (error) {
    console.error('❌ خطأ في جلب القيود:', error);
    return [];
  }
};
