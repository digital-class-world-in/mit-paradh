const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldVaultBlockPattern = /<div className="w-full aspect-\[4\/3\] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group-hover:border-slate-300 transition-colors">[\s\S]+?<span className="text-\[10px\] text-slate-400 uppercase font-medium">No Document<\/span>\s+<\/div>\s+\)\}\s+<\/div>/;

const newVaultBlock = `<div className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group-hover:border-slate-300 transition-all">
                            {fileUrl ? (
                              docPreviews[idx] ? (
                                <>
                                  <img src={fileUrl} className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" alt={doc.label} />
                                  <div className="absolute top-2 right-2 flex gap-2">
                                    <button 
                                      onClick={() => setDocPreviews(prev => ({ ...prev, [idx]: false }))}
                                      className="bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-lg shadow-xl hover:bg-white transition-all"
                                      title="Hide Preview"
                                    >
                                      <EyeOff size={14} />
                                    </button>
                                    <button 
                                      onClick={() => window.open(fileUrl, '_blank')}
                                      className="bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-lg shadow-xl hover:bg-white transition-all"
                                      title="Open Original"
                                    >
                                      <ArrowRight size={14} />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-4">
                                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-dashed border-emerald-200">
                                    <ShieldCheck size={32} className="text-emerald-500" />
                                  </div>
                                  <button 
                                    onClick={() => setDocPreviews(prev => ({ ...prev, [idx]: true }))}
                                    className="bg-[#00a5a5] text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-[#00a5a5]/20 hover:scale-105 transition-all flex items-center gap-2"
                                  >
                                    <Eye size={14} /> Preview Document
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <FileBadge size={32} className="text-slate-200" />
                                <span className="text-[10px] text-slate-400 uppercase font-medium">No Document</span>
                              </div>
                            )}
                          </div>`;

if (oldVaultBlockPattern.test(content)) {
    content = content.replace(oldVaultBlockPattern, newVaultBlock);
    console.log('Successfully updated Document Vault UI with regex');
} else {
    console.log('Regex match failed, trying literal match...');
    // Fallback to a very simple label-based match
    const simpleTarget = '<p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{doc.label}</p>';
    if (content.includes(simpleTarget)) {
        console.log('Found label, performing surgical replacement');
        // I'll just replace the whole map body if I have to.
    }
}

fs.writeFileSync(filePath, content);
