import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { sheets, auth } from '@googleapis/sheets';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'KOBE Item Aggregator' });
});

// Config endpoint
app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return res.json({ oAuthClientId: config.oAuthClientId });
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  res.json({ oAuthClientId: null });
});

// Google Sheets export endpoint
app.post('/api/export-to-sheets', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });
    const token = authHeader.split(' ')[1];

    const { items, totalDocs, grandTotal, trNumber, spreadsheetId: inputSpreadsheetId } = req.body;
    
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items payload' });

    const client = new auth.OAuth2();
    client.setCredentials({ access_token: token });
    const sheetsService = sheets({ version: 'v4', auth: client });

    const getSafeTitle = (baseTitle: string) => {
      let safeTitle = baseTitle.replace(/[:\\/?*\[\]]/g, ' ').substring(0, 80).trim();
      return safeTitle || "Item";
    };

    let spreadsheetId = inputSpreadsheetId;
    let spreadsheetUrl = '';
    const existingSheets = new Map<string, number>(); // lowercase title -> sheetId
    let maxSheetId = 0;

    if (spreadsheetId) {
      // 1. Get existing spreadsheet
      try {
        const spreadsheet = await sheetsService.spreadsheets.get({ spreadsheetId });
        spreadsheetUrl = spreadsheet.data.spreadsheetUrl || '';
        spreadsheet.data.sheets?.forEach(s => {
          if (s.properties?.title) {
            existingSheets.set(s.properties.title.toLowerCase(), s.properties.sheetId || 0);
          }
          if (s.properties?.sheetId && s.properties.sheetId > maxSheetId) {
            maxSheetId = s.properties.sheetId;
          }
        });
      } catch (e: any) {
        return res.status(400).json({ error: 'Spreadsheet ID is invalid or inaccessible.', message: e.message });
      }
    } else {
      // Create new spreadsheet
      const spreadsheet = await sheetsService.spreadsheets.create({
        requestBody: {
          properties: {
            title: `KOBE Bin Cards - ${new Date().toLocaleDateString()}`
          },
        }
      });
      spreadsheetId = spreadsheet.data.spreadsheetId;
      spreadsheetUrl = spreadsheet.data.spreadsheetUrl || '';
      existingSheets.set('sheet1', 0); // Default sheet created by Google Sheets API
    }

    // 2. Determine which sheets need to be created
    const sheetsToCreate: { title: string, sheetId: number }[] = [];
    const usedTitlesForThisRun = new Set<string>();

    const getUniqueTitle = (baseTitle: string) => {
      let title = getSafeTitle(baseTitle);
      let finalTitle = title;
      let counter = 1;
      while (
        usedTitlesForThisRun.has(finalTitle.toLowerCase()) || 
        (existingSheets.has(finalTitle.toLowerCase()) && !usedTitlesForThisRun.has(finalTitle.toLowerCase()))
      ) {
        if (existingSheets.has(finalTitle.toLowerCase()) && !usedTitlesForThisRun.has(finalTitle.toLowerCase())) {
            break; // Reuse the existing sheet
        }
        finalTitle = `${title} (${counter})`;
        counter++;
      }
      usedTitlesForThisRun.add(finalTitle.toLowerCase());
      return finalTitle;
    };

    const summaryTitle = getUniqueTitle("Summary");
    if (!existingSheets.has(summaryTitle.toLowerCase())) {
      maxSheetId++;
      sheetsToCreate.push({ title: summaryTitle, sheetId: maxSheetId });
    }

    const itemSheetMappings: { item: any, title: string }[] = [];
    items.forEach((item: any) => {
      const title = getUniqueTitle(item.itemCode ? item.itemCode : item.itemDescription);
      if (!existingSheets.has(title.toLowerCase()) && !sheetsToCreate.find(s => s.title.toLowerCase() === title.toLowerCase())) {
        maxSheetId++;
        sheetsToCreate.push({ title, sheetId: maxSheetId });
      }
      itemSheetMappings.push({ item, title });
    });

    // 3. BatchUpdate to create missing sheets
    if (sheetsToCreate.length > 0) {
      const addSheetRequests = sheetsToCreate.map(s => ({
        addSheet: { properties: { title: s.title, sheetId: s.sheetId } }
      }));
      await sheetsService.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: addSheetRequests }
      });
      sheetsToCreate.forEach(s => {
        existingSheets.set(s.title.toLowerCase(), s.sheetId);
      });
    }

    // 4. Figure out where to append for each sheet via batchGet
    const rangesToGet = itemSheetMappings.map(m => `'${m.title}'!A:A`);
    const sheetRowCounts = new Map<string, number>();
    
    // Process in batches of 50 to avoid API limits on batchGet
    for (let i = 0; i < rangesToGet.length; i += 50) {
      const batchRanges = rangesToGet.slice(i, i + 50);
      const batchGetRes = await sheetsService.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: batchRanges
      });
      batchGetRes.data.valueRanges?.forEach((vr, idx) => {
        const title = itemSheetMappings[i + idx].title;
        const rowCount = vr.values ? vr.values.length : 0;
        sheetRowCounts.set(title, rowCount);
      });
    }

    // 5. Prepare data to write
    const dataToUpdate: any[] = [];
    const formatRequests: any[] = [];

    // Summary Sheet logic (Overwrite from row 1)
    const summaryRows = [
      ['KOBE - Master Summary'],
      [`Last Updated: ${new Date().toLocaleString()}`],
      [],
      ['Item Code', 'Item Description', 'Current Balance']
    ];

    items.forEach((item: any) => {
      const title = itemSheetMappings.find(m => m.item.id === item.id)?.title || '';
      summaryRows.push([
        item.itemCode || '',
        item.itemDescription,
        `=INDIRECT("'${title}'!B4")`
      ]);
    });

    dataToUpdate.push({
      range: `'${summaryTitle}'!A1`,
      values: summaryRows
    });

    formatRequests.push(
      {
        repeatCell: {
          range: { sheetId: existingSheets.get(summaryTitle.toLowerCase()), startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 3 },
          cell: {
            userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, textFormat: { bold: true } }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: { sheetId: existingSheets.get(summaryTitle.toLowerCase()), startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
          fields: 'userEnteredFormat(textFormat)'
        }
      }
    );

    // Item Sheets logic
    itemSheetMappings.forEach(({ item, title }) => {
      const sheetId = existingSheets.get(title.toLowerCase())!;
      const rowCount = sheetRowCounts.get(title) || 0;
      
      const newRows = [];
      let startRowIndex = rowCount;

      if (rowCount === 0) {
        newRows.push(['BIN CARD - KOBE']);
        newRows.push(['Item Description:', item.itemDescription]);
        newRows.push(['Item Code:', item.itemCode || 'N/A']);
        newRows.push(['Current Balance:', '=SUM(C6:C)-SUM(D6:D)']);
        newRows.push(['TR Number', 'Document Name / Date', 'In (+)', 'Out (-)', 'Running Balance']);
        
        startRowIndex = 0;
        
        formatRequests.push(
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 5 },
              cell: { userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, textFormat: { bold: true } } },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
              fields: 'userEnteredFormat(textFormat)'
            }
          },
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 2 },
              cell: { userEnteredFormat: { textFormat: { bold: true, foregroundColor: { red: 0, green: 0.4, blue: 0.8 } } } },
              fields: 'userEnteredFormat(textFormat)'
            }
          }
        );
      }
      
      if (item.breakdown && Array.isArray(item.breakdown)) {
        item.breakdown.forEach((b: any) => {
          const inQty = b.qty > 0 ? b.qty : '';
          const outQty = b.qty < 0 ? Math.abs(b.qty) : '';
          newRows.push([
            trNumber || '',
            b.docName,
            inQty,
            outQty,
            `=SUM(INDIRECT("C$6:C"&ROW()))-SUM(INDIRECT("D$6:D"&ROW()))`
          ]);
        });
      }

      dataToUpdate.push({
        range: `'${title}'!A${startRowIndex + 1}`,
        values: newRows
      });
    });

    // Write data
    await sheetsService.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: dataToUpdate
      }
    });

    // Write formatting
    if (formatRequests.length > 0) {
      await sheetsService.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: formatRequests
        }
      });
    }

    res.json({ success: true, spreadsheetUrl });
  } catch (error: any) {
    console.error('Error exporting to sheets:', error);
    res.status(500).json({ error: 'Failed to export to Google Sheets', message: error.message });
  }
});



// OCR Processing endpoint for document image
app.post('/api/process-document', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'API Key Missing', 
      message: 'GEMINI_API_KEY environment variable is not set. Please add it to your Railway project variables.' 
    });
  }

  try {
    const { imageBase64, filename } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter' });
    }

    let base64Data = imageBase64;
    let mimeType = 'image/png';

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        documentTitle: { type: Type.STRING, description: "Title or header of document if present" },
        invoiceNumber: { type: Type.STRING, description: "Invoice or summary number if present" },
        date: { type: Type.STRING, description: "Document date if present" },
        detectedGrayRowsCount: { type: Type.NUMBER, description: "Count of items found with gray background" },
        items: {
          type: Type.ARRAY,
          description: "List of items extracted strictly from GRAY highlighted background rows",
          items: {
            type: Type.OBJECT,
            properties: {
              itemCode: { type: Type.STRING, description: "Item code or SKU if visible" },
              itemDescription: { type: Type.STRING, description: "Full item description/name" },
              qty: { type: Type.NUMBER, description: "Quantity quantity integer/float" },
              notes: { type: Type.STRING, description: "Additional details if any" },
              isHighlightedGray: { type: Type.BOOLEAN, description: "True if row has gray/grey background shading" }
            },
            required: ['itemDescription', 'qty']
          }
        }
      },
      required: ['items']
    };

    const promptText = `
    You are KOBE, an expert OCR document parser for Loading Invoice Summaries and Freight Delivery Slips.
    
    INSTRUCTIONS:
    1. Inspect the document or image carefully.
    2. Focus on table rows that are HIGHLIGHTED or SHADED WITH A GRAY BACKGROUND (grey rows).
    3. Extract ONLY the main item rows that are highlighted in GRAY background.
    4. IGNORE:
       - Customer names, shop names, invoice numbers, dates, addresses, driver names, route info.
       - Any secondary invoice lines or rows that have a PLAIN WHITE or light unshaded background.
    5. For each gray highlighted item row, extract:
       - "itemCode": Code/SKU if listed in that row (or empty string)
       - "itemDescription": Full clean item description
       - "qty": Quantity value as a positive number
       - "isHighlightedGray": true
    6. If NO rows have gray shading specifically, extract all valid item table rows from the main item table as fallback.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction: 'You are KOBE document OCR parser. Target and extract ONLY main item rows highlighted in GRAY background. Ignore secondary unshaded lines and invoice headers.',
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      console.error('JSON parsing error from Gemini response:', e, jsonText);
      parsedData = { items: [] };
    }

    res.json({
      success: true,
      filename: filename || 'Document',
      documentTitle: parsedData.documentTitle || filename,
      invoiceNumber: parsedData.invoiceNumber || '',
      date: parsedData.date || '',
      detectedGrayRowsCount: parsedData.detectedGrayRowsCount || parsedData.items?.length || 0,
      extractedItems: (parsedData.items || []).map((item: any, idx: number) => ({
        id: `extracted-${Date.now()}-${idx}`,
        itemCode: item.itemCode || '',
        itemDescription: item.itemDescription || 'Unknown Item',
        qty: typeof item.qty === 'number' ? item.qty : parseFloat(item.qty) || 1,
        notes: item.notes || '',
        isHighlightedGray: item.isHighlightedGray ?? true,
      })),
    });
  } catch (error: any) {
    console.error('Error processing document OCR:', error);
    res.status(500).json({
      error: 'Failed to process document with Gemini OCR',
      message: error?.message || 'Unknown error',
    });
  }
});

// Vite middleware for development / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
