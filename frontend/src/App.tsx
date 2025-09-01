import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import { Navigation } from './components/layout/Navigation';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { TransactionsList } from './components/transactions/TransactionsList';
import { TransactionModal } from './components/transactions/TransactionModal';
import { ReceiptUploader } from './components/receipts/ReceiptUploader';
import { Reports } from './components/reports/Reports';
import { Profile } from './components/profile/Profile';
import { FloatingActionButton } from './components/fab/FloatingActionButton';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { useApp } from './contexts/AppContext';
import type { Transaction } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { timeRange, setTimeRange } = useApp();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleQuickAdd = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleCloseModal = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'transactions':
        return <TransactionsList onEditTransaction={handleEditTransaction} />;
      case 'receipts':
        return <ReceiptUploader />;
      case 'reports':
        return <Reports />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] dark:bg-[#0F1724] transition-colors duration-200">
      <div className="flex h-screen">
        {!isMobile && (
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onQuickAdd={handleQuickAdd}
            isMobile={isMobile}
          />
          
          <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
            {renderContent()}
          </main>
        </div>
      </div>

      {isMobile && (
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isMobile={true}
        />
      )}

      <FloatingActionButton onClick={handleQuickAdd} />

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={handleCloseModal}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('authToken'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateAuthenticationState = () => {
    setIsAuthenticated(!!localStorage.getItem('authToken'));
  };

  return (
    <ThemeProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login onLogin={updateAuthenticationState} />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <AppContent /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;