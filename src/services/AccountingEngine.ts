import * as SQLite from 'expo-sqlite';

// ✅ محرك المحاسبة الموحد - يستخدم في جميع الشاشات
class AccountingEngine {
  private db: any = null;
  private static instance: AccountingEngine;

  static getInstance(): AccountingEngine {
    if (!AccountingEngine.instance) AccountingEngine.instance = new AccountingEngine();
    return AccountingEngine.instance;
  }

  setDatabase(db: any) { this.db = db; }

  // ============== العمليات المحاسبية التلقائية ==============

  /**
   * ترحيل فاتورة مبيعات
   * @param invoiceType 'cash' | 'credit'
   * @param cashAccountId حساب الصندوق (للنقدي)
   * @param customerAccountId حساب العميل (للآجل)
   * @param revenueAccountId حساب المبيعات
   * @param taxAccountId حساب الضريبة
   * @param total المبلغ الإجمالي
   * @param subtotal المبلغ قبل الضريبة
   * @param taxAmount مبلغ الضريبة
   */
  async postSalesInvoice(
    invoiceType: 'cash' | 'credit',
    cashAccountId: string,
    customerAccountId: string,
    revenueAccountId: string,
    taxAccountId: string,
    total: number,
    subtotal: number,
    taxAmount: number,
    date: string,
    description: string
  ) {
    if (!this.db) return;
    const entryId = 'je-' + Date.now();
    const number = 'SINV-' + Date.now().toString().slice(-6);

    await this.db.runAsync(
      'INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
      [entryId, number, date, description, total, total]
    );

    // مدين: الصندوق أو العميل
    const debitAccount = invoiceType === 'cash' ? cashAccountId : customerAccountId;
    await this.addJournalItem(entryId, debitAccount, total, 0, 'مدين');

    // دائن: المبيعات
    await this.addJournalItem(entryId, revenueAccountId, 0, subtotal, 'دائن المبيعات');

    // دائن: الضريبة (إذا وجدت)
    if (taxAmount > 0) {
      await this.addJournalItem(entryId, taxAccountId, 0, taxAmount, 'دائن ضريبة المبيعات');
    }

    // تحديث رصيد الصندوق أو العميل
    await this.updateAccountBalance(debitAccount, total);
    return entryId;
  }

  /**
   * ترحيل فاتورة مشتريات
   */
  async postPurchaseInvoice(
    invoiceType: 'cash' | 'credit',
    cashAccountId: string,
    supplierAccountId: string,
    expenseAccountId: string,
    total: number,
    date: string,
    description: string
  ) {
    if (!this.db) return;
    const entryId = 'je-' + Date.now();
    const number = 'PINV-' + Date.now().toString().slice(-6);

    await this.db.runAsync(
      'INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
      [entryId, number, date, description, total, total]
    );

    // مدين: المشتريات/المصروف
    await this.addJournalItem(entryId, expenseAccountId, total, 0, 'مدين المشتريات');

    // دائن: الصندوق أو المورد
    const creditAccount = invoiceType === 'cash' ? cashAccountId : supplierAccountId;
    await this.addJournalItem(entryId, creditAccount, 0, total, 'دائن');
    
    // تحديث رصيد الصندوق (ناقص) أو المورد (زائد)
    if (invoiceType === 'cash') {
      await this.updateAccountBalance(cashAccountId, -total);
    } else {
      await this.updateAccountBalance(supplierAccountId, total);
    }
    return entryId;
  }

  /**
   * ترحيل سند قبض/صرف
   */
  async postVoucher(
    type: 'receipt' | 'payment',
    voucherType: 'cash' | 'bank' | 'ewallet',
    sourceAccountId: string,
    targetAccountId: string,
    amount: number,
    date: string,
    description: string
  ) {
    if (!this.db) return;
    const entryId = 'je-' + Date.now();
    const number = type === 'receipt' ? 'RV-' : 'PV-' + Date.now().toString().slice(-6);

    await this.db.runAsync(
      'INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
      [entryId, number, date, description, amount, amount]
    );

    if (type === 'receipt') {
      // قبض: مدين الصندوق/البنك، دائن الحساب
      await this.addJournalItem(entryId, sourceAccountId, amount, 0, 'مدين');
      await this.addJournalItem(entryId, targetAccountId, 0, amount, 'دائن');
      await this.updateAccountBalance(sourceAccountId, amount);
    } else {
      // صرف: مدين الحساب، دائن الصندوق/البنك
      await this.addJournalItem(entryId, targetAccountId, amount, 0, 'مدين');
      await this.addJournalItem(entryId, sourceAccountId, 0, amount, 'دائن');
      await this.updateAccountBalance(sourceAccountId, -amount);
    }
    return entryId;
  }

  /**
   * ترحيل صرف/توريد مخزون
   */
  async postInventoryMovement(
    type: 'issue' | 'receipt',
    warehouseAccountId: string,
    inventoryAccountId: string,
    total: number,
    date: string,
    description: string
  ) {
    if (!this.db) return;
    const entryId = 'je-' + Date.now();
    const number = (type === 'issue' ? 'OUT-' : 'IN-') + Date.now().toString().slice(-6);

    await this.db.runAsync(
      'INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit, isPosted) VALUES (?,?,?,?,?,?,1)',
      [entryId, number, date, description, total, total]
    );

    if (type === 'issue') {
      // صرف: مدين المصروف، دائن المخزون
      await this.addJournalItem(entryId, warehouseAccountId, total, 0, 'مدين صرف مخزون');
      await this.addJournalItem(entryId, inventoryAccountId, 0, total, 'دائن المخزون');
    } else {
      // توريد: مدين المخزون، دائن المورد/الحساب
      await this.addJournalItem(entryId, inventoryAccountId, total, 0, 'مدين المخزون');
      await this.addJournalItem(entryId, warehouseAccountId, 0, total, 'دائن التوريد');
    }
    return entryId;
  }

  // ============== دوال مساعدة ==============

  async addJournalItem(entryId: string, accountId: string, debit: number, credit: number, description: string) {
    if (!accountId || (debit === 0 && credit === 0)) return;
    const id = 'ji-' + Date.now() + Math.random().toString(36).slice(2, 6);
    await this.db.runAsync(
      'INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      [id, entryId, accountId, debit, credit, description]
    );
  }

  async updateAccountBalance(accountId: string, amount: number) {
    if (!accountId || amount === 0) return;
    await this.db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
  }

  // ============== استعلامات موحدة ==============

  async getAccounts(type?: string) {
    let sql = 'SELECT * FROM accounts WHERE isActive=1';
    if (type) sql += ' AND type=?';
    return this.db?.getAllAsync(sql + ' ORDER BY code', type ? [type] : []) || [];
  }

  async getItems() { return this.db?.getAllAsync('SELECT * FROM items ORDER BY name') || []; }
  async getUnits() { return this.db?.getAllAsync('SELECT * FROM units ORDER BY name') || []; }
  async getGroups() { return this.db?.getAllAsync('SELECT * FROM categories ORDER BY name') || []; }
  async getWarehouses() { return this.db?.getAllAsync('SELECT * FROM warehouses ORDER BY name') || []; }
  async getCustomers() { return this.db?.getAllAsync('SELECT * FROM customers ORDER BY name') || []; }
  async getSuppliers() { return this.db?.getAllAsync('SELECT * FROM suppliers ORDER BY name') || []; }
  async getCurrencies() { return this.db?.getAllAsync('SELECT * FROM currencies ORDER BY code') || []; }
  async getBanks() { return this.db?.getAllAsync('SELECT * FROM banks ORDER BY name') || []; }
  async getCashBoxes() { return this.db?.getAllAsync('SELECT * FROM cashBoxes ORDER BY name') || []; }
  async getBrands() { return this.db?.getAllAsync('SELECT * FROM brands ORDER BY name') || []; }
  async getReps() { return this.db?.getAllAsync('SELECT * FROM salesReps ORDER BY name') || []; }
}

export const accountingEngine = AccountingEngine.getInstance();
