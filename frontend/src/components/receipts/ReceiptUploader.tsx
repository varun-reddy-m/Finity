import React, { useState, useRef } from 'react';
import { Upload, File, Check, AlertCircle, Loader } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../contexts/AppContext';
import { OCRReviewModal } from './OCRReviewModal';
import type { Receipt } from '../../types';

export function ReceiptUploader() {
  const { receipts, setReceipts } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const newReceipt: Receipt = {
        id: Date.now().toString() + Math.random(),
        filename: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'parsing'
      };

      setReceipts(prev => [...prev, newReceipt]);

      // Simulate OCR processing
      setTimeout(() => {
        setReceipts(prev => prev.map(r => 
          r.id === newReceipt.id 
            ? {
                ...r,
                status: 'ready',
                extractedItems: [
                  {
                    id: 'extracted-' + newReceipt.id,
                    date: new Date().toISOString().split('T')[0],
                    amount: Math.random() * 100 + 20,
                    type: 'expense',
                    category: 'groceries',
                    merchant: 'Sample Store',
                    notes: 'Extracted from receipt'
                  }
                ]
              }
            : r
        ));
      }, 3000);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const getStatusIcon = (status: Receipt['status']) => {
    switch (status) {
      case 'parsing':
        return <Loader size={16} className="text-yellow-500 animate-spin" />;
      case 'ready':
        return <Check size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusText = (status: Receipt['status']) => {
    switch (status) {
      case 'parsing':
        return 'Processing...';
      case 'ready':
        return 'Ready for review';
      case 'error':
        return 'Processing failed';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Receipt Management
        </h2>
        
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragOver
              ? 'border-[#8d07ce] bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Drop receipts here or click to upload
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Supports JPG, PNG, and PDF files
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload Receipt
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </Card>

      {receipts.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Uploaded Receipts
          </h3>
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <File size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {receipt.filename}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(receipt.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(receipt.status)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getStatusText(receipt.status)}
                    </span>
                  </div>
                  
                  {receipt.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedReceipt(receipt)}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <OCRReviewModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}