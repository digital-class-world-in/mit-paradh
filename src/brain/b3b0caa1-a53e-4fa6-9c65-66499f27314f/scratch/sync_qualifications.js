const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update addQualification
const addQualRegex = /const addQualification = \(\) => \{[\s\S]*?setTempQual\(\{[\s\S]*?\}\);\s*\};/;
const addQualReplacement = `const addQualification = async () => {
    if (!tempQual.examination || !tempQual.board || !tempQual.college || !tempQual.marksObtained || !tempQual.outOfMarks) {
      alert("Please fill mandatory qualification details marked with *");
      return;
    }
    
    // Support "Other" board name
    const finalQual = { ...tempQual };
    if (finalQual.board === 'Other' && tempQual.otherBoard) {
      finalQual.board = tempQual.otherBoard;
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

    // Sync with Firebase immediately so the Document Vault updates
    try {
      const userRef = ref(realtimeDb, \`users/\${userId}/profile\`);
      await update(userRef, { qualifications: currentQuals });
    } catch (error) {
      console.error("Error syncing qualification addition:", error);
    }

    setTempQual({
      examination: '', board: '', college: '', passingDate: '',
      result: 'Pass', mode: 'Regular', marksSystem: 'Marks',
      marksObtained: '', outOfMarks: '', percentage: '', grade: '',
      marksheetUrl: '', marksheetName: ''
    });
  };`;

if (addQualRegex.test(content)) {
    content = content.replace(addQualRegex, addQualReplacement);
    console.log('Updated addQualification to async sync');
} else {
    console.log('Could not find addQualification');
}

// 2. Update removeQualification
const removeQualRegex = /const removeQualification = \(index: number\) => \{[\s\S]*?if \(editQualIndex === index\) setEditQualIndex\(null\);\s*\};/;
const removeQualReplacement = `const removeQualification = async (index: number) => {
    const quals = [...(formData.qualifications || [])];
    quals.splice(index, 1);
    
    // Update local state
    setFormData((prev: any) => ({ ...prev, qualifications: quals }));
    if (editQualIndex === index) setEditQualIndex(null);

    // Sync with Firebase immediately so the Document Vault updates
    try {
      const userRef = ref(realtimeDb, \`users/\${userId}/profile\`);
      await update(userRef, { qualifications: quals });
    } catch (error) {
      console.error("Error syncing qualification deletion:", error);
    }
  };`;

if (removeQualRegex.test(content)) {
    content = content.replace(removeQualRegex, removeQualReplacement);
    console.log('Updated removeQualification to async sync');
} else {
    console.log('Could not find removeQualification');
}

fs.writeFileSync(filePath, content);
