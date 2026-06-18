const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Make the Eye icon in the qualification table always visible
const tableEyePattern = /\{q\.marksheetUrl && \(\s+<button\s+onClick=\{\(\) => setModalPreview\(\{ url: q\.marksheetUrl, label: `Marksheet - \$\{q\.examination\}` \}\)\}\s+className="text-emerald-500 hover:text-emerald-700 transition-colors p-2 rounded-lg hover:bg-emerald-50"\s+title="Preview Marksheet"\s+>\s+<Eye size=\{16\} \/>\s+<\/button>\s+\)\}/;

const newTableEye = `<button 
                                    onClick={() => {
                                      if (q.marksheetUrl) {
                                        setModalPreview({ url: q.marksheetUrl, label: \`Marksheet - \${q.examination}\` });
                                      } else {
                                        alert("No marksheet uploaded for this qualification. Please edit and upload to view preview.");
                                      }
                                    }}
                                    className={\`transition-colors p-2 rounded-lg \${q.marksheetUrl ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-300'}\`}
                                    title={q.marksheetUrl ? "Preview Marksheet" : "No Marksheet Uploaded"}
                                  >
                                    <Eye size={16} />
                                  </button>`;

if (tableEyePattern.test(content)) {
    content = content.replace(tableEyePattern, newTableEye);
    console.log('Updated table Eye icon to be always visible');
}

// 2. Make the live preview Eye icon in the upload area more prominent or always visible?
// Actually, for the live preview, it only makes sense if there's a file.
// But I'll make sure it's correctly implemented.
// Let's re-verify the live preview block.
const livePreviewPattern = /\{tempQual\.marksheetUrl && \(\s+<button\s+type="button"\s+onClick=\{\(\) => setModalPreview\(\{ url: tempQual\.marksheetUrl, label: 'Marksheet Preview' \}\)\}\s+className="w-14 h-14 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-all shadow-sm"\s+title="Preview Marksheet"\s+>\s+<Eye size=\{20\} \/>\s+<\/button>\s+\)\}/;

if (!livePreviewPattern.test(content)) {
    console.log('Live preview pattern not found, might be missing or different');
}

fs.writeFileSync(filePath, content);
