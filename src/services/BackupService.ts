import { getDatabase, query } from '../db/database';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const BackupService = {
  /**
   * إنشاء نسخة احتياطية كاملة
   */
  createBackup: async (): Promise<string> => {
    const db = await getDatabase();
    
    const tables = [
      'accounts', 'customers', 'suppliers', 'items', 'cashBoxes', 'banks',
      'currencies', 'journal_entries', 'journal_items', 'salesInvoices',
      'purchaseInvoices', 'vouchers', 'warehouses', 'units', 'categories', 'brands'
    ];
    
    const backup: any = {
      version: '1.0',
      date: new Date().toISOString(),
      data: {}
    };
    
    for (const table of tables) {
      try {
        const rows = await query(`SELECT * FROM ${table}`);
        backup.data[table] = rows;
      } catch(e) {}
    }
    
    const json = JSON.stringify(backup, null, 2);
    const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
    const path = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
    
    return path;
  },

  /**
   * مشاركة النسخة الاحتياطية
   */
  shareBackup: async () => {
    try {
      const path = await BackupService.createBackup();
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'مشاركة النسخة الاحتياطية',
      });
      Alert.alert('✅', 'تم إنشاء النسخة الاحتياطية ومشاركتها');
    } catch(e) {
      Alert.alert('خطأ', 'فشل إنشاء النسخة الاحتياطية');
    }
  },

  /**
   * استعادة نسخة احتياطية
   */
  restoreBackup: async (jsonData: string) => {
    const db = await getDatabase();
    const backup = JSON.parse(jsonData);
    
    for (const [table, rows] of Object.entries(backup.data)) {
      // حذف البيانات الحالية
      await db.runAsync(`DELETE FROM ${table}`);
      
      // إدخال البيانات المستعادة
      for (const row of rows as any[]) {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const placeholders = keys.map(() => '?').join(',');
        try {
          await db.runAsync(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, values);
        } catch(e) {}
      }
    }
    
    Alert.alert('✅', 'تم استعادة النسخة الاحتياطية بنجاح');
  },

  /**
   * نسخ احتياطي تلقائي (يومي)
   */
  scheduleAutoBackup: async () => {
    const lastBackup = await BackupService.getLastBackupDate();
    const today = new Date().toISOString().split('T')[0];
    
    if (lastBackup !== today) {
      await BackupService.createBackup();
      await BackupService.saveLastBackupDate(today);
    }
  },

  getLastBackupDate: async (): Promise<string | null> => {
    try {
      const result = await query("SELECT value FROM settings WHERE key='lastBackup'");
      return result[0]?.value || null;
    } catch { return null; }
  },

  saveLastBackupDate: async (date: string) => {
    await query("INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackup', ?)", [date]);
  },
};
