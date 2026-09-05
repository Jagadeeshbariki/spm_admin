const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || '';
let privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
const beginMatch = privateKey.match(/-----BEGIN [A-Z ]+-----/);
const endMatch = privateKey.match(/-----END [A-Z ]+-----/);

if (beginMatch && endMatch) {
  const begin = beginMatch[0];
  const end = endMatch[0];
  const body = privateKey
    .substring(privateKey.indexOf(begin) + begin.length, privateKey.indexOf(end))
    .replace(/\s+/g, '');
  const formattedBody = body.match(/.{1,64}/g)?.join('\n') || body;
  privateKey = `${begin}\n${formattedBody}\n${end}`;
}

const crypto = require('crypto');
try {
  crypto.createPrivateKey(privateKey);
  console.log("Valid private key!");
} catch (e) {
  console.log("Error:", e.message);
  console.log("Formatted key:", privateKey);
}
