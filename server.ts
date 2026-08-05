import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'KOBE Item Aggregator' });
});

// OCR Processing endpoint for document image
app.post('/api/process-document', async (req, res) => {
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
    1. Inspect the document image carefully.
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
      error: 'Failed to process document image with Gemini OCR',
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
