import { AggregatedItem } from '../types';

export const exportToGoogleSheets = async (
  aggregatedItems: AggregatedItem[],
  totalDocsCount: number,
  grandTotalAllItems: number,
  trNumber?: string,
  masterSpreadsheetId?: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const configRes = await fetch('/api/config');
      const config = await configRes.json();

      if (!config.oAuthClientId) {
        return reject(new Error('OAuth Client ID is not configured.'));
      }

      if (!(window as any).google?.accounts?.oauth2) {
         return reject(new Error('Google Identity Services script not loaded.'));
      }

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: config.oAuthClientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              const exportRes = await fetch('/api/export-to-sheets', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${response.access_token}`
                },
                body: JSON.stringify({
                  items: aggregatedItems,
                  totalDocs: totalDocsCount,
                  grandTotal: grandTotalAllItems,
                  trNumber,
                  spreadsheetId: masterSpreadsheetId
                })
              });

              const exportData = await exportRes.json();
              
              if (exportData.success && exportData.spreadsheetUrl) {
                resolve(exportData.spreadsheetUrl);
              } else {
                reject(new Error('Export failed: ' + (exportData.message || exportData.error)));
              }
            } catch (err: any) {
              reject(new Error('Export error: ' + err.message));
            }
          } else {
             reject(new Error('Authentication failed or was cancelled.'));
          }
        },
        error_callback: (err: any) => {
          console.error('OAuth error:', err);
          reject(new Error('OAuth error occurred.'));
        }
      });
      
      client.requestAccessToken();
    } catch (err: any) {
      reject(err);
    }
  });
};
