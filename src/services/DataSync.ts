import * as SQLite from 'expo-sqlite';

// ✅ الخدمة الموحدة لجميع الشاشات
class DataSyncService {
  private db: any = null;
  private static instance: DataSyncService;

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) DataSyncService.instance = new DataSyncService();
    return DataSyncService.instance;
  }

  setDatabase(db: any) { this.db = db; }

  // ============== الحسابات ==============
  async getAccounts() { return this.db?.getAllAsync('SELECT * FROM accounts WHERE isActive=1 ORDER BY code') || []; }
  async getAccountsByParent(parentId: string) { return this.db?.getAllAsync('SELECT * FROM accounts WHERE isActive=1 AND parentId=? ORDER BY code', [parentId]) || []; }
  async getLeafAccounts() {
    const all = await this.getAccounts();
    const parentIds = new Set(all.map((a: any) => a.parentId).filter(Boolean));
    return all.filter((a: any) => a.parentId && !parentIds.has(a.id));
  }

  // ============== الأصناف ==============
  async getItems() { return this.db?.getAllAsync('SELECT * FROM items ORDER BY name') || []; }

  // ============== الوحدات ==============
  async getUnits() { return this.db?.getAllAsync('SELECT * FROM units ORDER BY name') || []; }

  // ============== المجموعات ==============
  async getGroups() { return this.db?.getAllAsync('SELECT * FROM categories ORDER BY name') || []; }

  // ============== المخازن ==============
  async getWarehouses() { return this.db?.getAllAsync('SELECT * FROM warehouses ORDER BY name') || []; }

  // ============== العملاء ==============
  async getCustomers() { return this.db?.getAllAsync('SELECT * FROM customers ORDER BY name') || []; }

  // ============== الموردين ==============
  async getSuppliers() { return this.db?.getAllAsync('SELECT * FROM suppliers ORDER BY name') || []; }

  // ============== العملات ==============
  async getCurrencies() { return this.db?.getAllAsync('SELECT * FROM currencies ORDER BY code') || []; }

  // ============== البنوك ==============
  async getBanks() { return this.db?.getAllAsync('SELECT * FROM banks ORDER BY name') || []; }

  // ============== الصناديق ==============
  async getCashBoxes() { return this.db?.getAllAsync('SELECT * FROM cashBoxes ORDER BY name') || []; }

  // ============== المحافظ ==============
  async getEWallets() { return this.db?.getAllAsync('SELECT * FROM ewallets ORDER BY name') || []; }

  // ============== العلامات التجارية ==============
  async getBrands() { return this.db?.getAllAsync('SELECT * FROM brands ORDER BY name') || []; }

  // ============== المندوبين ==============
  async getReps() { return this.db?.getAllAsync('SELECT * FROM salesReps ORDER BY name') || []; }

  // ============== ترحيل محاسبي تلقائي ==============
  async postJournalEntry(description: string, date: string, lines: { accountId: string, debit: number, credit: number, desc?: string }[]) {
    if (!this.db) return;
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) { console.warn('⚠️ القيد غير متوازن'); return; }

    const entryId = 'je-' + Date.now();
    const number = 'JV-' + Date.now().toString().slice(-6);
    await this.db.runAsync('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
      [entryId, number, date, description, totalDebit, totalCredit]);

    for (const line of lines) {
      const itemId = 'ji-' + Date.now() + Math.random().toString(36).slice(2, 6);
      await this.db.runAsync('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
        [itemId, entryId, line.accountId, line.debit, line.credit, line.desc || '']);
      // تحديث رصيد الحساب
      await this.db.runAsync('UPDATE accounts SET balance = balance + ? - ? WHERE id = ?', [line.debit, line.credit, line.accountId]);
    }
    return entryId;
  }
}

export const dataSync = DataSyncService.getInstance();
