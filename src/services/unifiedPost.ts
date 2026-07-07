import { accounting } from './accountingEngine';

/**
 * 🎯 الدالة الموحدة لجميع شاشات التطبيق
 * 
 * @param screen اسم الشاشة
 * @param formData بيانات النموذج
 * @returns نتيجة العملية
 * 
 *使用方法: 
 * import { unifiedPost } from '../../src/services/unifiedPost';
 * const result = await unifiedPost('salesInvoice', formData);
 */

export const unifiedPost = async (screen: string, formData: any) => {
  const data = {
    date: formData.date || new Date().toISOString().split('T')[0],
    description: formData.description || formData.notes || '',
    number: formData.number || '',
    paid: parseFloat(formData.paid) || 0,
    total: parseFloat(formData.total) || 0,
    currency: formData.currency || 'YER',
    exchangeRate: parseFloat(formData.exchangeRate) || 1,
  };

  switch (screen) {
    // 📊 المبيعات
    case 'salesInvoice':
      if (formData.invoiceType === 'cash' || formData.type === 'cash')
        return accounting.salesCash(data, formData.cashId, formData.cashName, data.total, data.currency, data.exchangeRate);
      else
        return accounting.salesCredit(data, formData.customerId, formData.customerName, data.total, data.currency, data.exchangeRate);

    // 📦 المشتريات
    case 'purchaseInvoice':
      if (formData.invoiceType === 'cash' || formData.type === 'cash')
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
    case 'voucherReceipt':
      if (formData.voucherType === 'cash')
        return accounting.receiptCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);
      else if (formData.voucherType === 'bank')
        return accounting.receiptCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);
      else
        return accounting.receiptCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);

    // 💸 سند صرف
    case 'paymentVoucher':
    case 'voucherPayment':
      return accounting.paymentCash(data, formData.sourceId, formData.sourceName, formData.accountId, formData.accountName, data.total);

    // 📦 صرف مخزون
    case 'inventoryIssue':
      return accounting.inventoryOut(data, formData.itemId || '115', formData.itemName || 'المخزون', '514', 'مصاريف تشغيلية', data.total);

    // 📥 توريد مخزون
    case 'inventoryReceipt':
      return accounting.inventoryIn(data, formData.itemId || '115', formData.itemName || 'المخزون', '514', 'مصاريف تشغيلية', data.total);

    // 📝 قيد يومية
    case 'journalEntry':
      return accounting.paymentCash(data, formData.debitAccountId, formData.debitAccountName, formData.creditAccountId, formData.creditAccountName, data.total);

    default:
      return { success: false, error: `شاشة غير معروفة: ${screen}` };
  }
};

export default unifiedPost;
