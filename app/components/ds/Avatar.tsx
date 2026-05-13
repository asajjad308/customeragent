'use client';

import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-[12px]',
  lg: 'w-10 h-10 text-[14px]',
  xl: 'w-12 h-12 text-[16px]',
};

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToHue(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const hue = stringToHue(name ?? '0');
  const initials = getInitials(name);

  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full flex-shrink-0 font-semibold select-none overflow-hidden', sizes[size], className)}
      style={!src ? { background: `hsl(${hue} 70% 88%)`, color: `hsl(${hue} 60% 35%)` } : undefined}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
