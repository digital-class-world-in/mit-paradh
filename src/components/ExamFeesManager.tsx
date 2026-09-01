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
  Calendar,
  User,
  AlertCircle,
  Phone,
  Building2,
  BookOpen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExamFeesManagerProps {
  collegeId?: string;
  adminUid?: string;
}

export default function ExamFeesManager({ collegeId, adminUid }: ExamFeesManagerProps) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(collegeId || '');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<any | null>(null);
  const [rejectingSubmission, setRejectingSubmission] = useState<any | null>(null);
  const [rejectionRemark, setRejectionRemark] = useState('');

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
    const safetyTimer = setTimeout(() => setLoading(false), 500);
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

    return () => clearTimeout(safetyTimer);
  }, [selectedCollegeId, colleges]);

  const handleStatusUpdate = async (submissionId: string, newStatus: 'Verified' | 'Rejected', remark?: string) => {
    try {
      const collegePath = selectedCollegeId;
      if (!collegePath) return;

      const subRef = ref(realtimeDb, `colleges/${collegePath}/examSubmissions/${submissionId}`);
      await update(subRef, { 
        status: newStatus,
        remarks: remark || (newStatus === 'Verified' ? 'Exam form and fees verified.' : 'Exam form rejected.'),
        processedAt: new Date().toISOString()
      });
      
      alert(`Exam form submission marked as ${newStatus} successfully.`);
      setRejectingSubmission(null);
      setRejectionRemark('');
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    s.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.stream?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <CreditCard size={14} className="text-[#ff9f1c]" /> Financial & Exam Audit
            </div>
            <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Exam Fees & Form Submissions</h2>
            <p className="text-sm font-normal text-white/60">Audit student examination details, verify payment screenshots, and approve or reject submissions.</p>
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
                <h3 className="text-2xl font-black tracking-tighter capitalize">Exam Submissions Audit</h3>
                <p className="text-[13px] font-medium text-slate-400 capitalize">Audit student exam particulars, payment proofs, and approve or reject forms.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student, course, stream, or college..."
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
                    <th className="px-6 py-5 border-r border-black">Student Name</th>
                    <th className="px-6 py-5 border-r border-black">College</th>
                    <th className="px-6 py-5 border-r border-black">Course Type</th>
                    <th className="px-6 py-5 border-r border-black">Course</th>
                    <th className="px-6 py-5 border-r border-black">Stream / Branch</th>
                    <th className="px-6 py-5 border-r border-black">UTR / Trans No</th>
                    <th className="px-6 py-5 border-r border-black text-center">Academic Year</th>
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
                      <td className="px-6 py-6 border-r border-black font-black text-slate-800 capitalize">
                        <div>{sub.studentName}</div>
                        <div className="text-[10px] font-bold text-indigo-600">Reg: {sub.studentId || sub.regNo || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-6 border-r border-black font-medium text-slate-600 capitalize">{sub.collegeName}</td>
                      <td className="px-6 py-6 border-r border-black">
                         <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-black uppercase border border-amber-100">{sub.courseType}</span>
                      </td>
                      <td className="px-6 py-6 border-r border-black font-bold text-slate-700 capitalize">{sub.courseName}</td>
                      <td className="px-6 py-6 border-r border-black text-slate-700 font-bold text-sm">
                        {sub.stream || sub.branch || sub.streamBranch || <span className="text-slate-400 font-normal">N/A</span>}
                      </td>
                      <td className="px-6 py-6 border-r border-black text-slate-800 font-bold text-xs font-mono">
                        {sub.utrId ? (
                          <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">{sub.utrId}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-6 border-r border-black text-center text-slate-600 font-bold">{sub.academicYear || '2026-2027'}</td>
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
                          <button 
                            onClick={() => setSelectedSubmissionDetails(sub)}
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#002147] hover:text-white transition-all border border-slate-200 shadow-sm active:scale-95"
                            title="View Full Submission Details"
                          >
                            <Eye size={16} />
                          </button>

                          {sub.screenshot && (
                             <button 
                               onClick={() => setPreviewImage(sub.screenshot)}
                               className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm active:scale-95"
                               title="View Payment Screenshot"
                             >
                               <CreditCard size={16} />
                             </button>
                          )}

                          <button 
                            onClick={() => handleStatusUpdate(sub.id, 'Verified')}
                            disabled={sub.status === 'Verified'}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm font-black text-[11px] uppercase active:scale-95 disabled:opacity-30 flex items-center gap-1"
                            title="Verify Exam Form"
                          >
                            <Check size={14} /> Verify
                          </button>

                          <button 
                            onClick={() => {
                              setRejectingSubmission(sub);
                              setRejectionRemark('');
                            }}
                            disabled={sub.status === 'Rejected'}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm font-black text-[11px] uppercase active:scale-95 disabled:opacity-30 flex items-center gap-1"
                            title="Reject Exam Form"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-10 py-32 text-center">
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

      {/* View Full Submission Details Modal */}
      {selectedSubmissionDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/70 backdrop-blur-sm" onClick={() => setSelectedSubmissionDetails(null)} />
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-[#002147] p-8 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#00a5a5] rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Student Exam Form Details</h3>
                  <p className="text-xs text-white/60 font-medium">Session {selectedSubmissionDetails.academicYear || '2026-2027'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSubmissionDetails(null)} className="text-white/60 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Student Full Name</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{selectedSubmissionDetails.studentName}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Father's Name</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{selectedSubmissionDetails.fatherName || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Mother's Name</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{selectedSubmissionDetails.motherName || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Date of Birth</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSubmissionDetails.dob || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Aadhaar Number</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSubmissionDetails.aadharNumber || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Contact Phone</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSubmissionDetails.studentPhone || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Course Type</span>
                  <span className="text-sm font-bold text-indigo-600 uppercase">{selectedSubmissionDetails.courseType || 'Regular'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Course</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSubmissionDetails.courseName}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Stream / Branch</span>
                  <span className="text-sm font-bold text-teal-600">{selectedSubmissionDetails.stream || selectedSubmissionDetails.branch || selectedSubmissionDetails.streamBranch || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Transaction / UTR No</span>
                  <span className="text-sm font-bold font-mono text-slate-800">{selectedSubmissionDetails.utrId || selectedSubmissionDetails.utrNumber || selectedSubmissionDetails.transactionNumber || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Name Of Transfer / Sender</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">{selectedSubmissionDetails.nameOfTransfer || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Pay Amount</span>
                  <span className="text-sm font-black text-emerald-600">₹{selectedSubmissionDetails.payAmount || selectedSubmissionDetails.fees || '0'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Mode Of Transfer</span>
                  <span className="text-sm font-bold text-indigo-600 uppercase">{selectedSubmissionDetails.modeOfTransfer || 'UPI'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">UPI ID</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSubmissionDetails.upiId || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">UPI Mobile Number</span>
                  <span className="text-sm font-bold text-slate-800">{selectedSubmissionDetails.upiMobileNumber || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Bank A/c No</span>
                  <span className="text-sm font-bold font-mono text-slate-800">{selectedSubmissionDetails.bankAcNo || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">IFSC Code</span>
                  <span className="text-sm font-bold font-mono text-slate-800 uppercase">{selectedSubmissionDetails.ifscCode || 'N/A'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Transaction Date & Time</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedSubmissionDetails.transactionDate || 'N/A'} {selectedSubmissionDetails.transactionTime ? `(${selectedSubmissionDetails.transactionTime})` : ''}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Reference Number</span>
                  <span className="text-sm font-bold font-mono text-slate-800">{selectedSubmissionDetails.referenceNumber || 'N/A'}</span>
                </div>
              </div>

              {selectedSubmissionDetails.screenshot && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Payment Proof / Screenshot</span>
                  <div className="border border-slate-200 rounded-3xl p-3 bg-slate-50 max-h-72 overflow-hidden flex justify-center">
                    <img 
                      src={selectedSubmissionDetails.screenshot} 
                      alt="Payment Proof" 
                      className="max-h-64 object-contain rounded-2xl cursor-pointer hover:scale-105 transition-transform" 
                      onClick={() => setPreviewImage(selectedSubmissionDetails.screenshot)}
                    />
                  </div>
                </div>
              )}

              {selectedSubmissionDetails.remarks && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-medium text-amber-800">
                  <strong>Remarks / Feedback:</strong> {selectedSubmissionDetails.remarks}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  handleStatusUpdate(selectedSubmissionDetails.id, 'Verified');
                  setSelectedSubmissionDetails(null);
                }}
                disabled={selectedSubmissionDetails.status === 'Verified'}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
              >
                Approve & Verify
              </button>
              <button
                onClick={() => {
                  setRejectingSubmission(selectedSubmissionDetails);
                  setSelectedSubmissionDetails(null);
                }}
                disabled={selectedSubmissionDetails.status === 'Rejected'}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
              >
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason Input */}
      {rejectingSubmission && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-sm" onClick={() => setRejectingSubmission(null)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 p-8 space-y-6">
            <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Reject Exam Form</h3>
              <p className="text-xs text-slate-500 font-medium">Rejecting submission for <strong className="text-slate-800">{rejectingSubmission.studentName}</strong>.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Rejection Reason / Remark</label>
              <textarea
                rows={3}
                placeholder="e.g. Invalid payment screenshot, fee mismatch, or incorrect details..."
                value={rejectionRemark}
                onChange={(e) => setRejectionRemark(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-300 text-xs font-medium outline-none focus:border-rose-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRejectingSubmission(null)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate(rejectingSubmission.id, 'Rejected', rejectionRemark || 'Rejected by College Administration.')}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase hover:bg-rose-700 shadow-lg active:scale-95 transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8">
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
