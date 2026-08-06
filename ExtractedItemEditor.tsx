import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Check, AlertCircle } from 'lucide-react';
import { DocumentFile, RawExtractedItem } from '../types';

interface ExtractedItemEditorProps {
  document: DocumentFile;
  isOpen: boolean;
  onClose: () => void;
  onSaveItems: (docId: string, updatedItems: RawExtractedItem[]) => void;
}

export const ExtractedItemEditor: React.FC<ExtractedItemEditorProps> = ({
  document,
  isOpen,
  onClose,
  onSaveItems,
}) => {
  if (!isOpen || !document) return null;

  const [items, setItems] = useState<RawExtractedItem[]>(
    document.extractedItems.map((item) => ({ ...item }))
  );

  const handleItemChange = (id: string, field: keyof RawExtractedItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'qty' ? parseFloat(value) || 0 : value,
          };
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: RawExtractedItem = {
      id: `manual-item-${Date.now()}`,
      itemCode: '',
      itemDescription: '',
      qty: 1,
      isHighlightedGray: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    onSaveItems(document.id, items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500 text-zinc-950 rounded shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Edit Extracted Items — {document.name}
              </h3>
              <p className="text-xs text-slate-400">
                Verify and edit item codes, descriptions, or quantities extracted from gray highlighted rows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Extracted Rows ({items.length})
            </span>
            <button
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          {items.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              No items extracted. Click "Add Row" to manually add an item for this document.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-2">
                <div className="col-span-3">Item Code</div>
                <div className="col-span-6">Item Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200/80 hover:border-yellow-300 transition-all"
                >
                  {/* Item Code */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={item.itemCode || ''}
                      onChange={(e) => handleItemChange(item.id, 'itemCode', e.target.value)}
                      placeholder="e.g. C-004"
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-yellow-500 font-mono text-slate-800"
                    />
                  </div>

                  {/* Item Description */}
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.itemDescription}
                      onChange={(e) =>
                        handleItemChange(item.id, 'itemDescription', e.target.value)
                      }
                      placeholder="e.g. Cement Grade A"
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-yellow-500 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Qty */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-yellow-500 font-mono font-bold text-yellow-600 text-right"
                    />
                  </div>

                  {/* Remove action */}
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete item row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total Qty in Doc: <strong className="text-slate-800">{items.reduce((sum, i) => sum + i.qty, 0)}</strong>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save & Update Summary
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
