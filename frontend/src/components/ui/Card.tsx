import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, clickable = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#0B1320] rounded-2xl shadow-md p-4 transition-all duration-200',
        clickable && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}