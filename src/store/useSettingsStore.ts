import { create } from 'zustand';
import { AppSettings, defaultSettings } from '../../constants/DefaultSettings';
interface SettingsStore { settings: AppSettings; loadSettings: () => void; updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void; resetSettings: () => void; }
export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: { ...defaultSettings },
  loadSettings: () => set({ settings: { ...defaultSettings } }),
  updateSetting: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } })),
  resetSettings: () => set({ settings: { ...defaultSettings } }),
}));
