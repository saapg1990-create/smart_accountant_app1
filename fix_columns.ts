import * as SQLite from 'expo-sqlite';

const fix = async () => {
  const db = await SQLite.openDatabaseAsync('accounting.db');
  const columns = ['bankAccount', 'walletPhone', 'notes', 'isDebit'];
  
  for (const col of columns) {
    try {
      await db.execAsync(`ALTER TABLE accounts ADD COLUMN ${col} TEXT DEFAULT ''`);
      console.log('✅ تم إضافة:', col);
    } catch (e: any) {
      if (e.message.includes('duplicate')) console.log('⏭️ موجود:', col);
    }
  }
};

fix();
