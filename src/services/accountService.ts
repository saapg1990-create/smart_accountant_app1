import { query } from "../db";

export const AccountService = {
  createAccount: async (name: string, type: string) => {
    return await query("INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)", [name, type, 0]);
  },
  getAccounts: async () => {
    return await query("SELECT * FROM accounts");
  }
};
