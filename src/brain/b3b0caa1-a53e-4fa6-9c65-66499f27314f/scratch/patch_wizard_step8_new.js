const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Step 8: Bank Passbook Preview
const passbookRegex = /\{formData\.bankPassbookUrlFileName && \(\s*<span className="text-\[11px\] font-normal text-orange-500 italic flex items-center gap-1">\s*<PlusCircle size=\{10\} \/> \{formData\.bankPassbookUrlFileName\}\s*<\/span>\s*\)\}/;

const passbookReplacement = `{formData.bankPassbookUrl && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <span className="text-[10px] font-medium text-emerald-700">Uploaded</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setModalPreview({ url: formData.bankPassbookUrl, label: 'Passbook / Cheque' })}
                              className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                              title="Preview Document"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        )}`;

if (passbookRegex.test(content)) {
    content = content.replace(passbookRegex, passbookReplacement);
    console.log('Updated Bank Passbook Preview');
}

// Step 8: PAN Preview
const panRegex = /\{formData\.panCardUrlFileName && \(\s*<span className="text-\[11px\] font-normal text-orange-500 italic flex items-center gap-1">\s*<PlusCircle size=\{10\} \/> \{formData\.panCardUrlFileName\}\s*<\/span>\s*\)\}/;

const panReplacement = `{formData.panCardUrl && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <span className="text-[10px] font-medium text-emerald-700">Uploaded</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setModalPreview({ url: formData.panCardUrl, label: 'PAN Card' })}
                              className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"
                              title="Preview PAN Card"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        )}`;

if (panRegex.test(content)) {
    content = content.replace(panRegex, panReplacement);
    console.log('Updated PAN Preview');
}

fs.writeFileSync(filePath, content);
