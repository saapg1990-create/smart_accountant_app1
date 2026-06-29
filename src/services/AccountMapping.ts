// جدول الربط المحاسبي
export const ACCOUNT_MAPPING = {
  // فاتورة مبيعات
  sales_invoice: {
    debitField: 'customerId',       // الحساب المدين = العميل
    creditField: 'salesAccount',    // الحساب الدائن = المبيعات
    defaultCredit: 'المبيعات',      // اسم الحساب الدائن الافتراضي
    filterType: 'customer' as const,
  },
  
  // فاتورة مشتريات
  purchase_invoice: {
    debitField: 'purchasesAccount', // الحساب المدين = المشتريات
    creditField: 'supplierId',      // الحساب الدائن = المورد
    defaultDebit: 'المشتريات',      // اسم الحساب المدين الافتراضي
    filterType: 'supplier' as const,
  },
  
  // سند قبض
  receipt_voucher: {
    debitField: 'cashAccount',      // الحساب المدين = النقدية
    creditField: 'customerAccount', // الحساب الدائن = العميل
    defaultDebit: 'النقدية',        // اسم الحساب المدين الافتراضي
    filterType: 'cash' as const,
  },
  
  // سند صرف
  payment_voucher: {
    debitField: 'expenseAccount',   // الحساب المدين = المصروف
    creditField: 'cashAccount',     // الحساب الدائن = النقدية
    defaultCredit: 'النقدية',       // اسم الحساب الدائن الافتراضي
    filterType: 'cash' as const,
  },
};
