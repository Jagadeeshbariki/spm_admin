const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace console.log("Success with...", currentUrl);
const toFind = `// If we found it, return it`;
const replace = `
    console.log("ODK Image Fetch - Checked all candidate forms:", candidateForms, "Variants:", subIdVariants, "Last Status:", lastStatus, "Last Err:", lastErrText);
    // If we found it, return it`;
code = code.replace(toFind, replace);

fs.writeFileSync('server.ts', code);
