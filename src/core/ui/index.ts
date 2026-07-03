export const UI = {
  openAdd: (set: any) => set(true),
  closeAdd: (set: any) => set(false),
  loadData: async (fn: any) => fn(),
  loadAll: async (fn: any) => fn(),
};
