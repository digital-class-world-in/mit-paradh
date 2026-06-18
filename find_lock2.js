const fs = require('fs');
const file = 'e:/Digital Class/MIT/src/components/ProfileWizard.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, i) => {
    if (line.includes('handleLockProfile')) {
        console.log(Line : );
    }
});
