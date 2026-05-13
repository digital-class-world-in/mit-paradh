const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add PAN Card and Bank Passbook to Document Vault
const trainingDocLine = "{ label: 'Training Certificate', key: 'trainingCertificateUrl' },";
if (content.includes(trainingDocLine)) {
    content = content.replace(trainingDocLine, trainingDocLine + "\n                    { label: 'PAN Card', key: 'panCardUrl' },\n                    { label: 'Bank Passbook / Cheque', key: 'bankPassbookUrl' },");
    console.log('Added PAN and Bank docs to Document Vault');
} else {
    console.log('Training doc line not found in vault list');
}

fs.writeFileSync(filePath, content);
