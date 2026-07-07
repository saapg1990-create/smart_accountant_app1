import * as SQLite from 'expo-sqlite';
import { roundYER } from '../utils/moneyHelper';

let db: any = null;
const getDB = async () => { if (!db) db = await SQLite.openDatabaseAsync('accounting.db'); return db; };

export const initEngine = async () => {
  const d = await getDB();
  await d.execAsync(`
    CREATE TABLE IF NOT EXISTS currencies (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, symbol TEXT, rate REAL DEFAULT 1, isDefault INTEGER DEFAULT 0);
    INSERT OR IGNORE INTO currencies VALUES ('c1','YER','ريال يمني','﷼',1,1),('c2','USD','دولار','$',530,0),('c3','SAR','ريال سعودي','﷼',141,0);
    
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT UNIQUE, date TEXT, description TEXT,
      type TEXT, source_type TEXT, source_id TEXT, currency TEXT DEFAULT 'YER',
      exchange_rate REAL DEFAULT 1, original_amount REAL DEFAULT 0, base_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'posted', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS journal_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT, journal_id INTEGER, account_id TEXT, account_name TEXT,
      debit REAL DEFAULT 0, credit REAL DEFAULT 0, currency TEXT DEFAULT 'YER',
      original_debit REAL DEFAULT 0, original_credit REAL DEFAULT 0
    );
  `);
};

export const getNextNumber = async (table: string, type: string): Promise<string> => {
  const d = await getDB();
  const prefixes: Record<string, string> = {
    'salesInvoices_cash': 'CSI', 'salesInvoices_credit': 'CRI',
    'purchaseInvoices_cash': 'CPI', 'purchaseInvoices_credit': 'CRPI',
    'salesReturns': 'SR', 'purchaseReturns': 'PR',
    'vouchers_receipt_cash': 'RV-C', 'vouchers_receipt_bank': 'RV-B', 'vouchers_receipt_ewallet': 'RV-E',
    'vouchers_payment_cash': 'PV-C', 'vouchers_payment_bank': 'PV-B', 'vouchers_payment_ewallet': 'PV-E',
    'inventoryIssues': 'OUT', 'inventoryReceipts': 'IN', 'warehouseTransfers': 'TR',
  };
  const prefix = prefixes[`${table}_${type}`] || table.substring(0, 3).toUpperCase();
  const result = await d.getFirstAsync(`SELECT COUNT(*) as c FROM ${table}`) as any;
  const count = (result?.c || 0) + 1;
  return `${prefix}-${count.toString().padStart(6, '0')}`;
};

export const postTransaction = async (params: {
  table: string; type: string; data: Record<string, any>;
  debitAccountId: string; debitName: string;
  creditAccountId: string; creditName: string;
  amount: number; currency?: string; exchangeRate?: number;
}): Promise<{ success: boolean; number?: string; amountYER?: number; error?: string }> => {
  try {
    const d = await getDB();
    const cur = params.currency || 'YER';
    const rate = params.exchangeRate || 1;
    const amountYER = roundYER(params.amount * rate);
    
    // رقم تسلسلي تلقائي
    const number = await getNextNumber(params.table, params.type);
    
    await d.withTransactionAsync(async () => {
      // حفظ العملية
      const keys = Object.keys(params.data);
      await d.runAsync(
        `INSERT INTO ${params.table} (${keys.join(',')}, number, status) VALUES (${keys.map(()=>'?').join(',')}, ?, 'posted')`,
        [...Object.values(params.data), number]
      );
      
      // ترحيل محاسبي
      const jr = await d.runAsync(
        `INSERT INTO journal_entries (number, date, description, type, source_type, currency, exchange_rate, original_amount, base_amount) VALUES (?,?,?,?,?,?,?,?,?)`,
        ['JE-'+number, params.data.date||'', params.data.description||'', params.table, params.table, cur, rate, params.amount, amountYER]
      );
      const jid = jr.lastInsertRowId;
      
      await d.runAsync(`INSERT INTO journal_details (journal_id, account_id, account_name, debit, credit, currency, original_debit) VALUES (?,?,?,?,0,?,?)`, [jid, params.debitAccountId, params.debitName, amountYER, cur, params.amount]);
      await d.runAsync(`INSERT INTO journal_details (journal_id, account_id, account_name, debit, credit, currency, original_credit) VALUES (?,?,?,0,?,?,?)`, [jid, params.creditAccountId, params.creditName, amountYER, cur, params.amount]);
      
      await d.runAsync('UPDATE accounts SET balance = round(balance + ?, 2) WHERE id = ?', [amountYER, params.debitAccountId]);
      await d.runAsync('UPDATE accounts SET balance = round(balance - ?, 2) WHERE id = ?', [amountYER, params.creditAccountId]);
    });
    
    return { success: true, number, amountYER };
  } catch (e: any) { return { success: false, error: e.message }; }
};

// ✅ دوال جاهزة للاستخدام المباشر
export const accounting = {
  salesCash: (data: any, cashId: string, cashName: string, total: number, cur?: string, rate?: number) =>
    postTransaction({ table: 'salesInvoices', type: 'cash', data, debitAccountId: cashId, debitName: cashName, creditAccountId: '411', creditName: 'المبيعات', amount: total, currency: cur, exchangeRate: rate }),
    
  salesCredit: (data: any, custId: string, custName: string, total: number, cur?: string, rate?: number) =>
    postTransaction({ table: 'salesInvoices', type: 'credit', data, debitAccountId: custId, debitName: custName, creditAccountId: '411', creditName: 'المبيعات', amount: total, currency: cur, exchangeRate: rate }),
    
  purchaseCash: (data: any, cashId: string, cashName: string, total: number, cur?: string, rate?: number) =>
    postTransaction({ table: 'purchaseInvoices', type: 'cash', data, debitAccountId: '511', debitName: 'المشتريات', creditAccountId: cashId, creditName: cashName, amount: total, currency: cur, exchangeRate: rate }),
    
  purchaseCredit: (data: any, suppId: string, suppName: string, total: number, cur?: string, rate?: number) =>
    postTransaction({ table: 'purchaseInvoices', type: 'credit', data, debitAccountId: '511', debitName: 'المشتريات', creditAccountId: suppId, creditName: suppName, amount: total, currency: cur, exchangeRate: rate }),
    
  receiptCash: (data: any, cashId: string, cashName: string, accId: string, accName: string, amount: number) =>
    postTransaction({ table: 'vouchers', type: 'receipt_cash', data, debitAccountId: cashId, debitName: cashName, creditAccountId: accId, creditName: accName, amount }),
    
  paymentCash: (data: any, cashId: string, cashName: string, accId: string, accName: string, amount: number) =>
    postTransaction({ table: 'vouchers', type: 'payment_cash', data, debitAccountId: accId, debitName: accName, creditAccountId: cashId, creditName: cashName, amount }),
    
  inventoryOut: (data: any, invId: string, invName: string, expId: string, expName: string, amount: number) =>
    postTransaction({ table: 'inventoryIssues', type: '', data, debitAccountId: expId, debitName: expName, creditAccountId: invId, creditName: invName, amount }),
    
  inventoryIn: (data: any, invId: string, invName: string, expId: string, expName: string, amount: number) =>
    postTransaction({ table: 'inventoryReceipts', type: '', data, debitAccountId: invId, debitName: invName, creditAccountId: expId, creditName: expName, amount }),
    
  salesReturn: (data: any, custId: string, custName: string, total: number) =>
    postTransaction({ table: 'salesReturns', type: '', data, debitAccountId: '411', debitName: 'مردودات مبيعات', creditAccountId: custId, creditName: custName, amount: total }),
    
  purchaseReturn: (data: any, suppId: string, suppName: string, total: number) =>
    postTransaction({ table: 'purchaseReturns', type: '', data, debitAccountId: suppId, debitName: suppName, creditAccountId: '511', creditName: 'مردودات مشتريات', amount: total }),
};
