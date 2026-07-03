import { create } from "zustand";

type AppState = {
  loading: boolean;
  setLoading: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
