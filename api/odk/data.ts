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
    const errText = await res.text();
    throw new Error(`Failed to authenticate with ODK (${res.status}): ${errText}`);
  }

  const data = await res.json();
  odkToken = data.token;
  odkTokenExpiresAt = new Date(data.expiresAt).getTime() - 60000;
  return odkToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { formId } = req.query;
    if (!formId || typeof formId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid formId parameter' });
    }

    let cleanFormId = formId;
    if (cleanFormId.endsWith('.svc')) {
      cleanFormId = cleanFormId.slice(0, -4);
    }
    try {
      cleanFormId = decodeURIComponent(cleanFormId);
    } catch (e) {}

    const token = await getOdkToken();
    const url = `https://central.wassan.org/v1/projects/3/forms/${encodeURIComponent(cleanFormId)}.svc/Submissions?$expand=*`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ODK Data Fetch Error:', response.status, errText);
      return res.status(response.status).json({ error: 'Failed to fetch data from ODK', details: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error proxying ODK data:', error.message || error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
