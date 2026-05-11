'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface QuickChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
  disabled?: boolean;
}

export function QuickChips({ chips, onSelect, disabled }: QuickChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 p-4 overflow-x-auto flex-nowrap md:flex-wrap scrollbar-none"
    >
      {chips.map((chip, index) => (
        <motion.div
          key={chip}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(chip)}
            disabled={disabled}
            className="rounded-full"
          >
            {chip}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}