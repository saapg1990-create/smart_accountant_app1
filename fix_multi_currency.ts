import * as SQLite from 'expo-sqlite';

const fix = async () => {
  const db = await SQLite.openDatabaseAsync('accounting.db');
  
  try {
    await db.execAsync('ALTER TABLE accounts ADD COLUMN base_balance REAL DEFAULT 0');
    console.log('✅ base_balance');
  } catch (e) {}

  try {
    await db.execAsync('ALTER TABLE accounts ADD COLUMN exchange_rate REAL DEFAULT 1');
    console.log('✅ exchange_rate');
  } catch (e) {}

  // تحديث الأرصدة الحالية
  await db.execAsync("UPDATE accounts SET base_balance = balance WHERE currency = 'YER'");
  console.log('✅ تم تحديث الأرصدة');
};

fix();
