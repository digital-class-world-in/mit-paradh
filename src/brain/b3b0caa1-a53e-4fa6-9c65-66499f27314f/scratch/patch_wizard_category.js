const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Domicile Preview
const domicileTarget = `{formData.domicileUrlFileName && (
                            <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                              <PlusCircle size={10} /> {formData.domicileUrlFileName}
                            </span>
                          )}`;

const domicileReplacement = `{formData.domicileUrl && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  <span className="text-[10px] font-medium text-emerald-700">Uploaded</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setModalPreview({ url: formData.domicileUrl, label: 'Domicile Certificate' })}
                                  className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                                  title="Preview Document"
                                >
                                  <Eye size={14} />
                                </button>
                            </div>
                          )}`;

if (content.includes(domicileTarget)) {
    content = content.replace(domicileTarget, domicileReplacement);
    console.log('Updated Domicile Preview');
} else {
    // Try with different line endings or slightly different spacing
    const domicileRegex = /\{formData\.domicileUrlFileName && \(\s*<span className="text-\[11px\] font-normal text-orange-500 italic flex items-center gap-1">\s*<PlusCircle size=\{10\} \/> \{formData\.domicileUrlFileName\}\s*<\/span>\s*\)\}/;
    if (domicileRegex.test(content)) {
        content = content.replace(domicileRegex, domicileReplacement);
        console.log('Updated Domicile Preview (Regex)');
    } else {
        console.log('Could not find Domicile target');
    }
}

// 2. Add Caste Certificate Upload and Preview
const casteTarget = `<select 
                      name="casteCategory"
                      value={formData.casteCategory || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Category</option>
                      {CASTE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>`;

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

if (content.includes(casteTarget)) {
    content = content.replace(casteTarget, casteReplacement);
    console.log('Updated Caste Category with Upload/Preview');
}

// 3. Update PWD Preview
const pwdTarget = `{formData.pwdCertificateUrlFileName && (
                                <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                                  <PlusCircle size={10} /> {formData.pwdCertificateUrlFileName}
                                </span>
                              )}`;

const pwdReplacement = `{formData.pwdCertificateUrl && (
                                <button 
                                  type="button"
                                  onClick={() => setModalPreview({ url: formData.pwdCertificateUrl, label: 'PWD Certificate' })}
                                  className="w-12 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                                  title="Preview Certificate"
                                >
                                  <Eye size={20} />
                                </button>
                              )}`;

if (content.includes(pwdTarget)) {
    content = content.replace(pwdTarget, pwdReplacement);
    console.log('Updated PWD Preview');
} else {
    const pwdRegex = /\{formData\.pwdCertificateUrlFileName && \(\s*<span className="text-\[11px\] font-normal text-orange-500 italic flex items-center gap-1">\s*<PlusCircle size=\{10\} \/> \{formData\.pwdCertificateUrlFileName\}\s*<\/span>\s*\)\}/;
    if (pwdRegex.test(content)) {
        content = content.replace(pwdRegex, pwdReplacement);
        console.log('Updated PWD Preview (Regex)');
    }
}

fs.writeFileSync(filePath, content);
