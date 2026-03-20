const API_BASE = 'https://script.google.com/macros/s/AKfycbyBI057BE3CT_ddaSWjk7Z_xnV4Jirza-L-_QjtlkMWF_R-IFpFGm_6ZIv625NYmg/exec';

export async function fetchSheet(sheetName: string) {
  const res = await fetch(`${API_BASE}?sheetName=${encodeURIComponent(sheetName)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);
  const data = await res.json();
  if (data && data.error) {
    console.warn(`Sheet error for ${sheetName}:`, data.error);
    return []; // Return empty array if sheet not found or other error
  }
  return Array.isArray(data) ? data : [];
}

export async function addRow(sheetName: string, data: any) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'add', sheetName, data }),
  });
  if (!res.ok) throw new Error(`Failed to add row to ${sheetName}`);
  const result = await res.json();
  console.log('addRow result:', result);
  if (result.error) throw new Error(result.error);
  return result;
}

export async function updateRow(sheetName: string, rowIndex: number, data: any) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'update', sheetName, rowIndex, data }),
  });
  if (!res.ok) throw new Error(`Failed to update row in ${sheetName}`);
  const result = await res.json();
  if (result.error) throw new Error(result.error);
  return result;
}

export async function deleteRow(sheetName: string, rowIndex: number) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', sheetName, rowIndex }),
  });
  if (!res.ok) throw new Error(`Failed to delete row from ${sheetName}`);
  const result = await res.json();
  if (result.error) throw new Error(result.error);
  return result;
}

export async function uploadFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await fetch(API_BASE, {
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
        
        // Add webViewLink for compatibility with older components
        if (result.url && !result.webViewLink) {
          result.webViewLink = result.url;
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
