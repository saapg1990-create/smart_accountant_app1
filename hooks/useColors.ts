import { useColorScheme } from 'react-native';
import colors from '../constants/colors';
import { useApp } from '../context/AppContext';

export function useColors() {
  const scheme = useColorScheme();
  let isDark = scheme === 'dark';
  
  try {
    const ctx = useApp();
    if (ctx && typeof ctx.isDark === 'boolean') {
      isDark = ctx.isDark;
    }
  } catch {}
  
  const palette = isDark && 'dark' in colors
    ? (colors as any).dark
    : colors.light;
    
  return { ...palette, radius: colors.radius };
}
