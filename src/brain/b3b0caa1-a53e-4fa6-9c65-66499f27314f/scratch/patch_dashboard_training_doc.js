const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add Training Certificate to Document Vault
const vaultListPattern = /\{\s+label: 'Caste Certificate', key: 'casteCertificateUrl' \},/;
if (vaultListPattern.test(content)) {
    content = content.replace(vaultListPattern, "{ label: 'Caste Certificate', key: 'casteCertificateUrl' },\n                    { label: 'Training Certificate', key: 'trainingCertificateUrl' },");
    console.log('Added Training Certificate to Document Vault');
} else {
    console.log('Vault list pattern not found');
}

fs.writeFileSync(filePath, content);
