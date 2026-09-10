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
            resCandidate = await fetch(currentUrl, {
              headers: requestHeaders,
              redirect: 'manual'
            });
            
            if (resCandidate.status >= 300 && resCandidate.status < 400 && resCandidate.headers.has('location')) {
              const loc = resCandidate.headers.get('location');
              const redirectUrlObj = new URL(loc as string, currentUrl);
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
            successfulUrl = url;
            break;
          } else if (resCandidate) {
            lastStatus = resCandidate.status;
            if (resCandidate.status !== 404) {
               lastErrText = await resCandidate.text();
            }
          }
        } catch (err: any) {
           console.error("Fetch attempt error:", url, err.message);
        }
      }
      if (successfulRes) break;
    }

    if (!successfulRes) {
      const errMsg = `ODK Error: Image not found after checking forms. Status: ${lastStatus}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="100%" height="100%" fill="#fee2e2"/><text x="10" y="50" font-family="monospace" font-size="12" fill="#991b1b">${errMsg}</text></svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(lastStatus).send(svg);
    }

    const contentType = successfulRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    const buffer = await successfulRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
    
  } catch (error: any) {
    console.error('Error proxying ODK image:', error.message || error);
    res.status(500).json({ error: error.message || 'InternalServerError' });
  }
}
