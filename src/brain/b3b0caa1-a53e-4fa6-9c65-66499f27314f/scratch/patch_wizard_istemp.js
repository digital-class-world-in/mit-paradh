const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isTempPattern = /if \(isTemp\) \{\s+setTempQual\(prev => \(\{ \.\.\.prev, \[fieldName\]: 'mock_url\.jpg', marksheetName: file\.name \}\)\);\s+\} else \{/;

const newIsTemp = `if (isTemp) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setTempQual(prev => ({ ...prev, [fieldName]: dataUrl, marksheetName: file.name }));
      };
      reader.readAsDataURL(file);
    } else {`;

if (isTempPattern.test(content)) {
    content = content.replace(isTempPattern, newIsTemp);
    console.log('Fixed isTemp block in handleFileChange');
} else {
    console.log('isTemp pattern not found');
}

fs.writeFileSync(filePath, content);
