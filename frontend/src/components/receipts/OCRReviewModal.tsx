import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useApp } from '../../contexts/AppContext';
import type { Receipt, Transaction } from '../../types';

interface OCRReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export function OCRReviewModal({ isOpen, onClose, receipt }: OCRReviewModalProps) {
  const { setTransactions } = useApp();
  const [extractedItems, setExtractedItems] = useState<Transaction[]>([]);

  React.useEffect(() => {
    if (receipt?.extractedItems) {
      setExtractedItems([...receipt.extractedItems]);
    }
  }, [receipt]);

  const categories = [
    { value: 'groceries', label: 'Groceries' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'rent', label: 'Rent' },
    { value: 'subscriptions', label: 'Subscriptions' },
    { value: 'dining', label: 'Dining' },
    { value: 'entertainment', label: 'Entertainment' }
  ];

  const handleItemChange = (index: number, field: keyof Transaction, value: any) => {
    setExtractedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleAcceptAll = () => {
    setTransactions(prev => [...extractedItems, ...prev]);
    onClose();
  };

  const handleReject = () => {
    onClose();
  };

  if (!receipt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review parsed items"
      maxWidth="xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and edit the extracted transaction details from <strong>{receipt.filename}</strong>
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {extractedItems.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date"
                  type="date"
                  value={item.date}
                  onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                />
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={item.amount.toString()}
                  onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={item.category}
                  onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                  options={categories}
                />
                <Input
                  label="Merchant"
                  value={item.merchant}
                  onChange={(e) => handleItemChange(index, 'merchant', e.target.value)}
                />
              </div>
              
              <Input
                label="Notes"
                value={item.notes || ''}
                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleAcceptAll} className="flex-1">
            Accept All
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Edit
          </Button>
          <Button variant="ghost" onClick={handleReject}>
            Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}