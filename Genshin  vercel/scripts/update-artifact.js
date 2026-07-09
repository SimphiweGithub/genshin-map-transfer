const fs = require('fs');
const data = fs.readFileSync('metaData.json', 'utf8');
const artifactPath = 'C:\\Users\\Simphiwe Khumalo\\.gemini\\antigravity\\brain\\9fb8be45-9045-4b16-9416-0c5d553c66d8\\metaData_preview.md';
const content = '```json\n' + data + '\n```';
fs.writeFileSync(artifactPath, content);
console.log("Updated artifact!");
