const API_BASE = 'https://script.google.com/macros/s/AKfycbzRx6plxswS1MkTSm6mB5KsVsOn9Ws6PdafrLBPrz2RikyD9VeXoLs1ImjPxPrPsw0j_g/exec';

async function fetchWithFallback(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (error: any) {
    console.warn('Direct fetch failed, attempting via proxy...', error);
    // Fallback to a CORS proxy if the browser blocks the direct connection (common in iframes/incognito)
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, options);
    return res;
  }
}

export async function fetchSheet(sheetName: string) {
  try {
    const url = `${API_BASE}?sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    const res = await fetchWithFallback(url);
    if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);
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
    const res = await fetchWithFallback(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'add', sheetName, data }),
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
    const res = await fetchWithFallback(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'update', sheetName, rowIndex, data }),
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
    const res = await fetchWithFallback(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', sheetName, rowIndex }),
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

export async function uploadFile(file: File): Promise<any> {
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
            fileName: file.name
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
