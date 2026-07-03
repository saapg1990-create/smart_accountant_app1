export type Currency = { id: number; code: string; name: string; symbol: string; rate: number; isDefault: boolean; };
export type Customer = { id: number; name: string; phone: string; address: string; currency: string; groupId: number; groupName: string; balance: number; creditLimit: number; };
export type Account = { id: number; name: string; type: string; balance: number; parentId?: number; };
export type JournalEntry = { date: string; account: number; debit: number; credit: number; description: string; };
