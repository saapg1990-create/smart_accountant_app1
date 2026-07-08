import * as SQLite from 'expo-sqlite';

const fixDB = async () => {
  const db = await SQLite.openDatabaseAsync('accounting.db');
  try {
    await db.execAsync('ALTER TABLE vouchers ADD COLUMN description TEXT DEFAULT ""');
    console.log('✅ تمت إضافة العمود');
  } catch (e) {
    console.log('العمود موجود مسبقاً');
  }
};
fixDB();
