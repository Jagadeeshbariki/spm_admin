import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace fetch calls with timeout wrapped fetch calls
const fetchWithTimeoutCode = `
async function fetchWithTimeout(url, options = {}, timeoutMs = 8500) {
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
`;

content = content.replace('import express', fetchWithTimeoutCode + '\nimport express');

content = content.replace(
  `tokenPromise = fetch('https://central.wassan.org/v1/sessions', {`,
  `tokenPromise = fetchWithTimeout('https://central.wassan.org/v1/sessions', {`
);

content = content.replace(
  `const response = await fetch(url, {`,
  `const response = await fetchWithTimeout(url, {`
);

content = content.replace(
  `resCandidate = await fetch(currentUrl, {`,
  `resCandidate = await fetchWithTimeout(currentUrl, {`
);

fs.writeFileSync('server.ts', content);
