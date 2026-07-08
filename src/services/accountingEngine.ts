import * as SQLite from 'expo-sqlite';
import { roundYER } from '../utils/moneyHelper';

let db: any = null;
const getDB = async () => { if (!db) db = await SQLite.openDatabaseAsync('accounting.db'); return db; };

export const initEngine = async () => {
  const d = await getDB();
  await d.execAsync("CREATE TABLE IF NOT EXISTS journal_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT, date TEXT, description TEXT, type TEXT, currency TEXT DEFAULT 'YER', exchange_rate REAL DEFAULT 1, original_amount REAL DEFAULT 0, base_amount REAL DEFAULT 0, status TEXT DEFAULT 'posted')");
  await d.execAsync("CREATE TABLE IF NOT EXISTS journal_details (id INTEGER PRIMARY KEY AUTOINCREMENT, journal_id INTEGER, account_id TEXT, account_name TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, currency TEXT DEFAULT 'YER', original_debit REAL DEFAULT 0, original_credit REAL DEFAULT 0)");
};

export const getNextNumber = async (table: string, type: string): Promise<string> => {
  const d = await getDB();
  const p: Record<string, string> = { 'salesInvoices_cash':'CSI','salesInvoices_credit':'CRI','purchaseInvoices_cash':'CPI','purchaseInvoices_credit':'CRPI' };
  const prefix = p[table+'_'+type] || 'TR';
  const r = await d.getFirstAsync("SELECT COUNT(*) as c FROM "+table) as any;
  return prefix+'-'+((r?.c||0)+1).toString().padStart(6,'0');
};

export const postTransaction = async (params: any): Promise<any> => {
  try {
    const d = await getDB();
    const cur = params.currency || 'YER';
    const rate = params.exchangeRate || 1;
    const amountYER = roundYER(params.amount * rate);
    const number = await getNextNumber(params.table, params.type);
    await d.withTransactionAsync(async () => {
      const keys = Object.keys(params.data);
      await d.runAsync("INSERT INTO "+params.table+" ("+keys.join(',')+", number, status) VALUES ("+keys.map(()=>'?').join(',')+", ?, 'posted')", [...Object.values(params.data), number]);
      const jr = await d.runAsync("INSERT INTO journal_entries (number, date, description, type, currency, exchange_rate, original_amount, base_amount) VALUES (?,?,?,?,?,?,?,?)", ['JE-'+number, params.data.date||'', params.data.description||'', params.table, cur, rate, params.amount, amountYER]);
      const jid = jr.lastInsertRowId;
      await d.runAsync("INSERT INTO journal_details (journal_id, account_id, account_name, debit, credit, currency, original_debit) VALUES (?,?,?,?,0,?,?)", [jid, params.debitAccountId, params.debitName, amountYER, cur, params.amount]);
      await d.runAsync("INSERT INTO journal_details (journal_id, account_id, account_name, debit, credit, currency, original_credit) VALUES (?,?,?,0,?,?,?)", [jid, params.creditAccountId, params.creditName, amountYER, cur, params.amount]);
      await d.runAsync('UPDATE accounts SET balance = round(balance + ?, 2) WHERE id = ?', [amountYER, params.debitAccountId]);
      await d.runAsync('UPDATE accounts SET balance = round(balance - ?, 2) WHERE id = ?', [amountYER, params.creditAccountId]);
    });
    return { success: true, number, amountYER };
  } catch (e: any) { return { success: false, error: e.message }; }
};

export const accounting = {
  salesCash: (d: any, cid: string, cn: string, t: number, cur?: string, r?: number) => postTransaction({ table:'salesInvoices', type:'cash', data:d, debitAccountId:cid, debitName:cn, creditAccountId:'411', creditName:'المبيعات', amount:t, currency:cur, exchangeRate:r }),
  salesCredit: (d: any, cid: string, cn: string, t: number, cur?: string, r?: number) => postTransaction({ table:'salesInvoices', type:'credit', data:d, debitAccountId:cid, debitName:cn, creditAccountId:'411', creditName:'المبيعات', amount:t, currency:cur, exchangeRate:r }),
  purchaseCash: (d: any, cid: string, cn: string, t: number, cur?: string, r?: number) => postTransaction({ table:'purchaseInvoices', type:'cash', data:d, debitAccountId:'511', debitName:'المشتريات', creditAccountId:cid, creditName:cn, amount:t, currency:cur, exchangeRate:r }),
  purchaseCredit: (d: any, sid: string, sn: string, t: number, cur?: string, r?: number) => postTransaction({ table:'purchaseInvoices', type:'credit', data:d, debitAccountId:'511', debitName:'المشتريات', creditAccountId:sid, creditName:sn, amount:t, currency:cur, exchangeRate:r }),
  receiptCash: (d: any, cid: string, cn: string, aid: string, an: string, t: number) => postTransaction({ table:'vouchers', type:'receipt_cash', data:d, debitAccountId:cid, debitName:cn, creditAccountId:aid, creditName:an, amount:t }),
  paymentCash: (d: any, cid: string, cn: string, aid: string, an: string, t: number) => postTransaction({ table:'vouchers', type:'payment_cash', data:d, debitAccountId:aid, debitName:an, creditAccountId:cid, creditName:cn, amount:t }),
  inventoryOut: (d: any, eid: string, en: string, iid: string, inn: string, t: number) => postTransaction({ table:'inventoryIssues', type:'', data:d, debitAccountId:eid, debitName:en, creditAccountId:iid, creditName:inn, amount:t }),
  inventoryIn: (d: any, iid: string, inn: string, eid: string, en: string, t: number) => postTransaction({ table:'inventoryReceipts', type:'', data:d, debitAccountId:iid, debitName:inn, creditAccountId:eid, creditName:en, amount:t }),
  salesReturn: (d: any, cid: string, cn: string, t: number) => postTransaction({ table:'salesReturns', type:'', data:d, debitAccountId:'411', debitName:'مردودات مبيعات', creditAccountId:cid, creditName:cn, amount:t }),
  purchaseReturn: (d: any, sid: string, sn: string, t: number) => postTransaction({ table:'purchaseReturns', type:'', data:d, debitAccountId:sid, debitName:sn, creditAccountId:'511', creditName:'مردودات مشتريات', amount:t }),
};
