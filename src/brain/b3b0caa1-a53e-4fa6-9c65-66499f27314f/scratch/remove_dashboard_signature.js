const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const signaturePattern = /<div className="flex flex-col items-center w-full border-t border-slate-100 pt-4">[\s\S]+?Official Signature<\/p>\s+<\/div>/;

if (signaturePattern.test(content)) {
    content = content.replace(signaturePattern, '');
    console.log('Removed Official Signature from sidebar successfully');
} else {
    console.log('Official Signature pattern not found');
}

fs.writeFileSync(filePath, content);
