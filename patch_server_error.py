import re

with open('server.ts', 'r') as f:
    content = f.read()

old_error = """      const errMsg = `ODK Error ${status}: ${errText.substring(0, 50)}`;
      console.error('ODK Fetch Error:', url, status, errText);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="100%" height="100%" fill="#fee2e2"/><text x="10" y="50" font-family="monospace" font-size="12" fill="#991b1b">${errMsg}</text></svg>`;"""

new_error = """      const errMsg = `ODK Error ${status}: ${errText.substring(0, 50)}`;
      console.error('ODK Fetch Error:', url, status, errText);
      const debugInfo = `URL: ${url}`.substring(0, 100);
      const debugInfo2 = `Q: ${JSON.stringify(req.query)}`.substring(0, 100);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200"><rect width="100%" height="100%" fill="#fee2e2"/><text x="10" y="30" font-family="monospace" font-size="12" fill="#991b1b">${errMsg}</text><text x="10" y="60" font-family="monospace" font-size="10" fill="#991b1b">${debugInfo}</text><text x="10" y="90" font-family="monospace" font-size="10" fill="#991b1b">${debugInfo2}</text></svg>`;"""

content = content.replace(old_error, new_error)

with open('server.ts', 'w') as f:
    f.write(content)
