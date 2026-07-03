import { query } from "../../db";

export const BalanceSheetEngine = {
  getBalanceSheet: async () => {
    const accounts: any = await query("SELECT * FROM accounts ORDER BY code");
    const rows = accounts.rows?._array || [];
    const assets = rows.filter((a: any) => a.type === 'أصل').reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const liabilities = rows.filter((a: any) => a.type === 'خصم').reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const equity = rows.filter((a: any) => a.type === 'ملكية').reduce((s: number, a: any) => s + (a.balance || 0), 0);
    return { assets, liabilities, equity, balanced: Math.abs(assets - (liabilities + equity)) < 0.01, accounts: rows };
  },
};
