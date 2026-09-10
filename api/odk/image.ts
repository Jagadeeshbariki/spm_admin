import type { VercelRequest, VercelResponse } from '@vercel/node';

let odkToken: string | null = null;
let odkTokenExpiresAt = 0;

async function getOdkToken() {
  if (odkToken && Date.now() < odkTokenExpiresAt) {
    return odkToken;
  }

  const email = process.env.ODK_EMAIL;
  const password = process.env.ODK_PASSWORD;

  if (!email || !password) {
    throw new Error('ODK credentials not configured (ODK_EMAIL, ODK_PASSWORD)');
  }

  const res = await fetch('https://central.wassan.org/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Failed to authenticate with ODK: ${res.status}`);
  }

  const data = await res.json();
  odkToken = data.token;
  odkTokenExpiresAt = new Date(data.expiresAt).getTime() - 60000;
  return odkToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { submissionId, filename } = req.query;
    if (!submissionId || !filename || typeof submissionId !== 'string' || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid submissionId or filename parameter' });
    }

    const token = await getOdkToken();
    const url = `https://central.wassan.org/v1/projects/3/forms/Processing%20Units%20Mapping/submissions/${encodeURIComponent(submissionId)}/attachments/${encodeURIComponent(filename)}`;
    
    const imageRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!imageRes.ok) {
      const errText = await imageRes.text();
      const status = imageRes.status;
      const errMsg = `ODK Error ${status}: ${errText.substring(0, 50)}`;
      console.error('ODK Fetch Error:', url, status, errText);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="100%" height="100%" fill="#fee2e2"/><text x="10" y="50" font-family="monospace" font-size="12" fill="#991b1b">${errMsg}</text></svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(status).send(svg);
    }

    const contentType = imageRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    const buffer = await imageRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('Error proxying ODK image:', error.message || error);
    res.status(500).json({ error: error.message || 'InternalServerError' });
  }
}
