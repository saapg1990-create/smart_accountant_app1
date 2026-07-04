import { query, execute } from '../db/database';

export const DataService = {
  // حسابات
  getAccounts: () => query('SELECT * FROM accounts WHERE isActive=1 ORDER BY code'),
  addAccount: (data: any) => execute('INSERT INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,?)', [data.id, data.code, data.name, data.type, data.parentId, data.balance||0]),
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
  addCashBox: (data: any) => execute('INSERT INTO cashBoxes (id, name, balance) VALUES (?,?,?)', [data.id, data.name, data.balance||0]),

  // بنوك
  getBanks: () => query('SELECT * FROM banks ORDER BY name'),
  addBank: (data: any) => execute('INSERT INTO banks (id, name, accountNumber, balance) VALUES (?,?,?,?)', [data.id, data.name, data.accountNumber, data.balance||0]),

  // محافظ
  getEwallets: () => query('SELECT * FROM ewallets ORDER BY name'),
  addEwallet: (data: any) => execute('INSERT INTO ewallets (id, name, phone, balance) VALUES (?,?,?,?)', [data.id, data.name, data.phone, data.balance||0]),

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
};

// دوال إضافية للعلامات والمجموعات والمندوبين
DataService.getBrands = () => query('SELECT * FROM brands ORDER BY name');
DataService.addBrand = (data: any) => execute('INSERT INTO brands (id, name) VALUES (?,?)', [data.id, data.name]);
DataService.getGroups = () => query('SELECT * FROM categories ORDER BY name');
DataService.addGroup = (data: any) => execute('INSERT INTO categories (id, name) VALUES (?,?)', [data.id, data.name]);
DataService.getReps = () => query('SELECT * FROM salesReps ORDER BY name');
DataService.addRep = (data: any) => execute('INSERT INTO salesReps (id, name, phone) VALUES (?,?,?)', [data.id, data.name, data.phone]);
