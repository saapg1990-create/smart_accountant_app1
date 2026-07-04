import { query, execute } from '../db/database';

export const DataService: any = {
  // ============ حسابات ============
  getAccounts: () => query('SELECT * FROM accounts WHERE isActive=1 ORDER BY code'),
  addAccount: async (data: any) => {
    const id = data.id || 'acc-' + Date.now();
    await execute('INSERT INTO accounts (id, code, name, type, parentId, balance, currency, bankAccount, walletPhone, notes) VALUES (?,?,?,?,?,?,?,?,?,?)', [id, data.code, data.name, data.type, data.parentId, data.balance||0, data.currency||'YER', data.bankAccount||'', data.walletPhone||'', data.notes||'']);
    // إضافة رصيد بالعملة
    await execute('INSERT OR REPLACE INTO account_currencies (id, accountId, currency, balance) VALUES (?,?,?,?)', ['ac-' + id, id, data.currency||'YER', data.balance||0]);
    return id;
  },
  deleteAccount: (id: string) => execute('DELETE FROM accounts WHERE id=?', [id]),

  // ============ أرصدة متعددة العملات ============
  getAccountBalances: (accountId: string) => query('SELECT * FROM account_currencies WHERE accountId=?', [accountId]),
  addAccountBalance: (accountId: string, currency: string, balance: number) => execute('INSERT OR REPLACE INTO account_currencies (id, accountId, currency, balance) VALUES (?,?,?,?)', ['acb-' + Date.now(), accountId, currency, balance]),
  updateAccountBalance: (accountId: string, currency: string, amount: number) => execute('UPDATE account_currencies SET balance = balance + ? WHERE accountId=? AND currency=?', [amount, accountId, currency]),

  // ============ عملاء ============
  getCustomers: () => query('SELECT * FROM customers ORDER BY name'),
  addCustomer: (data: any) => execute('INSERT INTO customers (id, code, name, phone, address, currency, balance) VALUES (?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.phone, data.address, data.currency, data.balance||0]),

  // ============ موردين ============
  getSuppliers: () => query('SELECT * FROM suppliers ORDER BY name'),
  addSupplier: (data: any) => execute('INSERT INTO suppliers (id, code, name, phone, address, currency, balance) VALUES (?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.phone, data.address, data.currency, data.balance||0]),

  // ============ أصناف ============
  getItems: () => query('SELECT * FROM items ORDER BY name'),
  addItem: (data: any) => execute('INSERT INTO items (id, code, name, unitName, groupName, warehouseName, cost, price, quantity) VALUES (?,?,?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.unitName, data.groupName, data.warehouseName, data.cost||0, data.price||0, data.quantity||0]),

  // ============ صناديق ============
  getCashBoxes: () => query('SELECT * FROM cashBoxes ORDER BY name'),
  addCashBox: async (data: any) => {
    await execute('INSERT INTO cashBoxes (id, name, balance) VALUES (?,?,?)', [data.id, data.name, data.balance||0]);
    if ((data.balance || 0) > 0) await DataService.addAccount({ id: data.id, code: 'CSH-' + data.id.slice(-4), name: data.name, type: 'اصل', parentId: '11', balance: data.balance||0 });
  },

  // ============ بنوك ============
  getBanks: () => query('SELECT * FROM banks ORDER BY name'),
  addBank: async (data: any) => {
    await execute('INSERT INTO banks (id, name, accountNumber, balance) VALUES (?,?,?,?)', [data.id, data.name, data.accountNumber, data.balance||0]);
    if ((data.balance || 0) > 0) await DataService.addAccount({ id: data.id, code: 'BNK-' + data.id.slice(-4), name: data.name, type: 'اصل', parentId: '11', balance: data.balance||0 });
  },

  // ============ محافظ ============
  getEwallets: () => query('SELECT * FROM ewallets ORDER BY name'),
  addEwallet: async (data: any) => {
    await execute('INSERT INTO ewallets (id, name, phone, balance) VALUES (?,?,?,?)', [data.id, data.name, data.phone, data.balance||0]);
    if ((data.balance || 0) > 0) await DataService.addAccount({ id: data.id, code: 'EWL-' + data.id.slice(-4), name: data.name, type: 'اصل', parentId: '11', balance: data.balance||0 });
  },

  // ============ عملات ============
  getCurrencies: () => query('SELECT * FROM currencies ORDER BY code'),
  addCurrency: (data: any) => execute('INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)', [data.id, data.code, data.name, data.symbol, data.rate||1, data.isDefault||0]),
  updateCurrency: (id: string, data: any) => execute('UPDATE currencies SET rate=? WHERE id=?', [data.rate, id]),
  deleteCurrency: (id: string) => execute('DELETE FROM currencies WHERE id=?', [id]),

  // ============ علامات ============
  getBrands: () => query('SELECT * FROM brands ORDER BY name'),
  addBrand: (data: any) => execute('INSERT INTO brands (id, name) VALUES (?,?)', [data.id, data.name]),

  // ============ مجموعات ============
  getGroups: () => query('SELECT * FROM categories ORDER BY name'),
  addGroup: (data: any) => execute('INSERT INTO categories (id, name) VALUES (?,?)', [data.id, data.name]),

  // ============ مندوبين ============
  getReps: () => query('SELECT * FROM salesReps ORDER BY name'),
  addRep: (data: any) => execute('INSERT INTO salesReps (id, name, phone) VALUES (?,?,?)', [data.id, data.name, data.phone]),

  // ============ سندات ============
  getVouchers: () => query('SELECT * FROM vouchers ORDER BY date DESC'),
  addVoucher: (data: any) => execute('INSERT INTO vouchers (id, number, date, description, amount, sourceName, accountName, type, voucherType, currency, exchangeRate, refNumber) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.description, data.amount, data.sourceName, data.accountName, data.type, data.voucherType, data.currency, data.exchangeRate, data.refNumber]),

  // ============ قيود ============
  getJournalEntries: () => query('SELECT * FROM journal_entries ORDER BY date DESC'),
  addJournalEntry: (data: any) => execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)', [data.id, data.number, data.date, data.description, data.amount, data.amount]),

  // ============ فواتير ============
  getSalesInvoices: () => query('SELECT * FROM salesInvoices ORDER BY date DESC'),
  addSalesInvoice: (data: any) => execute('INSERT INTO salesInvoices (id, number, date, customerName, itemName, qty, price, total) VALUES (?,?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.customerName, data.itemName, data.qty, data.price, data.total]),

  getPurchaseInvoices: () => query('SELECT * FROM purchaseInvoices ORDER BY date DESC'),
  addPurchaseInvoice: (data: any) => execute('INSERT INTO purchaseInvoices (id, number, date, supplierName, itemName, qty, cost, total) VALUES (?,?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.supplierName, data.itemName, data.qty, data.cost, data.total]),

  // ============ مخازن ============
  getWarehouses: () => query('SELECT * FROM warehouses ORDER BY name'),
  addWarehouse: (data: any) => execute('INSERT INTO warehouses (id, name, location) VALUES (?,?,?)', [data.id, data.name, data.location]),

  // ============ وحدات ============
  getUnits: () => query('SELECT * FROM units ORDER BY name'),
  addUnit: (data: any) => execute('INSERT INTO units (id, name) VALUES (?,?)', [data.id, data.name]),
};
