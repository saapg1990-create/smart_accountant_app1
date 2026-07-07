import LocalStore from '@hooks/useLocalStore';

const DEFAULT_MAIN_ACCOUNTS = [
  { code: '101', name: 'الصندوق', type: 'أصل', currency: 'YER', balance: 0, parentId: '' },
  { code: '102', name: 'البنوك', type: 'أصل', currency: 'YER', balance: 0, parentId: '' },
  { code: '103', name: 'العملاء', type: 'أصل', currency: 'YER', balance: 0, parentId: '' },
  { code: '104', name: 'المخزون', type: 'أصل', currency: 'YER', balance: 0, parentId: '' },
  { code: '105', name: 'الأصول الثابتة', type: 'أصل', currency: 'YER', balance: 0, parentId: '' },
  { code: '201', name: 'الموردين', type: 'خصم', currency: 'YER', balance: 0, parentId: '' },
  { code: '202', name: 'الضرائب المستحقة', type: 'خصم', currency: 'YER', balance: 0, parentId: '' },
  { code: '301', name: 'رأس المال', type: 'ملكية', currency: 'YER', balance: 0, parentId: '' },
  { code: '302', name: 'الأرباح المحتجزة', type: 'ملكية', currency: 'YER', balance: 0, parentId: '' },
  { code: '401', name: 'المبيعات', type: 'إيراد', currency: 'YER', balance: 0, parentId: '' },
  { code: '402', name: 'إيرادات أخرى', type: 'إيراد', currency: 'YER', balance: 0, parentId: '' },
  { code: '501', name: 'المشتريات', type: 'مصروف', currency: 'YER', balance: 0, parentId: '' },
  { code: '502', name: 'المصروفات العامة', type: 'مصروف', currency: 'YER', balance: 0, parentId: '' },
  { code: '503', name: 'الرواتب والأجور', type: 'مصروف', currency: 'YER', balance: 0, parentId: '' },
];

export async function initializeDefaultAccounts() {
  const store = LocalStore.getInstance();
  const existing = await store.getAll('accounts');
  
  if (existing.length === 0) {
    for (const acc of DEFAULT_MAIN_ACCOUNTS) {
      await store.add('accounts', {
        ...acc,
        id: '',
        createdAt: new Date().toISOString(),
      });
    }
    console.log('✅ تم إنشاء الحسابات الرئيسية الافتراضية');
  }
}

export { DEFAULT_MAIN_ACCOUNTS };
