import React, { createContext, useContext, useState } from 'react';
import type { TimeRange, Transaction, Receipt } from '../types';

interface AppContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  userCurrency: string;
  setUserCurrency: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([
    {
      id: '1',
      filename: 'grocery_receipt_01.jpg',
      uploadDate: '2025-01-14',
      status: 'ready',
      extractedItems: [
        {
          id: 'extracted-1',
          date: '2025-01-14',
          amount: 89.99,
          type: 'expense',
          category: 'Groceries',
          merchant: 'Whole Foods',
          notes: 'Organic vegetables, milk, bread'
        }
      ]
    },
    {
      id: '2',
      filename: 'restaurant_bill.pdf',
      uploadDate: '2025-01-13',
      status: 'parsing'
    }
  ]);
  const [userCurrency, setUserCurrency] = useState<string>(
    localStorage.getItem('userCurrency') || 'INR'
  );

  // Persist userCurrency to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('userCurrency', userCurrency);
  }, [userCurrency]);

  return (
    <AppContext.Provider value={{
      timeRange,
      setTimeRange,
      transactions,
      setTransactions,
      receipts,
      setReceipts,
      userCurrency,
      setUserCurrency
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}