import { db } from "./db";
export const Ledger = {
  get: async (accountId: number) => db.getAllAsync(`SELECT * FROM journal WHERE account = ?`, [accountId]),
  getAll: async () => db.getAllAsync(`SELECT * FROM journal ORDER BY date`),
};
