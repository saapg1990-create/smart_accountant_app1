import * as SQLite from "expo-sqlite";
export const db = SQLite.openDatabaseSync("smart.db");
export const query = async (sql: string, params: any[] = []) => {
  return db.getAllAsync(sql, params);
};
