import { useMemo } from 'react';
import type { KPI, ChartDataPoint, CategoryData } from '../types';
import { useApp } from '../contexts/AppContext';

export function useFinanceData() {
  const { transactions, timeRange } = useApp();

  const kpis = useMemo((): KPI[] => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    const topCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const topCategoryName = Object.keys(topCategory).length > 0 
      ? Object.keys(topCategory).reduce((a, b) => topCategory[a] > topCategory[b] ? a : b)
      : 'None';

    return [
      {
        label: 'Balance',
        value: balance,
        change: 12.5,
        trend: balance > 0 ? 'up' : 'down'
      },
      {
        label: `Income (${timeRange})`,
        value: income,
        change: 8.2,
        trend: 'up'
      },
      {
        label: `Expenses (${timeRange})`,
        value: expenses,
        change: -3.1,
        trend: 'down'
      },
      {
        label: 'Top Category',
        value: topCategory[topCategoryName] || 0,
        change: 15.7,
        trend: 'up'
      }
    ];
  }, [transactions, timeRange]);

  const chartData = useMemo((): ChartDataPoint[] => {
    // Generate sample chart data based on timeRange
    const points = timeRange === 'weekly' ? 7 : timeRange === 'monthly' ? 30 : 12;
    const data: ChartDataPoint[] = [];
    
    for (let i = 0; i < points; i++) {
      const date = new Date();
      if (timeRange === 'weekly') {
        date.setDate(date.getDate() - (6 - i));
      } else if (timeRange === 'monthly') {
        date.setDate(date.getDate() - (29 - i));
      } else {
        date.setMonth(date.getMonth() - (11 - i));
      }
      
      const income = Math.random() * 5000 + 1000;
      const expense = Math.random() * 4000 + 500;
      
      data.push({
        date: date.toISOString().split('T')[0],
        income,
        expense,
        net: income - expense
      });
    }
    
    return data;
  }, [timeRange]);

  const categoryData = useMemo((): CategoryData[] => {
    const categories = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    const colors = ['#8d07ce', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return Object.entries(categories)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: (amount / total) * 100,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const insights = useMemo(() => {
    const monthlyForecast = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) * 0.2; // Example logic

    const largestMerchant = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.merchant] = (acc[t.merchant] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const largestMerchantName = Object.keys(largestMerchant).length > 0
      ? Object.keys(largestMerchant).reduce((a, b) => largestMerchant[a] > largestMerchant[b] ? a : b)
      : 'None';

    return {
      monthlyForecast,
      largestMerchant: {
        name: largestMerchantName,
        amount: largestMerchant[largestMerchantName] || 0
      }
    };
  }, [transactions]);

  return {
    kpis,
    chartData,
    categoryData,
    insights
  };
}