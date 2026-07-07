import * as SQLite from 'expo-sqlite';
let db: any = null;
export const getDatabase = async () => {
  if (!db) db = await SQLite.openDatabaseAsync('accounting.db');
  return db;
};
export default { getDatabase };
