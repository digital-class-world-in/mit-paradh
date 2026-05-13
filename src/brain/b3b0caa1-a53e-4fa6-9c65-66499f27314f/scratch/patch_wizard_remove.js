const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const removeQualPattern = /const removeQualification = \(index: number\) => \{\s+const quals = \[\.\.\.\(formData\.qualifications \|\| \[\]\)\];\s+quals\.splice\(index, 1\);\s+setFormData\(\(prev: any\) => \(\{ \.\.\.prev, qualifications: quals \}\)\);\s+if \(editQualIndex === index\) setEditQualIndex\(null\);\s+\};/;

const newRemoveQual = `const removeQualification = async (index: number) => {
    const quals = [...(formData.qualifications || [])];
    quals.splice(index, 1);
    const userRef = ref(realtimeDb, \`users/\${userId}/profile\`);
    await update(userRef, { qualifications: quals });
    setFormData((prev: any) => ({ ...prev, qualifications: quals }));
    if (editQualIndex === index) setEditQualIndex(null);
  };`;

if (removeQualPattern.test(content)) {
    content = content.replace(removeQualPattern, newRemoveQual);
    console.log('Updated removeQualification function with regex');
} else {
    console.log('removeQualification pattern not found');
}

fs.writeFileSync(filePath, content);
