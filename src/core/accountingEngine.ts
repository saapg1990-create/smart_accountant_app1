import { query } from "../db";

export const AccountingEngine = {
  createJournalEntry: async (entry: any) => {
    return await query(
      `INSERT INTO journal_entries (date, description, total) VALUES (?, ?, ?)`,
      [entry.date, entry.description, entry.total]
    );
  },

  postToLedger: async (accountId: number, amount: number) => {
    return await query(
      `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
      [amount, accountId]
    );
  },

  getTrialBalance: async () => {
    return await query(`SELECT * FROM accounts`);
  }
};
