import React from 'react';
import { Moon, Sun, User, Plus, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { RangeSwitch } from '../dashboard/RangeSwitch';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import type { TimeRange } from '../../types';

interface HeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onQuickAdd: () => void;
  isMobile?: boolean;
}

export function Header({ timeRange, onTimeRangeChange, onQuickAdd, isMobile = false }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white dark:bg-[#0B1320] border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {isMobile && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#8d07ce] rounded-xl flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              FinanceFlow
            </span>
          </div>
        )}
        
        <div className={cn(
          'flex items-center',
          isMobile ? 'space-x-2' : 'flex-1 justify-center'
        )}>
          {!isMobile && (
            <RangeSwitch
              value={timeRange}
              onChange={onTimeRangeChange}
              isVisible={!isMobile}
            />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isMobile && (
            <Button onClick={onQuickAdd} size="sm">
              <Plus size={16} />
            </Button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <div className="relative group">
            <button
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
            >
              <User size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg hidden group-hover:block group-focus-within:block">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut size={16} className="inline-block mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isMobile && (
        <div className="mt-4">
          <RangeSwitch
            value={timeRange}
            onChange={onTimeRangeChange}
            isVisible={!isMobile}
          />
        </div>
      )}
    </header>
  );
}