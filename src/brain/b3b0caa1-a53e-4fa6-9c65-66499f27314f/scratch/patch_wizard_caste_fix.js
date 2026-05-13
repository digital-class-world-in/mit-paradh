const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean up corrupted block in Step 11 (Preview)
const corruptedPreviewPattern = /\{\/\* Parent & Category \*\/\}                \{\/\* Religion & Caste Category \*\/\}[\s\S]+?<div className="grid grid-cols-1 md:grid-cols-2 gap-8">[\s\S]+?onChange=\{\(e\) => handleFileChange\(e, 'casteCertificateUrl'\)\}\s+\/>\s+<\/label>[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>/;

// Wait, the corrupted block ends with multiple </div>.
// I'll use a more targeted regex.
const badBlockStart = `{/* Parent & Category */}                {/* Religion & Caste Category */}`;
if (content.includes(badBlockStart)) {
    const startIdx = content.indexOf(badBlockStart);
    // Find the end of this div grid. It's followed by <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> (the correct one)
    const nextCorrectGrid = content.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 gap-8">', startIdx + 100);
    
    if (nextCorrectGrid !== -1) {
        content = content.substring(0, startIdx) + content.substring(nextCorrectGrid);
        console.log('Cleaned up corrupted block in Step 11');
    }
}

// 2. Add Preview button to Caste upload in Step 4
const casteUploadEndPattern = /\{formData\.casteCertificateUrl && \(\s+<div className="w-10 h-10 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500">\s+<CheckCircle2 size=\{20\} \/>\s+<\/div>\s+\)\}/;

const newCasteUploadEnd = `{formData.casteCertificateUrl && (
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <CheckCircle2 size={20} />
                              </div>
                              <button 
                                type="button"
                                onClick={() => window.open(formData.casteCertificateUrl, '_blank')}
                                className="w-10 h-10 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-all"
                                title="Preview Certificate"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          )}`;

if (casteUploadEndPattern.test(content)) {
    content = content.replace(casteUploadEndPattern, newCasteUploadEnd);
    console.log('Added Preview button to Caste upload in Step 4');
}

fs.writeFileSync(filePath, content);
