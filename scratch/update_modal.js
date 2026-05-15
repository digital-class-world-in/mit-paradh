const fs = require('fs');
let c = fs.readFileSync('src/components/FeesCollectionManager.tsx', 'utf8');

// Replace DollarSign with IndianRupee in the modal
c = c.replace(/<DollarSign size={32} \/>/g, '<IndianRupee size={32} />');
c = c.replace(/<DollarSign size={16} className=\"text-\[#00a5a5\]\" \/>/g, '<IndianRupee size={16} className="text-[#00a5a5]" />');

// Update student name font size
c = c.replace(/<p className=\"text-\[13px\] font-normal text-white\/60 capitalize tracking-tight\">\{selectedStudent\.studentName\}<\/p>/g, '<p className="text-[15px] font-bold text-white/90 capitalize tracking-tight leading-none mt-1">{selectedStudent.studentName}</p>');

// Add outstanding and payment method
const bodyStartSearch = '<div className=\"p-10 space-y-8 overflow-y-auto no-scrollbar\">';
const outstandingContent = `
                   {/* Outstanding Fees Display */}
                   <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                         <p className="text-2xl font-black text-rose-600">₹{(parseFloat(selectedStudent.fees || '0') - parseFloat(selectedStudent.paidFees || '0')).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                         <Tag size={24} />
                      </div>
                   </div>
`;
c = c.replace(bodyStartSearch, bodyStartSearch + outstandingContent);

const gridEndSearch = '                     </div>\n                  </div>\n\n                 <button';
const paymentMethodContent = `
                   {/* Payment Method Selection */}
                   <div className="space-y-3">
                      <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight flex items-center gap-2 pl-1">
                         <CreditCard size={16} className="text-indigo-500" /> Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                         {['Cash', 'Online/UPI', 'Cheque/DD'].map((method) => (
                            <button
                               key={method}
                               type="button"
                               onClick={() => setCollectPaymentMethod(method)}
                               className={cn(
                                  "py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all border-2",
                                  collectPaymentMethod === method 
                                     ? "bg-indigo-600 border-black text-white shadow-lg scale-[1.02]" 
                                     : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                               )}
                            >
                               {method}
                            </button>
                         ))}
                      </div>
                   </div>
`;
c = c.replace(gridEndSearch, '                     </div>\n                  </div>\n' + paymentMethodContent + '\n                 <button');

fs.writeFileSync('src/components/FeesCollectionManager.tsx', c, 'utf8');
console.log('DONE');
