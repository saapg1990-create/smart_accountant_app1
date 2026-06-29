import { create } from 'zustand';
import LocalStore from '../../hooks/useLocalStore';

const store = LocalStore.getInstance();

interface Account {
  id: string; code: string; name: string; type: string;
  currency: string; balance: number; parentId: string; createdAt: string;
}

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  
  // العمليات الأساسية
  loadAccounts: () => Promise<void>;
  addAccount: (account: Partial<Account>) => Promise<string | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  
  // الاستعلامات
  getMainAccounts: () => Account[];
  getSubAccounts: (parentId: string) => Account[];
  getLeafAccounts: () => Account[];
  getAccountsByType: (type: string) => Account[];
  
  // التوليد
  generateCode: (parentId?: string) => string;
  
  // التحديث التراكمي
  updateParentBalance: (parentId: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,

  loadAccounts: async () => {
    set({ loading: true });
    const accounts = await store.getAll('accounts');
    set({ accounts: accounts as Account[], loading: false });
  },

  addAccount: async (account) => {
    // منع التكرار: نفس الاسم + نفس الأب
    const { accounts } = get();
    const parentId = account.parentId || '';
    const exists = accounts.find((a: Account) => 
      a.name === account.name && (a.parentId || '') === parentId
    );
    if (exists) return null; // مكرر
    
    const id = await store.add('accounts', account);
    await get().loadAccounts();
    
    // تحديث تراكمي لرصيد الأب
    if (parentId) {
      await get().updateParentBalance(parentId);
    }
    
    return id;
  },

  updateAccount: async (id, updates) => {
    await store.update('accounts', id, updates);
    await get().loadAccounts();
    
    // تحديث تراكمي
    const account = get().accounts.find((a: Account) => a.id === id);
    if (account?.parentId) {
      await get().updateParentBalance(account.parentId);
    }
  },

  removeAccount: async (id) => {
    // منع حذف حساب له أبناء
    const subs = get().getSubAccounts(id);
    if (subs.length > 0) return;
    
    const account = get().accounts.find((a: Account) => a.id === id);
    await store.remove('accounts', id);
    await get().loadAccounts();
    
    if (account?.parentId) {
      await get().updateParentBalance(account.parentId);
    }
  },

  getMainAccounts: () => get().accounts.filter((a: Account) => !a.parentId),
  
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
    const subs = get().getSubAccounts(parentId);
    const totalBalance = subs.reduce((sum: number, sub: Account) => sum + (sub.balance || 0), 0);
    await store.update('accounts', parentId, { balance: totalBalance });
    await get().loadAccounts();
  },
}));
