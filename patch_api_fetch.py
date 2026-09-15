import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

target = """export async function fetchFileContent(fileId: string) {
  try {
    const cleanId = fileId.trim();
    console.log(`Fetching file content for ID: "${cleanId}"`);
    const res = await fetch(`/api/drive/file/${encodeURIComponent(cleanId)}`);
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch file: ${res.status} - ${errorText}`);
    }
    
    const text = await res.text();"""

replacement = """export async function fetchFileContent(fileId: string) {
  try {
    const cleanId = fileId.trim();
    console.log(`Fetching file content for ID: "${cleanId}"`);
    
    // Fallback to Apps Script directly
    const scriptUrl = `https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec?action=getFile&fileId=${encodeURIComponent(cleanId)}&t=${Date.now()}`;
    
    let res;
    try {
      res = await fetch(`/api/drive/file/${encodeURIComponent(cleanId)}`);
    } catch(e) {
      console.warn("Proxy fetch failed, falling back to direct Apps Script fetch", e);
      res = await fetch(scriptUrl);
    }
    
    if (!res.ok) {
        // Fallback again just in case
        console.warn(`Proxy returned ${res.status}, falling back to direct Apps Script fetch`);
        res = await fetch(scriptUrl);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to fetch file: ${res.status} - ${errorText}`);
        }
    }
    
    let text = await res.text();
    // Sometimes Apps script direct returns { content: "..." }
    try {
       const parsed = JSON.parse(text);
       if (parsed && parsed.content) {
           text = parsed.content;
       }
    } catch(e) {}
    """

content = content.replace(target, replacement)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
