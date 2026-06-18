const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Step 6: Training Preview
const trainingRegex = /\{formData\.trainingCertificateUrl && \(\s*<div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">\s*<CheckCircle2 size=\{16\} className="text-emerald-500" \/>\s*<span className="text-xs font-normal text-emerald-700 text-nowrap truncate max-w-\[200px\]">Uploaded Successfully<\/span>\s*<\/div>\s*\)\}/;

const trainingReplacement = `{formData.trainingCertificateUrl && (
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
                       )}`;

if (trainingRegex.test(content)) {
    content = content.replace(trainingRegex, trainingReplacement);
    console.log('Updated Training Preview');
}

// Step 8: Bank/PAN Preview
const passbookRegex = /\{formData\.bankPassbookUrl && \(\s*<div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">\s*<CheckCircle2 size=\{16\} className="text-emerald-500" \/>\s*<span className="text-\[10px\] font-medium text-emerald-700">Uploaded<\/span>\s*<\/div>\s*\)\}/;

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

const panRegex = /\{formData\.panCardUrl && \(\s*<div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">\s*<CheckCircle2 size=\{16\} className="text-emerald-500" \/>\s*<span className="text-\[10px\] font-medium text-emerald-700">Uploaded<\/span>\s*<\/div>\s*\)\}/;

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
