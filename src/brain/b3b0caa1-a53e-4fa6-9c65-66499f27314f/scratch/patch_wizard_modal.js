const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update lucide-react imports
if (!content.includes('Eye,\n  X,\n  ArrowRight')) {
    content = content.replace('  Eye\n} from \'lucide-react\';', '  Eye,\n  X,\n  ArrowRight\n} from \'lucide-react\';');
    console.log('Updated lucide-react imports');
}

// 2. Add modalPreview state
if (!content.includes('const [modalPreview, setModalPreview] =')) {
    content = content.replace('const [declarationChecked, setDeclarationChecked] = useState(false);', 
        'const [declarationChecked, setDeclarationChecked] = useState(false);\n  const [modalPreview, setModalPreview] = useState<{ url: string, label: string } | null>(null);');
    console.log('Added modalPreview state');
}

// 3. Update Caste Certificate preview to use modal
const castePreviewPattern = /onClick=\{\(\) => window\.open\(formData\.casteCertificateUrl, '_blank'\)\}/;
if (castePreviewPattern.test(content)) {
    content = content.replace(castePreviewPattern, "onClick={() => setModalPreview({ url: formData.casteCertificateUrl, label: 'Caste Certificate' })}");
    console.log('Updated Caste Certificate preview logic');
}

// 4. Update Marksheet preview in Step 5 table to use modal
const marksheetPreviewPattern = /onClick=\{\(\) => window\.open\(q\.marksheetUrl, '_blank'\)\}/;
if (marksheetPreviewPattern.test(content)) {
    content = content.replace(marksheetPreviewPattern, "onClick={() => setModalPreview({ url: q.marksheetUrl, label: `Marksheet - ${q.examination}` })}");
    console.log('Updated Marksheet preview logic');
}

// 5. Add the Preview Modal component at the end of the return block
// Find the end of the main container div
const modalCode = `
      {/* Document Preview Modal */}
      {modalPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalPreview(null)} />
          <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                  <Tag size={16} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{modalPreview.label}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(modalPreview.url, '_blank')}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-orange-500 transition-all"
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

if (!content.includes('Document Preview Modal')) {
    // Insert before the last return statement's closing tags
    // The main container ends with </motion.div> or similar if it's there, but here it's likely a div.
    // Let's find the very end of the return statement.
    const lastReturnEndIdx = content.lastIndexOf('    </div>\n  );\n}');
    if (lastReturnEndIdx !== -1) {
        content = content.substring(0, lastReturnEndIdx) + modalCode + content.substring(lastReturnEndIdx);
        console.log('Added Document Preview Modal component');
    } else {
        const lastReturnEndIdx2 = content.lastIndexOf('    </div>\r\n  );\r\n}');
        if (lastReturnEndIdx2 !== -1) {
            content = content.substring(0, lastReturnEndIdx2) + modalCode + content.substring(lastReturnEndIdx2);
            console.log('Added Document Preview Modal component (CRLF)');
        }
    }
}

fs.writeFileSync(filePath, content);
