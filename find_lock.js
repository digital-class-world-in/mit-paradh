const fs = require('fs');
const file = 'e:/Digital Class/MIT/src/components/ProfileWizard.tsx';
let content = fs.readFileSync(file, 'utf8');
const index = content.indexOf('const handleLockProfile');
console.log(content.substring(Math.max(0, index - 200), index + 500));
