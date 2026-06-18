const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix Step 4 (Caste Category with upload) - Using very loose matching
const oldCastePattern = /<label className="text-sm font-normal text-slate-600">Caste Category <span className="text-red-500">\*<\/span><\/label>\s+<select\s+name="casteCategory"[\s\S]+?<\/select>\s+<\/div>/;

const newCasteBlock = `<label className="text-sm font-normal text-slate-600">Caste Category <span className="text-red-500">*</span></label>
                    <div className="flex flex-col md:flex-row gap-4">
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
                      
                      {formData.casteCategory && formData.casteCategory !== 'Open' && (
                        <div className="flex items-center gap-3 animate-in slide-in-from-left duration-300">
                          <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all group min-w-[240px]">
                            <Upload size={18} className="text-orange-400 group-hover:text-orange-600" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-orange-600 uppercase tracking-tight">Upload Caste Certificate</span>
                              {formData.casteCertificateUrlFileName && (
                                <span className="text-[10px] font-normal text-slate-400 truncate max-w-[150px]">{formData.casteCertificateUrlFileName}</span>
                              )}
                            </div>
                            <input 
                               type="file" 
                               className="hidden" 
                               onChange={(e) => handleFileChange(e, 'casteCertificateUrl')}
                            />
                          </label>
                          {formData.casteCertificateUrl && (
                            <div className="w-10 h-10 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500">
                              <CheckCircle2 size={20} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>`;

if (oldCastePattern.test(content)) {
    // Only replace the one in Step 4. Step 1 has text-slate-500 or is already fixed?
    // Let's replace the one that matches text-slate-600.
    content = content.replace(oldCastePattern, newCasteBlock);
    console.log('Fixed Step 4 Caste Category with regex');
} else {
    console.log('Step 4 Caste Category pattern not found');
}

// Clean up corrupted markers
content = content.replace(/\{(\s+)\/\* Parent & Category \*\/(\s+)\}\s+\/\* Religion & Caste Category \*\//g, '{/* Parent & Category */}');
console.log('Cleaned up corrupted markers');

fs.writeFileSync(filePath, content);
