import * as XLSX from 'xlsx';
import { DocumentFile, AggregatedItem } from '../types';

/**
 * Normalizes item description for matching
 */
export function normalizeItemName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, ' ') // collapse spacing, dashes, underscores
    .replace(/[^\w\s]/gi, ''); // strip special characters
}

/**
 * Aggregates extracted items across all successfully processed documents
 */
export function aggregateDocuments(documents: DocumentFile[]): AggregatedItem[] {
  const itemMap = new Map<string, AggregatedItem>();

  const validDocs = documents.filter((doc) => doc.status === 'success');

  validDocs.forEach((doc) => {
    doc.extractedItems.forEach((item) => {
      if (!item.itemDescription || item.qty <= 0) return;

      const normalizedKey = normalizeItemName(item.itemDescription);
      if (!normalizedKey) return;

      const existing = itemMap.get(normalizedKey);

      if (existing) {
        // Add to breakdown
        existing.breakdown.push({
          docId: doc.id,
          docName: doc.name,
          qty: item.qty,
        });

        // Update code if existing code was empty and current has one
        if (!existing.itemCode && item.itemCode) {
          existing.itemCode = item.itemCode;
        }

        // Standardize item description if current is cleaner/longer
        if (item.itemDescription.length > existing.itemDescription.length) {
          existing.itemDescription = item.itemDescription.trim();
        }

        existing.totalQty += item.qty;
      } else {
        itemMap.set(normalizedKey, {
          id: `agg-${normalizedKey}`,
          itemCode: item.itemCode ? item.itemCode.trim() : '',
          itemDescription: item.itemDescription.trim(),
          breakdown: [
            {
              docId: doc.id,
              docName: doc.name,
              qty: item.qty,
            },
          ],
          totalQty: item.qty,
          breakdownString: '',
        });
      }
    });
  });

  // Calculate breakdownString for each item
  const aggregatedList = Array.from(itemMap.values()).map((agg) => {
    const qtyParts = agg.breakdown.map((b) => b.qty);
    const docParts = agg.breakdown.map((b) => `${b.docName} (${b.qty})`);

    const simpleEquation = qtyParts.join(' + ');
    const detailedEquation = docParts.join(' + ');

    return {
      ...agg,
      breakdownString: qtyParts.length > 1 
        ? `${simpleEquation} = ${agg.totalQty}` 
        : `${agg.totalQty}`,
      detailedBreakdownString: qtyParts.length > 1
        ? `${detailedEquation} = ${agg.totalQty}`
        : `${agg.breakdown[0]?.docName || 'Doc'}: ${agg.totalQty}`
    };
  });

  // Sort alphabetically by item description
  return aggregatedList.sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
}

/**
 * Export aggregated list to Excel (.xlsx) file download
 */
export function exportToExcel(aggregatedItems: AggregatedItem[], filename = 'KOBE_Aggregated_Summary.xlsx') {
  const data = aggregatedItems.map((item, idx) => ({
    'No.': idx + 1,
    'Item Code': item.itemCode || 'N/A',
    'Item Description': item.itemDescription,
    'Calculated Breakdown': item.breakdownString,
    'Breakdown by Document': item.breakdown.map(b => `${b.docName}: ${b.qty}`).join('; '),
    'Grand Total Qty': item.totalQty,
  }));

  // Add overall total row
  const overallTotal = aggregatedItems.reduce((sum, item) => sum + item.totalQty, 0);
  data.push({
    'No.': 0,
    'Item Code': '',
    'Item Description': 'OVERALL TOTAL QUANTITY',
    'Calculated Breakdown': '',
    'Breakdown by Document': '',
    'Grand Total Qty': overallTotal,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated Summary');

  // Auto column width
  const max_cols = [
    { wch: 6 },
    { wch: 15 },
    { wch: 35 },
    { wch: 25 },
    { wch: 40 },
    { wch: 18 },
  ];
  worksheet['!cols'] = max_cols;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export aggregated list to CSV download
 */
export function exportToCSV(aggregatedItems: AggregatedItem[], filename = 'KOBE_Aggregated_Summary.csv') {
  const headers = ['No.', 'Item Code', 'Item Description', 'Calculated Breakdown', 'Document Breakdown', 'Total Qty'];
  
  const rows = aggregatedItems.map((item, idx) => [
    idx + 1,
    `"${(item.itemCode || 'N/A').replace(/"/g, '""')}"`,
    `"${item.itemDescription.replace(/"/g, '""')}"`,
    `"${item.breakdownString.replace(/"/g, '""')}"`,
    `"${item.breakdown.map(b => `${b.docName}: ${b.qty}`).join('; ').replace(/"/g, '""')}"`,
    item.totalQty,
  ]);

  const overallTotal = aggregatedItems.reduce((sum, item) => sum + item.totalQty, 0);
  rows.push(['', '""', '"OVERALL TOTAL QUANTITY"', '""', '""', overallTotal]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy formatted text table to Clipboard
 */
export async function copyToClipboard(aggregatedItems: AggregatedItem[]): Promise<boolean> {
  try {
    let text = `KOBE - Consolidated Loading Summary\n`;
    text += `=======================================================\n`;
    text += `Item Description — Total Quantity (Breakdown)\n`;
    text += `=======================================================\n\n`;

    aggregatedItems.forEach((item, idx) => {
      const codeStr = item.itemCode ? `[${item.itemCode}] ` : '';
      text += `${idx + 1}. ${codeStr}${item.itemDescription} — Total: ${item.totalQty} (${item.breakdownString})\n`;
    });

    const overallTotal = aggregatedItems.reduce((sum, item) => sum + item.totalQty, 0);
    text += `\n=======================================================\n`;
    text += `OVERALL GRAND TOTAL QUANTITY: ${overallTotal}\n`;
    text += `=======================================================\n`;

    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed', err);
    return false;
  }
}
