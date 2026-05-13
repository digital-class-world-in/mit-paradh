const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const boardRegex = /<select\s+value=\{tempQual\.board\}\s+onChange=\{\(e\) => setTempQual\(\{\.\.\.tempQual, board: e\.target\.value\}\)\}\s+className="w-full bg-white border border-slate-200 rounded-lg p-4 text-\[14px\] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"\s+>\s+<option value="">Select Board<\/option>\s+\{BOARDS\.map\(board => <option key=\{board\} value=\{board\}>\{board\}<\/option>\)\}\s+<\/select>/;

const boardReplacement = `<div className="space-y-3">
                    <select 
                      value={tempQual.board}
                      onChange={(e) => setTempQual({...tempQual, board: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Board</option>
                      {BOARDS.map(board => <option key={board} value={board}>{board}</option>)}
                    </select>
                    {tempQual.board === 'Other' && (
                      <input 
                        value={tempQual.otherBoard || ''}
                        onChange={(e) => setTempQual({...tempQual, otherBoard: e.target.value})}
                        className="w-full bg-orange-50 border border-orange-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm animate-in slide-in-from-top-2"
                        placeholder="Enter Board/University Name"
                      />
                    )}
                  </div>`;

if (boardRegex.test(content)) {
    content = content.replace(boardRegex, boardReplacement);
    console.log('Updated Board selection with Other option');
}

const uploadRegex = /<label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all flex-1 group">\s*<Upload size=\{18\} className="text-orange-400 group-hover:text-orange-600" \/>\s*<span className="text-sm font-normal text-orange-600">Upload Marksheet<\/span>\s*<input\s+type="file"\s+className="hidden"\s+onChange=\{\(e\) => handleFileChange\(e, 'marksheetUrl', true\)\}\s*\/>\s*<\/label>/;

const uploadReplacement = `<label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all flex-1 group">
                        <Upload size={18} className="text-orange-400 group-hover:text-orange-600" />
                        <span className="text-sm font-normal text-orange-600">Upload Marksheet</span>
                        <input 
                           type="file" 
                           className="hidden" 
                           onChange={(e) => handleFileChange(e, 'marksheetUrl', true)}
                        />
                      </label>
                      {tempQual.marksheetUrl && (
                        <button 
                          type="button"
                          onClick={() => setModalPreview({ url: tempQual.marksheetUrl, label: \`Preview - \${tempQual.examination || 'Marksheet'}\` })}
                          className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                          title="Preview Uploaded Marksheet"
                        >
                          <Eye size={20} />
                        </button>
                      )}`;

if (uploadRegex.test(content)) {
    content = content.replace(uploadRegex, uploadReplacement);
    console.log('Updated Form with Live Preview');
}

const tableActionRegex = /<button\s+onClick=\{\(\) => startEditQualification\(idx\)\}\s+className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"\s+title="Edit Record"\s+>\s+<Edit2 size=\{16\} \/>\s+<\/button>/;

const tableActionReplacement = `<button 
                                  type="button"
                                  onClick={() => setModalPreview({ url: q.marksheetUrl, label: \`Marksheet - \${q.examination}\` })}
                                  className="text-[#00a5a5] hover:text-[#008e8e] transition-colors p-2 rounded-lg hover:bg-teal-50"
                                  title="Preview Marksheet"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => startEditQualification(idx)} 
                                  className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                  title="Edit Record"
                                >
                                  <Edit2 size={16} />
                                </button>`;

if (tableActionRegex.test(content)) {
    content = content.replace(tableActionRegex, tableActionReplacement);
    console.log('Updated Table with Preview Action');
}

fs.writeFileSync(filePath, content);
