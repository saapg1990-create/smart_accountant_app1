import { query } from "../../db";

export const CashFlowEngine = {
  getCashFlow: async () => {
    const entries: any = await query("SELECT * FROM journal_entries ORDER BY date");
    const rows = entries.rows?._array || [];
    const inflows = rows.filter((e: any) => e.description?.includes('قبض') || e.description?.includes('مبيعات')).reduce((s: number, e: any) => s + (e.totalDebit || 0), 0);
    const outflows = rows.filter((e: any) => e.description?.includes('صرف') || e.description?.includes('مشتريات')).reduce((s: number, e: any) => s + (e.totalCredit || 0), 0);
    return { inflows, outflows, netCashFlow: inflows - outflows, entries: rows };
  },
};
