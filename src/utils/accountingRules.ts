// القوانين المحاسبية والضرائب اليمنية

export const ACCOUNTING_RULES = {
  // ضريبة المبيعات
  SALES_TAX_RATE: 0.05, // 5%
  
  // أنواع الحسابات
  DEBIT_TYPES: ['أصل', 'مصروف'],
  CREDIT_TYPES: ['خصم', 'إيراد', 'ملكية'],
  
  // أكواد الحسابات الرئيسية
  ACCOUNT_CODES: {
    CASH: '111',        // الصندوق
    BANK: '112',        // البنوك
    EWALLET: '113',     // المحافظ الإلكترونية
    CUSTOMERS: '114',   // العملاء
    INVENTORY: '115',   // المخزون
    SUPPLIERS: '211',   // الموردين
    TAX_PAYABLE: '212', // الضرائب المستحقة
    CAPITAL: '311',     // رأس المال
    SALES: '411',       // المبيعات
    PURCHASES: '511',   // المشتريات
    SALARIES: '512',    // الرواتب
    RENT: '513',        // الإيجارات
    EXPENSES: '514',    // مصاريف تشغيلية
  },
};

// التحقق من توازن القيد
export const validateEntry = (debit: number, credit: number): boolean => {
  return Math.abs(debit - credit) < 0.001;
};

// حساب الضريبة
export const calculateTax = (amount: number, rate: number = ACCOUNTING_RULES.SALES_TAX_RATE): number => {
  return amount * rate;
};

// تحديد إذا كان الحساب مدين أو دائن
export const getAccountNature = (type: string): 'debit' | 'credit' => {
  return ACCOUNTING_RULES.DEBIT_TYPES.includes(type) ? 'debit' : 'credit';
};
