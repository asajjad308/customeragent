'use client';

import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store';
import { themes } from '@/lib/themes';
import type { ThemeKey } from '@/store';

export function ThemeSwitcher() {
  const { theme, updateTheme } = useAppStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Switch theme">
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(themes) as ThemeKey[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => updateTheme(key)}
            className={theme === key ? 'bg-accent' : ''}
          >
            {themes[key].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
