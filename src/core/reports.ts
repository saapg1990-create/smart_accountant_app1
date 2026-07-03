import { db } from "./db";
export const Reports = {
  trialBalance: async () => db.getAllAsync(`SELECT account, SUM(debit) as debit, SUM(credit) as credit FROM journal GROUP BY account`),
  incomeStatement: async () => db.getAllAsync(`SELECT * FROM accounts WHERE type IN ('إيراد','مصروف')`),
  balanceSheet: async () => db.getAllAsync(`SELECT * FROM accounts WHERE type IN ('أصل','خصم','ملكية')`),
};
