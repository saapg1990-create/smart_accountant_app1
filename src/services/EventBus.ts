// ناقل الأحداث العام - للمراقبة التلقائية
type Listener = (event: string, data?: any) => void;

class EventBus {
  private listeners: Map<string, Listener[]> = new Map();
  private static instance: EventBus;

  static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  // إطلاق حدث
  emit(event: string, data?: any) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(cb => cb(event, data));
  }

  // الاستماع لحدث
  on(event: string, callback: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
    return () => {
      const arr = this.listeners.get(event) || [];
      this.listeners.set(event, arr.filter(cb => cb !== callback));
    };
  }
}

// الأحداث الموحدة
export const EVENTS = {
  DATA_SAVED: 'DATA_SAVED',       // تم حفظ بيانات
  DATA_DELETED: 'DATA_DELETED',   // تم حذف بيانات
  DATA_UPDATED: 'DATA_UPDATED',   // تم تحديث بيانات
  ACCOUNT_ADDED: 'ACCOUNT_ADDED', // تم إضافة حساب
  BALANCE_CHANGED: 'BALANCE_CHANGED', // تغير رصيد
  REFRESH_ALL: 'REFRESH_ALL',     // تحديث كل الشاشات
};

export const eventBus = EventBus.getInstance();
