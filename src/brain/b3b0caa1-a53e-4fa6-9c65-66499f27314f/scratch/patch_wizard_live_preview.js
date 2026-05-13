const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const uploadEndPattern = /<\/label>\s+<div className="flex gap-2">/;
const newUploadEnd = `</label>
                      {tempQual.marksheetUrl && (
                        <button 
                          type="button"
                          onClick={() => setModalPreview({ url: tempQual.marksheetUrl, label: 'Marksheet Preview' })}
                          className="w-14 h-14 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-all shadow-sm"
                          title="Preview Marksheet"
                        >
                          <Eye size={20} />
                        </button>
                      )}
                      <div className="flex gap-2">`;

if (uploadEndPattern.test(content)) {
    content = content.replace(uploadEndPattern, newUploadEnd);
    console.log('Added live preview button to Step 5 upload area');
} else {
    console.log('Upload end pattern not found');
}

fs.writeFileSync(filePath, content);
