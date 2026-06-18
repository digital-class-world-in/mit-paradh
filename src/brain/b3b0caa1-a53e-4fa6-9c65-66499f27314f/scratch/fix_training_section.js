const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const trainingSectionStart = '<div className="col-span-full space-y-3">';
if (content.includes(trainingSectionStart)) {
    const startIdx = content.indexOf(trainingSectionStart);
    const endIdx = content.indexOf('</fieldset>', startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        const restoredTraining = `<div className="col-span-full space-y-3">
                     <label className="text-sm font-normal text-slate-600">Upload Certificate</label>
                     <div className="flex items-center gap-4">
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
`;
        // We need to find the actual end of the section
        const searchEnd = '             )}';
        const actualEndIdx = content.indexOf(searchEnd, startIdx) + searchEnd.length;
        
        content = content.substring(0, startIdx) + restoredTraining + content.substring(actualEndIdx);
        console.log('Restored and updated training section successfully');
    }
}

fs.writeFileSync(filePath, content);
