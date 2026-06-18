const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the vault UI to compact layout
const mapStart = "].map((doc, idx) => {";
const mapEnd = "                  })}";

if (content.includes(mapStart)) {
    const startIdx = content.indexOf(mapStart, content.indexOf('case 11:'));
    const endIdx = content.indexOf(mapEnd, startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        const newMapBody = `].map((doc, idx) => {
                    let fileUrl = '';
                    if (doc.key === 'ssc') {
                      fileUrl = userData?.profile?.qualifications?.find((q: any) => q.examination === 'SSC/10th' || q.examination === '10th')?.marksheetUrl;
                    } else if (doc.key === 'hsc') {
                      fileUrl = userData?.profile?.qualifications?.find((q: any) => q.examination === 'HSC/12th' || q.examination === '12th')?.marksheetUrl;
                    } else {
                      fileUrl = userData?.profile?.[doc.key];
                    }

                    return (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group transition-all hover:border-[#00a5a5]">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:text-[#00a5a5] transition-colors">
                               <FileBadge size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doc.label}</p>
                               <div className="flex items-center gap-1.5 mt-0.5">
                                  {fileUrl ? (
                                     <>
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[9px] font-medium text-emerald-600 uppercase">Available</span>
                                     </>
                                  ) : (
                                     <>
                                        <AlertCircle size={12} className="text-slate-300" />
                                        <span className="text-[9px] font-medium text-slate-400 uppercase">Missing</span>
                                     </>
                                  )}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {fileUrl ? (
                               <button 
                                 onClick={() => setModalPreview({ url: fileUrl, label: doc.label })}
                                 className="bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-[#00a5a5] hover:text-white transition-all flex items-center gap-1.5"
                               >
                                 <Eye size={12} /> Preview
                               </button>
                            ) : (
                               <button 
                                 onClick={() => handleTabChange(3)}
                                 className="bg-slate-50 text-slate-400 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 transition-all"
                               >
                                 Upload
                               </button>
                            )}
                         </div>
                      </div>
                    );
                  })`;
        
        content = content.substring(0, startIdx) + newMapBody + content.substring(endIdx + mapEnd.length);
        console.log('Updated Document Vault to compact layout successfully');
    }
}

// 2. Add Modal at the end of DashboardContent
if (!content.includes('Document Preview Modal')) {
    const dashboardContentEnd = "  );\n}";
    const modalCode = `
        {/* Document Preview Modal */}
        {modalPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalPreview(null)} />
            <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00a5a5] flex items-center justify-center text-white">
                    <FileBadge size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{modalPreview.label}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.open(modalPreview.url, '_blank')}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#00a5a5] transition-all"
                    title="Open in New Tab"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => setModalPreview(null)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-8 bg-slate-100/50 flex items-center justify-center">
                <img 
                  src={modalPreview.url} 
                  alt={modalPreview.label}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-4 border-white"
                />
              </div>
            </div>
          </div>
        )}
`;
    
    // Find the last ");" before the end of DashboardContent
    const lastReturnIdx = content.lastIndexOf("  );\n}");
    if (lastReturnIdx !== -1) {
        content = content.substring(0, lastReturnIdx) + modalCode + content.substring(lastReturnIdx);
        console.log('Added Document Preview Modal successfully');
    }
}

// 3. Update the Grid container class to reflect list layout
content = content.replace('<div className="grid grid-cols-1 md:grid-cols-3 gap-6">', '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">');

fs.writeFileSync(filePath, content);
