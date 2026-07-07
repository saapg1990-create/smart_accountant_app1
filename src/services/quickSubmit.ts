import { injectCurrencyEntry } from './currencyEngine';

/**
 * واجهة موحدة لجميع العمليات مع دعم العملات
 */
export const submitOperation = {
  // فاتورة مبيعات
  salesInvoice: async (data: {
    date: string; number: string; customerName: string;
    total: number; currency: string; exchangeRate: number;
    cashId?: string; cashName?: string;
    customerId?: string;
    isCash: boolean;
  }) => {
    const debitId = data.isCash ? data.cashId! : data.customerId!;
    const debitName = data.isCash ? data.cashName! : data.customerName;
    
    return injectCurrencyEntry({
      type: 'Sales',
      date: data.date,
      description: `فاتورة مبيعات ${data.number} - ${debitName}`,
      debitAccountId: debitId,
      debitAccountName: debitName,
      creditAccountId: '411',
      creditAccountName: 'المبيعات',
      amountForeign: data.total,
      currencyCode: data.currency,
      exchangeRate: data.exchangeRate,
    });
  },

  // فاتورة مشتريات
  purchaseInvoice: async (data: {
    date: string; number: string; supplierName: string;
    total: number; currency: string; exchangeRate: number;
    cashId?: string; cashName?: string;
    supplierId?: string;
    isCash: boolean;
  }) => {
    const creditId = data.isCash ? data.cashId! : data.supplierId!;
    const creditName = data.isCash ? data.cashName! : data.supplierName;
    
    return injectCurrencyEntry({
      type: 'Purchase',
      date: data.date,
      description: `فاتورة مشتريات ${data.number} - ${creditName}`,
      debitAccountId: '511',
      debitAccountName: 'المشتريات',
      creditAccountId: creditId,
      creditAccountName: creditName,
      amountForeign: data.total,
      currencyCode: data.currency,
      exchangeRate: data.exchangeRate,
    });
  },
};

export default submitOperation;
