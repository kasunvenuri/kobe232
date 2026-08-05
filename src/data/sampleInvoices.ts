import { DocumentFile } from '../types';

// Helper to create an SVG invoice data URL with gray highlighted item rows
export function createSampleInvoiceDataUrl(
  title: string,
  invNo: string,
  dateStr: string,
  items: { code: string; desc: string; qty: number; isGray: boolean }[]
): string {
  const svgRows = items
    .map((item, idx) => {
      const y = 140 + idx * 30;
      const bg = item.isGray ? '#E2E8F0' : '#FFFFFF'; // gray background vs white
      const textColor = item.isGray ? '#0F172A' : '#64748B';
      const badge = item.isGray ? `<rect x="500" y="${y - 18}" width="65" height="20" rx="4" fill="#94A3B8" opacity="0.3"/><text x="505" y="${y - 4}" font-size="10" font-family="sans-serif" fill="#334155" font-weight="bold">GRAY ROW</text>` : '';

      return `
        <rect x="20" y="${y - 20}" width="560" height="26" fill="${bg}" rx="3" stroke="#CBD5E1" stroke-width="0.5"/>
        <text x="30" y="${y - 3}" font-size="12" font-family="sans-serif" fill="${textColor}" font-weight="${item.isGray ? 'bold' : 'normal'}">${item.code}</text>
        <text x="120" y="${y - 3}" font-size="12" font-family="sans-serif" fill="${textColor}" font-weight="${item.isGray ? 'bold' : 'normal'}">${item.desc}</text>
        <text x="440" y="${y - 3}" font-size="13" font-family="sans-serif" fill="${textColor}" font-weight="bold">${item.qty}</text>
        ${badge}
      `;
    })
    .join('');

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
      <rect width="600" height="420" fill="#F8FAFC" rx="8"/>
      
      <!-- Header banner -->
      <rect x="20" y="20" width="560" height="55" fill="#1E293B" rx="6"/>
      <text x="40" y="45" font-size="18" font-family="sans-serif" fill="#FFFFFF" font-weight="bold">${title}</text>
      <text x="40" y="63" font-size="11" font-family="sans-serif" fill="#94A3B8">LOGISTICS & LOADING SUMMARY INVOICE</text>
      <text x="440" y="45" font-size="12" font-family="sans-serif" fill="#38BDF8" font-weight="bold">INV: ${invNo}</text>
      <text x="440" y="63" font-size="11" font-family="sans-serif" fill="#CBD5E1">Date: ${dateStr}</text>

      <!-- Subheader notes (Ignored by KOBE OCR) -->
      <text x="25" y="95" font-size="11" font-family="sans-serif" fill="#64748B">Customer: Metro Warehouse Depot - Dock 4B</text>
      <text x="350" y="95" font-size="11" font-family="sans-serif" fill="#64748B">Route: North Sector Express</text>

      <!-- Table Header -->
      <rect x="20" y="105" width="560" height="24" fill="#334155" rx="3"/>
      <text x="30" y="121" font-size="11" font-family="sans-serif" fill="#F8FAFC" font-weight="bold">ITEM CODE</text>
      <text x="120" y="121" font-size="11" font-family="sans-serif" fill="#F8FAFC" font-weight="bold">ITEM DESCRIPTION (GRAY = TARGET)</text>
      <text x="440" y="121" font-size="11" font-family="sans-serif" fill="#F8FAFC" font-weight="bold">QTY</text>
      <text x="500" y="121" font-size="10" font-family="sans-serif" fill="#F8FAFC" font-weight="bold">STATUS</text>

      ${svgRows}

      <!-- Footer Note -->
      <line x1="20" y1="380" x2="580" y2="380" stroke="#E2E8F0" stroke-width="1"/>
      <text x="20" y="400" font-size="10" font-family="sans-serif" fill="#94A3B8">* Only gray highlighted item rows represent primary load dispatch units requiring KOBE aggregation.</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

export function getSampleDocuments(): DocumentFile[] {
  const doc1Url = createSampleInvoiceDataUrl(
    'LOADING SUMMARY #01',
    'LS-2026-081',
    '2026-08-01',
    [
      { code: 'KB-101', desc: 'Heavy Duty Steel Brackets 12-Inch', qty: 12, isGray: true },
      { code: 'KB-102', desc: 'Standard Mounting Screws Box (100pk)', qty: 50, isGray: false }, // White row (ignored)
      { code: 'KB-103', desc: 'Industrial Rubber Seal Gaskets', qty: 24, isGray: true },
      { code: 'KB-104', desc: 'Aluminum Extension Rods 2M', qty: 8, isGray: true },
      { code: 'KB-105', desc: 'Packaging Bubble Wrap Roll (Non-gray)', qty: 5, isGray: false }, // White row (ignored)
    ]
  );

  const doc2Url = createSampleInvoiceDataUrl(
    'LOADING SUMMARY #02',
    'LS-2026-082',
    '2026-08-02',
    [
      { code: 'KB-101', desc: 'Heavy Duty Steel Brackets 12-Inch', qty: 18, isGray: true },
      { code: 'KB-103', desc: 'Industrial Rubber Seal Gaskets', qty: 16, isGray: true },
      { code: 'KB-106', desc: 'Precision Bearing Set Grade A', qty: 30, isGray: true },
      { code: 'KB-107', desc: 'Secondary Plastic Cable Ties (White Row)', qty: 100, isGray: false }, // White row (ignored)
    ]
  );

  const doc3Url = createSampleInvoiceDataUrl(
    'LOADING SUMMARY #03',
    'LS-2026-083',
    '2026-08-03',
    [
      { code: 'KB-101', desc: 'Heavy Duty Steel Brackets 12-Inch', qty: 6, isGray: true },
      { code: 'KB-104', desc: 'Aluminum Extension Rods 2M', qty: 14, isGray: true },
      { code: 'KB-106', desc: 'Precision Bearing Set Grade A', qty: 20, isGray: true },
      { code: 'KB-108', desc: 'Hydraulic Valve Cylinders 50mm', qty: 10, isGray: true },
    ]
  );

  return [
    {
      id: 'sample-doc-1',
      name: 'Loading_Summary_Route_A.png',
      size: 142000,
      type: 'image/png',
      dataUrl: doc1Url,
      status: 'success',
      extractedItems: [
        { id: 'i1-1', itemCode: 'KB-101', itemDescription: 'Heavy Duty Steel Brackets 12-Inch', qty: 12, isHighlightedGray: true },
        { id: 'i1-2', itemCode: 'KB-103', itemDescription: 'Industrial Rubber Seal Gaskets', qty: 24, isHighlightedGray: true },
        { id: 'i1-3', itemCode: 'KB-104', itemDescription: 'Aluminum Extension Rods 2M', qty: 8, isHighlightedGray: true },
      ],
      documentMetadata: {
        documentTitle: 'LOADING SUMMARY #01',
        invoiceNumber: 'LS-2026-081',
        date: '2026-08-01',
        detectedGrayRowsCount: 3,
      },
    },
    {
      id: 'sample-doc-2',
      name: 'Loading_Summary_Route_B.png',
      size: 156000,
      type: 'image/png',
      dataUrl: doc2Url,
      status: 'success',
      extractedItems: [
        { id: 'i2-1', itemCode: 'KB-101', itemDescription: 'Heavy Duty Steel Brackets 12-Inch', qty: 18, isHighlightedGray: true },
        { id: 'i2-2', itemCode: 'KB-103', itemDescription: 'Industrial Rubber Seal Gaskets', qty: 16, isHighlightedGray: true },
        { id: 'i2-3', itemCode: 'KB-106', itemDescription: 'Precision Bearing Set Grade A', qty: 30, isHighlightedGray: true },
      ],
      documentMetadata: {
        documentTitle: 'LOADING SUMMARY #02',
        invoiceNumber: 'LS-2026-082',
        date: '2026-08-02',
        detectedGrayRowsCount: 3,
      },
    },
    {
      id: 'sample-doc-3',
      name: 'Loading_Summary_Route_C.png',
      size: 138000,
      type: 'image/png',
      dataUrl: doc3Url,
      status: 'success',
      extractedItems: [
        { id: 'i3-1', itemCode: 'KB-101', itemDescription: 'Heavy Duty Steel Brackets 12-Inch', qty: 6, isHighlightedGray: true },
        { id: 'i3-2', itemCode: 'KB-104', itemDescription: 'Aluminum Extension Rods 2M', qty: 14, isHighlightedGray: true },
        { id: 'i3-3', itemCode: 'KB-106', itemDescription: 'Precision Bearing Set Grade A', qty: 20, isHighlightedGray: true },
        { id: 'i3-4', itemCode: 'KB-108', itemDescription: 'Hydraulic Valve Cylinders 50mm', qty: 10, isHighlightedGray: true },
      ],
      documentMetadata: {
        documentTitle: 'LOADING SUMMARY #03',
        invoiceNumber: 'LS-2026-083',
        date: '2026-08-03',
        detectedGrayRowsCount: 4,
      },
    },
  ];
}
