import { execute, query } from '../db/database';

export const AccountingEngine = {
  /**
   * ترحيل فاتورة مبيعات
   * نقدي: مدين الصندوق، دائن المبيعات
   * آجل: مدين العميل، دائن المبيعات
   */
  postSalesInvoice: async (data: {
    type: 'cash' | 'credit',
    cashAccountId: string,
    customerAccountId: string,
    total: number,
    date: string,
    customerName: string,
    invoiceNumber: string
  }) => {
    const isCash = data.type === 'cash';
    const debitAccount = isCash ? data.cashAccountId : data.customerAccountId;
    const description = `فاتورة مبيعات ${data.invoiceNumber} - ${data.customerName}`;
    
    const entryId = 'je-sales-' + Date.now();
    await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)', 
      [entryId, data.invoiceNumber, data.date, description, data.total, data.total]);
    
    // مدين: الصندوق أو العميل
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '1', entryId, debitAccount, data.total, 0, `مدين ${isCash ? 'الصندوق' : 'العميل'}`]);
    
    // دائن: المبيعات
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '2', entryId, '411', 0, data.total, 'دائن المبيعات']);
    
    // تحديث الأرصدة
    await execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [data.total, debitAccount]);
    await execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [data.total, '411']);
    
    return entryId;
  },

  /**
   * ترحيل فاتورة مشتريات
   */
  postPurchaseInvoice: async (data: {
    type: 'cash' | 'credit',
    cashAccountId: string,
    supplierAccountId: string,
    total: number,
    date: string,
    supplierName: string,
    invoiceNumber: string
  }) => {
    const isCash = data.type === 'cash';
    const creditAccount = isCash ? data.cashAccountId : data.supplierAccountId;
    const description = `فاتورة مشتريات ${data.invoiceNumber} - ${data.supplierName}`;
    
    const entryId = 'je-purch-' + Date.now();
    await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)',
      [entryId, data.invoiceNumber, data.date, description, data.total, data.total]);
    
    // مدين: المشتريات
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '1', entryId, '511', data.total, 0, 'مدين المشتريات']);
    
    // دائن: الصندوق أو المورد
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '2', entryId, creditAccount, 0, data.total, `دائن ${isCash ? 'الصندوق' : 'المورد'}`]);
    
    // تحديث الأرصدة
    await execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [data.total, '511']);
    await execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [data.total, creditAccount]);
    
    return entryId;
  },

  /**
   * ترحيل سند قبض
   */
  postReceiptVoucher: async (data: {
    cashAccountId: string,
    accountId: string,
    amount: number,
    date: string,
    description: string,
    voucherNumber: string
  }) => {
    const entryId = 'je-recv-' + Date.now();
    await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)',
      [entryId, data.voucherNumber, data.date, data.description, data.amount, data.amount]);
    
    // مدين: الصندوق
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '1', entryId, data.cashAccountId, data.amount, 0, 'مدين الصندوق']);
    
    // دائن: الحساب
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '2', entryId, data.accountId, 0, data.amount, 'دائن الحساب']);
    
    await execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [data.amount, data.cashAccountId]);
    await execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [data.amount, data.accountId]);
    
    return entryId;
  },

  /**
   * ترحيل سند صرف
   */
  postPaymentVoucher: async (data: {
    cashAccountId: string,
    accountId: string,
    amount: number,
    date: string,
    description: string,
    voucherNumber: string
  }) => {
    const entryId = 'je-pay-' + Date.now();
    await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)',
      [entryId, data.voucherNumber, data.date, data.description, data.amount, data.amount]);
    
    // مدين: الحساب
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '1', entryId, data.accountId, data.amount, 0, 'مدين الحساب']);
    
    // دائن: الصندوق
    await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
      ['ji-' + Date.now() + '2', entryId, data.cashAccountId, 0, data.amount, 'دائن الصندوق']);
    
    await execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [data.amount, data.accountId]);
    await execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [data.amount, data.cashAccountId]);
    
    return entryId;
  },

  /**
   * ترحيل قيد مزدوج عام
   */
  postDoubleEntry: async (data: {
    date: string,
    description: string,
    lines: { accountId: string, debit: number, credit: number, description: string }[]
  }) => {
    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error('القيد غير متوازن! يجب تساوي المدين والدائن');
    }
    
    const entryId = 'je-gen-' + Date.now();
    const number = 'JV-' + Date.now().toString().slice(-6);
    
    await execute('INSERT INTO journal_entries (id, number, date, description, totalDebit, totalCredit) VALUES (?,?,?,?,?,?)',
      [entryId, number, data.date, data.description, totalDebit, totalCredit]);
    
    for (const line of data.lines) {
      if (line.debit === 0 && line.credit === 0) continue;
      await execute('INSERT INTO journal_items (id, entryId, accountId, debit, credit, description) VALUES (?,?,?,?,?,?)',
        ['ji-' + Date.now() + Math.random(), entryId, line.accountId, line.debit, line.credit, line.description]);
      await execute('UPDATE accounts SET balance = balance + ? - ? WHERE id = ?', [line.debit, line.credit, line.accountId]);
    }
    
    return entryId;
  },

  /**
   * الحصول على ميزان المراجعة
   */
  getTrialBalance: async () => {
    const accounts = await query('SELECT * FROM accounts WHERE isActive=1 ORDER BY code');
    const totalDebit = accounts.filter((a: any) => ['أصل','مصروف'].includes(a.type)).reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalCredit = accounts.filter((a: any) => ['خصم','ملكية','إيراد'].includes(a.type)).reduce((s: number, a: any) => s + (a.balance || 0), 0);
    return { accounts, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  },

  /**
   * إقفال الفترة المالية
   */
  closePeriod: async (date: string) => {
    // ترحيل صافي الإيرادات إلى الأرباح المحتجزة
    const revenues = await query("SELECT * FROM accounts WHERE type='إيراد' AND isActive=1");
    const expenses = await query("SELECT * FROM accounts WHERE type='مصروف' AND isActive=1");
    
    const totalRevenue = revenues.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalExpense = expenses.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const netIncome = totalRevenue - totalExpense;
    
    if (netIncome !== 0) {
      await AccountingEngine.postDoubleEntry({
        date,
        description: 'إقفال الفترة - ترحيل صافي الدخل',
        lines: [
          { accountId: '41', debit: totalRevenue, credit: 0, description: 'إقفال الإيرادات' },
          { accountId: '51', debit: 0, credit: totalExpense, description: 'إقفال المصروفات' },
          { accountId: '321', debit: netIncome < 0 ? Math.abs(netIncome) : 0, credit: netIncome > 0 ? netIncome : 0, description: 'صافي الدخل' },
        ]
      });
    }
    
    return { totalRevenue, totalExpense, netIncome };
  },
};
