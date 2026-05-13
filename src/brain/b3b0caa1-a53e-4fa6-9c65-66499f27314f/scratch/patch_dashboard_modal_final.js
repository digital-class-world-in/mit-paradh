const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

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
    </div>
  );
}`;

if (!content.includes('Document Preview Modal')) {
    // Replace the end of DashboardContent
    const lines = content.split('\n');
    let targetLineIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('export default function StudentDashboard')) {
            // Find the line before this which should be }
            for (let j = i - 1; j >= 0; j--) {
                if (lines[j].trim() === '}') {
                    // This is the end of DashboardContent. 
                    // Go back one more line which should be );
                    if (lines[j-1].trim() === ');') {
                        // This is it.
                        targetLineIdx = j - 2; // The line with the last </div>
                        break;
                    }
                }
            }
            break;
        }
    }
    
    if (targetLineIdx !== -1) {
        // Find the index in the original content
        const searchStr = "    </div>\n  );\n}";
        const idx = content.lastIndexOf(searchStr);
        if (idx !== -1) {
            content = content.substring(0, idx) + modalCode + content.substring(idx + searchStr.length);
            console.log('Successfully inserted modal');
        } else {
             // Try without newline
             const idx2 = content.lastIndexOf("    </div>\r\n  );\r\n}");
             if (idx2 !== -1) {
                 content = content.substring(0, idx2) + modalCode + content.substring(idx2 + "    </div>\r\n  );\r\n}".length);
                 console.log('Successfully inserted modal (CRLF)');
             } else {
                 console.log('Could not find return block precisely');
             }
        }
    }
}

fs.writeFileSync(filePath, content);
