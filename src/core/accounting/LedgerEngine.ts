import { query } from "../../db";

export const LedgerEngine = {
  getAccountLedger: async (accountId: number, from?: string, to?: string) => {
    let sql = `SELECT j.*, je.date, je.description FROM journal_items j JOIN journal_entries je ON j.entryId = je.id WHERE j.accountId = ?`;
    const params: any[] = [accountId];
    if (from) { sql += " AND je.date >= ?"; params.push(from); }
    if (to) { sql += " AND je.date <= ?"; params.push(to); }
    sql += " ORDER BY je.date, je.id";
    return await query(sql, params);
  },

  getGeneralLedger: async () => {
    return await query(`SELECT a.id, a.code, a.name, a.type, a.balance, COUNT(j.id) as transactions FROM accounts a LEFT JOIN journal_items j ON a.id = j.accountId GROUP BY a.id ORDER BY a.code`);
  },
};
