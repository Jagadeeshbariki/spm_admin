const API_BASE = '/api';

export async function fetchSheet(sheetName: string) {
  const res = await fetch(`${API_BASE}/sheets/${sheetName}`);
  if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);
  return res.json();
}

export async function addRow(sheetName: string, data: any) {
  const res = await fetch(`${API_BASE}/sheets/${sheetName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to add row to ${sheetName}`);
  return res.json();
}

export async function updateRow(sheetName: string, rowIndex: number, data: any) {
  const res = await fetch(`${API_BASE}/sheets/${sheetName}/${rowIndex}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update row in ${sheetName}`);
  return res.json();
}

export async function deleteRow(sheetName: string, rowIndex: number) {
  const res = await fetch(`${API_BASE}/sheets/${sheetName}/${rowIndex}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete row from ${sheetName}`);
  return res.json();
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.json();
}
