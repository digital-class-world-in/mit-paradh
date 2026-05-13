const fs = require('fs');
const file = 'e:/Digital Class/MIT/src/components/ProfileWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Alert -> Alert + window location
content = content.replace(
    /alert\("Application Locked Successfully! Your profile is now final and cannot be edited."\);/g,
    "alert('Application Locked Successfully!');\n      setShowLockPopup(false);\n      window.location.href = '/dashboard';"
);

// 2. Lock Profile button trigger
content = content.replace(
    /onClick=\{handleLockProfile\}/g,
    'onClick={() => setShowLockPopup(true)}'
);

// 3. Inject popup at end
const popupHtml = `
      {showLockPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-red-600 mb-3 text-center">Are you sure you want to lock this profile?</h3>
            <p className="text-[13px] font-semibold text-blue-800/80 mb-8 leading-relaxed text-center">
              Once locked, you will not be able to edit your profile details. Please review all details carefully before proceeding.
            </p>
            <div className="flex justify-center gap-4 font-poppins">
              <button 
                onClick={() => setShowLockPopup(false)}
                className="bg-[#ef4444] hover:bg-red-600 text-white font-bold py-2.5 px-8 rounded shadow-sm transition-all text-sm uppercase tracking-widest"
              >
                No
              </button>
              <button 
                onClick={handleLockProfile}
                className="bg-[#22c55e] hover:bg-green-600 text-white font-bold py-2.5 px-8 rounded shadow-sm transition-all text-sm uppercase tracking-widest"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
    /<\/div>\s*<\/div>\s*;\s*}\s*$/m,
    popupHtml + '\n    </div>\n  );\n}'
);

// 4. Increase font size in Step 10 by doing string replacement on the case 10 block.
let case10Index = content.indexOf('case 10:');
if (case10Index !== -1) {
    let before = content.slice(0, case10Index);
    let after = content.slice(case10Index);
    
    // Scale up specific text sizes carefully
    after = after.replace(/text-\[8px\]/g, 'text-[11px]');
    after = after.replace(/text-\[9px\]/g, 'text-[13px]');
    after = after.replace(/text-\[10px\]/g, 'text-xs');
    after = after.replace(/text-\[11px\]/g, 'text-sm');
    after = after.replace(/text-\[13px\]/g, 'text-base');
    
    after = after.replace(/text-xs/g, 'text-sm');
    after = after.replace(/text-sm/g, 'text-base');

    content = before + after;
}

fs.writeFileSync(file, content);
console.log('Wizard updated successfully!');
