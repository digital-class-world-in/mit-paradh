const fs = require('fs');
const file = 'e:/Digital Class/MIT/src/components/ProfileWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace p-5 text-lg with p-6 text-xl
content = content.replace(/p-5 text-lg/g, 'p-6 text-xl');

// Replace p-4 rounded-xl shadow-md ... to slightly larger, maybe? 
// The user strictly mentioned "registration form fields", so I will focus on the ones with p-5 text-lg, p-3.5 text-sm

content = content.replace(/p-3\.5 text-sm/g, 'p-4 text-base');
content = content.replace(/px-4 py-2 text-sm/g, 'px-5 py-3 text-base');
content = content.replace(/p-4 text-sm/g, 'p-5 text-base');

fs.writeFileSync(file, content);
console.log('Form field sizes updated!');
