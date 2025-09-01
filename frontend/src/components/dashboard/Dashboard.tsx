import { useEffect } from 'react';
import { KPICard } from './KPICard';
import { GrowthChart } from './GrowthChart';
import { ExpenseByCategoryChart } from './ExpenseByCategoryChart';
import { RecentTransactions } from './RecentTransactions';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/cn'; 
import { fetchTransactions, fetchCategories } from '../../utils/apiClient';
import type { Transaction } from '../../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { chartData, categoryData, insights } = useFinanceData(); 
  const { transactions, setTransactions, userCurrency } = useApp(); 

  useEffect(() => {
    const loadTransactionsWithCategories = async () => {
      try {
        const [transactionsResp, categoriesData] = await Promise.all([
          fetchTransactions(1, 100),
          fetchCategories(),
        ]);

        const transactionsData = Array.isArray(transactionsResp?.data) ? transactionsResp.data : transactionsResp;

        const categoriesMap = categoriesData.reduce((map: Record<number, string>, category: { id: number; name: string }) => {
          map[category.id] = category.name;
          return map;
        }, {});

        const transactionsWithCategories = transactionsData.map((transaction: Transaction) => ({
          ...transaction,
          category: transaction.category_id && categoriesMap[transaction.category_id]
            ? categoriesMap[transaction.category_id]
            : 'Unknown',
        }));

        setTransactions(transactionsWithCategories);
      } catch (error) {
        console.error('Error loading transactions with categories:', error);
      }
    };

    loadTransactionsWithCategories();
  }, [setTransactions]);

  // Calculate monthly and total income/expenses
  const monthlyIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => {
      const month = new Date(t.date).getMonth();
      acc[month] = (acc[month] || 0) + t.amount;
      return acc;
    }, {} as Record<number, number>);

  const monthlyExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const month = new Date(t.date).getMonth();
      acc[month] = (acc[month] || 0) + t.amount;
      return acc;
    }, {} as Record<number, number>);

  const averageMonthlyIncome =
    Object.values(monthlyIncome).reduce((sum, value) => sum + value, 0) /
    (Object.keys(monthlyIncome).length || 1);

  const averageMonthlyExpenses =
    Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0) /
    (Object.keys(monthlyExpenses).length || 1);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleCategoryClick = () => {
    onNavigate('transactions');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          kpi={{ label: 'Average Monthly Income', value: averageMonthlyIncome, change: 0, trend: 'neutral' }}
          onClick={() => onNavigate('transactions')}
        />
        <KPICard
          kpi={{ label: 'Average Monthly Expenses', value: averageMonthlyExpenses, change: 0, trend: 'neutral' }}
          onClick={() => onNavigate('transactions')}
        />
        <KPICard
          kpi={{ label: 'Total Income', value: totalIncome, change: 0, trend: 'neutral' }}
          onClick={() => onNavigate('transactions')}
        />
        <KPICard
          kpi={{ label: 'Total Expenses', value: totalExpenses, change: 0, trend: 'neutral' }}
          onClick={() => onNavigate('transactions')}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart data={chartData} />
        <ExpenseByCategoryChart 
          data={categoryData} 
          onCategoryClick={handleCategoryClick}
        />
      </div>

      {/* Recent Transactions and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions 
          transactions={transactions}
          onViewAll={() => onNavigate('transactions')}
        />
        
        {/* Quick Insights */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#8d07ce] to-purple-600 rounded-2xl p-6 text-white">
            <h4 className="font-semibold mb-2">Monthly Forecast</h4>
            <p className="text-2xl font-bold mb-1">
              {formatCurrency(insights.monthlyForecast, 'INR', 'en-IN')} {/* Always show in INR */}
            </p>
            <p className="text-sm opacity-90">Projected savings this month</p>
          </div>
          
          <div className="bg-white dark:bg-[#0B1320] rounded-2xl p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Largest Merchant
            </h4>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {insights.largestMerchant.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(insights.largestMerchant.amount, 'INR', 'en-IN')} this month {/* Always show in INR */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}