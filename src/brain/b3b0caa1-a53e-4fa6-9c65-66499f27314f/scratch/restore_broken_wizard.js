const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const brokenPattern = /\)\}\s+<\/div>\s+<\/div>\s+<\/div>\s+\)\}\s+<\/div>\s+<\/div>\s+<\/div>/;

// Actually, let's be more specific. 
// From line 1712 to 1720 roughly.
const sectionToReplace = /<div className="flex items-center gap-4">[\s\S]+?\{formData\.trainingCertificateUrl && \([\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+\)\}\s+<\/div>\s+<\/div>\s+<\/div>/;

const replacement = `<div className="flex items-center gap-4">
                       <label className="cursor-pointer bg-white border-2 border-slate-200 hover:border-orange-500 px-8 py-3 rounded-xl flex items-center gap-3 transition-all group shadow-sm">
                         <Upload size={18} className="text-slate-400 group-hover:text-orange-500" />
                         <span className="text-sm font-normal text-slate-600 group-hover:text-orange-600">Upload</span>
                         <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'trainingCertificateUrl')} />
                       </label>
                       {formData.trainingCertificateUrl && (
                         <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <span className="text-xs font-normal text-emerald-700 text-nowrap truncate max-w-[200px]">Uploaded</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setModalPreview({ url: formData.trainingCertificateUrl, label: 'Training Certificate' })}
                              className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                              title="Preview Certificate"
                            >
                              <Eye size={18} />
                            </button>
                         </div>
                       )}
                     </div>
                  </div>
               </div>
             )}

              </fieldset>
               <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-100">
                <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs uppercase transition-all active:scale-95">Back</button>
                <button onClick={() => !formData.profileLocked && setFormData({})} className={\`\${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs uppercase shadow-md active:scale-95\`}>Reset</button>
                <button onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs uppercase shadow-md active:scale-95 flex items-center gap-2">Save & Next</button>
              </div>
           </div>
        );
      case 7:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
             <div className="flex flex-col gap-1 pb-6 border-b border-slate-100">
               <h4 className="text-base font-normal text-slate-800 italic">Additional Details</h4>
               <p className="text-xs font-normal text-slate-400 uppercase tracking-widest">Ancillary & Linguistic Information</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1.5">
                 <label className="text-sm font-normal text-slate-600">Blood Group</label>
                 <select 
                   name="bloodGroup"
                   value={formData.bloodGroup || ''}
                   onChange={handleInputChange}
                   className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                 >
                   <option value="">Select Blood Group</option>
                   {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-sm font-normal text-slate-600">Mother Tongue <span className="text-red-500">*</span></label>
                 <select 
                   name="motherTongue"
                   value={formData.motherTongue || ''}
                   onChange={handleInputChange}
                   className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                 >
                   <option value="">Select Mother Tongue</option>
                   {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                 </select>
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-sm font-normal text-slate-600">Known Languages <span className="text-red-500">*</span></label>
               <div className="flex flex-col md:flex-row gap-4 items-end">
                 <div className="flex-1 space-y-1.5">
                   <select 
                     value={tempLang.language}
                     onChange={(e) => setTempLang({ ...tempLang, language: e.target.value })}
                     className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                   >
                     <option value="">Select Language</option>
                     {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                   </select>
                 </div>
                 <div className="flex gap-6 py-4">
                   {['read', 'write', 'speak'].map((skill) => (
                     <label key={skill} className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox"
                         checked={tempLang[skill]}
                         onChange={(e) => setTempLang({ ...tempLang, [skill]: e.target.checked })}
                         className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                       />
                       <span className="text-xs font-normal text-slate-600 uppercase group-hover:text-orange-600 transition-colors">{skill}</span>
                     </label>
                   ))}
                 </div>
                 <button 
                   onClick={addLanguageKnown}
                   className="bg-[#ff9f1c] hover:bg-orange-600 text-white p-4 rounded-xl shadow-md transition-all active:scale-95"
                   type="button"
                 >
                   <PlusCircle size={20} />
                 </button>
               </div>`;

if (sectionToReplace.test(content)) {
    content = content.replace(sectionToReplace, replacement);
    console.log('Restored Case 6 and 7 correctly');
} else {
    console.log('Broken section pattern not found');
}

fs.writeFileSync(filePath, content);
