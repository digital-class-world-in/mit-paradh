'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, update, push, set } from 'firebase/database';
import { 
  FileText, 
  Search, 
  ChevronDown, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Download,
  ShieldCheck,
  Settings,
  Plus,
  Check,
  X,
  Save
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExamFormManagerProps {
  collegeId?: string;
}

export default function ExamFormManager({ collegeId }: ExamFormManagerProps) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(collegeId || '');
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [examSettings, setExamSettings] = useState<any>({
    registrationOpen: false,
    examDate: '',
    lastDate: '',
    fees: '500'
  });

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
    // Fetch Exam Settings
    const settingsRef = ref(realtimeDb, `colleges/${targetId}/examSettings`);
    onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setExamSettings(snap.val());
      }
    });

    // Fetch Exam Forms (syncing with examSubmissions node)
    const formsRef = ref(realtimeDb, `colleges/${targetId}/examSubmissions`);
    onValue(formsRef, (snap) => {
      if (snap.exists()) {
        setForms(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setForms([]);
      }
      setLoading(false);
    });
  }, [selectedCollegeId]);

  const toggleRegistration = async () => {
    if (!selectedCollegeId) return;
    const settingsRef = ref(realtimeDb, `colleges/${selectedCollegeId}/examSettings`);
    await update(settingsRef, { registrationOpen: !examSettings.registrationOpen });
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) return;
    const settingsRef = ref(realtimeDb, `colleges/${selectedCollegeId}/examSettings`);
    await update(settingsRef, examSettings);
    alert('Exam settings updated successfully!');
  };

  const filteredForms = forms.filter(f => 
    f.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.applicationId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleStatusUpdate = async (submissionId: string, newStatus: 'Verified' | 'Rejected') => {
    try {
      const collegePath = collegeId || selectedCollegeId;
      if (!collegePath) return;

      const subRef = ref(realtimeDb, `colleges/${collegePath}/examSubmissions/${submissionId}`);
      await update(subRef, { 
        status: newStatus,
        verifiedAt: new Date().toISOString()
      });
      
      alert(`Submission ${newStatus} successfully.`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-[#002147] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
              <FileText size={14} className="text-[#00a5a5]" /> Academic Control
            </div>
            <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Exam Form Management</h2>
            <p className="text-sm font-normal text-white/60">Configure exam registration and monitor student form submissions.</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#00a5a5] text-white px-8 py-4 rounded-2xl text-[12px] font-black capitalize tracking-tight shadow-xl hover:bg-white hover:text-[#002147] transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} strokeWidth={3} /> Configure Exam
            </button>

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
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00a5a5] pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCollegeId ? (
        <div className="space-y-6">
          {/* Main Content: Form Submissions */}
          <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-slate-100 overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter capitalize">Student Submissions</h3>
                <p className="text-[13px] font-medium text-slate-400 capitalize">Review and verify student examination applications.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..."
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-[#00a5a5] transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-50 text-[14px] font-black text-black uppercase tracking-widest border-b border-black">
                    <th className="px-6 py-5 border-r border-black">Student Information</th>
                    <th className="px-6 py-5 border-r border-black">Program / Course</th>
                    <th className="px-6 py-5 border-r border-black">Parents Detail</th>
                    <th className="px-6 py-5 border-r border-black">Personal Details</th>
                    <th className="px-6 py-5 border-r border-black text-center">Payment</th>
                    <th className="px-6 py-5 border-r border-black text-center">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredForms.map((form) => (
                    <tr key={form.id} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                      <td className="px-6 py-6 border-r border-black">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-black text-slate-800 tracking-tight capitalize leading-none mb-1.5">{form.studentName}</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID: {form.studentId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-slate-700 capitalize leading-none mb-1.5">{form.courseName}</span>
                          <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">{form.courseType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-12">Father:</span>
                            <span className="text-[12px] font-bold text-slate-600 capitalize">{form.fatherName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-12">Mother:</span>
                            <span className="text-[12px] font-bold text-slate-600 capitalize">{form.motherName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-12">DOB:</span>
                            <span className="text-[12px] font-bold text-slate-600 capitalize">{form.dob}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-12">Aadhar:</span>
                            <span className="text-[12px] font-bold text-slate-600 capitalize">{form.aadharNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center border-r border-black">
                        {form.screenshot ? (
                          <button 
                            onClick={() => setPreviewImage(form.screenshot)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-black uppercase"
                          >
                            <Eye size={14} /> View Receipt
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-300 uppercase">No Receipt</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center border-r border-black">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                          form.status === 'Verified' ? "bg-emerald-100 text-emerald-700" :
                          form.status === 'Rejected' ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", 
                            form.status === 'Verified' ? "bg-emerald-500" :
                            form.status === 'Rejected' ? "bg-rose-500" :
                            "bg-amber-500"
                          )} />
                          {form.status || 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 transition-opacity">
                          <button 
                            onClick={() => handleStatusUpdate(form.id, 'Verified')}
                            disabled={form.status === 'Verified'}
                            className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 active:scale-95 disabled:opacity-30"
                            title="Accept Submission"
                          >
                            <Check size={20} strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(form.id, 'Rejected')}
                            disabled={form.status === 'Rejected'}
                            className="p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100 active:scale-95 disabled:opacity-30"
                            title="Reject Submission"
                          >
                            <X size={20} strokeWidth={3} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredForms.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <FileText size={64} strokeWidth={1} />
                          <p className="text-lg font-bold tracking-tight">No submissions found for this institution.</p>
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
        <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-xl p-32 text-center">
          <div className="flex flex-col items-center gap-6 text-slate-300">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
              <ShieldCheck size={48} className="opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black tracking-tighter text-slate-400 uppercase">Selection Required</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Please select an institutional ledger to begin examination form audit.</p>
            </div>
          </div>
        </div>
      )}
      {/* Create Exam Form Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#002147] p-10 text-white relative">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                 <Settings size={32} />
              </div>
              <h3 className="text-3xl font-black tracking-tighter capitalize">Configure Exam Form</h3>
              <p className="text-[13px] font-normal text-black capitalize tracking-normal mt-2">Set up registration parameters for the current session.</p>
            </div>

            <form onSubmit={(e) => { handleUpdateSettings(e); setIsCreateModalOpen(false); }} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Registration Status</label>
                  <button 
                    type="button"
                    onClick={toggleRegistration}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      examSettings.registrationOpen 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                        : "bg-rose-50 border-rose-500 text-rose-700"
                    )}
                  >
                    <span className="font-bold text-sm">{examSettings.registrationOpen ? 'Registration OPEN' : 'Registration CLOSED'}</span>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      examSettings.registrationOpen ? "bg-emerald-500" : "bg-rose-500"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        examSettings.registrationOpen ? "left-7" : "left-1"
                      )} />
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Regular Exam Fee (₹)</label>
                    <input 
                      type="number" 
                      value={examSettings.fees}
                      onChange={(e) => setExamSettings({...examSettings, fees: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Last Date (Without Late Fee)</label>
                    <input 
                      type="date" 
                      value={examSettings.lastDate}
                      onChange={(e) => setExamSettings({...examSettings, lastDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#002147] text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-[#00a5a5] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                <Save size={20} /> Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
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
              <img src={previewImage} className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" alt="Payment Receipt" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
