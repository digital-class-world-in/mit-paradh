const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix startEditQualification
const startEditQualPattern = /const startEditQualification = \(index: number\) => \{\s+const qual = \(formData\.qualifications \|\| \[\]\)\[index\];\s+\s+const userRef = ref\(realtimeDb, `users\/\$\{userId\}\/profile`\);\s+await update\(userRef, \{ qualifications: currentQuals \}\);\s+setTempQual\(\{ \.\.\.qual \}\);\s+setEditQualIndex\(index\);\s+\};/;

const correctStartEditQual = `const startEditQualification = (index: number) => {
    const qual = (formData.qualifications || [])[index];
    setTempQual({ ...qual });
    setEditQualIndex(index);
  };`;

if (startEditQualPattern.test(content)) {
    content = content.replace(startEditQualPattern, correctStartEditQual);
    console.log('Fixed startEditQualification');
} else {
    console.log('startEditQualPattern not found');
}

// Fix addQualification (which is likely right after)
const addQualPattern = /const addQualification = \(\) => \{\s+if \(!tempQual\.examination \|\| !tempQual\.board \|\| !tempQual\.college \|\| !tempQual\.marksObtained \|\| !tempQual\.outOfMarks\) \{[\s\S]+?setTempQual\(\{[\s\S]+?\}\);\s+\};/;

const correctAddQual = `const addQualification = async () => {
    const finalQual = { ...tempQual };
    if (finalQual.board === 'Other' && finalQual.customBoard) {
      finalQual.board = finalQual.customBoard;
    }
    if (!finalQual.examination || !finalQual.board || !finalQual.college || !finalQual.marksObtained || !finalQual.outOfMarks) {
      alert("Please fill mandatory qualification details marked with *");
      return;
    }
    const currentQuals = [...(formData.qualifications || [])];
    
    if (editQualIndex !== null) {
      currentQuals[editQualIndex] = finalQual;
      setEditQualIndex(null);
    } else {
      currentQuals.push(finalQual);
    }

    setFormData((prev: any) => ({
      ...prev,
      qualifications: currentQuals
    }));

    const userRef = ref(realtimeDb, \`users/\${userId}/profile\`);
    await update(userRef, { qualifications: currentQuals });

    setTempQual({
      examination: '', board: '', college: '', passingDate: '',
      result: 'Pass', mode: 'Regular', marksSystem: 'Marks',
      marksObtained: '', outOfMarks: '', percentage: '', grade: '',
      marksheetUrl: '', marksheetName: ''
    });
  };`;

if (addQualPattern.test(content)) {
    content = content.replace(addQualPattern, correctAddQual);
    console.log('Fixed addQualification');
} else {
    console.log('addQualPattern not found');
}

fs.writeFileSync(filePath, content);
