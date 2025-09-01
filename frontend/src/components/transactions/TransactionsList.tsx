import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useApp } from '../../contexts/AppContext';
import { fetchTransactions, fetchCategories } from '../../utils/apiClient';
import type { Transaction } from '../../types';

interface TransactionsListProps {
  onEditTransaction: (transaction: Transaction) => void;
}

export function TransactionsList({ onEditTransaction }: TransactionsListProps) {
  const { setTransactions } = useApp();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // Store all transactions locally
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]); // Store paginated transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Updated page size to 15
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch all transactions and categories
  useEffect(() => {
    const loadTransactionsWithCategories = async () => {
      try {
        // Request a larger page size to populate global transactions state
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

        setAllTransactions(transactionsWithCategories); // Store all transactions locally
        setTransactions(transactionsWithCategories); // Update global state with all transactions
      } catch (error) {
        console.error('Error loading transactions with categories:', error);
      }
    };

    loadTransactionsWithCategories();
  }, [setTransactions]);

  // Updated to fetch paginated data from the backend
  useEffect(() => {
    const loadPaginatedTransactions = async () => {
      try {
        const response = await fetchTransactions(currentPage, itemsPerPage);
        const { data, pagination } = response;

        setPaginatedTransactions(data);
        setTotalPages(pagination.total_pages);
        setTotalCount(pagination.total_count);
      } catch (error) {
        console.error('Error fetching paginated transactions:', error);
      }
    };

    loadPaginatedTransactions();
  }, [currentPage, itemsPerPage]);

  const handleDelete = (id: string) => {
    setAllTransactions(prev => prev.filter(t => t.id !== id));
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex space-x-2">
            {['all', 'income', 'expense'].map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedType(type as any)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
          
          <Button variant="secondary" size="sm">
            <Filter size={16} className="mr-2" />
            Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Merchant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Type</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <tr 
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(transaction.id)}
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.merchant}
                        </p>
                        {transaction.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTransaction(transaction);
                          }}
                          className="p-1 text-gray-400 hover:text-[#8d07ce] transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(transaction.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedRow === transaction.id ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {expandedRow === transaction.id && (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Notes:</strong> {transaction.notes || 'No notes'}
                          </p>
                          {transaction.receiptUrl && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Receipt:</strong> 
                              <a href="#" className="text-[#8d07ce] hover:underline ml-1">
                                View receipt
                              </a>
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}