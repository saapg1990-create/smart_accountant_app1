import { query, execute } from '../db/database';

export const DataService = {
  // حسابات
  getAccounts: () => query('SELECT * FROM accounts WHERE isActive=1 ORDER BY code'),
  addAccount: async (data: any) => {
    const id = data.id || 'acc-' + Date.now();
    await execute('INSERT INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,?)', [id, data.code, data.name, data.type, data.parentId, data.balance||0]);
    
    // ✅ إذا فيه رصيد افتتاحي، نسجل قيد تلقائي
    if ((data.balance || 0) > 0) {
      const entryId = 'je-open-' + Date.now();
      const entryNumber = 'OPEN-' + Date.now().toString().slice(-6);
      const date = new Date().toISOString().split('T')[0];
      const desc = `رصيد افتتاحي - ${data.name}`;
      const isDebit = ['أصل', 'مصروف'].includes(data.type); // أصل ومصروف = مدين
      const isCredit = ['خصم', 'ملكية', 'إيراد'].includes(data.type); // خصم وملكية وإيراد = دائن
      
      const total = data.balance || 0;
      
      await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)', [entryId, entryNumber, date, desc, isDebit ? total : 0, isCredit ? total : 0]);
      
      if (isDebit) {
        // مدين الحساب، دائن رأس المال
        await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)', ['ji-' + Date.now() + 'a', entryId, id, total, 0, 'مدين - رصيد افتتاحي']);
        await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)', ['ji-' + Date.now() + 'b', entryId, '31', 0, total, 'دائن - رأس المال']);
      } else if (isCredit) {
        // مدين رأس المال، دائن الحساب
        await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)', ['ji-' + Date.now() + 'a', entryId, '31', total, 0, 'مدين - رأس المال']);
        await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)', ['ji-' + Date.now() + 'b', entryId, id, 0, total, 'دائن - رصيد افتتاحي']);
      }
    }
    return id;
  },
  deleteAccount: (id: string) => execute('DELETE FROM accounts WHERE id=?', [id]),

  // عملاء
  getCustomers: () => query('SELECT * FROM customers ORDER BY name'),
  addCustomer: (data: any) => execute('INSERT INTO customers (id, code, name, phone, address, balance, creditLimit) VALUES (?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.phone, data.address, data.balance||0, data.creditLimit||0]),
  deleteCustomer: (id: string) => execute('DELETE FROM customers WHERE id=?', [id]),

  // موردين
  getSuppliers: () => query('SELECT * FROM suppliers ORDER BY name'),
  addSupplier: (data: any) => execute('INSERT INTO suppliers (id, code, name, phone, address, balance) VALUES (?,?,?,?,?,?)', [data.id, data.code, data.name, data.phone, data.address, data.balance||0]),

  // أصناف
  getItems: () => query('SELECT * FROM items ORDER BY name'),
  addItem: (data: any) => execute('INSERT INTO items (id, code, name, unitName, groupName, brandName, warehouseName, cost, price, quantity) VALUES (?,?,?,?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.unitName, data.groupName, data.brandName, data.warehouseName, data.cost||0, data.price||0, data.quantity||0]),

  // صناديق
  getCashBoxes: () => query('SELECT * FROM cashBoxes ORDER BY name'),
  addCashBox: async (data: any) => {
    await execute('INSERT INTO cashBoxes (id, name, balance) VALUES (?,?,?)', [data.id, data.name, data.balance||0]);
    // إضافة حساب للصندوق في الدليل
    if ((data.balance || 0) > 0) {
      await DataService.addAccount({ id: data.id, code: 'CSH-' + data.id.slice(-4), name: data.name, type: 'أصل', parentId: '11', balance: data.balance||0 });
    }
  },

  // بنوك
  getBanks: () => query('SELECT * FROM banks ORDER BY name'),
  addBank: async (data: any) => {
    await execute('INSERT INTO banks (id, name, accountNumber, balance) VALUES (?,?,?,?)', [data.id, data.name, data.accountNumber, data.balance||0]);
    if ((data.balance || 0) > 0) {
      await DataService.addAccount({ id: data.id, code: 'BNK-' + data.id.slice(-4), name: data.name, type: 'أصل', parentId: '11', balance: data.balance||0 });
    }
  },

  // محافظ
  getEwallets: () => query('SELECT * FROM ewallets ORDER BY name'),
  addEwallet: async (data: any) => {
    await execute('INSERT INTO ewallets (id, name, phone, balance) VALUES (?,?,?,?)', [data.id, data.name, data.phone, data.balance||0]);
    if ((data.balance || 0) > 0) {
      await DataService.addAccount({ id: data.id, code: 'EWL-' + data.id.slice(-4), name: data.name, type: 'أصل', parentId: '11', balance: data.balance||0 });
    }
  },

  // عملات
  getCurrencies: () => query('SELECT * FROM currencies ORDER BY code'),
  addCurrency: (data: any) => execute('INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)', [data.id, data.code, data.name, data.symbol, data.rate||1, data.isDefault||0]),

  // فواتير
  getSalesInvoices: () => query('SELECT * FROM salesInvoices ORDER BY date DESC'),
  addSalesInvoice: (data: any) => execute('INSERT INTO salesInvoices (id, number, date, customerId, customerName, total, paid, remaining) VALUES (?,?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.customerId, data.customerName, data.total, data.paid, data.remaining]),

  // ترحيل محاسبي
  postJournalEntry: async (entry: any, lines: any[]) => {
    const entryId = 'je-' + Date.now();
    await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)', [entryId, entry.number, entry.date, entry.description, entry.totalDebit, entry.totalCredit]);
    for (const line of lines) {
      await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)', ['ji-' + Date.now() + Math.random(), entryId, line.accountId, line.debit, line.credit, line.description]);
      await execute('UPDATE accounts SET balance = balance + ? - ? WHERE id = ?', [line.debit, line.credit, line.accountId]);
    }
  },

  // علامات
  getBrands: () => query('SELECT * FROM brands ORDER BY name'),
  addBrand: (data: any) => execute('INSERT INTO brands (id, name) VALUES (?,?)', [data.id, data.name]),
  
  // مجموعات
  getGroups: () => query('SELECT * FROM categories ORDER BY name'),
  addGroup: (data: any) => execute('INSERT INTO categories (id, name) VALUES (?,?)', [data.id, data.name]),
  
  // مندوبين
  getReps: () => query('SELECT * FROM salesReps ORDER BY name'),
  addRep: (data: any) => execute('INSERT INTO salesReps (id, name, phone) VALUES (?,?,?)', [data.id, data.name, data.phone]),
};
