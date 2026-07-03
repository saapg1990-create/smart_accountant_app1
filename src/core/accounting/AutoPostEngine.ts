import { JournalEngine } from "./JournalEngine";

export const AutoPostEngine = {
  postSalesInvoice: async (cashAccountId: number, revenueAccountId: number, taxAccountId: number, total: number, tax: number, date: string, customer: string) => {
    return await JournalEngine.createEntry(date, `فاتورة مبيعات - ${customer}`, [
      { accountId: cashAccountId, debit: total, credit: 0 },
      { accountId: revenueAccountId, debit: 0, credit: total - tax },
      { accountId: taxAccountId, debit: 0, credit: tax },
    ]);
  },

  postPurchaseInvoice: async (expenseAccountId: number, cashAccountId: number, total: number, date: string, supplier: string) => {
    return await JournalEngine.createEntry(date, `فاتورة مشتريات - ${supplier}`, [
      { accountId: expenseAccountId, debit: total, credit: 0 },
      { accountId: cashAccountId, debit: 0, credit: total },
    ]);
  },

  postReceipt: async (cashAccountId: number, accountId: number, amount: number, date: string, description: string) => {
    return await JournalEngine.createEntry(date, `سند قبض - ${description}`, [
      { accountId: cashAccountId, debit: amount, credit: 0 },
      { accountId: accountId, debit: 0, credit: amount },
    ]);
  },

  postPayment: async (cashAccountId: number, accountId: number, amount: number, date: string, description: string) => {
    return await JournalEngine.createEntry(date, `سند صرف - ${description}`, [
      { accountId: accountId, debit: amount, credit: 0 },
      { accountId: cashAccountId, debit: 0, credit: amount },
    ]);
  },
};
