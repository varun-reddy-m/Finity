import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useApp } from '../../contexts/AppContext';
import type { Transaction } from '../../types';
import { createTransaction, updateTransaction, fetchCategories } from '../../utils/apiClient';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

type TxType = 'income' | 'expense';

type CategoryOption = { value: number; label: string };

export function TransactionModal({
  isOpen,
  onClose,
  editingTransaction,
}: TransactionModalProps) {
  const { setTransactions } = useApp();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    date: string;
    amount: string;
    type: TxType;
    categoryId: number | '';
    merchant: string;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'expense',
    categoryId: '',
    merchant: '',
    notes: '',
  });

  const loadCategories = async () => {
    try {
      const data = await fetchCategories(); 
      setCategories(
        (data || []).map((c: any) => ({
          value: c.id, // Ensure this is a number
          label: String(c.name),
        })),
      );
    } catch (e) {
      console.error('Error fetching categories', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      const tx = editingTransaction as any;
      const ttype = String(editingTransaction.type || 'expense').toLowerCase();
      setFormData({
        date: (editingTransaction.date || new Date().toISOString()).slice(0, 10),
        amount: String(editingTransaction.amount ?? ''),
        type: (ttype === 'income' ? 'income' : 'expense') as TxType,
        categoryId:
          (tx.category_id !== undefined && tx.category_id !== null
            ? Number(tx.category_id)
            : tx.category?.id !== undefined && tx.category?.id !== null
            ? Number(tx.category.id)
            : '') as number | '',
        merchant: (tx.merchant ?? '') as string,
        notes: editingTransaction.notes ?? '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'expense',
        categoryId: '',
        merchant: '',
        notes: '',
      });
    }
  }, [editingTransaction, isOpen]);

  const typeOptions: { value: TxType; label: string }[] = useMemo(
    () => [
      { value: 'expense', label: 'Expense' },
      { value: 'income', label: 'Income' },
    ],
    [],
  );

  const handleInput =
    (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSelect =
    (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [key]: key === 'categoryId' ? (val ? Number(val) : '') : (val as any),
      }));
    };

  const resetOrClose = (addAnother: boolean) => {
    if (addAnother) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'expense',
        categoryId: '',
        merchant: '',
        notes: '',
      });
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        ...formData,
        category_id: formData.categoryId || null,
      };

      if (editingTransaction?.id) {
        const updated = await updateTransaction(editingTransaction.id, payload);
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === editingTransaction.id
              ? { ...t, ...updated, category: categories.find(c => c.value === formData.categoryId)?.label || t.category, merchant: formData.merchant }
              : t
          ),
        );
      } else {
        const created = await createTransaction(payload);
        setTransactions((prev) => [
          {
            ...created,
            category: categories.find(c => c.value === formData.categoryId)?.label || created.category,
            merchant: formData.merchant,
          },
          ...prev,
        ]);
      }

      resetOrClose(addAnother);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}>
      <form className="space-y-4" onSubmit={(e) => handleSubmit(e, false)}>
        {error && (
          <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleInput('date')}
            required
          />

          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleInput('amount')}
            required
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={handleSelect('type')}
            options={typeOptions}
            required
          />

          <Select
            label="Category"
            value={formData.categoryId ? String(formData.categoryId) : ''} // Convert categoryId to string for compatibility
            onChange={handleSelect('categoryId')}
            options={[{ value: '', label: 'Select a category' }, ...categories.map((c) => ({ value: String(c.value), label: c.label }))]} // Add placeholder option
            required
          />

          <Input
            label="Merchant"
            placeholder="e.g., Blinkit, Grocery Store"
            value={formData.merchant}
            onChange={handleInput('merchant')}
            required 
          />

          <Input
            label="Notes"
            placeholder="Optional notes"
            value={formData.notes}
            onChange={handleInput('notes')}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          {!editingTransaction && (
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e as any, true)}
              disabled={submitting}
            >
              Save & Add Another
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {editingTransaction ? 'Save Changes' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
