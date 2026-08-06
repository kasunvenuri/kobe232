import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  Plus,
  Download,
} from 'lucide-react';
import { AggregatedItem } from '../types';
import { exportToExcel, exportToCSV, copyToClipboard } from '../utils/aggregator';
import { exportToPDF } from '../utils/pdfExport';
import { exportToGoogleSheets } from '../services/googleSheets';

interface SummaryTableProps {
  aggregatedItems: AggregatedItem[];
  totalDocsCount: number;
  onAddManualItem: () => void;
  trNumber?: string;
  masterSpreadsheetId?: string;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  aggregatedItems,
  totalDocsCount,
  onAddManualItem,
  trNumber,
  masterSpreadsheetId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDetailedDocNames, setShowDetailedDocNames] = useState(false);
  const [sortField, setSortField] = useState<'itemDescription' | 'totalQty' | 'itemCode'>('itemDescription');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isExportingSheets, setIsExportingSheets] = useState(false);

  const grandTotalAllItems = aggregatedItems.reduce((acc, curr) => acc + curr.totalQty, 0);

  const handleExportToSheets = async () => {
    try {
      setIsExportingSheets(true);
      const url = await exportToGoogleSheets(aggregatedItems, totalDocsCount, grandTotalAllItems, trNumber, masterSpreadsheetId);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error(err);
      alert('Export failed: ' + err.message);
    } finally {
      setIsExportingSheets(false);
    }
  };


  // Filter items based on search query
  const filteredItems = aggregatedItems.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.itemDescription.toLowerCase().includes(q) ||
      item.itemCode.toLowerCase().includes(q)
    );
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'itemDescription') {
      comparison = a.itemDescription.localeCompare(b.itemDescription);
    } else if (sortField === 'itemCode') {
      comparison = (a.itemCode || '').localeCompare(b.itemCode || '');
    } else if (sortField === 'totalQty') {
      comparison = a.totalQty - b.totalQty;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'itemDescription' | 'totalQty' | 'itemCode') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopyClipboard = async () => {
    const success = await copyToClipboard(aggregatedItems);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0 flex flex-col">
      {/* Summary Header & Export Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Aggregated Summary
            <span className="text-xs font-semibold bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded border border-yellow-100 uppercase tracking-wider">
              {aggregatedItems.length} Items
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Matching duplicate items across {totalDocsCount} documents with calculated breakdown.
          </p>
        </div>

        {/* Action / Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddManualItem}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            Add Item
          </button>

          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-900 uppercase tracking-wider transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={() => exportToCSV(aggregatedItems)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 uppercase tracking-wider transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-yellow-600" />
            CSV
          </button>

          <button
            onClick={() => exportToPDF(aggregatedItems, totalDocsCount, grandTotalAllItems)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-yellow-600" />
            PDF
          </button>

          <button
            onClick={() => exportToExcel(aggregatedItems)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-zinc-950 rounded text-xs font-bold hover:bg-yellow-400 uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>

          <button
            onClick={handleExportToSheets}
            disabled={isExportingSheets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 uppercase tracking-wider transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {isExportingSheets ? 'Exporting...' : 'Sync to Google Sheets'}
          </button>
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items by code or description..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-yellow-500 text-slate-800"
          />
        </div>

        {/* Detailed Breakdown Toggle */}
        <div className="flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={showDetailedDocNames}
              onChange={(e) => setShowDetailedDocNames(e.target.checked)}
              className="rounded border-slate-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4"
            />
            <span>Show Document Names in Breakdown</span>
          </label>
        </div>
      </div>

      {/* Main Aggregated Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Header */}
          <thead className="bg-slate-100 sticky top-0 border-b border-slate-200">
            <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3 border-b border-slate-200 w-12 text-center text-slate-400">#</th>

              <th
                onClick={() => toggleSort('itemCode')}
                className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Item Code</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('itemDescription')}
                className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Item Description</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="px-6 py-3 border-b border-slate-200">
                <span>Calculated Breakdown</span>
              </th>

              <th
                onClick={() => toggleSort('totalQty')}
                className="px-6 py-3 border-b border-slate-200 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Grand Total</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                  {searchTerm ? 'No items matched your search filter.' : 'No documents uploaded or processed yet.'}
                </td>
              </tr>
            ) : (
              sortedItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-center font-mono text-[11px] text-slate-400">
                    {idx + 1}
                  </td>

                  <td className="px-6 py-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {item.itemCode ? (
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {item.itemCode}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic text-[10px]">N/A</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{item.itemDescription}</div>
                  </td>

                  {/* Calculated Breakdown Display Format */}
                  <td className="px-6 py-4 font-mono text-xs text-yellow-600 font-semibold">
                    <div className="flex items-center space-x-2">
                      <span>
                        {showDetailedDocNames
                          ? (item as any).detailedBreakdownString || item.breakdownString
                          : item.breakdownString}
                      </span>
                      {item.breakdown.length > 1 && (
                        <span className="text-[10px] text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 font-sans font-semibold">
                          {item.breakdown.length} docs
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Grand Total Quantity */}
                  <td className="px-6 py-4 text-right font-bold text-slate-800 text-base">
                    {item.totalQty.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer - Overall Total Banner */}
      {sortedItems.length > 0 && (
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Final Aggregate
            </span>
            <span className="text-xs text-slate-300">
              Across {aggregatedItems.length} unique items in {totalDocsCount} documents
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              OVERALL TOTAL QTY
            </span>
            <span className="text-3xl font-black tabular-nums text-white">
              {grandTotalAllItems.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
