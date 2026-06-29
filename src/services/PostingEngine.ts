import LocalStore from '../../hooks/useLocalStore';

// ثوابت الحسابات
export const DEFAULT_ACCOUNTS = {
  SALES: 'المبيعات',
  PURCHASES: 'المشتريات',
  CASH: 'الصندوق',
  BANK: 'البنوك',
  CUSTOMERS: 'العملاء',
  SUPPLIERS: 'الموردين',
  INVENTORY: 'المخزون',
  COGS: 'تكلفة البضاعة المباعة',
  TAX_PAYABLE: 'الضرائب المستحقة',
};

const store = LocalStore.getInstance();

export class PostingEngine {
  
  // البحث عن حساب بالاسم
  static async findAccountByName(name: string): Promise<any> {
    const accounts = await store.getAll('accounts');
    return accounts.find((a: any) => a.name === name) || null;
  }

  // البحث عن الحسابات الفرعية فقط (Leaf Accounts)
  static async getLeafAccounts(parentName: string): Promise<any[]> {
    const accounts = await store.getAll('accounts');
    const parent = accounts.find((a: any) => a.name === parentName && !a.parentId);
    if (!parent) return [];
    return accounts.filter((a: any) => a.parentId === parent.id);
  }

  // الحصول على حسابات الأصول المتداولة (للصناديق والبنوك)
  static async getCashAccounts(): Promise<any[]> {
    const accounts = await store.getAll('accounts');
    const cashParent = accounts.find((a: any) => a.name === DEFAULT_ACCOUNTS.CASH);
    const bankParent = accounts.find((a: any) => a.name === DEFAULT_ACCOUNTS.BANK);
    const cashSubs = cashParent ? accounts.filter((a: any) => a.parentId === cashParent.id) : [];
    const bankSubs = bankParent ? accounts.filter((a: any) => a.parentId === bankParent.id) : [];
    return [...cashSubs, ...bankSubs];
  }

  // التحقق من أن الحساب هو حساب ترحيل (فرعي)
  static isLeafAccount(account: any): boolean {
    return !!account.parentId; // الحساب الفرعي فقط
  }

  // تنفيذ الترحيل المحاسبي
  static async postTransaction(params: {
    date: string;
    description: string;
    refNumber: string;
    refType: string;
    lines: Array<{ accountId: string; accountName: string; debit: number; credit: number }>;
    userId?: string;
  }): Promise<boolean> {
    try {
      // 1. التحقق من التوازن
      const totalDebit = params.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = params.lines.reduce((s, l) => s + l.credit, 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        console.error('❌ القيد غير متوازن');
        return false;
      }

      // 2. التحقق من أن جميع الحسابات فرعية
      const accounts = await store.getAll('accounts');
      for (const line of params.lines) {
        const account = accounts.find((a: any) => a.id === line.accountId || a.name === line.accountName);
        if (account && !account.parentId) {
          console.error(`❌ الحساب "${line.accountName}" حساب رئيسي - لا يمكن الترحيل عليه`);
          return false;
        }
      }

      // 3. إنشاء قيد اليومية
      const journalEntry = {
        number: `JV-${Date.now().toString(36)}`,
        date: params.date,
        description: params.description,
        descriptionAr: params.description,
        totalDebit,
        totalCredit,
        isRecurring: false,
        refType: params.refType,
        refId: params.refNumber,
        lines: params.lines,
        userId: params.userId || 'system',
        timestamp: new Date().toISOString(),
      };

      await store.add('journalEntries', journalEntry);

      // 4. تحديث الأرصدة
      for (const line of params.lines) {
        const account = accounts.find((a: any) => a.id === line.accountId || a.name === line.accountName);
        if (account) {
          const delta = line.debit - line.credit;
          await store.update('accounts', account.id, {
            balance: (account.balance || 0) + delta,
          });
        }
      }

      console.log('✅ تم الترحيل بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل الترحيل:', error);
      return false;
    }
  }
}
