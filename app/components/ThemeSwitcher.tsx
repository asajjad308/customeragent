'use client';

import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { themes } from '@/lib/themes';

export function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(themes).map(([key, themeData]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => changeTheme(key as keyof typeof themes)}
            className={theme === key ? 'bg-accent' : ''}
          >
            {themeData.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}