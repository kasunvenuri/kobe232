import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AggregatedItem } from '../types';

export const exportToPDF = (aggregatedItems: AggregatedItem[], totalDocs: number, grandTotal: number) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text('KOBE - Aggregated Summary', 14, 15);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Across ${totalDocs} documents`, 14, 22);

  const tableColumn = ["Item Code", "Item Description", "Calculated Breakdown", "Grand Total"];
  const tableRows: any[][] = [];

  aggregatedItems.forEach(item => {
    const itemData = [
      item.itemCode || '',
      item.itemDescription,
      item.breakdownString,
      item.totalQty.toLocaleString()
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontStyle: 'bold',
    },
    foot: [['', '', 'OVERALL TOTAL QTY', grandTotal.toLocaleString()]],
    footStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    }
  });

  doc.save('kobe-aggregated-summary.pdf');
};
