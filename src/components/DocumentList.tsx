import React from 'react';
import {
  FileText,
  Trash2,
  Eye,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DocumentFile } from '../types';

interface DocumentListProps {
  documents: DocumentFile[];
  onRemoveDocument: (docId: string) => void;
  onViewDocument: (doc: DocumentFile) => void;
  onEditDocumentItems: (doc: DocumentFile) => void;
  onReprocessDocument: (docId: string) => void;
  isProcessing: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onRemoveDocument,
  onViewDocument,
  onEditDocumentItems,
  onReprocessDocument,
  isProcessing,
}) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Uploaded Documents Queue ({documents.length})
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          Click thumbnail to inspect image or edit extracted lines
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, idx) => {
          const itemCount = doc.extractedItems.length;
          const totalQtyInDoc = doc.extractedItems.reduce((acc, curr) => acc + curr.qty, 0);

          return (
            <div
              key={doc.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between hover:border-blue-400 transition-all shadow-2xs group"
            >
              {/* Top Header info */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="shrink-0 font-mono text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      DOC #{idx + 1}
                    </span>
                    <span
                      className="text-xs font-bold text-slate-800 truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                    title="Remove document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="mb-3">
                  {doc.status === 'processing' && (
                    <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Processing OCR...</span>
                    </div>
                  )}

                  {doc.status === 'idle' && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium bg-slate-200/60 px-2.5 py-1 rounded">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Pending OCR</span>
                    </div>
                  )}

                  {doc.status === 'success' && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/60">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Extraction Complete ({itemCount} gray rows)
                      </span>
                      <span className="text-[11px] font-mono text-emerald-800 font-bold">
                        {totalQtyInDoc} pcs
                      </span>
                    </div>
                  )}

                  {doc.status === 'error' && (
                    <div className="flex items-center space-x-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded border border-rose-200/60">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">{doc.errorMessage || 'Extraction failed'}</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Preview */}
                <div
                  onClick={() => onViewDocument(doc)}
                  className="relative aspect-16/10 rounded overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer group-hover:shadow-xs transition-all mb-3"
                >
                  <img
                    src={doc.dataUrl}
                    alt={doc.name}
                    className="w-full h-full object-contain bg-slate-950 p-1"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1 shadow-sm">
                      <Eye className="w-3.5 h-3.5" /> Inspect Image
                    </span>
                  </div>
                </div>

                {/* Extracted Item Snippets preview */}
                {doc.status === 'success' && (
                  <div className="bg-white rounded border border-slate-200/80 p-2 text-xs space-y-1 mb-2 max-h-28 overflow-y-auto">
                    {doc.extractedItems.length === 0 ? (
                      <p className="text-slate-400 text-[11px] italic text-center py-2">
                        No gray shaded items detected in document.
                      </p>
                    ) : (
                      doc.extractedItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-slate-700 py-0.5 border-b border-slate-100 last:border-none"
                        >
                          <span className="truncate pr-2 text-[11px] font-medium" title={item.itemDescription}>
                            {item.itemCode ? `[${item.itemCode}] ` : ''}
                            {item.itemDescription}
                          </span>
                          <span className="font-mono text-blue-600 font-bold text-[11px] shrink-0 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                            {item.qty}
                          </span>
                        </div>
                      ))
                    )}
                    {doc.extractedItems.length > 3 && (
                      <div className="text-[10px] text-slate-400 font-semibold text-center pt-0.5">
                        + {doc.extractedItems.length - 3} more items...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Card Action Bar */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => onViewDocument(doc)}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-slate-500" /> View
                </button>

                {doc.status === 'success' && (
                  <button
                    onClick={() => onEditDocumentItems(doc)}
                    className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold uppercase text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-blue-600" /> Edit Items
                  </button>
                )}

                <button
                  onClick={() => onReprocessDocument(doc.id)}
                  disabled={isProcessing}
                  className="px-2 py-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors text-[11px] disabled:opacity-40 cursor-pointer"
                  title="Re-run OCR"
                >
                  <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
