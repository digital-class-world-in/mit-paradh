'use client';

import { useState } from 'react';
import { 
  Award, 
  Plus, 
  FileText, 
  User, 
  Calendar, 
  CheckCircle2, 
  X, 
  Save, 
  Printer, 
  Download,
  Building2,
  Users
} from 'lucide-react';

export default function CertificateManager({ collegeId }: { collegeId: string | undefined }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tcForm, setTcForm] = useState({
    studentName: '',
    studentId: '',
    fatherName: '',
    motherName: '',
    dob: '',
    admissionNo: '',
    dateOfLeaving: '',
    reasonForLeaving: '',
    lastClassStudied: '',
    characterConduct: 'Good',
    feesPaidStatus: true
  });

  const handleCreateTC = () => {
    console.log('Creating Transfer Certificate:', tcForm);
    alert('Transfer Certificate created successfully!');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header Banner */}
      <div className="bg-[#5D5fb1] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 sm:gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-3 sm:space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
            <Award size={14} className="text-[#00a5a5]" /> Certification Module
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize leading-tight">Transfer Certificates</h2>
          <p className="text-xs sm:text-sm font-normal text-white/60">Issue and manage institutional transfer certificates for students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-white text-[#5D5fb1] w-full md:w-auto px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center justify-center gap-3 shrink-0"
        >
          <Plus size={20} strokeWidth={3} /> Create Certificate
        </button>
      </div>

      {/* List / Placeholder */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-14 md:p-20 text-center">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-slate-300">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
            <FileText size={36} className="opacity-20 sm:w-12 sm:h-12" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-normal tracking-normal capitalize text-black">No Certificates Issued</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Start issuing institutional transfer certificates by clicking the create button above.</p>
          </div>
        </div>
      </div>

      {/* Create TC Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-[#5D5fb1] p-5 sm:p-8 md:p-10 text-white relative shrink-0">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute right-8 top-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
               >
                 <X size={24} />
               </button>
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-lg">
                     <Plus size={24} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">Create Transfer Certificate</h3>
               </div>
               <p className="text-[13px] font-normal text-black capitalize tracking-normal">Institutional Leaving and Conduct Certification</p>
            </div>

            {/* Modal Body */}
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTC(); }} className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><User size={12} /> Student Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.studentName}
                    onChange={(e) => setTcForm({...tcForm, studentName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Admission / Enrollment No.</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.admissionNo}
                    onChange={(e) => setTcForm({...tcForm, admissionNo: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Father's Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.fatherName}
                    onChange={(e) => setTcForm({...tcForm, fatherName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mother's Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.motherName}
                    onChange={(e) => setTcForm({...tcForm, motherName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Calendar size={12} /> Date of Birth</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.dob}
                    onChange={(e) => setTcForm({...tcForm, dob: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Calendar size={12} /> Date of Leaving</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.dateOfLeaving}
                    onChange={(e) => setTcForm({...tcForm, dateOfLeaving: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Building2 size={12} /> Last Class Studied</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.lastClassStudied}
                    onChange={(e) => setTcForm({...tcForm, lastClassStudied: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Reason for Leaving</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={tcForm.reasonForLeaving}
                    onChange={(e) => setTcForm({...tcForm, reasonForLeaving: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Character & Conduct</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm cursor-pointer"
                    value={tcForm.characterConduct}
                    onChange={(e) => setTcForm({...tcForm, characterConduct: e.target.value})}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4 pt-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={tcForm.feesPaidStatus}
                      onChange={(e) => setTcForm({...tcForm, feesPaidStatus: e.target.checked})}
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00a5a5]"></div>
                    <span className="ml-3 text-[13px] font-normal text-black capitalize tracking-tight">Institutional Dues Cleared</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-4">
                <button 
                  type="submit"
                  className="bg-[#5D5fb1] text-white px-12 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                >
                  <Save size={20} /> Finalize & Create TC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



