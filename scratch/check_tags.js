const fs = require('fs');
const content = fs.readFileSync('e:/Digital Class/MIT/src/app/college/dashboard/page.tsx', 'utf8');

const lines = content.split('\n');
let stack = [];
let errors = [];



for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find all <div or </div>
  // Skip self-closing
  const tokens = line.match(/<div[^>]*>|<\/div>/g) || [];
  
  tokens.forEach(token => {
    if (token.endsWith('/>')) return; // Regex should have handled this but just in case
    if (token.startsWith('<div')) {
      stack.push({ line: i + 1, type: 'div' });
    } else if (token.startsWith('</div')) {
      if (stack.length === 0) {
        errors.push(`Extra </div> at line ${i + 1}`);
      } else {
        stack.pop();
      }
    }


    
  });
}

stack.forEach(item => {
  errors.push(`Unclosed <${item.type}> from line ${item.line}`);
});

console.log(errors.join('\n'));
