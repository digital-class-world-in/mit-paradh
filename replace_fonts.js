const fs = require('fs');
const path = 'src/components/ProfileWizard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/text-sm/g, 'text-[15px]');
content = content.replace(/text-\[14px\]/g, 'text-[15px]');
content = content.replace(/text-xs/g, 'text-[15px]');
content = content.replace(/text-\[13px\]/g, 'text-[15px]');
content = content.replace(/text-\[12px\]/g, 'text-[15px]');
content = content.replace(/text-\[11px\]/g, 'text-[15px]');
content = content.replace(/text-\[10px\]/g, 'text-[15px]');

fs.writeFileSync(path, content);
console.log('Done');
