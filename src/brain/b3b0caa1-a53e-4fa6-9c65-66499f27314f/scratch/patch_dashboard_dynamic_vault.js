const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update Document Vault to be dynamic
const dynamicVaultPattern = /\{\[\s+\{ label: 'Aadhar Card Front', key: 'aadhaarFrontUrl' \},[\s\S]+?\}\)\}\s+<\/div>/;

const newDynamicVault = `{[
                    { label: 'Aadhar Card Front', key: 'aadhaarFrontUrl' },
                    { label: 'Aadhar Card Back', key: 'aadhaarBackUrl' },
                    { label: 'Caste Certificate', key: 'casteCertificateUrl' },
                    ...(userData?.profile?.qualifications || []).map((q: any) => ({
                      label: \`\${q.examination} Marksheet\`,
                      url: q.marksheetUrl
                    }))
                  ].map((doc: any, idx) => {
                    const fileUrl = doc.url || userData?.profile?.[doc.key];

                    return (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group transition-all hover:border-[#00a5a5]">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:text-[#00a5a5] transition-colors">
                               <FileBadge size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doc.label}</p>
                               <div className="flex items-center gap-1.5 mt-0.5">
                                  {fileUrl ? (
                                     <>
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[9px] font-medium text-emerald-600 uppercase">Available</span>
                                     </>
                                  ) : (
                                     <>
                                        <AlertCircle size={12} className="text-slate-300" />
                                        <span className="text-[9px] font-medium text-slate-400 uppercase">Missing</span>
                                     </>
                                  )}
                                </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {fileUrl ? (
                               <button 
                                 onClick={() => setModalPreview({ url: fileUrl, label: doc.label })}
                                 className="bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-[#00a5a5] hover:text-white transition-all flex items-center gap-1.5"
                               >
                                 <Eye size={12} /> Preview
                               </button>
                            ) : (
                               <button 
                                 onClick={() => handleTabChange(3)}
                                 className="bg-slate-50 text-slate-400 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 transition-all"
                               >
                                 Upload
                               </button>
                            )}
                         </div>
                      </div>
                    );
                  })}
                </div>`;

if (dynamicVaultPattern.test(content)) {
    content = content.replace(dynamicVaultPattern, newDynamicVault);
    console.log('Updated Document Vault to be dynamic successfully');
} else {
    console.log('Dynamic vault pattern not found');
}

fs.writeFileSync(filePath, content);
