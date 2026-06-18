const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const vaultPattern = /<div className="w-full aspect-\[4\/3\] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group-hover:border-slate-300 transition-colors">\s+\{fileUrl \? \([\s\S]+?<\/div>\s+<\/div>\s+\);/;

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

// Since the regex might be tricky with nested divs, I'll use a more targeted search
const oldBlockStart = `<div className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group-hover:border-slate-300 transition-colors">`;
if (content.includes(oldBlockStart)) {
    // Find the end of this div block. It ends right before {!fileUrl && (
    const startIdx = content.indexOf(oldBlockStart);
    const endIdx = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', startIdx + 100) + 1) + 1);
    
    // Actually, I'll just use a pattern that matches the end precisely
    const searchString = `                                <div className="flex flex-col items-center gap-2">
                                <FileBadge size={32} className="text-slate-200" />
                                <span className="text-[10px] text-slate-400 uppercase font-medium">No Document</span>
                              </div>
                            )}
                          </div>`;
    
    const fullPatternEndIdx = content.indexOf(searchString) + searchString.length;
    
    if (startIdx !== -1 && content.indexOf(searchString) !== -1) {
        content = content.substring(0, startIdx) + newVaultBlock + content.substring(fullPatternEndIdx);
        console.log('Updated Document Vault UI with Preview logic');
    } else {
        console.log('Could not find complete Document Vault block');
    }
} else {
    console.log('Could not find start of Document Vault block');
}

fs.writeFileSync(filePath, content);
