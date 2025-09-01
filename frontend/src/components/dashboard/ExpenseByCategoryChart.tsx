import React from 'react';
import { Card } from '../ui/Card';
import type { CategoryData } from '../../types';
import { formatCurrency } from '../../utils/cn';

interface ExpenseByCategoryChartProps {
  data: CategoryData[];
  onCategoryClick?: (category: string) => void;
}

export function ExpenseByCategoryChart({ data, onCategoryClick }: ExpenseByCategoryChartProps) {
  // Add a fallback for empty data
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Expenses by Category
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  let currentAngle = 0;
  const slices = data.map(item => {
    const percentage = (item.amount / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      startAngle,
      angle,
      percentage
    };
  });

  const createPath = (startAngle: number, angle: number) => {
    const centerX = 50;
    const centerY = 50;
    const radius = 35;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = ((startAngle + angle) * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Expenses by Category
      </h3>
      
      <div className="flex items-center space-x-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {slices.map((slice) => (
              <path
                key={slice.category}
                d={createPath(slice.startAngle, slice.angle)}
                fill={slice.color}
                className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                onClick={() => onCategoryClick?.(slice.category)}
              />
            ))}
            <circle
              cx="50"
              cy="50"
              r="15"
              fill="white"
              className="dark:fill-[#0B1320]"
            />
          </svg>
        </div>
        
        <div className="flex-1 space-y-3">
          {data.slice(0, 4).map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors"
              onClick={() => onCategoryClick?.(item.category)}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.category}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.amount, 'INR', 'en-IN')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}