import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Layers, CheckCircle2 } from 'lucide-react';
import { DocumentFile } from '../types';

interface DocumentModalProps {
  document: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ document, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-slate-800 text-amber-400 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate">{document.name}</h3>
              <p className="text-xs text-slate-400">
                Original Loading Summary Image • {document.extractedItems.length} Gray Shaded Items Extracted
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 rounded-lg p-1 flex items-center space-x-1 border border-slate-700/60">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-300 px-2 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content split view */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* Main Image Stage */}
          <div className="flex-1 relative overflow-auto p-6 flex items-center justify-center bg-slate-950/80">
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="transition-transform duration-150 ease-out max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={document.dataUrl}
                alt={document.name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl ring-1 ring-slate-800"
              />
            </div>
          </div>

          {/* Extracted Items Sidebar Panel */}
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col overflow-hidden">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
              <Layers className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Extracted Gray Rows ({document.extractedItems.length})
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {document.extractedItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  No gray shaded rows extracted.
                </p>
              ) : (
                document.extractedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-800/80 border border-slate-700/60 rounded p-3 text-xs space-y-1 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                        #{idx + 1} {item.itemCode ? `[${item.itemCode}]` : ''}
                      </span>
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {item.qty} pcs
                      </span>
                    </div>
                    <p className="font-semibold text-slate-200 pt-0.5 leading-snug">
                      {item.itemDescription}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Total Qty in Document:</span>
              <span className="font-bold text-white text-xs">
                {document.extractedItems.reduce((sum, i) => sum + i.qty, 0)}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
