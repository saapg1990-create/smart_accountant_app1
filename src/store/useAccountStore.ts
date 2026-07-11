import { create } from 'zustand';

let dbInstance: any = null;
export const setDatabase = (db: any) => { dbInstance = db; };
const getDB = () => dbInstance;

export const useAccountStore = create<any>((set, get) => ({
  accounts: [],
  loading: false,

  loadAccounts: async () => {
    const db = getDB();
    if (!db) return;
    set({ loading: true });
    const result = await db.getAllAsync(`
      SELECT a.*, 
        COALESCE(SUM(ab.balance), 0) as balance,
        COALESCE(SUM(ab.base_balance), 0) as base_balance,
        (SELECT ab2.currency FROM account_balances ab2 WHERE ab2.account_id = a.id AND ab2.isDefault = 1 LIMIT 1) as currency
      FROM accounts a
      LEFT JOIN account_balances ab ON a.id = ab.account_id
      WHERE a.isActive = 1
      GROUP BY a.id
      ORDER BY a.code
    `);
    set({ accounts: result, loading: false });
  },

  getExchangeRate: async (currencyCode: string) => {
    if (!currencyCode || currencyCode === 'YER') return 1;
    const db = getDB();
    if (!db) return 1;
    try {
      const result = await db.getFirstAsync('SELECT rate FROM currencies WHERE code=?', [currencyCode]) as any;
      return result?.rate || 530; // افتراضي 530 للدولار
    } catch (e) { return 530; }
  },

  addBalance: async (accountId: string, currency: string, balance: number) => {
    const db = getDB();
    if (!db || balance === 0) return;
    
    // ✅ جلب سعر الصرف الحقيقي
    const rate = await get().getExchangeRate(currency);
    console.log("💰 تحويل:", balance, currency, "×", rate, "=", balance * rate);
    const baseBalance = balance * rate;
    
    const id = 'bal-' + Date.now();
    await db.runAsync(
      'INSERT INTO account_balances (id, account_id, currency, balance, base_balance, exchange_rate, isDefault) VALUES (?,?,?,?,?,?,1)',
      [id, accountId, currency, balance, baseBalance, rate]
    );
    console.log(`✅ رصيد: ${balance} ${currency} × ${rate} = ${baseBalance} ﷼`);
    await get().loadAccounts();
  },

  addAccount: async (account: any) => {
    const db = getDB();
    if (!db) return { success: false, error: 'قاعدة البيانات غير جاهزة' };
    
    const { accounts } = get();
    const name = account.name?.trim() || '';
    const parentId = account.parentId || '';
    
    const exists = accounts.find((a: any) => a.name === name && (a.parentId || '') === parentId);
    if (exists) return { success: false, error: `"${name}" موجود مسبقاً` };

    const id = account.id || 'acc-' + Date.now();
    const code = account.code || get().generateCode(parentId);
    
    await db.runAsync(
      'INSERT INTO accounts (id, code, name, type, parentId, isDebit, bankAccount, walletPhone, notes, isActive) VALUES (?,?,?,?,?,?,?,?,?,1)',
      [id, code, name, account.type, parentId, account.isDebit ?? 1, account.bankAccount || '', account.walletPhone || '', account.notes || '']
    );

    // ✅ إضافة الرصيد بالعملة الصحيحة
    const balance = parseFloat(account.balance) || 0;
    if (balance !== 0) {
      await get().addBalance(id, account.currency || 'YER', Math.abs(balance));
    }

    await get().loadAccounts();
    return { success: true, id };
  },

  updateAccount: async (id: string, updates: any) => {
    const db = getDB();
    if (!db) return;
    if (updates.name !== undefined) await db.runAsync('UPDATE accounts SET name=? WHERE id=?', [updates.name, id]);
    await get().loadAccounts();
  },

  removeAccount: async (id: string) => {
    const db = getDB();
    if (!db) return;
    await db.runAsync('UPDATE accounts SET isActive=0 WHERE id=?', [id]);
    await db.runAsync('DELETE FROM account_balances WHERE account_id=?', [id]);
    await get().loadAccounts();
  },

  getMainAccounts: () => get().accounts.filter((a: any) => !a.parentId || a.parentId === ''),
  getSubAccounts: (parentId: string) => get().accounts.filter((a: any) => a.parentId === parentId),

  generateCode: (parentId?: string) => {
    const { accounts } = get();
    if (parentId) {
      const siblings = accounts.filter((a: any) => a.parentId === parentId);
      const parent = accounts.find((a: any) => a.id === parentId);
      return (parent?.code || '') + (siblings.length + 1).toString().padStart(2, '0');
    }
    return (accounts.filter((a: any) => !a.parentId).length + 1).toString();
  },
}));
