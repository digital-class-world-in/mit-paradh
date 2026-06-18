const fs = require('fs');
const content = fs.readFileSync('src/components/ProfileWizard.tsx', 'utf8');
const lines = content.split('\n');

const modalStart = `      {/* Application Preview Modal */}
      {isPreviewModalOpen && (
         <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-normal italic text-[#ff9f1c]">Application Preview</h3>
                 <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-rose-600">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-12">`;

const modalEnd = `              </div>
              <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex justify-center gap-4">
                 <button onClick={() => { setIsPreviewModalOpen(false); setCurrentStep(1); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-normal py-3.5 px-10 rounded shadow-sm transition-all text-sm capitalize">Edit Application</button>
                 <button onClick={() => { setIsPreviewModalOpen(false); handleSaveAndNext(); }} className="bg-[#21ba45] hover:bg-green-600 text-white font-normal py-3.5 px-10 rounded shadow-sm transition-all text-sm capitalize flex items-center gap-2">Proceed to Lock Profile <ArrowRight size={16} /></button>
              </div>
           </div>
         </div>
      )}`;

// 1. Add state
let newContent = content.replace('const [declarationChecked, setDeclarationChecked] = useState(false);', 'const [declarationChecked, setDeclarationChecked] = useState(false);\n  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);');

// 2. Update step 10 button
newContent = newContent.replace('onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2">Save & Next</button>', 'onClick={() => { if (!selectedCollege || !selectedCourseType || !selectedCourseId) { alert("Please select Target Institution, Course Type and Course Name before previewing."); return; } setIsPreviewModalOpen(true); }} disabled={loading} className="bg-[#ff9f1c] hover:bg-orange-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2"><Eye size={16} /> Preview Application</button>');

// 3. Extract preview details from Step 11
const previewContent = lines.slice(2975, 3313).join('\n');

// 4. Create new step 11
const oldStep11Str = lines.slice(2968, 3335).join('\n');
const newStep11Str = `      case 11:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1 pb-6 border-b border-slate-200 text-center">
              <h4 className="text-sm font-normal text-[#ff9f1c] italic capitalize tracking-wider">Lock Profile</h4>
              <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">You have previewed your application. Please agree to the declaration to lock and submit.</p>
            </div>
            <div className="space-y-12 text-left">
              {/* Declaration Block */}
              <div className="bg-sky-50/50 rounded-2xl border border-orange-100 p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="declaration"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-sky-200 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="declaration" className="space-y-4 cursor-pointer">
                    <p className="text-sm font-medium text-slate-800 italic capitalize tracking-tight">I hereby declare & understand that,</p>
                    <ul className="list-decimal list-inside space-y-2 text-sm font-normal text-slate-500 leading-relaxed">
                      <li>All the information furnished by me in this profile is true, complete and correct to the best of my knowledge and belief.</li>
                      <li>Entire information furnished by me in this profile is final and binding to me.</li>
                      <li>If any information furnished by me here, is found to be false or incorrect, I shall be liable for appropriate legal action and my application will be cancelled as per rules.</li>
                    </ul>
                  </label>
                </div>
              </div>
            </div>`;

newContent = newContent.replace(oldStep11Str, newStep11Str);

// 5. Inject modal at the bottom
const modalHTML = '\n' + modalStart + '\n' + previewContent + '\n' + modalEnd + '\n';
newContent = newContent.replace('    </div>\n  );\n}\n', modalHTML + '    </div>\n  );\n}\n');

fs.writeFileSync('src/components/ProfileWizard.tsx', newContent);
console.log('Update complete');
