import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 md:bottom-8 right-6 z-30',
        'w-14 h-14 bg-[#8d07ce] hover:bg-[#7a06b8] text-white',
        'rounded-full shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-200 hover:scale-110',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8d07ce]',
        className
      )}
    >
      <Plus size={24} />
    </button>
  );
}