const fs = require("fs");
const file = "e:/Digital Class/MIT/src/components/ProfileWizard.tsx";
let content = fs.readFileSync(file, "utf8");

// Find case 4 start and case 10 end
const case4Start = content.indexOf("case 4:");
const case10 = content.indexOf("case 10:");
const afterCase10 = content.indexOf("return (", case10);
// We will rebuild the section from case 4 to after case 10 declaration
// Actually we just do string replacements between case 4: and the renderStepContent closing brace

let before = content.slice(0, case4Start);
let section = content.slice(case4Start);

// Scale up label text: text-sm -> text-base for labels, text-[10px]->text-xs for helper text
section = section.replace(/className="text-sm font-bold text-slate-500"/g, 'className="text-base font-bold text-slate-600"');
section = section.replace(/className="text-sm font-bold text-slate-800 italic"/g, 'className="text-lg font-bold text-slate-800 italic"');
section = section.replace(/className="text-\[10px\] font-bold text-slate-400 uppercase tracking-widest"/g, 'className="text-xs font-bold text-slate-400 uppercase tracking-widest"');

// Scale up form inputs: p-6 text-xl already good, but check p-4 text-base and increase
// Currently some fields might have p-4 text-base, upgrade to p-5 text-lg
section = section.replace(/p-4 text-base font-semibold/g, "p-5 text-lg font-semibold");

// Scale up section header subtext
section = section.replace(/"text-\[10px\] font-bold text-slate-400 uppercase tracking-widest"/g, '"text-xs font-bold text-slate-400 uppercase tracking-widest"');

content = before + section;
fs.writeFileSync(file, content);
console.log("Done - font sizes updated for Steps 4-10");
