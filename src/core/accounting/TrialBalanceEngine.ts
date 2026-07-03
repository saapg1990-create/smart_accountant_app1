import { query } from "../../db";

export const TrialBalanceEngine = {
  getTrialBalance: async () => {
    const accounts: any = await query("SELECT * FROM accounts ORDER BY code");
    const rows = accounts.rows?._array || [];
    const totalDebit = rows.filter((a: any) => ['أصل','مصروف'].includes(a.type)).reduce((s: number, a: any) => s + (a.balance || 0), 0);
    const totalCredit = rows.filter((a: any) => ['خصم','إيراد','ملكية'].includes(a.type)).reduce((s: number, a: any) => s + (a.balance || 0), 0);
    return { accounts: rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  },
};
