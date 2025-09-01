import { cn } from '../../utils/cn';
import type { TimeRange } from '../../types';

interface RangeSwitchProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  isVisible: boolean;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

export function RangeSwitch({ value, onChange, isVisible }: RangeSwitchProps) {
  if (!isVisible) return null;

  return (
    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 inline-flex">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={cn(
            'relative px-6 py-2 text-sm font-medium rounded-xl transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-[#8d07ce] focus:ring-offset-2',
            value === range.value
              ? 'text-white bg-[#8d07ce] shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}