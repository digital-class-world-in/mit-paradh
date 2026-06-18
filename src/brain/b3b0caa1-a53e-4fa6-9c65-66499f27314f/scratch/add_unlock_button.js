const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'StudentAdmissionManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `<div className="pt-6 flex justify-end gap-4">
                 <button 
                   type="button"
                   onClick={() => setIsEditModalOpen(false)}
                   className="px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                   disabled={isSubmitting}
                 >
                   Discard Changes
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="bg-[#5D5fb1] hover:bg-black text-white font-black px-12 py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl flex items-center gap-3"
                 >
                   {isSubmitting ? (
                     <>
                       <Save size={18} className="animate-pulse" />
                       Saving...
                     </>
                   ) : (
                     <>
                       <Save size={18} />
                       Finalize Changes
                     </>
                   )}
                 </button>
              </div>`;

const replacement = `<div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 mt-6">
                 <button 
                   type="button"
                   onClick={handleUnlockProfile}
                   className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100"
                   disabled={isSubmitting}
                 >
                   <Unlock size={16} /> Unlock Profile for Editing
                 </button>

                 <div className="flex w-full md:w-auto gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 md:flex-none px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                      disabled={isSubmitting}
                    >
                      Discard
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 md:flex-none bg-[#5D5fb1] hover:bg-black text-white font-black px-12 py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <>
                          <Save size={18} className="animate-pulse" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Finalize
                        </>
                      )}
                    </button>
                 </div>
              </div>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log('Successfully replaced footer with Unlock button');
} else {
    // Try a more flexible regex if exact match fails
    const regex = /<div className="pt-6 flex justify-end gap-4">[\s\S]*?<\/button>\s*<\/div>/;
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        console.log('Successfully replaced footer using regex');
    } else {
        console.log('Could not find target footer');
    }
}

fs.writeFileSync(filePath, content);
