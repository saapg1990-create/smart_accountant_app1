export interface AppSettings {
  darkMode: boolean; language: 'ar' | 'en'; fontSize: 'small' | 'medium' | 'large';
  allowNegativeStock: boolean; showTransactionNumber: boolean; showTotalBelowAccount: boolean; debtAlert: boolean;
  printHeader: boolean; printDate: boolean; printBalance: boolean; shortFormat: boolean; footerNote: string;
  enablePassword: boolean; password: string;
  autoBackup: boolean; backupFolder: string; googleDriveEnabled: boolean; backupTime: string;
  voiceMode: boolean; showVoiceIcon: boolean; showCurrency: boolean; whatsappShare: boolean;
  sortOrder: 'code' | 'name'; yearEndClosing: boolean;
}
export const defaultSettings: AppSettings = {
  darkMode: true, language: 'ar', fontSize: 'medium', allowNegativeStock: false,
  showTransactionNumber: true, showTotalBelowAccount: true, debtAlert: true,
  printHeader: true, printDate: true, printBalance: true, shortFormat: false, footerNote: '',
  enablePassword: false, password: '1234', autoBackup: false, backupFolder: '',
  googleDriveEnabled: false, backupTime: '23:00', voiceMode: false, showVoiceIcon: true,
  showCurrency: true, whatsappShare: false, sortOrder: 'code', yearEndClosing: false,
};
