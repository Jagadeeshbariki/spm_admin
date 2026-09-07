const fs = require('fs');

function patch() {
  const file = 'server.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Fix backend to always ensure 'uuid:' prefix on submissionId
  const fixBlock = `
    let parsedSubmissionId = String(submissionId);
    if (!parsedSubmissionId.startsWith('uuid:')) {
      parsedSubmissionId = 'uuid:' + parsedSubmissionId;
    }
    
    const imageRes = await fetch(\`\${ODK_URL}/v1/projects/\${ODK_PROJECT_ID}/forms/\${encodeURIComponent(targetFormId)}/submissions/\${encodeURIComponent(parsedSubmissionId)}/attachments/\${encodeURIComponent(String(filename))}\`, {`;

  // Find the fetch call for the image and replace it
  const regex = /const imageRes = await fetch\(`\$\{ODK_URL\}\/v1\/projects\/\$\{ODK_PROJECT_ID\}\/forms\/\$\{encodeURIComponent\(targetFormId\)\}\/submissions\/\$\{encodeURIComponent\(String\(submissionId\)\)\}\/attachments\/\$\{encodeURIComponent\(String\(filename\)\)\}`, \{/g;
  
  content = content.replace(regex, fixBlock);

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched server.ts to handle uuid: prefix");
