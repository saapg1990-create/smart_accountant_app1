import { accounting } from './accountingEngine';

/**
 * الدالة الموحدة لجميع شاشات التطبيق
 */
export const unifiedPost = async (screen: string, formData: any) => {
  const data = {
    date: formData.date || new Date().toISOString().split('T')[0],
    description: formData.description || formData.notes || '',
    total: parseFloat(formData.total) || parseFloat(formData.balance) || 0,
    currency: formData.currency || 'YER',
    exchangeRate: parseFloat(formData.exchangeRate) || 1,
    paid: parseFloat(formData.paid) || 0,
  };

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

    // 🔄 مردود مبيعات
    case 'salesReturn':
      return accounting.salesReturn(data, formData.customerId, formData.customerName, data.total);

    // 🔄 مردود مشتريات
    case 'purchaseReturn':
      return accounting.purchaseReturn(data, formData.supplierId, formData.supplierName, data.total);

    // 💰 سند قبض
    case 'receiptVoucher':
      return accounting.receiptCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);

    // 💸 سند صرف
    case 'paymentVoucher':
      return accounting.paymentCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);

    // 📦 صرف مخزون
    case 'inventoryIssue':
      return accounting.inventoryOut(data, formData.debitAccountId || '514', formData.debitAccountName || 'مصاريف', formData.creditAccountId || '115', formData.creditAccountName || 'مخزون', data.total);

    // 📥 توريد مخزون
    case 'inventoryReceipt':
      return accounting.inventoryIn(data, formData.debitAccountId || '115', formData.debitAccountName || 'مخزون', formData.creditAccountId || '514', formData.creditAccountName || 'مصاريف', data.total);

    // 🚚 تحويل مخازن
    case 'warehouseTransfer':
      return { success: true, number: 'TR-' + Date.now().toString(36), message: 'تم التحويل' };

    // 💵 رصيد افتتاحي صندوق
    case 'cashBox':
      return accounting.salesCash({ ...data, description: `رصيد افتتاحي صندوق: ${formData.name}` }, formData.id || '111', formData.name, data.total, data.currency, data.exchangeRate);

    // 🏦 رصيد افتتاحي بنك
    case 'bank':
      return accounting.salesCash({ ...data, description: `رصيد افتتاحي بنك: ${formData.name}` }, formData.id || '112', formData.name, data.total, data.currency, data.exchangeRate);

    // 📱 رصيد افتتاحي محفظة
    case 'ewallet':
      return accounting.salesCash({ ...data, description: `رصيد افتتاحي محفظة: ${formData.name}` }, formData.id || '113', formData.name, data.total, data.currency, data.exchangeRate);

    // 👥 رصيد افتتاحي عميل
    case 'customer':
      return accounting.salesCredit({ ...data, description: `رصيد افتتاحي عميل: ${formData.name}` }, formData.id || '114', formData.name, data.total, data.currency, data.exchangeRate);

    // 🏭 رصيد افتتاحي مورد
    case 'supplier':
      return accounting.purchaseCredit({ ...data, description: `رصيد افتتاحي مورد: ${formData.name}` }, formData.id || '211', formData.name, data.total, data.currency, data.exchangeRate);

    // 📝 قيد يومية
    case 'journalEntry':
      return accounting.paymentCash(data, formData.debitAccountId, formData.debitAccountName, formData.creditAccountId, formData.creditAccountName, data.total);

    default:
      return { success: false, error: `شاشة غير معروفة: ${screen}` };
  }
};

export default unifiedPost;
