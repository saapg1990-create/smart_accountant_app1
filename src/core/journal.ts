import { db } from "./db";
export const Journal = {
  post: async (entry: { date: string; account: number; debit: number; credit: number; description: string }) => {
    return db.runAsync(`INSERT INTO journal(date, account, debit, credit, description) VALUES (?, ?, ?, ?, ?)`, [entry.date, entry.account, entry.debit, entry.credit, entry.description]);
  },
  getAll: async () => db.getAllAsync(`SELECT * FROM journal ORDER BY date DESC`),
};
