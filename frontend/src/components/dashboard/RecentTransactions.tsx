import { ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Transaction } from '../../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export function RecentTransactions({ transactions, onViewAll }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 3);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Transactions
        </h3>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View all
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {recent.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {transaction.merchant}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' 
                  ? 'text-green-500' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                }).format(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {recent.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No transactions yet — Add your first transaction
          </p>
        </div>
      )}
    </Card>
  );
}