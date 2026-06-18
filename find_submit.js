const fs = require('fs');

const data = fs.readFileSync('src/app/student/dashboard/page.tsx', 'utf-8');
const lines = data.split('\n');

for(let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if(line.includes('send to college') || line.includes('submit application') || line.includes('function handle')) {
        if(line.includes('handle')) {
            console.log(`Line ${i+1}: ${lines[i].trim()}`);
        } else if (line.includes('send to college') || line.includes('submit application')) {
            console.log(`Line ${i+1}: ${lines[i].trim()}`);
        }
    }
}
