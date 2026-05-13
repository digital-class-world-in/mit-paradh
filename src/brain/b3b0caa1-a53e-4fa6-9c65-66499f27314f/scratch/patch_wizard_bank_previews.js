const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add preview button to Bank Passbook upload
const passbookPattern = /<input type="file" className="hidden" onChange=\{\(e\) => handleFileChange\(e, 'bankPassbookUrl'\)\} \/>\s+<\/label>\s+\{formData\.bankPassbookUrlFileName && \([\s\S]+?<\/span>\s+\)\}/;

const newPassbook = `<input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'bankPassbookUrl')} />
                        </label>
                        {formData.bankPassbookUrl && (
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

if (passbookPattern.test(content)) {
    content = content.replace(passbookPattern, newPassbook);
    console.log('Added preview button to Bank Passbook');
}

// 2. Add preview button to PAN Card upload
const panPattern = /<input type="file" className="hidden" onChange=\{\(e\) => handleFileChange\(e, 'panCardUrl'\)\} \/>\s+<\/label>\s+\{formData\.panCardUrlFileName && \([\s\S]+?<\/span>\s+\)\}/;

const newPan = `<input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'panCardUrl')} />
                        </label>
                        {formData.panCardUrl && (
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

if (panPattern.test(content)) {
    content = content.replace(panPattern, newPan);
    console.log('Added preview button to PAN Card');
}

fs.writeFileSync(filePath, content);
