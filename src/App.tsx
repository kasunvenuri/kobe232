/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { DocumentList } from './components/DocumentList';
import { SummaryTable } from './components/SummaryTable';
import { DocumentModal } from './components/DocumentModal';
import { ExtractedItemEditor } from './components/ExtractedItemEditor';
import { ManualItemModal } from './components/ManualItemModal';
import { DocumentFile, RawExtractedItem } from './types';
import { aggregateDocuments } from './utils/aggregator';
import { getSampleDocuments } from './data/sampleInvoices';
import { Sparkles, FileText, CheckCircle2, Package, Layers } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal States
  const [selectedViewDoc, setSelectedViewDoc] = useState<DocumentFile | null>(null);
  const [selectedEditDoc, setSelectedEditDoc] = useState<DocumentFile | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Compute aggregated summary items
  const aggregatedItems = useMemo(() => {
    return aggregateDocuments(documents);
  }, [documents]);

  const grandTotalQty = useMemo(() => {
    return aggregatedItems.reduce((sum, item) => sum + item.totalQty, 0);
  }, [aggregatedItems]);

  const pendingDocsCount = useMemo(() => {
    return documents.filter((d) => d.status === 'idle').length;
  }, [documents]);

  // Handle uploading new file selection
  const handleFilesSelected = (files: File[]) => {
    const newDocs: DocumentFile[] = [];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newDoc: DocumentFile = {
          id: `doc-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: dataUrl,
          status: 'idle',
          extractedItems: [],
        };

        setDocuments((prev) => [...prev, newDoc]);
        
        // Auto process newly uploaded document with OCR
        processDocumentOCR(newDoc);
      };
      reader.readAsDataURL(file);
    });
  };

  // Perform Gemini OCR processing for a document
  const processDocumentOCR = async (doc: DocumentFile) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: 'processing', errorMessage: undefined } : d))
    );
    setIsProcessing(true);

    try {
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: doc.dataUrl,
          filename: doc.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.extractedItems)) {
        setDocuments((prev) =>
          prev.map((d) => {
            if (d.id === doc.id) {
              return {
                ...d,
                status: 'success',
                extractedItems: result.extractedItems,
                documentMetadata: {
                  documentTitle: result.documentTitle,
                  invoiceNumber: result.invoiceNumber,
                  date: result.date,
                  detectedGrayRowsCount: result.detectedGrayRowsCount,
                },
              };
            }
            return d;
          })
        );
      } else {
        throw new Error(result.error || 'Invalid server response structure');
      }
    } catch (err: any) {
      console.error(`OCR processing failed for ${doc.name}:`, err);
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === doc.id) {
            return {
              ...d,
              status: 'error',
              errorMessage: err?.message || 'Failed to extract items from document image.',
            };
          }
          return d;
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Process all pending idle documents
  const handleProcessAllPending = async () => {
    const pending = documents.filter((d) => d.status === 'idle');
    for (const doc of pending) {
      await processDocumentOCR(doc);
    }
  };

  // Load preset sample invoice documents
  const handleLoadSamples = () => {
    const samples = getSampleDocuments();
    setDocuments(samples);
  };

  // Remove document
  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Reprocess specific document
  const handleReprocessDocument = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      processDocumentOCR(doc);
    }
  };

  // Clear all documents
  const handleReset = () => {
    setDocuments([]);
  };

  // Save updated items from ExtractedItemEditor
  const handleSaveDocumentItems = (docId: string, updatedItems: RawExtractedItem[]) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, extractedItems: updatedItems } : d))
    );
  };

  // Add manual item
  const handleAddManualItem = (itemCode: string, itemDescription: string, qty: number) => {
    // Find or create a manual document container
    let manualDoc = documents.find((d) => d.id === 'manual-entry-doc');

    if (!manualDoc) {
      manualDoc = {
        id: 'manual-entry-doc',
        name: 'Manual_Adjustments.png',
        size: 0,
        type: 'image/png',
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23f1f5f9"><rect width="200" height="150"/><text x="20" y="80" fill="%2364748b" font-family="sans-serif">Manual Row</text></svg>',
        status: 'success',
        extractedItems: [],
      };
      setDocuments((prev) => [...prev, manualDoc!]);
    }

    const newItem: RawExtractedItem = {
      id: `manual-item-${Date.now()}`,
      itemCode,
      itemDescription,
      qty,
      isHighlightedGray: true,
    };

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === manualDoc!.id) {
          return {
            ...d,
            extractedItems: [...d.extractedItems, newItem],
          };
        }
        return d;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Header */}
      <Header
        totalDocs={documents.length}
        totalUniqueItems={aggregatedItems.length}
        grandTotalQty={grandTotalQty}
        onLoadSamples={handleLoadSamples}
        onReset={handleReset}
        isProcessingAny={isProcessing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Upload & Dropzone */}
        <UploadSection
          onFilesSelected={handleFilesSelected}
          onLoadSamples={handleLoadSamples}
          onProcessAllPending={handleProcessAllPending}
          pendingCount={pendingDocsCount}
          isProcessing={isProcessing}
          totalDocs={documents.length}
        />

        {/* Uploaded Documents List Grid */}
        <DocumentList
          documents={documents}
          onRemoveDocument={handleRemoveDocument}
          onViewDocument={(doc) => setSelectedViewDoc(doc)}
          onEditDocumentItems={(doc) => setSelectedEditDoc(doc)}
          onReprocessDocument={handleReprocessDocument}
          isProcessing={isProcessing}
        />

        {/* Consolidated Summary Output Table */}
        <SummaryTable
          aggregatedItems={aggregatedItems}
          totalDocsCount={documents.filter((d) => d.status === 'success').length}
          onAddManualItem={() => setIsManualModalOpen(true)}
        />

      </main>

      {/* Modals & Slide-overs */}
      <DocumentModal
        document={selectedViewDoc}
        isOpen={!!selectedViewDoc}
        onClose={() => setSelectedViewDoc(null)}
      />

      {selectedEditDoc && (
        <ExtractedItemEditor
          document={selectedEditDoc}
          isOpen={!!selectedEditDoc}
          onClose={() => setSelectedEditDoc(null)}
          onSaveItems={handleSaveDocumentItems}
        />
      )}

      <ManualItemModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddItem={handleAddManualItem}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800 tracking-wider">KOBE</span>
            <span>— Loading Invoice Summary Quantity Aggregator</span>
          </div>
          <div className="text-slate-400">
            Targeting GRAY highlighted rows • Gemini Powered OCR
          </div>
        </div>
      </footer>
    </div>
  );
}
