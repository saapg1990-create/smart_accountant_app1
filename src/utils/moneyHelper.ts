// دوال المساعدة المالية بدقة خانتين عشريتين

export const roundYER = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

export const formatYER = (amount: number): string => {
  return roundYER(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseAmount = (value: string): number => {
  return roundYER(parseFloat(value) || 0);
};

export const calculateTax = (subtotal: number, rate: number = 0.05): number => {
  return roundYER(subtotal * rate);
};

export const calculateTotal = (subtotal: number, discount: number = 0, taxRate: number = 0.05): number => {
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount, taxRate);
  return roundYER(afterDiscount + tax);
};
