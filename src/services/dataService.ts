import { query, execute } from '../db/database';
import { AccountingEngine } from './AccountingEngine';

export const DataService = {
  // ============ حسابات ============
  getAccounts: () => query('SELECT * FROM accounts WHERE isActive=1 ORDER BY code'),
  addAccount: async (data: any) => {
    const id = data.id || 'acc-' + Date.now();
    await execute('INSERT INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,?)', [id, data.code, data.name, data.type, data.parentId, data.balance||0]);
    if ((data.balance || 0) > 0) {
      const isDebit = ['أصل', 'مصروف'].includes(data.type);
      await AccountingEngine.postDoubleEntry({
        date: new Date().toISOString().split('T')[0],
        description: `رصيد افتتاحي - ${data.name}`,
        lines: [
          { accountId: id, debit: isDebit ? data.balance : 0, credit: !isDebit ? data.balance : 0, description: 'رصيد افتتاحي' },
          { accountId: '31', debit: !isDebit ? data.balance : 0, credit: isDebit ? data.balance : 0, description: 'رأس المال' },
        ]
      });
    }
    return id;
  },
  deleteAccount: (id: string) => execute('DELETE FROM accounts WHERE id=?', [id]),

  // ============ عملاء ============
  getCustomers: () => query('SELECT * FROM customers ORDER BY name'),
  addCustomer: (data: any) => execute('INSERT INTO customers (id, code, name, phone, address, balance, creditLimit) VALUES (?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.phone, data.address, data.balance||0, data.creditLimit||0]),
  deleteCustomer: (id: string) => execute('DELETE FROM customers WHERE id=?', [id]),

  // ============ موردين ============
  getSuppliers: () => query('SELECT * FROM suppliers ORDER BY name'),
  addSupplier: (data: any) => execute('INSERT INTO suppliers (id, code, name, phone, address, balance) VALUES (?,?,?,?,?,?)', [data.id, data.code, data.name, data.phone, data.address, data.balance||0]),

  // ============ أصناف ============
  getItems: () => query('SELECT * FROM items ORDER BY name'),
  addItem: (data: any) => execute('INSERT INTO items (id, code, name, unitName, groupName, brandName, warehouseName, cost, price, quantity) VALUES (?,?,?,?,?,?,?,?,?,?)', [data.id, data.code, data.name, data.unitName, data.groupName, data.brandName, data.warehouseName, data.cost||0, data.price||0, data.quantity||0]),

  // ============ صناديق ============
  getCashBoxes: () => query('SELECT * FROM cashBoxes ORDER BY name'),
  addCashBox: async (data: any) => {
    await execute('INSERT INTO cashBoxes (id, name, balance) VALUES (?,?,?)', [data.id, data.name, data.balance||0]);
    if ((data.balance || 0) > 0) {
      await DataService.addAccount({ id: data.id, code: 'CSH-' + data.id.slice(-4), name: data.name, type: 'أصل', parentId: '11', balance: data.balance||0 });
    }
  },

  // ============ بنوك ============
  getBanks: () => query('SELECT * FROM banks ORDER BY name'),
  addBank: async (data: any) => {
    await execute('INSERT INTO banks (id, name, accountNumber, balance) VALUES (?,?,?,?)', [data.id, data.name, data.accountNumber, data.balance||0]);
    if ((data.balance || 0) > 0) {
      await DataService.addAccount({ id: data.id, code: 'BNK-' + data.id.slice(-4), name: data.name, type: 'أصل', parentId: '11', balance: data.balance||0 });
    }
  },

  // ============ محافظ ============
  getEwallets: () => query('SELECT * FROM ewallets ORDER BY name'),
  addEwallet: async (data: any) => {
    await execute('INSERT INTO ewallets (id, name, phone, balance) VALUES (?,?,?,?)', [data.id, data.name, data.phone, data.balance||0]);
    if ((data.balance || 0) > 0) {
      await DataService.addAccount({ id: data.id, code: 'EWL-' + data.id.slice(-4), name: data.name, type: 'أصل', parentId: '11', balance: data.balance||0 });
    }
  },

  // ============ عملات ============
  getCurrencies: () => query('SELECT * FROM currencies ORDER BY code'),
  addCurrency: (data: any) => execute('INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)', [data.id, data.code, data.name, data.symbol, data.rate||1, data.isDefault||0]),

  // ============ علامات ============
  getBrands: () => query('SELECT * FROM brands ORDER BY name'),
  addBrand: (data: any) => execute('INSERT INTO brands (id, name) VALUES (?,?)', [data.id, data.name]),
  
  // ============ مجموعات ============
  getGroups: () => query('SELECT * FROM categories ORDER BY name'),
  addGroup: (data: any) => execute('INSERT INTO categories (id, name) VALUES (?,?)', [data.id, data.name]),
  
  // ============ مندوبين ============
  getReps: () => query('SELECT * FROM salesReps ORDER BY name'),
  addRep: (data: any) => execute('INSERT INTO salesReps (id, name, phone) VALUES (?,?,?)', [data.id, data.name, data.phone]),

  // ============ سندات مع ترحيل ============
  getVouchers: () => query('SELECT * FROM vouchers ORDER BY date DESC'),
  addVoucher: async (data: any) => {
    await execute('INSERT INTO vouchers (id, number, date, description, amount, sourceName, accountName, type) VALUES (?,?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.description, data.amount, data.sourceName, data.accountName, data.type || 'receipt']);
    // ✅ ترحيل محاسبي تلقائي
    const isReceipt = data.type !== 'payment';
    await AccountingEngine.postDoubleEntry({
      date: data.date,
      description: `${isReceipt ? 'سند قبض' : 'سند صرف'} - ${data.description}`,
      lines: [
        { accountId: '111', debit: isReceipt ? data.amount : 0, credit: !isReceipt ? data.amount : 0, description: isReceipt ? 'مدين الصندوق' : 'دائن الصندوق' },
        { accountId: data.accountId || '411', debit: !isReceipt ? data.amount : 0, credit: isReceipt ? data.amount : 0, description: isReceipt ? 'دائن الحساب' : 'مدين الحساب' },
      ]
    });
  },

  // ============ قيود ============
  getJournalEntries: () => query('SELECT * FROM journal_entries ORDER BY date DESC'),
  addJournalEntry: async (data: any) => {
    await AccountingEngine.postDoubleEntry({
      date: data.date,
      description: data.description,
      lines: [
        { accountId: data.debitAccount || '111', debit: data.amount || 0, credit: 0, description: 'مدين' },
        { accountId: data.creditAccount || '411', debit: 0, credit: data.amount || 0, description: 'دائن' },
      ]
    });
  },

  // ============ فاتورة مبيعات مع ترحيل ============
  getSalesInvoices: () => query('SELECT * FROM salesInvoices ORDER BY date DESC'),
  addSalesInvoice: async (data: any) => {
    await execute('INSERT INTO salesInvoices (id, number, date, customerName, total, paid, remaining) VALUES (?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.sourceName, data.amount, data.amount, 0]);
    // ✅ ترحيل تلقائي
    await AccountingEngine.postSalesInvoice({
      type: 'cash',
      cashAccountId: '111',
      customerAccountId: '114',
      total: data.amount,
      date: data.date,
      customerName: data.sourceName,
      invoiceNumber: data.number
    });
  },

  // ============ فاتورة مشتريات مع ترحيل ============
  getPurchaseInvoices: () => query('SELECT * FROM purchaseInvoices ORDER BY date DESC'),
  addPurchaseInvoice: async (data: any) => {
    await execute('INSERT INTO purchaseInvoices (id, number, date, supplierName, total, paid, remaining) VALUES (?,?,?,?,?,?,?)', [data.id, data.number, data.date, data.sourceName, data.amount, data.amount, 0]);
    await AccountingEngine.postPurchaseInvoice({
      type: 'cash',
      cashAccountId: '111',
      supplierAccountId: '211',
      total: data.amount,
      date: data.date,
      supplierName: data.sourceName,
      invoiceNumber: data.number
    });
  },

  // ============ مردودات ============
  getSalesReturns: () => query('SELECT * FROM salesReturns ORDER BY date DESC'),
  addSalesReturn: (data: any) => execute('INSERT INTO salesReturns (id, number, date, description, amount) VALUES (?,?,?,?,?)', [data.id, data.number, data.date, data.description, data.amount]),
  getPurchaseReturns: () => query('SELECT * FROM purchaseReturns ORDER BY date DESC'),
  addPurchaseReturn: (data: any) => execute('INSERT INTO purchaseReturns (id, number, date, description, amount) VALUES (?,?,?,?,?)', [data.id, data.number, data.date, data.description, data.amount]),
};
