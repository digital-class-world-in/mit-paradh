const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const importPattern = /  Eye\s+\} from 'lucide-react';/;
if (importPattern.test(content)) {
    content = content.replace(importPattern, "  Eye,\n  X,\n  ArrowRight\n} from 'lucide-react';");
    console.log('Fixed lucide-react imports in ProfileWizard.tsx');
} else {
    console.log('Import pattern not found');
}

fs.writeFileSync(filePath, content);
