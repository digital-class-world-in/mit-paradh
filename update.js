const fs = require('fs');
const file = 'e:/Digital Class/MIT/src/components/ProfileWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the wrap around renderStepContent
content = content.replace(
    /<fieldset disabled=\{formData\.profileLocked\} className="contents">\s*\{renderStepContent\(\)\}\s*<\/fieldset>/,
    '<div className="contents">\n          {renderStepContent()}\n        </div>'
);

// 2. Wrap each step's content with fieldset
for (let i = 1; i <= 9; i++) {
    const caseStart = new RegExp(`case ${i}:\\s*return \\(\\s*<div className="space-y-\\d+ animate-in fade-in[^"]*">`);
    
    // Find where the navigation starts
    // It's usually <div className="flex ... justify-center gap-4 pt-10
    
    let parts = content.split(`case ${i}:`);
    if (parts.length > 1) {
        let afterCase = parts[1];
        
        afterCase = afterCase.replace(
            /(return \(\s*<div className="space-y-\d+ animate-in fade-in[^"]*">)/,
            '$1\n            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">'
        );
        
        afterCase = afterCase.replace(
            /(<div className="flex [^"]*justify-center gap-4 pt-10)/,
            '</fieldset>\n              $1'
        );
        
        content = parts[0] + `case ${i}:` + afterCase;
    }
}

fs.writeFileSync(file, content);
console.log('Done!');
