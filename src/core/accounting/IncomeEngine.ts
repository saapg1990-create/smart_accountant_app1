import { query } from "../../db";

export const IncomeEngine = {
  getIncomeStatement: async (from?: string, to?: string) => {
    let sql = "SELECT * FROM accounts WHERE type IN ('إيراد','مصروف')";
    if (from) sql += " AND createdAt >= ?";
    if (to) sql += " AND createdAt <= ?";
    const accounts: any = await query(sql, from && to ? [from, to] : []);
    const rows = accounts.rows?._array || [];
    const revenues = rows.filter((a: any) => a.type === 'إيراد').reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const expenses = rows.filter((a: any) => a.type === 'مصروف').reduce((s: number, a: any) => s + (a.balance || 0), 0);
    return { revenues, expenses, netIncome: revenues - expenses, accounts: rows };
  },
};
