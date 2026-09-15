import re

with open('server.ts', 'r') as f:
    content = f.read()

target = """    const fetchResponse = await fetch(scriptUrl);
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ error: 'Failed to fetch from Apps Script' });
    }
    const data = await fetchResponse.json();
    if (data.error) {
       return res.status(400).json({ error: data.error });
    }"""

replacement = """    const fetchResponse = await fetch(scriptUrl);
    if (!fetchResponse.ok) {
      console.error(`Apps Script fetch failed: ${fetchResponse.status}`);
      return res.status(fetchResponse.status).json({ error: 'Failed to fetch from Apps Script' });
    }
    const text = await fetchResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      console.error('Failed to parse Apps Script response as JSON:', text.substring(0, 200));
      return res.status(500).json({ error: 'Invalid response from Apps Script' });
    }
    if (data.error) {
       console.error(`Apps Script returned error:`, data.error);
       return res.status(400).json({ error: data.error });
    }"""

content = content.replace(target, replacement)

with open('server.ts', 'w') as f:
    f.write(content)
