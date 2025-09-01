import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import type { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
  onClick?: () => void;
}

export function KPICard({ kpi, onClick }: KPICardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(kpi.value);
    }, 100);
    return () => clearTimeout(timer);
  }, [kpi.value]);

  // Update formatValue to use INR currency
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <Card clickable={!!onClick} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {kpi.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {formatValue(animatedValue)}
          </p>
          <div className="flex items-center space-x-1">
            <TrendIcon size={16} className={trendColor} />
            <span className={cn('text-sm font-medium', trendColor)}>
              {kpi.change > 0 ? '+' : ''}{kpi.change}%
            </span>
          </div>
        </div>
        <div className="w-16 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="w-12 h-1 bg-[#8d07ce] rounded-full opacity-60" />
        </div>
      </div>
    </Card>
  );
}