export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  category_id?: number; // Add optional category_id field
  merchant: string;
  notes?: string;
  receiptUrl?: string;
}

export interface KPI {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export type TimeRange = 'weekly' | 'monthly' | 'yearly';
export type Theme = 'light' | 'dark';

export interface Receipt {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'parsing' | 'ready' | 'error';
  extractedItems?: Transaction[];
}