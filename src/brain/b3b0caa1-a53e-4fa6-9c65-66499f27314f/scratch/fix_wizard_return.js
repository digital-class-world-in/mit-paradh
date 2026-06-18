const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Wrap in Fragment
const returnStartRegex = /return \(\s*<div className="max-w-7xl mx-auto bg-white border-4 border-slate-200 rounded-3xl shadow-sm overflow-hidden">/;
if (returnStartRegex.test(content)) {
    content = content.replace(returnStartRegex, 'return (\n    <>\n    <div className="max-w-7xl mx-auto bg-white border-4 border-slate-200 rounded-3xl shadow-sm overflow-hidden">');
    console.log('Added Fragment start');
}

// 2. Fix Fragment end and extra div
const returnEndRegex = /\{\/\* Document Preview Modal \*\/\}\s*\{modalPreview && \([\s\S]*?\)\}\s*<\/div>\s*<\/div>\s*\);\s*\}/;
// Wait, let's be simpler.
const finalClosingRegex = /\)\}\s*<\/div>\s*\);\s*\}/;
if (finalClosingRegex.test(content)) {
    // We want to replace the last part of the file
    content = content.replace(finalClosingRegex, ')}\n    </>\n  );\n}');
    console.log('Added Fragment end');
}

fs.writeFileSync(filePath, content);
