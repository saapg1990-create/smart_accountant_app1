export const UIController = {
  openAdd: (set: (v: boolean) => void) => set(true),
  closeAdd: (set: (v: boolean) => void) => set(false),
  loadData: async (fn: any) => fn(),
  loadAll: async (fn: any) => fn(),
};
