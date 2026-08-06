import React from 'react';
import { Layers, FileText, CheckCircle2, RefreshCw, Sparkles, PackageCheck } from 'lucide-react';

interface HeaderProps {
  totalDocs: number;
  totalUniqueItems: number;
  grandTotalQty: number;
  onLoadSamples: () => void;
  onReset: () => void;
  isProcessingAny: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalDocs,
  totalUniqueItems,
  grandTotalQty,
  onLoadSamples,
  onReset,
  isProcessingAny,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Logo & App Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-500 rounded-sm text-zinc-950 flex items-center justify-center shadow-xs">
            <span className="text-zinc-950 font-bold text-lg leading-none">K</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">KOBE</h1>
            <span className="text-[11px] font-semibold bg-yellow-50 text-yellow-600 px-2.5 py-0.5 rounded border border-yellow-100 uppercase tracking-widest hidden sm:inline-block">
              Aggregator
            </span>
          </div>
        </div>

        {/* Key Metrics Banner */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span>Documents: <strong className="text-slate-800">{totalDocs}</strong></span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Unique Lines: <strong className="text-slate-800">{totalUniqueItems}</strong></span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 text-white rounded px-3 py-1 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Qty:</span>
            <span className="text-yellow-400 font-extrabold text-sm">{grandTotalQty.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onLoadSamples}
            disabled={isProcessingAny}
            className="px-3 py-1.5 rounded bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
            Samples
          </button>

          {totalDocs > 0 && (
            <button
              onClick={onReset}
              disabled={isProcessingAny}
              className="px-3 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 hover:text-rose-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Clear all uploaded documents"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
