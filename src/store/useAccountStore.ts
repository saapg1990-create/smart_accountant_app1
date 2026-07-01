import { create } from 'zustand';

let dbInstance: any = null;

export const setDatabase = (db: any) => { dbInstance = db; };

const getDB = () => {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
};

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
    try {
      const db = getDB();
      set({ loading: true });
      const result = await db.getAllAsync('SELECT * FROM accounts WHERE isActive=1 ORDER BY code');
      set({ accounts: result as Account[], loading: false });
    } catch (e) {
      console.log('Load accounts error:', e);
      set({ loading: false });
    }
  },

  addAccount: async (account) => {
    try {
      const db = getDB();
      const { accounts } = get();
      const parentId = account.parentId || '';
      const exists = accounts.find((a: Account) => a.name === account.name && (a.parentId || '') === parentId);
      if (exists) return null;
      
      const id = account.id || ('acc-' + Date.now());
      const code = account.code || get().generateCode(parentId);
      
      await db.runAsync(
        'INSERT INTO accounts (id, code, name, type, parentId, currency, balance, isActive) VALUES (?,?,?,?,?,?,?,1)',
        [id, code, account.name, account.type, parentId, account.currency || 'YER', account.balance || 0]
      );
      await get().loadAccounts();
      if (parentId) await get().updateParentBalance(parentId);
      return id;
    } catch (e) { console.log('Add error:', e); return null; }
  },

  updateAccount: async (id, updates) => {
    try {
      const db = getDB();
      const fields: string[] = [];
      const values: any[] = [];
      if (updates.name !== undefined) { fields.push('name=?'); values.push(updates.name); }
      if (updates.code !== undefined) { fields.push('code=?'); values.push(updates.code); }
      if (updates.type !== undefined) { fields.push('type=?'); values.push(updates.type); }
      if (updates.balance !== undefined) { fields.push('balance=?'); values.push(updates.balance); }
      if (updates.parentId !== undefined) { fields.push('parentId=?'); values.push(updates.parentId); }
      if (fields.length > 0) { values.push(id); await db.runAsync(`UPDATE accounts SET ${fields.join(',')} WHERE id=?`, values); }
      await get().loadAccounts();
      const account = get().accounts.find((a: Account) => a.id === id);
      if (account?.parentId) await get().updateParentBalance(account.parentId);
    } catch (e) { console.log('Update error:', e); }
  },

  removeAccount: async (id) => {
    try {
      const db = getDB();
      const subs = get().getSubAccounts(id);
      if (subs.length > 0) return;
      const account = get().accounts.find((a: Account) => a.id === id);
      await db.runAsync('UPDATE accounts SET isActive=0 WHERE id=?', [id]);
      await get().loadAccounts();
      if (account?.parentId) await get().updateParentBalance(account.parentId);
    } catch (e) { console.log('Remove error:', e); }
  },

  getMainAccounts: () => get().accounts.filter((a: Account) => !a.parentId || a.parentId === ''),
  
  getSubAccounts: (parentId: string) => get().accounts.filter((a: Account) => a.parentId === parentId),
  
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
    const mainAccounts = accounts.filter((a: Account) => !a.parentId);
    return '1' + (mainAccounts.length + 1).toString().padStart(2, '0');
  },

  updateParentBalance: async (parentId: string) => {
    try {
      const db = getDB();
      const subs = get().getSubAccounts(parentId);
      const totalBalance = subs.reduce((sum: number, sub: Account) => sum + (sub.balance || 0), 0);
      await db.runAsync('UPDATE accounts SET balance=? WHERE id=?', [totalBalance, parentId]);
      await get().loadAccounts();
    } catch (e) { console.log('Update parent error:', e); }
  },
}));
