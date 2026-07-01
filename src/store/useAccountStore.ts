import { create } from 'zustand';

let dbInstance: any = null;

export const setDatabase = (db: any) => { dbInstance = db; };

const getDB = () => dbInstance;

interface Account {
  id: string; code: string; name: string; type: string;
  currency: string; balance: number; parentId: string; createdAt: string;
  isActive?: number;
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
  getLeafAccounts: () => Account[];
  getAccountsByType: (type: string) => Account[];
  generateCode: (parentId?: string) => string;
  updateParentBalance: (parentId: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,

  loadAccounts: async () => {
    const db = getDB();
    if (!db) return;
    try {
      set({ loading: true });
      const result = await db.getAllAsync('SELECT * FROM accounts WHERE isActive=1 ORDER BY code');
      set({ accounts: result as Account[], loading: false });
    } catch (e) {
      console.log('Load error:', e);
      set({ loading: false });
    }
  },

  addAccount: async (account) => {
    const db = getDB();
    if (!db) return null;
    try {
      const parentId = account.parentId || '';
      const id = account.id || ('acc-' + Date.now());
      const code = account.code || get().generateCode(parentId || undefined);
      
      await db.runAsync(
        'INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isActive) VALUES (?,?,?,?,?,?,?,1)',
        [id, code, account.name, account.type, parentId, account.currency || 'YER', account.balance || 0]
      );
      await get().loadAccounts();
      return id;
    } catch (e) { console.log('Add error:', e); return null; }
  },

  updateAccount: async (id, updates) => {
    const db = getDB();
    if (!db) return;
    try {
      if (updates.name !== undefined) await db.runAsync('UPDATE accounts SET name=? WHERE id=?', [updates.name, id]);
      if (updates.balance !== undefined) await db.runAsync('UPDATE accounts SET balance=? WHERE id=?', [updates.balance, id]);
      if (updates.code !== undefined) await db.runAsync('UPDATE accounts SET code=? WHERE id=?', [updates.code, id]);
      await get().loadAccounts();
    } catch (e) { console.log('Update error:', e); }
  },

  removeAccount: async (id) => {
    const db = getDB();
    if (!db) return;
    try {
      await db.runAsync('UPDATE accounts SET isActive=0 WHERE id=?', [id]);
      await get().loadAccounts();
    } catch (e) { console.log('Remove error:', e); }
  },

  // ✅ أهم تعديل: تصفية الحسابات الرئيسية
  getMainAccounts: () => {
    const { accounts } = get();
    // الرئيسي: parentId فاضي أو null أو undefined أو ''
    return accounts.filter((a: Account) => {
      const pid = a.parentId;
      return pid === null || pid === undefined || pid === '' || pid === 'null';
    });
  },

  // ✅ أهم تعديل: جلب الأبناء
  getSubAccounts: (parentId: string) => {
    const { accounts } = get();
    if (!parentId) return [];
    return accounts.filter((a: Account) => {
      const pid = a.parentId;
      return pid === parentId || pid === String(parentId);
    });
  },

  getLeafAccounts: () => {
    const { accounts } = get();
    const parentIds = new Set(accounts.map((a: Account) => a.parentId).filter(Boolean));
    return accounts.filter((a: Account) => a.parentId && !parentIds.has(a.id));
  },

  getAccountsByType: (type: string) => get().accounts.filter((a: Account) => a.type === type),

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
    try {
      const subs = get().getSubAccounts(parentId);
      const totalBalance = subs.reduce((sum: number, sub: Account) => sum + (sub.balance || 0), 0);
      await db.runAsync('UPDATE accounts SET balance=? WHERE id=?', [totalBalance, parentId]);
    } catch (e) { console.log('Update parent error:', e); }
  },
}));
