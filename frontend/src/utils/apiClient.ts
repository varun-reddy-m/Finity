import axios from 'axios';
import type { Transaction } from '../types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // Update with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Reports API
export const fetchReports = async () => {
  try {
    const response = await apiClient.get('/reports');
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

// Receipts API
export const fetchReceipts = async () => {
  try {
    const response = await apiClient.get('/receipts');
    return response.data;
  } catch (error) {
    console.error('Error fetching receipts:', error);
    throw error;
  }
};

// Transactions API
export const fetchTransactions = async (page: number = 1, perPage: number = 15) => {
  try {
    const response = await apiClient.get('/transactions', {
      params: { page, per_page: perPage },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const createTransaction = async (transaction: Transaction) => {
  try {
    const payload = {
      ...transaction,
      category_id: transaction.category_id, // Ensure category_id is explicitly included and valid
      merchant: transaction.merchant || null, // Ensure merchant is included
      date: new Date(transaction.date).toISOString(), // Ensure date is sent as ISO string
    };
    const response = await apiClient.post('/transactions', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, transaction: Transaction) => {
  try {
    const payload = {
      ...transaction,
      category_id: transaction.category_id || null, // Ensure category_id is included
      merchant: transaction.merchant || null, // Ensure merchant is included
      date: new Date(transaction.date).toISOString(), // Ensure date is sent as ISO string
    };
    const response = await apiClient.put(`/transactions/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// User Data API
export const fetchUserData = async () => {
  try {
    const response = await apiClient.get('/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateUser = async (userData: { full_name: string }) => {
  try {
    const response = await apiClient.put('/user', userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Categories API
export const fetchCategories = async () => {
  try {
    const response = await apiClient.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const addCategory = async (name: string): Promise<any> => {
  try {
    const response = await apiClient.post('/categories', { name });
    return response.data;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/categories/${id}`);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Authentication API
export const registerUser = async (email: string, password: string, fullName: string): Promise<void> => {
  try {
    await apiClient.post('/auth/register', { email, password, full_name: fullName });
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.access_token;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

export default apiClient;
