import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { ChartDataPoint } from '../../types';

interface GrowthChartProps {
  data: ChartDataPoint[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  const [activeSeries, setActiveSeries] = useState<Set<string>>(new Set(['net', 'income', 'expense']));

  const toggleSeries = (series: string) => {
    const newActive = new Set(activeSeries);
    if (newActive.has(series)) {
      newActive.delete(series);
    } else {
      newActive.add(series);
    }
    setActiveSeries(newActive);
  };

  const maxValue = Math.max(
    ...data.flatMap(d => [
      activeSeries.has('income') ? d.income : 0,
      activeSeries.has('expense') ? d.expense : 0,
      activeSeries.has('net') ? Math.abs(d.net) : 0
    ])
  );

  const getYPosition = (value: number) => {
    return 100 - (Math.abs(value) / maxValue) * 80;
  };

  const createPath = (points: number[], color: string) => {
    if (points.length === 0) return null;
    
    const pathData = points.map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = getYPosition(value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1"
        className="transition-all duration-300"
      />
    );
  };

  const createArea = (points: number[], color: string) => {
    if (points.length === 0) return null;
    
    const pathData = points.map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = getYPosition(value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <path
        d={`${pathData} L 100 100 L 0 100 Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
        className="transition-all duration-300"
      />
    );
  };

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Growth Overview
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'income', label: 'Income', color: '#10b981' },
            { key: 'expense', label: 'Expenses', color: '#ef4444' },
            { key: 'net', label: 'Net', color: '#8d07ce' }
          ].map(({ key, label, color }) => (
            <Button
              key={key}
              variant={activeSeries.has(key) ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => toggleSeries(key)}
              className={activeSeries.has(key) ? '' : `hover:text-[${color}]`}
            >
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: color }} />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="gradient-10b981" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-ef4444" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-8d07ce" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8d07ce" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8d07ce" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {activeSeries.has('income') && createArea(data.map(d => d.income), '#10b981')}
          {activeSeries.has('expense') && createArea(data.map(d => d.expense), '#ef4444')}
          {activeSeries.has('net') && createArea(data.map(d => d.net), '#8d07ce')}
          
          {activeSeries.has('income') && createPath(data.map(d => d.income), '#10b981')}
          {activeSeries.has('expense') && createPath(data.map(d => d.expense), '#ef4444')}
          {activeSeries.has('net') && createPath(data.map(d => d.net), '#8d07ce')}
        </svg>
      </div>
    </Card>
  );
}