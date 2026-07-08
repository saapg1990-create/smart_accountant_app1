import { create } from 'zustand';

let dbInstance: any = null;
export const setDatabase = (db: any) => { dbInstance = db; };
const getDB = () => dbInstance;

interface Account {
  id: string; code: string; name: string; type: string;
  currency: string; balance: number; parentId: string;
  isDebit: number; isActive: number;
  bankAccount?: string; walletPhone?: string; notes?: string;
}

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  loadAccounts: () => Promise<void>;
  addAccount: (account: Partial<Account>) => Promise<string | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  getMainAccounts: () => Account[];
  getSubAccounts: (parentId: string) => Account[];
  generateCode: (parentId?: string) => string;
  updateParentBalance: (parentId: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,

  loadAccounts: async () => {
    const db = getDB();
    if (!db) return;
    set({ loading: true });
    const result = await db.getAllAsync('SELECT * FROM accounts WHERE isActive = 1 ORDER BY code');
    set({ accounts: result as Account[], loading: false });
  },

  addAccount: async (account) => {
    const db = getDB();
    if (!db) return null;
    
    // ✅ منع التكرار: نفس الاسم + نفس الأب
    const { accounts } = get();
    const parentId = account.parentId || '';
    const exists = accounts.find((a: Account) => 
      a.name === account.name && (a.parentId || '') === parentId
    );
    if (exists) {
      console.log('❌ مكرر:', account.name);
      return null;
    }
    
    const id = account.id || ('acc-' + Date.now());
    const code = account.code || get().generateCode(parentId);
    
    await db.runAsync(
      'INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isDebit, isActive, bankAccount, walletPhone, notes) VALUES (?,?,?,?,?,?,?,?,1,?,?,?)',
      [id, code, account.name, account.type, parentId, account.currency||'YER', account.balance||0, account.isDebit!==false?1:0, account.bankAccount||'', account.walletPhone||'', account.notes||'']
    );
    
    await get().loadAccounts();
    if (parentId) await get().updateParentBalance(parentId);
    return id;
  },

  updateAccount: async (id, updates) => {
    const db = getDB();
    if (!db) return;
    if (updates.name !== undefined) await db.runAsync('UPDATE accounts SET name=? WHERE id=?', [updates.name, id]);
    if (updates.balance !== undefined) await db.runAsync('UPDATE accounts SET balance=? WHERE id=?', [updates.balance, id]);
    if (updates.currency !== undefined) await db.runAsync('UPDATE accounts SET currency=? WHERE id=?', [updates.currency, id]);
    if (updates.isDebit !== undefined) await db.runAsync('UPDATE accounts SET isDebit=? WHERE id=?', [updates.isDebit, id]);
    await get().loadAccounts();
  },

  removeAccount: async (id) => {
    const db = getDB();
    if (!db) return;
    const subs = get().getSubAccounts(id);
    if (subs.length > 0) return;
    await db.runAsync('UPDATE accounts SET isActive=0 WHERE id=?', [id]);
    await get().loadAccounts();
  },

  getMainAccounts: () => get().accounts.filter((a: Account) => !a.parentId || a.parentId === ''),
  getSubAccounts: (parentId: string) => get().accounts.filter((a: Account) => a.parentId === parentId),

  generateCode: (parentId?: string) => {
    const { accounts } = get();
    if (parentId) {
      const parent = accounts.find((a: Account) => a.id === parentId);
      if (!parent) return '';
      const siblings = accounts.filter((a: Account) => a.parentId === parentId);
      const maxSeq = siblings.reduce((max: number, a: Account) => {
        const suffix = a.code?.replace(parent.code || '', '');
        return Math.max(max, parseInt(suffix) || 0);
      }, 0);
      return parent.code + (maxSeq + 1).toString().padStart(2, '0');
    }
    return '1' + (accounts.length + 1).toString().padStart(2, '0');
  },

  updateParentBalance: async (parentId: string) => {
    const db = getDB();
    if (!db) return;
    const subs = get().getSubAccounts(parentId);
    const totalBalance = subs.reduce((sum: number, sub: Account) => sum + (sub.balance || 0), 0);
    await db.runAsync('UPDATE accounts SET balance=? WHERE id=?', [totalBalance, parentId]);
    await get().loadAccounts();
  },
}));
