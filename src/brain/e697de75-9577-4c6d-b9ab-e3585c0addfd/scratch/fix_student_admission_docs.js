const fs = require('fs');
const path = 'e:\\Digital Class\\MIT\\src\\components\\StudentAdmissionManager.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/onFile=\{\(e\) => handleFileChange\(e/g, 'onFile={(e: any) => handleFileChange(e');
fs.writeFileSync(path, content);
console.log('Fixed StudentAdmissionManager.tsx (DocUpload)');
