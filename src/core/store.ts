import { create } from "zustand";
type Account = { id: number; name: string; type: string; balance: number; parentId?: number; };
type State = { accounts: Account[]; setAccounts: (data: Account[]) => void; };
export const useAppStore = create<State>((set) => ({ accounts: [], setAccounts: (data) => set({ accounts: data }) }));
