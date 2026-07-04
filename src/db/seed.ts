import { getDatabase } from './database';

export async function seedDefaultData() {
  const db = await getDatabase();
  
  // عملات افتراضية
  const currencies = await db.getAllAsync('SELECT * FROM currencies');
  if (currencies.length === 0) {
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c1','YER','ريال يمني','﷼',1,1]);
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c2','USD','دولار','$',530,0]);
    await db.runAsync("INSERT INTO currencies (id, code, name, symbol, rate, isDefault) VALUES (?,?,?,?,?,?)", ['c3','SAR','ريال سعودي','﷼',141,0]);
  }

  // حسابات رئيسية
  const accounts = await db.getAllAsync("SELECT * FROM accounts WHERE parentId = ''");
  if (accounts.length === 0) {
    const mains = [
      ['1','1','الأصول','أصل',''],['2','2','الخصوم','خصم',''],['3','3','حقوق الملكية','ملكية',''],
      ['4','4','الإيرادات','إيراد',''],['5','5','المصروفات','مصروف',''],
    ];
    for (const m of mains) {
      await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,0)', m);
    }
    
    const subs = [
      ['11','11','الأصول المتداولة','أصل','1'],['12','12','الأصول الثابتة','أصل','1'],
      ['21','21','الخصوم المتداولة','خصم','2'],['31','31','رأس المال','ملكية','3'],
      ['41','41','المبيعات','إيراد','4'],['51','51','المشتريات','مصروف','5'],
    ];
    for (const s of subs) {
      await db.runAsync('INSERT OR IGNORE INTO accounts (id, code, name, type, parentId, balance) VALUES (?,?,?,?,?,0)', s);
    }
  }

  // صندوق افتراضي
  const boxes = await db.getAllAsync('SELECT * FROM cashBoxes');
  if (boxes.length === 0) {
    await db.runAsync('INSERT INTO cashBoxes (id, name, balance) VALUES (?,?,?)', ['cb-1','الصندوق الرئيسي',0]);
  }

  // بنك افتراضي
  const banks = await db.getAllAsync('SELECT * FROM banks');
  if (banks.length === 0) {
    await db.runAsync('INSERT INTO banks (id, name, accountNumber, balance) VALUES (?,?,?,?)', ['b-1','البنك المركزي','123456',0]);
  }

  console.log('✅ تم إضافة البيانات الافتراضية');
}
