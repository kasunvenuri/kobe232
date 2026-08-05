import React, { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';

interface ManualItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemCode: string, itemDescription: string, qty: number) => void;
}

export const ManualItemModal: React.FC<ManualItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [itemCode, setItemCode] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [qty, setQty] = useState<number>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription.trim() || qty <= 0) return;
    onAddItem(itemCode.trim(), itemDescription.trim(), qty);
    setItemCode('');
    setItemDescription('');
    setQty(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Add Manual Item Row</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Item Code (Optional)
            </label>
            <input
              type="text"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="e.g. C-004"
              className="w-full text-xs border border-slate-200 rounded p-2.5 focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Item Description *
            </label>
            <input
              type="text"
              required
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="e.g. Cement Grade A"
              className="w-full text-xs border border-slate-200 rounded p-2.5 focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={qty}
              onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
              className="w-full text-xs border border-slate-200 rounded p-2.5 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
