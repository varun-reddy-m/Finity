import React from 'react';
import { 
  BarChart3, 
  CreditCard, 
  Receipt, 
  FileText, 
  User,
  Home
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User }
];

export function Navigation({ activeTab, onTabChange, isMobile = false }: NavigationProps) {
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B1320] border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                activeTab === id 
                  ? 'text-[#8d07ce] bg-purple-50 dark:bg-purple-900/20' 
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-[#0B1320] border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-[#8d07ce] rounded-xl flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            FinanceFlow
          </span>
        </div>
        
        <nav className="space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800 text-left',
                activeTab === id 
                  ? 'text-[#8d07ce] bg-purple-50 dark:bg-purple-900/20 font-medium' 
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}