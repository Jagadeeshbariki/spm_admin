import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google APIs
const getGoogleAuth = () => {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const begin = '-----BEGIN PRIVATE KEY-----';
    const end = '-----END PRIVATE KEY-----';
    
    if (privateKey.includes(begin) && privateKey.includes(end)) {
      const keyBodyStartIndex = privateKey.indexOf(begin) + begin.length;
      const keyBodyEndIndex = privateKey.indexOf(end);
      const keyBody = privateKey.substring(keyBodyStartIndex, keyBodyEndIndex).replace(/\s+/g, '');
      const lines = keyBody.match(/.{1,64}/g) || [];
      privateKey = `${begin}\n${lines.join('\n')}\n${end}`;
    }
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    return null;
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
app.get('/api/sheets/:sheetName', async (req, res) => {
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

// Upload a file to Google Drive
app.post('/api/upload', upload.single('file'), async (req, res) => {
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

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
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
