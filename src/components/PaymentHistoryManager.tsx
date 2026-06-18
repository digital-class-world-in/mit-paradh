'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, set, push } from 'firebase/database';
import { Search, Eye, CheckCircle2, XCircle, Clock, Download, ExternalLink, Calendar, User, CreditCard, Building2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PaymentHistoryManagerProps {
  collegeId: string;
  adminUid?: string;
}

export default function PaymentHistoryManager({ collegeId, adminUid }: PaymentHistoryManagerProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    let paymentsRef;
    
    if (collegeId) {
      paymentsRef = ref(realtimeDb, `colleges/${collegeId}/payments/online`);
      const unsubscribe = onValue(paymentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.keys(data).map(key => ({
            id: key,
            collegeId,
            ...data[key]
          })).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setPayments(list);
        } else {
          setPayments([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Global view - Fetch all colleges
      const allCollegesRef = ref(realtimeDb, 'colleges');
      const unsubscribe = onValue(allCollegesRef, (snapshot) => {
        if (snapshot.exists()) {
          const allData = snapshot.val();
          let aggregated: any[] = [];
          
          Object.keys(allData).forEach(cId => {
            if (allData[cId].payments?.online) {
              const pData = allData[cId].payments.online;
              Object.keys(pData).forEach(pId => {
                aggregated.push({
                  id: pId,
                  collegeId: cId,
                  collegeName: allData[cId].name,
                  ...pData[pId]
                });
              });
            }
          });
          
          aggregated.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setPayments(aggregated);
        } else {
          setPayments([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [collegeId]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.studentName?.toLowerCase().includes(filter.toLowerCase()) ||
      p.utrId?.toLowerCase().includes(filter.toLowerCase()) ||
      p.email?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      await set(ref(realtimeDb, `colleges/${collegeId}/payments/online/${paymentId}/status`), newStatus);
      // In a real app, you'd also update the student's ledger here
      alert(`Payment status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5D5fb1]"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student, UTR or email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
         </div>

         <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
            {['All', 'Pending Verification', 'Approved', 'Rejected'].map((status) => (
               <button
                 key={status}
                 onClick={() => setStatusFilter(status)}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                   statusFilter === status 
                    ? "bg-[#5D5fb1] text-white border-[#5D5fb1] shadow-lg shadow-indigo-100" 
                    : "bg-white text-slate-400 border-slate-200 hover:border-[#5D5fb1] hover:text-[#5D5fb1]"
                 )}
               >
                 {status === 'Pending Verification' ? 'Pending' : status}
               </button>
            ))}
         </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-4">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px] border border-black">
               <thead>
                  <tr className="bg-[#002147] text-[14px] font-black text-white uppercase tracking-widest border-b border-black">
                     <th className="px-6 py-5 border-r border-black text-center w-16">Sr. No.</th>
                     {!collegeId && <th className="px-8 py-5 border-r border-black">Institution</th>}
                     <th className="px-8 py-5 border-r border-black">Student / Course</th>
                     <th className="px-8 py-5 text-center border-r border-black">Date & Time</th>
                     <th className="px-8 py-5 text-center border-r border-black">Amount</th>
                     <th className="px-8 py-5 border-r border-black">UTR / Transaction ID</th>
                     <th className="px-8 py-5 text-center border-r border-black">Status</th>
                     <th className="px-8 py-5 text-center border-r border-black">Verification</th>
                     <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-black">
                  {filteredPayments.map((p, idx) => (
                     <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-6 border-r border-black text-center text-[14px] font-medium text-black">
                           {idx + 1}
                        </td>
                        {!collegeId && (
                           <td className="px-8 py-6 border-r border-black">
                              <div className="flex items-center gap-2">
                                 <Building2 size={16} className="text-slate-400" />
                                 <span className="text-[13px] font-bold text-slate-700">{p.collegeName || 'N/A'}</span>
                              </div>
                           </td>
                        )}
                        <td className="px-8 py-6 border-r border-black">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                 <User size={18} />
                              </div>
                              <div>
                                 <p className="text-[14px] font-medium text-slate-800 tracking-tight leading-none mb-1">{p.studentName}</p>
                                 <p className="text-[11px] font-normal text-slate-400 uppercase">{p.courseName || 'General Fee'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center border-r border-black">
                           <div className="inline-flex flex-col items-center">
                              <span className="text-[13px] font-medium text-slate-600">{new Date(p.submittedAt).toLocaleDateString()}</span>
                              <span className="text-[10px] font-normal text-slate-400 uppercase">{new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center border-r border-black">
                           <span className="text-[15px] font-medium text-emerald-600 tracking-tighter">₹{parseFloat(p.amount).toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-6 border-r border-black">
                           <div className="flex flex-col">
                              <span className="text-[13px] font-mono font-medium text-slate-600">{p.utrId || 'NO UTR PROVIDED'}</span>
                              <span className="text-[10px] font-normal text-slate-400">Payer: {p.relationship}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center border-r border-black">
                           <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest border",
                              p.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              p.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-amber-50 text-amber-600 border-amber-100"
                           )}>
                              {p.status === 'Approved' && <CheckCircle2 size={10} />}
                              {p.status === 'Rejected' && <XCircle size={10} />}
                              {p.status === 'Pending Verification' && <Clock size={10} />}
                              {p.status === 'Pending Verification' ? 'Pending' : p.status}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center border-r border-black">
                           {p.screenshot && (
                              <button 
                                onClick={() => window.open(p.screenshot, '_blank')}
                                className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-[#5D5fb1] hover:text-white transition-all active:scale-95 shadow-sm"
                                title="View Screenshot"
                              >
                                 <Eye size={16} />
                              </button>
                           )}
                        </td>
                        <td className="px-8 py-6 text-center">
                           <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              {p.status !== 'Approved' && (
                                 <button 
                                   onClick={() => handleUpdateStatus(p.id, 'Approved')}
                                   className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                   title="Approve Payment"
                                 >
                                    <CheckCircle2 size={16} />
                                 </button>
                              )}
                              {p.status !== 'Rejected' && (
                                 <button 
                                   onClick={() => handleUpdateStatus(p.id, 'Rejected')}
                                   className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                   title="Reject Payment"
                                 >
                                    <XCircle size={16} />
                                 </button>
                              )}
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                     <tr>
                        <td colSpan={7} className="px-8 py-24 text-center">
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                 <CreditCard size={32} />
                              </div>
                              <p className="text-[13px] font-bold text-slate-400 max-w-xs leading-tight">No transactions found matching your criteria.</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
