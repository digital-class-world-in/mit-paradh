const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted block in Step 5
const brokenPattern = /\{tempQual\.board === 'Other' && \([\s\S]+?placeholder="Enter board\/university"\s+\/>\s+className="w-full bg-white border border-slate-200 rounded-lg p-4 text-\[14px\] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"\s+placeholder="Enter school\/college"\s+\/>\s+<\/div>/;

const correctBlock = `{tempQual.board === 'Other' && (
                    <div className="space-y-1.5 animate-in slide-in-from-left duration-300">
                      <label className="text-sm font-normal text-slate-600">Enter Board/University Name <span className="text-red-500">*</span></label>
                      <input 
                        value={tempQual.customBoard || ''}
                        onChange={(e) => setTempQual({...tempQual, customBoard: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Enter board/university"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">School/College Name <span className="text-red-500">*</span></label>
                    <input 
                      value={tempQual.college}
                      onChange={(e) => setTempQual({...tempQual, college: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="Enter school/college"
                    />
                  </div>`;

if (brokenPattern.test(content)) {
    content = content.replace(brokenPattern, correctBlock);
    console.log('Fixed corrupted block in Step 5');
} else {
    // Try a more specific match for just the lines 1391-1394
    const brokenPattern2 = /placeholder="Enter board\/university"\s+\/>\s+className="w-full bg-white border border-slate-200 rounded-lg p-4 text-\[14px\] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"\s+placeholder="Enter school\/college"/;
    
    if (brokenPattern2.test(content)) {
        const fix = `placeholder="Enter board/university"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">School/College Name <span className="text-red-500">*</span></label>
                    <input 
                      value={tempQual.college}
                      onChange={(e) => setTempQual({...tempQual, college: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="Enter school/college"`;
        content = content.replace(brokenPattern2, fix);
        console.log('Fixed corrupted block in Step 5 using pattern 2');
    } else {
        console.log('Broken pattern not found');
    }
}

fs.writeFileSync(filePath, content);
