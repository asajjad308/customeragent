import { useState, useEffect } from 'react';
import { ThemeKey } from '@/lib/themes';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeKey>('aurora');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeKey;
    if (saved) setTheme(saved);
  }, []);

  const changeTheme = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return { theme, changeTheme };
}