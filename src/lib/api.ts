const API_BASE = 'https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec';

const OFFICE_ADMIN_SPREADSHEET_ID = '18Afss-S7VLMhgGluuwm4RanzyRfew61NLa_QzmBxHz4';
const WATER_COLLECTIVE_SPREADSHEET_ID = '1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo';
const MAIL_TRACKER_SPREADSHEET_ID = '18cmONE4zcVWsfWJ42vSUUX-LYjt-GEe-sRPfizHbQic'; // Replace with your Application_Mail Tracker Spreadsheet ID

export const ADMIN_FOLDER_ID = '1d_4gLeoJ84zPrUe-vPJDR-f5b4V-ksY3';
export const WATER_COLLECTIVES_FOLDER_ID = '1gga5glk6oNlI5tRDZFMthh4B-sUa0NnG';

function getSpreadsheetId(sheetName: string) {
  if (sheetName === 'water_collectives' || sheetName === 'Polygons_manyam') {
    return WATER_COLLECTIVE_SPREADSHEET_ID;
  }
  if (sheetName === 'mail_tracker' || sheetName === 'mail_tracker_batches') {
    return MAIL_TRACKER_SPREADSHEET_ID;
  }
  if (sheetName === 'village_assets') {
    return WATER_COLLECTIVE_SPREADSHEET_ID;
  }
  return OFFICE_ADMIN_SPREADSHEET_ID;
}

async function fetchWithFallback(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  // Increased timeout to 60 seconds for larger GeoJSON files
  const timeoutId = setTimeout(() => controller.abort(), 60000); 

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Loading is taking longer than expected. Please check your internet or retry.');
    }

    console.warn('Direct fetch failed, attempting via proxy...', error);
    
    // Fallback to a CORS proxy if the browser blocks the direct connection
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const proxyController = new AbortController();
    const proxyTimeoutId = setTimeout(() => proxyController.abort(), 25000); // Slightly longer for proxy
    
    try {
      const res = await fetch(proxyUrl, { ...options, signal: proxyController.signal });
      clearTimeout(proxyTimeoutId);
      return res;
    } catch (proxyError: any) {
      clearTimeout(proxyTimeoutId);
      if (proxyError.name === 'AbortError') {
        throw new Error('Proxy request timed out.');
      }
      throw proxyError;
    }
  }
}

export async function fetchSheet(sheetName: string) {
  try {
    const spreadsheetId = getSpreadsheetId(sheetName);
    const url = `${API_BASE}?sheetName=${encodeURIComponent(sheetName)}&spreadsheetId=${encodeURIComponent(spreadsheetId)}&t=${Date.now()}`;
    const res = await fetchWithFallback(url);
    if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return []; // Silently fail if it's HTML, to avoid crashing component
    }

    const data = await res.json();
    if (data && data.error) {
      console.warn(`Sheet error for ${sheetName}:`, data.error);
      return []; 
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Fetch error:', error);
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".');
    }
    throw error;
  }
}

export async function addRow(sheetName: string, data: any) {
  try {
    const spreadsheetId = getSpreadsheetId(sheetName);
    const res = await fetchWithFallback(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'add', sheetName, spreadsheetId, data }),
    });
    if (!res.ok) throw new Error(`Failed to add row to ${sheetName}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".');
    }
    throw error;
  }
}

export async function updateRow(sheetName: string, rowIndex: number, data: any) {
  try {
    const spreadsheetId = getSpreadsheetId(sheetName);
    const res = await fetchWithFallback(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'update', sheetName, spreadsheetId, rowIndex, data }),
    });
    if (!res.ok) throw new Error(`Failed to update row in ${sheetName}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".');
    }
    throw error;
  }
}

export async function deleteRow(sheetName: string, rowIndex: number) {
  try {
    const spreadsheetId = getSpreadsheetId(sheetName);
    const res = await fetchWithFallback(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', sheetName, spreadsheetId, rowIndex }),
    });
    if (!res.ok) throw new Error(`Failed to delete row from ${sheetName}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".');
    }
    throw error;
  }
}

export async function fetchFileContent(fileId: string) {
  try {
    const url = `${API_BASE}?action=getFile&fileId=${encodeURIComponent(fileId)}&t=${Date.now()}`;
    const res = await fetchWithFallback(url);
    if (!res.ok) throw new Error('Failed to fetch file');

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned HTML instead of file data. This often means the Google script or Drive link is unauthorized or incorrect.');
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    return data.content || '';
  } catch (error: any) {
    console.error('Fetch file content error:', error);
    throw error;
  }
}

export async function fetchGeoJson(fileId: string) {
  try {
    const content = await fetchFileContent(fileId);
    if (!content) return null;
    return JSON.parse(content);
  } catch (error: any) {
    console.error(`Error parsing GeoJSON ${fileId}:`, error);
    throw new Error(`Failed to load GeoJSON (${fileId}).`);
  }
}

export async function getSetting(category: string, key: string): Promise<string | null> {
  try {
    const masterData = await fetchSheet('MasterData');
    const filtered = masterData.filter(item => 
      item.formname === 'GIS Configuration' && 
      item['dropdwon catagorty'] === category && 
      item['dropdwon options'] === key
    );
    const setting = filtered[filtered.length - 1]; // Get the latest upload
    return setting ? setting.value || setting['dropdwon options'] : null;
  } catch (e) {
    return null;
  }
}

export async function uploadFile(file: File, folderId: string = ADMIN_FOLDER_ID): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetchWithFallback(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'upload',
            base64: base64String,
            mimeType: file.type,
            fileName: file.name,
            folderId: folderId
          }),
        });
        if (!res.ok) throw new Error('Failed to upload file');
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        
        if (result.url && !result.webViewLink) {
          result.webViewLink = result.url;
        }
        
        resolve(result);
      } catch (error: any) {
        if (error.message === 'Failed to fetch') {
          reject(new Error('Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".'));
        } else {
          reject(error);
        }
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
