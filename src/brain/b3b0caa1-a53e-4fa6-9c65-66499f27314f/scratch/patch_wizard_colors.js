const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'ProfileWizard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Table Preview Icon Color (from Emerald to Teal)
content = content.replace(
    /className=\{\`transition-colors p-2 rounded-lg \$\{q\.marksheetUrl \? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-300'\}\`\}/g,
    "className={`transition-colors p-2 rounded-lg ${q.marksheetUrl ? 'text-[#00a5a5] hover:text-[#008a8a] hover:bg-slate-50' : 'text-slate-300'}`}"
);

// 2. Update Live Marksheet Preview Button Color (from Orange to Teal)
content = content.replace(
    /className="w-14 h-14 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-all shadow-sm"/g,
    'className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all shadow-sm"'
);

// 3. Update Caste Certificate Preview Icon Color (from Orange to Teal)
content = content.replace(
    /className="w-10 h-10 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-all"/g,
    'className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-[#00a5a5] hover:bg-white hover:border-[#00a5a5] transition-all"'
);

fs.writeFileSync(filePath, content);
console.log('Updated all preview icon colors to Teal (#00a5a5) in ProfileWizard.tsx');
