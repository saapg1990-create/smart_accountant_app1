import { accounting } from './accountingEngine';

export const unifiedPost = async (screen: string, formData: any) => {
  const data = {
    date: formData.date || new Date().toISOString().split('T')[0],
    description: formData.description || formData.notes || '',
    total: parseFloat(formData.total) || parseFloat(formData.balance) || 0,
    currency: formData.currency || 'YER',
    exchangeRate: parseFloat(formData.exchangeRate) || 1,
    paid: parseFloat(formData.paid) || 0,
  };

  // ✅ إذا كان الرصيد دائن، نعكس القيد
  const isDebit = formData.isDebit !== false;

  switch (screen) {
    // 📊 المبيعات
    case 'salesInvoice':
      if (formData.invoiceType === 'cash')
        return accounting.salesCash(data, formData.cashId, formData.cashName, data.total, data.currency, data.exchangeRate);
      else
        return accounting.salesCredit(data, formData.customerId, formData.customerName, data.total, data.currency, data.exchangeRate);

    // 📦 المشتريات
    case 'purchaseInvoice':
      if (formData.invoiceType === 'cash')
        return accounting.purchaseCash(data, formData.cashId, formData.cashName, data.total, data.currency, data.exchangeRate);
      else
        return accounting.purchaseCredit(data, formData.supplierId, formData.supplierName, data.total, data.currency, data.exchangeRate);

    // 💰 سند قبض
    case 'receiptVoucher':
      return accounting.receiptCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);

    // 💸 سند صرف
    case 'paymentVoucher':
      return accounting.paymentCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);

    // 📦 المخزون
    case 'inventoryIssue':
      return accounting.inventoryOut(data, formData.debitAccountId || '514', formData.debitAccountName || 'مصاريف', formData.creditAccountId || '115', formData.creditAccountName || 'مخزون', data.total);
    case 'inventoryReceipt':
      return accounting.inventoryIn(data, formData.debitAccountId || '115', formData.debitAccountName || 'مخزون', formData.creditAccountId || '514', formData.creditAccountName || 'مصاريف', data.total);

    // ✅ رصيد افتتاحي - يراعي مدين/دائن
    case 'cashBox':
    case 'bank':
    case 'ewallet':
    case 'customer':
    case 'supplier':
      const desc = `رصيد افتتاحي ${formData.name}`;
      const accountId = formData.id || formData.cashId || formData.bankId || '';
      const accountName = formData.name || '';
      
      if (isDebit) {
        // مدين: الحساب / دائن: رأس المال
        return accounting.salesCash({ ...data, description: desc }, accountId, accountName, data.total, data.currency, data.exchangeRate);
      } else {
        // دائن: الحساب / مدين: رأس المال
        return accounting.purchaseCash({ ...data, description: desc }, '311', 'رأس المال', data.total, data.currency, data.exchangeRate);
      }

    default:
      return { success: false, error: `شاشة غير معروفة: ${screen}` };
  }
};

export default unifiedPost;
