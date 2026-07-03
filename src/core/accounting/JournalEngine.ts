import { query } from "../../db";

export const JournalEngine = {
  createEntry: async (date: string, description: string, lines: { accountId: number; debit: number; credit: number }[]) => {
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) throw new Error("القيد غير متوازن");
    
    const entry: any = await query("INSERT INTO journal_entries (date, description, totalDebit, totalCredit) VALUES (?, ?, ?, ?)", [date, description, totalDebit, totalCredit]);
    const entryId = entry.insertId;
    
    for (const line of lines) {
      await query("INSERT INTO journal_items (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)", [entryId, line.accountId, line.debit, line.credit]);
      await query("UPDATE accounts SET balance = balance + ? - ? WHERE id = ?", [line.debit, line.credit, line.accountId]);
    }
    return entryId;
  },

  getEntries: async () => await query("SELECT * FROM journal_entries ORDER BY date DESC"),
  getEntryLines: async (entryId: number) => await query("SELECT * FROM journal_items WHERE entryId = ?", [entryId]),
};
