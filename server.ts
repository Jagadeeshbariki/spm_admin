
async function fetchWithTimeout(url, options = {}, timeoutMs = 55000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after ' + timeoutMs + 'ms');
    }
    throw error;
  }
}

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Try to use import.meta.url if available (ESM), fallback to process.cwd() (CJS bundle)
let __dirname = '';
try {
  const metaUrl = typeof import.meta !== 'undefined' ? (import.meta as any).url : null;
  if (metaUrl) {
    __dirname = path.dirname(fileURLToPath(metaUrl));
  } else {
    __dirname = process.cwd();
  }
} catch (e) {
  __dirname = process.cwd();
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google APIs
const getGoogleAuth = () => {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return null;
  }

  try {
    // 1. Check if user accidentally pasted the entire JSON file content
    const parsed = JSON.parse(privateKey);
    if (parsed.private_key) {
      privateKey = parsed.private_key;
    }
  } catch (e) {
    // Not JSON, proceed normally
  }

  // 2. Remove surrounding quotes if present
  privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
  
  // 3. Replace literal '\n' strings with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  // 4. Ensure proper PEM formatting
  const beginMatch = privateKey.match(/-----BEGIN [A-Z ]+-----/);
  const endMatch = privateKey.match(/-----END [A-Z ]+-----/);
  
  if (beginMatch && endMatch) {
    const begin = beginMatch[0];
    const end = endMatch[0];
    const body = privateKey
      .substring(privateKey.indexOf(begin) + begin.length, privateKey.indexOf(end))
      .replace(/\s+/g, ''); // Remove all whitespace/newlines from body
    
    const formattedBody = body.match(/.{1,64}/g)?.join('\n') || body;
    privateKey = `${begin}\n${formattedBody}\n${end}`;
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
};

const getSheetsClient = async () => {
  const auth = getGoogleAuth();
  if (!auth) return null;
  return google.sheets({ version: 'v4', auth });
};

const getDriveClient = async () => {
  const auth = getGoogleAuth();
  if (!auth) return null;
  return google.drive({ version: 'v3', auth });
};

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Helper to get headers
const getHeaders = async (sheetName: string) => {
  const sheets = await getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) throw new Error('Google Sheets not configured');
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!1:1`,
  });
  return response.data.values?.[0] || [];
};

// --- API Routes ---

// Get all rows from a sheet
app.get(['/api/sheets/:sheetName', '/api/sheets/:sheetName/'], async (req, res) => {
  try {
    const { sheetName } = req.params;
    const sheets = await getSheetsClient();
    if (!sheets || !SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return res.json([]);

    const headers = rows[0];
    const data = rows.slice(1).map((row, index) => {
      const obj: any = { _rowIndex: index + 2 }; // +2 because 1-based index and header row
      headers.forEach((header: string, i: number) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    res.json(data);
  } catch (error: any) {
    console.error(`Error fetching sheet ${req.params.sheetName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Add a row to a sheet
app.post('/api/sheets/:sheetName', async (req, res) => {
  try {
    const { sheetName } = req.params;
    const data = req.body;
    const sheets = await getSheetsClient();
    if (!sheets || !SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const headers = await getHeaders(sheetName);
    const rowData = headers.map((header: string) => data[header] || '');

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error adding to sheet ${req.params.sheetName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Update a row in a sheet
app.put('/api/sheets/:sheetName/:rowIndex', async (req, res) => {
  try {
    const { sheetName, rowIndex } = req.params;
    const data = req.body;
    const sheets = await getSheetsClient();
    if (!sheets || !SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const headers = await getHeaders(sheetName);
    const rowData = headers.map((header: string) => data[header] || '');

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating sheet ${req.params.sheetName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a row from a sheet
app.delete('/api/sheets/:sheetName/:rowIndex', async (req, res) => {
  try {
    const { sheetName, rowIndex } = req.params;
    const sheets = await getSheetsClient();
    if (!sheets || !SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // To delete a row, we need the sheet ID (gid)
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) {
      return res.status(404).json({ error: `Sheet ${sheetName} not found` });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: parseInt(rowIndex) - 1,
                endIndex: parseInt(rowIndex),
              },
            },
          },
        ],
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting from sheet ${req.params.sheetName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy for Google Apps Script to bypass CORS
app.all(['/api/proxy/script', '/api/proxy/script/'], async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target url parameter' });
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Accept': req.headers.accept || '*/*',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'text/plain;charset=utf-8', // Google Scripts prefer text/plain
      };
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    if (contentType && contentType.includes('application/json')) {
       try {
         return res.json(JSON.parse(text));
       } catch (e) {
         return res.send(text);
       }
    }
    
    res.send(text);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download a file from Google Drive via the Apps Script proxy
app.get(['/api/drive/file/:fileId', '/api/drive/file/:fileId/'], async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).json({ error: 'No file ID provided' });
    }

    const scriptUrl = `https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec?action=getFile&fileId=${encodeURIComponent(fileId)}&t=${Date.now()}`;
    
    // Node 18+ has native fetch. Let's fetch and send back the content
    const fetchResponse = await fetch(scriptUrl);
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ error: 'Failed to fetch from Apps Script' });
    }

    const data = await fetchResponse.json();
    if (data.error) {
       return res.status(400).json({ error: data.error });
    }
    
    // The Apps Script returns { content: "..." }
    res.send(data.content || "");
      
  } catch (error: any) {
    console.error(`Error downloading file ${req.params.fileId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Upload a file to Google Drive
app.post(['/api/upload', '/api/upload/'], upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const drive = await getDriveClient();
    if (!drive || !DRIVE_FOLDER_ID) {
      return res.status(500).json({ error: 'Google Drive not configured' });
    }

    // Convert buffer to stream
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(req.file.buffer);
    stream.push(null);

    const fileMetadata = {
      name: req.file.originalname,
      parents: [DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: stream,
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Make the file readable by anyone with the link
    if (driveResponse.data.id) {
      await drive.permissions.create({
        fileId: driveResponse.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    res.json({ 
      success: true, 
      url: driveResponse.data.webViewLink,
      id: driveResponse.data.id 
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- ODK Central Proxy ---
let odkToken: string | null = null;
let odkTokenExpiresAt = 0;
let tokenPromise: Promise<string> | null = null;

async function getOdkToken() {
  if (odkToken && Date.now() < odkTokenExpiresAt) {
    return odkToken;
  }
  if (tokenPromise) {
    return tokenPromise;
  }

  const email = process.env.ODK_EMAIL;
  const password = process.env.ODK_PASSWORD;

  if (!email || !password) {
    throw new Error('ODK credentials not configured (ODK_EMAIL, ODK_PASSWORD)');
  }

  tokenPromise = fetchWithTimeout('https://central.wassan.org/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(async (response) => {
    if (!response.ok) {
      tokenPromise = null;
      throw new Error('Failed to authenticate with ODK Central');
    }
    const data = await response.json();
    odkToken = data.token;
    odkTokenExpiresAt = new Date(data.expiresAt).getTime() - 60000;
    tokenPromise = null;
    return odkToken;
  }).catch(err => {
    tokenPromise = null;
    throw err;
  });

  return tokenPromise;
}

app.get(["/api/odk/data", "/api/odk/data/"], async (req, res) => {
  try {
    const { formId, table } = req.query;
    if (!formId || typeof formId !== "string") {
      return res.status(400).json({ error: "Missing or invalid formId parameter" });
    }
    let cleanFormId = formId;
    if (cleanFormId.endsWith('.svc')) {
      cleanFormId = cleanFormId.slice(0, -4);
    }
    try {
      cleanFormId = decodeURIComponent(cleanFormId);
    } catch (e) {}

    const token = await getOdkToken();
    let url = `https://central.wassan.org/v1/projects/3/forms/${encodeURIComponent(cleanFormId)}.svc/Submissions?$expand=*`;
    
    if (table && typeof table === 'string') {
      // e.g., table = "Submissions.application_bio_input"
      url = `https://central.wassan.org/v1/projects/3/forms/${encodeURIComponent(cleanFormId)}.svc/${table}`;
    }
    const response = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("ODK Data Fetch Error:", response.status, errText);
      return res.status(response.status).json({ error: "Failed to fetch data from ODK", details: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error proxying ODK data:", error);
    res.status(500).json({ error: error.message || "Internal server error fetching ODK data" });
  }
});

app.get(['/api/odk/image', '/api/odk/image/'], async (req, res) => {
  try {
    const { submissionId, filename, formId } = req.query;
    if (!submissionId || !filename || typeof submissionId !== 'string' || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid submissionId or filename parameter' });
    }

    // 1. Clean and normalize filename
    let cleanFilename = decodeURIComponent(String(filename)).trim();

    // 2. Clean and normalize submission ID
    let rawSub = decodeURIComponent(String(submissionId)).trim();
    while (rawSub.toLowerCase().startsWith('uuid:')) {
      rawSub = rawSub.slice(5).trim();
    }
    const subIdVariants = [`uuid:${rawSub}`, rawSub];

    // 3. Build candidate forms list to search
    const candidateForms: string[] = [];
    if (formId && typeof formId === 'string' && formId !== 'undefined' && formId !== 'null') {
      let f = decodeURIComponent(formId).trim();
      if (f.endsWith('.svc')) {
        f = f.slice(0, -4).trim();
      }
      if (f) {
        candidateForms.push(f);
        if (f.includes('-') && !f.includes('- ')) {
          candidateForms.push(f.replace('-', '- '));
        }
        if (f.includes('- ')) {
          candidateForms.push(f.replace('- ', '-'));
        }
      }
    }

    // Always include the main forms as fallback
    const defaultForms = [
      'NF- Register',
      'NF- Activities',
      'Processing Units Mapping',
      'BRC_Units',
      'Micro Enterprizes',
      'Beneficiary Register',
      'Material_distribution'
    ];
    for (const df of defaultForms) {
      if (!candidateForms.includes(df)) {
        candidateForms.push(df);
      }
    }

    const token = await getOdkToken();
    let successfulRes: Response | null = null;
    let successfulUrl = '';
    let lastStatus = 404;
    let lastErrText = '';

    // Search across candidate forms and submission ID variants
    for (const form of candidateForms) {
      for (const subIdToTry of subIdVariants) {
        const url = `https://central.wassan.org/v1/projects/3/forms/${encodeURIComponent(form)}/submissions/${encodeURIComponent(subIdToTry)}/attachments/${encodeURIComponent(cleanFilename)}`;
        
        try {
          let currentUrl = url;
          let followRedirects = 5;
          let requestHeaders: HeadersInit = { Authorization: `Bearer ${token}` };
          let resCandidate: Response | null = null;

          while (followRedirects > 0) {
            resCandidate = await fetchWithTimeout(currentUrl, {
              headers: requestHeaders,
              redirect: 'manual'
            });

            if (resCandidate.status >= 300 && resCandidate.status < 400 && resCandidate.headers.has('location')) {
              const loc = resCandidate.headers.get('location')!;
              const redirectUrlObj = new URL(loc, currentUrl);
              currentUrl = redirectUrlObj.toString();
              followRedirects--;
              if (redirectUrlObj.hostname !== 'central.wassan.org') {
                requestHeaders = {};
              }
            } else {
              break;
            }
          }

          if (resCandidate && resCandidate.ok) {
            successfulRes = resCandidate;
            successfulUrl = currentUrl;
            break;
          } else if (resCandidate) {
            lastStatus = resCandidate.status;
            lastErrText = await resCandidate.text();
          }
        } catch (err: any) {
          lastErrText = err.message || 'Fetch error';
        }
      }
      if (successfulRes) break;
    }

    if (!successfulRes || !successfulRes.ok) {
      console.error('ODK Image Not Found after checking all candidate forms:', { cleanFilename, rawSub, candidateForms, lastStatus, lastErrText });
      const errMsg = `ODK Error ${lastStatus}: Image not found`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120"><rect width="100%" height="100%" fill="#fee2e2" rx="8"/><text x="16" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#991b1b">${errMsg}</text><text x="16" y="75" font-family="monospace" font-size="11" fill="#b91c1c">File: ${cleanFilename.substring(0, 50)}</text><text x="16" y="95" font-family="monospace" font-size="10" fill="#7f1d1d">Sub: ${rawSub.substring(0, 50)}</text></svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(lastStatus === 404 ? 404 : 500).send(svg);
    }

    const contentType = successfulRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (successfulRes.body) {
      const buffer = await successfulRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      res.status(500).send('No image body');
    }
  } catch (error: any) {
    console.error('Error proxying ODK image:', error.message || error);
    
    let svg = '';
    if (error.message && error.message.includes('ODK credentials not configured')) {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="150">
        <rect width="100%" height="100%" fill="#fef2f2" rx="8"/>
        <text x="20" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#991b1b">API Keys Missing</text>
        <text x="20" y="70" font-family="sans-serif" font-size="14" fill="#7f1d1d">To view images in the Live Preview:</text>
        <text x="20" y="95" font-family="sans-serif" font-size="13" fill="#7f1d1d">1. Click the "Settings" gear icon in the top right.</text>
        <text x="20" y="115" font-family="sans-serif" font-size="13" fill="#7f1d1d">2. Add ODK_EMAIL and ODK_PASSWORD secrets.</text>
      </svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80"><rect width="100%" height="100%" fill="#fee2e2" rx="8"/><text x="16" y="45" font-family="sans-serif" font-size="13" fill="#991b1b">Proxy Error: ${error.message || 'Unknown'}</text></svg>`;
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).send(svg);
  }
});

// --- Vite Integration ---
// Export for Vercel
export default app;

async function startServer() {
  // If running in Vercel, do not start the server manually
  if (process.env.VERCEL) {
    return;
  }
  
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist')) 
      ? path.join(process.cwd(), 'dist')
      : (fs.existsSync(path.join(__dirname, 'dist')) ? path.join(__dirname, 'dist') : __dirname);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
