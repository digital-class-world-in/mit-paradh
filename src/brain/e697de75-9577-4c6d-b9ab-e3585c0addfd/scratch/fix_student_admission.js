const fs = require('fs');
const path = 'e:\\Digital Class\\MIT\\src\\components\\StudentAdmissionManager.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/onChange=\{\(v\) => setStudentForm/g, 'onChange={(v: any) => setStudentForm');
fs.writeFileSync(path, content);
console.log('Fixed StudentAdmissionManager.tsx');
