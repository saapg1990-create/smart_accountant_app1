import { query } from "./index";

export const initDB = async () => {
  await query(`CREATE TABLE IF NOT EXISTS brands (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
  await query(`CREATE TABLE IF NOT EXISTS reps (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
  await query(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, type TEXT, balance REAL)`);
};
