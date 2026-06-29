import { useState, useEffect } from 'react';

let currentLang: 'ar' | 'en' = 'ar';
let listeners: Function[] = [];

export function useTranslation() {
  const [lang, setLang] = useState(currentLang);

  useEffect(() => {
    const fn = (l: string) => setLang(l as 'ar' | 'en');
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);

  const changeLanguage = (l: 'ar' | 'en') => {
    currentLang = l;
    listeners.forEach(fn => fn(l));
  };

  return { lang, changeLanguage };
}
