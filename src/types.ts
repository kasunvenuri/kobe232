export interface RawExtractedItem {
  id: string;
  itemCode?: string;
  itemDescription: string;
  qty: number;
  notes?: string;
  isHighlightedGray?: boolean;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 or object URL
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  extractedItems: RawExtractedItem[];
  documentMetadata?: {
    documentTitle?: string;
    invoiceNumber?: string;
    date?: string;
    detectedGrayRowsCount?: number;
  };
}

export interface AggregatedItem {
  id: string;
  itemCode: string;
  itemDescription: string;
  breakdown: {
    docId: string;
    docName: string;
    qty: number;
  }[];
  totalQty: number;
  breakdownString: string; // e.g. "6 + 3 = 9" or "Doc 1 (6) + Doc 2 (3) = 9"
}

export type GroupingStrategy = 'exact' | 'clean_normalized' | 'fuzzy';
