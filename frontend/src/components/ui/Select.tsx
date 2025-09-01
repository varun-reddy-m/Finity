import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-[#8d07ce] focus:border-transparent',
            'transition-all duration-200 appearance-none pr-10',
            className
          )}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={20} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
        />
      </div>
    </div>
  );
}