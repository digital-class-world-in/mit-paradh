const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Eye icon to imports
if (!content.includes(' Eye,')) {
    content = content.replace('  CheckCircle2', '  CheckCircle2,\n  Eye');
    console.log('Added Eye icon to imports');
}

// 2. Add "Other" board logic to tempQual initialization and display
// In Step 5, add the custom board field
const boardSelectPattern = /<label className="text-sm font-normal text-slate-600">Board\/University <span className="text-red-500">\*<\/span><\/label>\s+<select\s+value=\{tempQual\.board\}\s+onChange=\{\(e\) => setTempQual\(\{\.\.\.tempQual, board: e\.target\.value\}\)\}\s+className="w-full bg-white border border-slate-200 rounded-lg p-4 text-\[14px\] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"\s+>\s+<option value="">Select Board<\/option>\s+\{BOARDS\.map\(board => <option key=\{board\} value=\{board\}>\{board\}<\/option>\)\}\s+<\/select>/;

const newBoardBlock = `<label className="text-sm font-normal text-slate-600">Board/University <span className="text-red-500">*</span></label>
                    <select 
                      value={tempQual.board}
                      onChange={(e) => setTempQual({...tempQual, board: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Board</option>
                      {BOARDS.map(board => <option key={board} value={board}>{board}</option>)}
                      <option value="Other">Other (Custom Board/University)</option>
                    </select>
                  </div>
                  {tempQual.board === 'Other' && (
                    <div className="space-y-1.5 animate-in slide-in-from-left duration-300">
                      <label className="text-sm font-normal text-slate-600">Enter Board/University Name <span className="text-red-500">*</span></label>
                      <input 
                        value={tempQual.customBoard || ''}
                        onChange={(e) => setTempQual({...tempQual, customBoard: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Enter board/university"
                      />
                    </div>`;

if (boardSelectPattern.test(content)) {
    content = content.replace(boardSelectPattern, newBoardBlock);
    console.log('Added Other board logic to Step 5');
}

// 3. Update addQualification to use customBoard
const addQualPattern = /const addQualification = \(\) => \{\s+if \(!tempQual\.examination || !tempQual\.board || !tempQual\.college || !tempQual\.marksObtained || !tempQual\.outOfMarks\) \{/;
const newAddQualStart = `const addQualification = async () => {
    const finalQual = { ...tempQual };
    if (finalQual.board === 'Other' && finalQual.customBoard) {
      finalQual.board = finalQual.customBoard;
    }
    if (!finalQual.examination || !finalQual.board || !finalQual.college || !finalQual.marksObtained || !finalQual.outOfMarks) {`;

if (addQualPattern.test(content)) {
    content = content.replace(addQualPattern, newAddQualStart);
    // Also update the rest of the function to use finalQual
    content = content.replace('currentQuals[editQualIndex] = tempQual;', 'currentQuals[editQualIndex] = finalQual;');
    content = content.replace('currentQuals.push(tempQual);', 'currentQuals.push(finalQual);');
    
    // Add immediate save to Firebase in addQualification
    content = content.replace('setTempQual({', `
    const userRef = ref(realtimeDb, \`users/\${userId}/profile\`);
    await update(userRef, { qualifications: currentQuals });
    setTempQual({`);
    
    console.log('Updated addQualification function');
}

// 4. Update the qualifications table to include Preview button
const tableActionCell = /<td className="px-6 py-4 text-center">\s+<div className="flex items-center justify-center gap-2">/;
const newTableActionCell = `<td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {q.marksheetUrl && (
                                  <button 
                                    onClick={() => window.open(q.marksheetUrl, '_blank')}
                                    className="text-emerald-500 hover:text-emerald-700 transition-colors p-2 rounded-lg hover:bg-emerald-50"
                                    title="Preview Marksheet"
                                  >
                                    <Eye size={16} />
                                  </button>
                                )}`;

if (tableActionCell.test(content)) {
    content = content.replace(tableActionCell, newTableActionCell);
    console.log('Added Preview button to Qualifications table');
}

fs.writeFileSync(filePath, content);
