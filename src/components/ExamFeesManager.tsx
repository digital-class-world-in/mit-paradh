'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { 
  FileText, 
  Search, 
  ChevronDown, 
  Eye,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Calendar
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExamFeesManagerProps {
  collegeId?: string;
}

export default function ExamFeesManager({ collegeId }: ExamFeesManagerProps) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(collegeId || '');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (collegeId) setSelectedCollegeId(collegeId);
  }, [collegeId]);

  useEffect(() => {
    if (!collegeId) {
      const collegesRef = ref(realtimeDb, 'colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          setColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      });
    }
  }, [collegeId]);

  useEffect(() => {
    const targetId = selectedCollegeId;
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const submissionsRef = ref(realtimeDb, `colleges/${targetId}/examSubmissions`);
    onValue(submissionsRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.val()).map(([id, val]: any) => ({ 
          id, 
          ...val,
          collegeName: val.collegeName || colleges.find(c => c.id === targetId)?.name || 'Unknown'
        }));
        setSubmissions(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      } else {
        setSubmissions([]);
      }
      setLoading(false);
    });
  }, [selectedCollegeId, colleges]);

  const handleStatusUpdate = async (submissionId: string, newStatus: 'Verified' | 'Rejected') => {
    try {
      const collegePath = selectedCollegeId;
      if (!collegePath) return;

      const subRef = ref(realtimeDb, `colleges/${collegePath}/examSubmissions/${submissionId}`);
      await update(subRef, { 
        status: newStatus,
        processedAt: new Date().toISOString()
      });
      
      alert(`Payment ${newStatus} successfully.`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    s.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.collegeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-[#002147] rounded-[3rem] p-12 text-white border-b-8 border-[#ff9f1c] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
              <CreditCard size={14} className="text-[#ff9f1c]" /> Financial Audit
            </div>
            <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Exam Fees Management</h2>
            <p className="text-sm font-normal text-white/60">Monitor and verify student examination fee submissions.</p>
          </div>

          {!collegeId && (
            <div className="relative">
              <select 
                className="bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-sm font-bold text-white outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer min-w-[280px]"
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
              >
                <option value="" className="text-black">Select Institution...</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#ff9f1c] pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {selectedCollegeId ? (
        <div className="space-y-6">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-black overflow-hidden">
            <div className="p-10 border-b border-black flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter capitalize">Fee Submissions</h3>
                <p className="text-[13px] font-medium text-slate-400 capitalize">Audit student exam payments and verify transaction proofs.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student, course, or college..."
                  className="w-full bg-white border border-black rounded-2xl py-4 pl-14 pr-6 text-sm font-normal outline-none focus:border-[#ff9f1c] transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-b border-black">
                <thead>
                  <tr className="bg-slate-50 text-[14px] font-black text-black uppercase tracking-widest border-b border-black">
                    <th className="px-6 py-5 border-r border-black text-center">Sr No</th>
                    <th className="px-6 py-5 border-r border-black">Date & Time</th>
                    <th className="px-6 py-5 border-r border-black">Name</th>
                    <th className="px-6 py-5 border-r border-black">College</th>
                    <th className="px-6 py-5 border-r border-black">Course Type</th>
                    <th className="px-6 py-5 border-r border-black">Course</th>
                    <th className="px-6 py-5 border-r border-black text-center">Fees</th>
                    <th className="px-6 py-5 border-r border-black text-center">Status</th>
                    <th className="px-6 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredSubmissions.map((sub, index) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors border-b border-black">
                      <td className="px-6 py-6 border-r border-black text-center font-bold">{index + 1}</td>
                      <td className="px-6 py-6 border-r border-black">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 leading-none mb-1">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-r border-black font-black text-slate-800 capitalize">{sub.studentName}</td>
                      <td className="px-6 py-6 border-r border-black font-medium text-slate-600 capitalize">{sub.collegeName}</td>
                      <td className="px-6 py-6 border-r border-black">
                         <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-black uppercase border border-amber-100">{sub.courseType}</span>
                      </td>
                      <td className="px-6 py-6 border-r border-black font-bold text-slate-700 capitalize">{sub.courseName}</td>
                      <td className="px-6 py-6 border-r border-black text-center">
                        <span className="text-[15px] font-black text-[#ff9f1c]">₹{sub.fees}</span>
                      </td>
                      <td className="px-6 py-6 text-center border-r border-black">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                          sub.status === 'Verified' ? "bg-emerald-100 text-emerald-700" :
                          sub.status === 'Rejected' ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {sub.status || 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {sub.screenshot && (
                             <button 
                               onClick={() => setPreviewImage(sub.screenshot)}
                               className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm active:scale-95"
                               title="View Screenshot"
                             >
                               <Eye size={16} />
                             </button>
                          )}
                          <button 
                            onClick={() => handleStatusUpdate(sub.id, 'Verified')}
                            disabled={sub.status === 'Verified'}
                            className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm font-black text-[11px] uppercase active:scale-95 disabled:opacity-30"
                          >
                            Process
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <FileText size={64} strokeWidth={1} />
                          <p className="text-lg font-bold tracking-tight">No fee submissions found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-black shadow-xl p-32 text-center">
          <div className="flex flex-col items-center gap-6 text-slate-300">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-black shadow-inner">
              <ShieldCheck size={48} className="opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black tracking-tighter text-slate-400 uppercase">Selection Required</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Please select an institutional ledger to begin fee audit.</p>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setPreviewImage(null)} />
          <div className="relative max-w-5xl w-full max-h-full flex flex-col gap-6 animate-in zoom-in-95">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-rose-500 transition-colors flex items-center gap-2 font-bold"
            >
              <X size={24} /> Close Preview
            </button>
            <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden">
              <img src={previewImage} className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" alt="Payment Screenshot" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
