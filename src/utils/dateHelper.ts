// تنسيق التاريخ حسب ISO-8601
export const toISODate = (date?: Date): string => {
  return (date || new Date()).toISOString().split('T')[0]; // YYYY-MM-DD
};

export const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`; // للعرض فقط
};

export const today = (): string => toISODate();
