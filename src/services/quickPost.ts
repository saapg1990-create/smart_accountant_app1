import { injectJournalEntryWithCurrency } from './accountingService';

export const quickPost = async (
  type: string,
  date: string,
  number: string,
  partyName: string,
  amount: number,
  debitAccountId: string,
  creditAccountId: string,
  currency: string = 'YER',
  exchangeRate: number = 1
) => {
  const descriptions: Record<string, string> = {
    'Sales': `فاتورة مبيعات ${number} - ${partyName}`,
    'Purchase': `فاتورة مشتريات ${number} - ${partyName}`,
    'SalesReturn': `مردود مبيعات ${number} - ${partyName}`,
    'PurchaseReturn': `مردود مشتريات ${number} - ${partyName}`,
    'CashReceipt': `سند قبض ${number} - ${partyName}`,
    'CashPayment': `سند صرف ${number} - ${partyName}`,
    'InventoryOut': `صرف مخزون ${number}`,
    'InventoryIn': `توريد مخزون ${number}`,
  };

  const description = descriptions[type] || `${type} ${number} - ${partyName}`;
  return await injectJournalEntryWithCurrency(
    type, date, description, debitAccountId, creditAccountId, amount, currency, exchangeRate
  );
};
