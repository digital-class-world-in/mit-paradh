const fs = require("fs");
const file = "e:/Digital Class/MIT/src/components/ProfileWizard.tsx";
let content = fs.readFileSync(file, "utf8");

const case10Start = content.indexOf("case 10:");
let before = content.slice(0, case10Start);
let step10 = content.slice(case10Start);

const replacePairs = [
  ['text-[13px] font-black text-slate-700 uppercase tracking-tight italic', 'text-base font-black text-slate-700 uppercase tracking-tight italic'],
  ['text-[11px] font-black text-slate-700 uppercase tracking-tight italic', 'text-base font-black text-slate-700 uppercase tracking-tight italic'],
  ['text-[10px] font-bold text-slate-400 uppercase tracking-widest', 'text-xs font-bold text-slate-400 uppercase tracking-widest'],
  ['text-[9px] font-bold text-slate-400 uppercase tracking-widest', 'text-xs font-bold text-slate-400 uppercase tracking-widest'],
  ['text-[9px] font-bold text-slate-400 uppercase', 'text-xs font-bold text-slate-400 uppercase'],
  ['text-sm font-black text-slate-700 uppercase italic', 'text-base font-black text-slate-700 uppercase italic'],
  ['text-[13px] font-bold text-slate-700 uppercase', 'text-base font-bold text-slate-700 uppercase'],
  ['text-[13px] font-semibold text-slate-500 uppercase', 'text-base font-semibold text-slate-500 uppercase'],
  ['text-[13px] font-black text-[#ff9f1c] italic', 'text-base font-black text-[#ff9f1c] italic'],
  ['text-[13px] font-semibold text-slate-500 capitalize', 'text-base font-semibold text-slate-500 capitalize'],
  ['text-[13px] font-black text-slate-800 italic uppercase tracking-tight', 'text-base font-black text-slate-800 italic uppercase tracking-tight'],
  ['text-[12px] font-bold text-slate-500 leading-relaxed', 'text-sm font-bold text-slate-500 leading-relaxed'],
  ['text-[11px] font-bold text-slate-700 uppercase tracking-tighter', 'text-sm font-bold text-slate-700 uppercase tracking-tighter'],
  ['text-[8px] font-black text-[#ff9f1c] uppercase', 'text-xs font-black text-[#ff9f1c] uppercase'],
  ['text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none', 'text-xs font-bold text-slate-400 uppercase tracking-widest leading-none'],
];

for (const [from, to] of replacePairs) {
  step10 = step10.split(from).join(to);
}

content = before + step10;
fs.writeFileSync(file, content);
console.log("Step 10 review text scaled up successfully.");
