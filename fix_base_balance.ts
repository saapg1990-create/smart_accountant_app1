import * as SQLite from 'expo-sqlite';

const fix = async () => {
  const db = await SQLite.openDatabaseAsync('accounting.db');
  try {
    await db.execAsync('ALTER TABLE accounts ADD COLUMN base_balance REAL DEFAULT 0');
    console.log('✅ base_balance added');
  } catch (e: any) {
    if (e.message.includes('duplicate')) console.log('⏭️ already exists');
  }
  try {
    await db.execAsync('ALTER TABLE accounts ADD COLUMN exchange_rate REAL DEFAULT 1');
    console.log('✅ exchange_rate added');
  } catch (e: any) {
    if (e.message.includes('duplicate')) console.log('⏭️ already exists');
  }
};

fix();
