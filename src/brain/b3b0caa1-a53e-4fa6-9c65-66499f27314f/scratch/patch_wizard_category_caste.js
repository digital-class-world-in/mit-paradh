const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const casteRegex = /<select\s+name="casteCategory"\s+value=\{formData\.casteCategory \|\| ''\}\s+onChange=\{handleInputChange\}\s+className="w-full bg-white border border-slate-200 rounded-lg p-4 text-\[14px\] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"\s+>\s+<option value="">Select Category<\/option>\s+\{CASTE_CATEGORIES\.map\(cat => \(\s+<option key=\{cat\} value=\{cat\}>\{cat\}<\/option>\s+\)\)\}\s+<\/select>/;

const casteReplacement = `<div className="flex gap-4">
                      <select 
                        name="casteCategory"
                        value={formData.casteCategory || ''}
                        onChange={handleInputChange}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      >
                        <option value="">Select Category</option>
                        {CASTE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {formData.casteCategory && formData.casteCategory !== 'OPEN' && (
                        <div className="flex items-center gap-2">
                           <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all group">
                              <Upload size={14} className="text-orange-400 group-hover:text-orange-600" />
                              <span className="text-xs font-normal text-orange-600">Upload Caste</span>
                              <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'casteCertificateUrl')} />
                           </label>
                           {formData.casteCertificateUrl && (
                             <button 
                               type="button"
                               onClick={() => setModalPreview({ url: formData.casteCertificateUrl, label: 'Caste Certificate' })}
                               className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                               title="Preview Caste Certificate"
                             >
                               <Eye size={18} />
                             </button>
                           )}
                        </div>
                      )}
                    </div>`;

if (casteRegex.test(content)) {
    content = content.replace(casteRegex, casteReplacement);
    console.log('Updated Caste Category with Upload/Preview');
} else {
    console.log('Could not find Caste target');
}

fs.writeFileSync(filePath, content);
