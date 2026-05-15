'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, onValue, set, push, update } from 'firebase/database';
import ProfileWizard from '@/components/ProfileWizard';
import StudentNavbar from '@/components/StudentNavbar';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  LayoutDashboard, 
  User, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  CreditCard, 
  AlertCircle,
  FileBadge,
  X,
  ChevronDown,
  ShieldCheck,
  PenTool,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  Camera,
  Copy,
  Download,
  XCircle,
  Clock,
  Building2,
  FileText,
  Save,
  Plus,
  Printer,
  Receipt
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const formatDOB = (dob: string) => {
  if (!dob || dob === 'N/A') return 'N/A';
  if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) return dob;
  const parts = dob.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dob;
};

// --- Reusable ERP Components ---

const Widget = ({ icon: Icon, label, value, trend, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "glass-effect p-6 rounded-3xl border-2 border-white/40 flex items-center justify-between group overflow-hidden relative",
      onClick && "cursor-pointer active:scale-95 transition-all hover:border-[#00a5a5]/30"
    )}
  >
    <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform`} />
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-white shadow-sm border border-slate-200 ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[13px] font-medium capitalize tracking-tight text-black mb-0.5">{label}</p>
        <p className="text-xl font-medium text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
    <div className="text-[13px] font-medium text-black bg-emerald-50 px-2 py-1 rounded-md">{trend}</div>
  </div>
);

// --- Modular Tab Components ---

const DashboardHome = ({ userData, userApplications, studentReceipts, stepPercentages, feeDue, hasActiveAdmission, setIsOtherCourseMode, setIsCourseModalOpen, handleTabChange }: any) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="bg-[#003366] text-white py-4 px-8 rounded-2xl shadow-lg font-medium tracking-tight text-[16px] flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <LayoutDashboard size={20} className="text-[#00a5a5]" /> Welcome to MIT PARADH
      </div>
      <div className="flex items-center gap-4">
         {userApplications.length === 0 ? (
           <button 
             onClick={() => {
               setIsOtherCourseMode(false);
               setIsCourseModalOpen(true);
             }}
             className="bg-[#ff9f1c] hover:bg-white hover:text-black text-black px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-tight transition-all shadow-md active:scale-95 flex items-center gap-2"
           >
             <Plus size={16} /> Apply for Admission
           </button>
         ) : userApplications.some((app: any) => app.status === 'Accepted' || app.status === 'Confirmed') ? (
           <button 
             onClick={() => {
               setIsOtherCourseMode(true);
               setIsCourseModalOpen(true);
             }}
             className="bg-[#ff9f1c] hover:bg-white hover:text-black text-black px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-tight transition-all shadow-md active:scale-95 flex items-center gap-2"
           >
             <Plus size={16} /> Apply for Other Course
           </button>
         ) : null}
      </div>
    </div>

    {/* Summary Widgets */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <Widget 
         icon={CheckCircle2} 
         label="Profile Status" 
         value={`${Object.values(stepPercentages).filter(p => p === 100).length}/11 Steps`} 
         trend="Verified" 
         color="bg-emerald-600" 
       />
       <Widget 
         icon={FileBadge} 
         label="Applications" 
         value={userApplications.length.toString()} 
         trend="Live" 
         color="bg-blue-600" 
       />
       <Widget 
         icon={CreditCard} 
         label="Fee Due" 
         value={feeDue} 
         trend="Status" 
         color="bg-red-600" 
       />
       <Widget 
         icon={Receipt} 
         label="Official Receipts" 
         value={studentReceipts?.length?.toString() || '0'} 
         trend="View Slips" 
         color="bg-purple-600" 
         onClick={() => handleTabChange(15)}
       />
    </div>

    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/4 bg-white border-4 border-slate-200 rounded-md p-4 flex flex-col items-center gap-6 shadow-sm">
          <div className="flex flex-col items-center w-full">
            <div className="w-40 h-48 bg-slate-100 rounded-md border-2 border-slate-200 overflow-hidden flex items-center justify-center mb-2 group cursor-pointer shadow-inner" onClick={() => handleTabChange(3)}>
              {(userData?.profile?.photoUrl || userData?.photo) ? (
                <img src={userData.profile?.photoUrl || userData?.photo} alt="Student" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <User size={48} className="text-slate-300" />
                  <span className="text-[13px] text-black capitalize font-medium">No Photo</span>
                </div>
              )}
            </div>
            <p className="text-[13px] font-bold text-black capitalize tracking-tight">Official Photo</p>
          </div>
      </div>

      <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-min">
          {[
            { l: 'Admission year', v: '2026-2027' },
            { 
              l: 'Name', 
              v: toTitleCase(userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.middleName || ''} ${userData.profile.lastName || ''}` : `${userData?.firstName || 'Student'}`)
            },
            { l: 'Registration number', v: userData?.profile?.regNo || userData?.regNo || 'PENDING' },
            { l: 'Date of birth', v: formatDOB(userData?.profile?.dateOfBirth || 'N/A') },
            { l: 'Gender', v: userData?.profile?.gender || 'N/A' },
            { l: 'Mobile number', v: userData?.profile?.mobileNumber || userData?.phone || 'N/A' },
            { l: 'Email ID', v: userData?.email || userData?.profile?.email || 'N/A' },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} className="flex border-2 border-slate-200 rounded-md overflow-hidden bg-white h-12">
               <div className="w-1/3 bg-[#e6f7f7] px-4 py-2 text-[#00a5a5] font-normal text-[15px] flex items-center tracking-tight">{item.l}</div>
               <div className="w-2/3 px-4 py-2 text-slate-700 text-[15px] font-medium flex items-center">{item.v}</div>
            </div>
          ))}
      </div>
    </div>

    <div className="bg-[#003366] text-white py-3 px-6 rounded-md text-center font-normal text-[15px] tracking-wide shadow-md">
      Candidate dashboard
    </div>

    <div className="bg-white border-4 border-slate-200 rounded-md p-10 shadow-sm overflow-x-auto no-scrollbar">
      <div className="min-w-[1000px] relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-[#21ba45] -translate-y-1/2 z-0 opacity-20" />
        <div className="relative z-10 flex justify-between gap-4">
          {[
            { id: 1, l: 'Primary' },
            { id: 2, l: 'Address' },
            { id: 3, l: 'Parent' },
            { id: 4, l: 'Category' },
            { id: 5, l: 'Qualification' },
            { id: 6, l: 'Training' },
            { id: 7, l: 'Additional' },
            { id: 8, l: 'Bank' },
            { id: 9, l: 'Work Experience' },
            { id: 221, l: 'Apply' },
            { id: 222, l: 'Letter' },
          ].map((step, idx) => {
            const perc = stepPercentages[step.id as keyof typeof stepPercentages] || 0;
            const color = perc === 100 ? '#21ba45' : perc > 0 ? '#fbbd08' : '#d1d1d1';
            return (
              <div key={idx} className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => {
                    if (hasActiveAdmission) return;
                    if (step.id === 1) setIsCourseModalOpen(true);
                    else if (step.id <= 10) handleTabChange(3, step.id);
                  }}
                  className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center text-[13px] font-medium shadow-sm transition-all hover:scale-110 active:scale-95 group"
                  style={{ border: `4px solid ${color}`, color: color === '#d1d1d1' ? '#a1a1a1' : color }}
                >
                  {perc === 100 ? <Check size={28} /> : `${perc}%`}
                </button>
                <span className="text-[13px] font-bold text-black capitalize tracking-tighter text-center max-w-[80px]">
                  {perc === 100 && step.id === 222 ? 'Admission Confirm' : step.l}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        {hasActiveAdmission && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check size={18} /> Admission Processed - You have an active enrollment
          </div>
        )}
      </div>
    </div>
  </div>
);

const ApplicationManager = ({ 
  selectedCollege, setSelectedCollege, availableColleges,
  selectedCourseType, setSelectedCourseType, availableCourseTypes,
  selectedCourseId, setSelectedCourseId, filteredCourses,
  selectedDuration, selectedFees, handleAddNewApplication, isSubmittingApp,
  sortedApplications, userData, handleTabChange
}: any) => {
  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">

    <div className="bg-white border border-black rounded-xl shadow-sm overflow-hidden text-[#343a40]">
      <div className="bg-[#343a40] text-white py-3 px-6 font-normal text-sm tracking-wide uppercase">Your Applications</div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse border-[0.5px] border-black">
          <thead>
            <tr className="text-[12px] font-black text-black border-b-[0.5px] border-black bg-slate-100 whitespace-nowrap">
              <th className="px-4 py-5 border-r-[0.5px] border-black text-center w-16 uppercase">Sr. No.</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Date and Time</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Student Name</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Reg. No.</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Roll No.</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">College</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Course Type</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Course</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Fee</th>
              <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Status</th>
              <th className="px-4 py-5 text-center uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-[13px] font-medium text-black">
            {sortedApplications.map((app: any, i: number) => (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors border-b-[0.5px] border-black whitespace-nowrap">
                <td className="px-4 py-6 text-center border-r-[0.5px] border-black font-bold">{i + 1}.</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#00a5a5]" />
                    {(() => {
                       const d = new Date(app.appliedAt || app.date || Date.now());
                       return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                    })()}
                  </div>
                </td>
                <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{app.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim() || 'Student'}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black font-bold uppercase">{userData?.profile?.regNo || userData?.regNo || 'PENDING'}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black font-bold uppercase">{userData?.profile?.rollNo || userData?.rollNo || 'N/A'}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black capitalize">{app.collegeName || 'N/A'}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-200">{app.courseType || 'Regular'}</span>
                </td>
                <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{app.courseName}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black text-center font-bold text-emerald-600">₹{parseFloat(app.fees || '0').toLocaleString()}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                      app.status === 'Accepted' || app.status === 'Confirmed' || app.status === 'Updated' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      app.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-200" :
                      app.status === 'Unlocked' ? "bg-blue-50 text-blue-600 border-blue-200" :
                      "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                      {app.status || 'Pending'}
                    </span>
                 </td>
                 <td className="px-4 py-6 text-center">
                   <div className="flex items-center justify-center gap-3">
                     {app.status === 'Unlocked' ? (
                       <button 
                         onClick={() => handleTabChange(3, 1)} 
                         title="Change Details"
                         className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 font-bold text-[10px]"
                       >
                         <PenTool size={14} /> CHANGE
                       </button>
                     ) : (
                       <button 
                         onClick={() => handleTabChange(3, 1)} 
                         title="View Profile"
                         className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                       >
                         <Eye size={18} />
                       </button>
                     )}
                   </div>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

const ExaminationCenter = ({ activeApp, examSettings, examSubmissions, setIsExamModalOpen, userData }: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
    <div className="bg-white border-[0.5px] border-black rounded-md shadow-sm overflow-hidden text-[#343a40]">
      <div className="bg-[#002147] text-white py-4 px-8 font-black text-sm tracking-widest flex items-center justify-between">
        <span>Exam Form</span>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[10px]">
          <Clock size={12} className="text-[#00a5a5]" /> Academic Session 2026
        </div>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse border-b-[0.5px] border-black">
          <thead className="bg-slate-50 border-b-[0.5px] border-black">
            <tr className="text-[12px] font-black text-[#00a5a5] uppercase tracking-tighter whitespace-nowrap">
              <th className="px-8 py-5 border-r-[0.5px] border-black text-center w-16">Sr No.</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black text-center">Last Date</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Reg No.</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Student Name</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">College</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Course Type</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Course</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black text-center">Fees</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {activeApp ? (
              <tr className="hover:bg-slate-50/50 transition-colors border-b-[0.5px] border-black whitespace-nowrap">
                <td className="px-8 py-6 border-r-[0.5px] border-black text-center text-sm font-bold text-slate-700">1.</td>
                <td className="px-8 py-6 border-r-[0.5px] border-black text-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-rose-500">{examSettings?.lastDate ? new Date(examSettings.lastDate).toLocaleDateString() : '23/05/2026'}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deadline</span>
                  </div>
                </td>
                <td className="px-8 py-6 border-r-[0.5px] border-black">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{userData?.profile?.regNo || userData?.regNo || 'PENDING'}</span>
                </td>
                <td className="px-8 py-6 border-r-[0.5px] border-black">
                  <span className="text-sm font-black text-slate-800 capitalize tracking-tight">
                    {userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.lastName || ''}`.trim() : (userData?.studentName || userData?.firstName || 'N/A')}
                  </span>
                </td>
                <td className="px-8 py-6 border-r-[0.5px] border-black">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-800 capitalize">{activeApp.collegeName}</span>
                  </div>
                </td>
                <td className="px-8 py-6 border-r-[0.5px] border-black text-center">
                  <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border-[0.5px] border-indigo-100">{activeApp.courseType || 'REGULAR'}</span>
                </td>
                <td className="px-8 py-6 border-r-[0.5px] border-black font-bold text-slate-700 text-sm capitalize">{activeApp.courseName}</td>
                <td className="px-8 py-6 border-r-[0.5px] border-black text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-emerald-600">₹{parseFloat(examSettings?.fees || '1250').toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Exam Fees</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    disabled={!examSettings?.registrationOpen || examSubmissions.some((s: any) => s.status !== 'Rejected')}
                    onClick={() => setIsExamModalOpen(true)}
                    className={cn(
                      "px-8 py-3 rounded-xl text-[12px] font-black capitalize tracking-tight shadow-xl transition-all active:scale-95",
                      (!examSettings?.registrationOpen || examSubmissions.some((s: any) => s.status !== 'Rejected'))
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border-[0.5px] border-black"
                        : "bg-[#00a5a5] text-white hover:bg-[#002147] hover:scale-105"
                    )}
                  >
                    {examSubmissions.some((s: any) => s.status === 'Verified') ? 'SUBMITTED' : 'SUBMIT EXAM FORM'}
                  </button>
                </td>
              </tr>
            ) : (
              <tr><td colSpan={9} className="py-20 text-center text-slate-400 font-medium border-b-[0.5px] border-black">No active enrollment found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const FeePaymentPortal = ({ acceptedApps, totalFees, totalPaid, balanceDue, userPayments, setSelectedAppForPayment, setPaymentForm, setIsPaymentModalOpen }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Widget icon={CreditCard} label="Total Fee" value={`₹${totalFees.toLocaleString()}`} trend="Current Session" color="bg-blue-600" />
        <Widget icon={CheckCircle2} label="Amount Paid" value={`₹${totalPaid.toLocaleString()}`} trend="Verified" color="bg-emerald-600" />
        <Widget icon={AlertCircle} label="Balance Due" value={`₹${balanceDue.toLocaleString()}`} trend={balanceDue > 0 ? "Outstanding" : "Cleared"} color={balanceDue > 0 ? "bg-red-600" : "bg-emerald-600"} />
     </div>
     
     <div className="glass-effect p-10 rounded-[3rem] border-4 border-white shadow-2xl">
        <h3 className="text-2xl font-medium text-slate-800 capitalize tracking-tighter mb-8">Financial Records & Payments</h3>
        <div className="p-0 overflow-x-auto">
           <table className="w-full text-left border-collapse border-[0.5px] border-black">
              <thead>
                 <tr className="text-[14px] font-normal text-[#00a5a5] border-b-[0.5px] border-black bg-slate-50">
                    <th className="px-6 py-4 border-r-[0.5px] border-black text-center">Sr. No.</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black">College</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black">Course Name</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black text-center">Type</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black text-center">Date</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black text-right">Total Fees</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black text-right">Paid Fees</th>
                    <th className="px-6 py-4 border-r-[0.5px] border-black text-right">Outstanding</th>
                    <th className="px-6 py-4 text-center">Pay Fee</th>
                 </tr>
              </thead>
              <tbody className="border-b-[0.5px] border-black text-[14px] font-normal text-slate-600">
                 {acceptedApps.map((app: any, idx: number) => {
                   const t = parseFloat(app.fees || '0');
                   const p = parseFloat(app.paidFees || '0');
                   return (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors border-b-[0.5px] border-black">
                         <td className="px-6 py-4 text-center border-r-[0.5px] border-black font-medium text-slate-600">{idx + 1}.</td>
                         <td className="px-6 py-4 font-medium text-slate-800 border-r-[0.5px] border-black">{app.collegeName || 'MIT College'}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 capitalize border-r-[0.5px] border-black">{app.courseName || 'Course Not Assigned'}</td>
                        <td className="px-6 py-4 text-center border-r-[0.5px] border-black"><span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase">{app.courseType || 'Reg'}</span></td>
                        <td className="px-6 py-4 text-center border-r-[0.5px] border-black font-medium text-slate-600">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700 border-r-[0.5px] border-black">₹{t.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 border-r-[0.5px] border-black">₹{p.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-500 border-r-[0.5px] border-black">₹{(t-p).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                           <button onClick={() => { setSelectedAppForPayment(app); setPaymentForm((prev: any) => ({ ...prev, amount: (t-p).toString() })); setIsPaymentModalOpen(true); }} className="bg-[#00a5a5] text-black px-4 py-2 rounded-lg text-[12px] font-bold capitalize shadow-md hover:bg-[#5D5fb1] transition-all active:scale-95 whitespace-nowrap">Pay Online</button>
                        </td>
                     </tr>
                   );
                 })}
              </tbody>
           </table>
        </div>
     </div>
  </div>
);

const TransactionHistory = ({ userPayments }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
     <div className="glass-effect p-10 rounded-[3rem] border-4 border-white shadow-2xl">
        <header className="mb-10">
           <h3 className="text-2xl font-black text-[#002147] tracking-tighter capitalize">Financial Transaction History</h3>
           <p className="text-[13px] font-medium text-slate-400 capitalize tracking-tight mt-1">Audit trail of all fees submitted to institutions</p>
        </header>
        <div className="overflow-x-auto no-scrollbar">
           <table className="w-full text-left border-collapse border-[0.5px] border-black">
              <thead>
                 <tr className="bg-slate-50/50 border-b-[0.5px] border-black">
                    <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">Sr.</th>
                    <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">Reference ID</th>
                    <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">Course & College</th>
                    <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black text-center">Date</th>
                    <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black text-right">Amount</th>
                    <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest text-center">Status</th>
                 </tr>
              </thead>
              <tbody className="border-b-[0.5px] border-black">
                 {(userPayments || []).sort((a: any,b: any) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()).map((p: any, i: number) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b-[0.5px] border-black">
                      <td className="px-6 py-5 border-r-[0.5px] border-black text-center font-bold text-black">{i + 1}.</td>
                      <td className="px-6 py-5 border-r-[0.5px] border-black"><span className="text-[11px] font-black text-[#00a5a5] uppercase tracking-widest bg-[#e6f7f7] px-3 py-1 rounded-md">REF-{p.id?.slice(-8).toUpperCase()}</span></td>
                      <td className="px-6 py-5 border-r-[0.5px] border-black"><p className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1">{p.courseName}</p><p className="text-[10px] font-medium text-slate-400 capitalize">{p.collegeName}</p></td>
                      <td className="px-6 py-5 border-r-[0.5px] border-black text-center text-sm font-medium text-slate-500">{new Date(p.submittedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-5 border-r-[0.5px] border-black text-right text-[15px] font-black text-emerald-600">₹{parseFloat(p.amount || '0').toLocaleString()}</td>
                      <td className="px-6 py-5 text-center">
                         <div className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border shadow-sm inline-flex items-center gap-2", p.status === 'Accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                            {p.status === 'Accepted' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {p.status || 'Pending'}
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
     </div>
  </div>
);

const DocumentVault = ({ profileDocs, userData, customDocuments, setIsUploadModalOpen, setModalPreview, handleDocumentUpload, handleDeleteCustomDoc }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8 p-6">
    <header className="bg-[#003366] text-white py-6 px-10 rounded-2xl shadow-xl flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20"><FileText size={28} /></div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Digital Document Vault</h3>
          <p className="text-white/60 text-sm mt-1 font-medium">Manage all academic & identity documents</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setIsUploadModalOpen(true)} className="bg-[#00a5a5] hover:bg-white hover:text-[#003366] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"><Plus size={18} /> ADD DOCUMENT</button>
      </div>
    </header>
    <div className="bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-slate-800 text-white py-4 px-8 font-bold text-sm tracking-wide">DOCUMENT REPOSITORY</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase text-center w-16">Sr.</th>
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase">Document Name</th>
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase text-center">Status</th>
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {profileDocs.map((doc: any, idx: number) => {
              const fileUrl = doc.url || userData?.profile?.[doc.key];
              return (
                <tr key={`p-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 border-2 border-black text-center text-[14px] font-bold text-slate-700">{idx + 1}</td>
                  <td className="px-6 py-5 border-2 border-black font-bold text-slate-800 capitalize">{doc.label}</td>
                  <td className="px-6 py-5 border-2 border-black text-center">
                    <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 flex items-center justify-center gap-2 mx-auto w-fit", fileUrl ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100")}>
                      {fileUrl ? <Check size={12} /> : <X size={12} />} {fileUrl ? 'Verified' : 'Missing'}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-2 border-black text-center">
                    {fileUrl ? <button onClick={() => setModalPreview({ url: fileUrl, label: doc.label })} className="px-5 py-2.5 bg-[#00a5a5] text-white rounded-lg text-[11px] font-black uppercase flex items-center gap-2 mx-auto"><Eye size={14} /> Preview</button> : <button onClick={() => handleDocumentUpload(doc.stepId)} className="px-5 py-2.5 bg-amber-500 text-white rounded-lg text-[11px] font-black uppercase flex items-center gap-2 mx-auto"><Plus size={14} /> Upload</button>}
                  </td>
                </tr>
              );
            })}
            {customDocuments.map((doc: any, idx: number) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5 border-2 border-black text-center text-[14px] font-bold text-slate-700">{profileDocs.length + idx + 1}</td>
                <td className="px-6 py-5 border-2 border-black font-bold text-slate-800 capitalize">{doc.name}</td>
                <td className="px-6 py-5 border-2 border-black text-center"><span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border-2 border-emerald-100 flex items-center justify-center gap-2 mx-auto w-fit"><Check size={12} /> Available</span></td>
                <td className="px-6 py-5 border-2 border-black text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setModalPreview({ url: doc.fileUrl, label: doc.name })} className="px-5 py-2.5 bg-[#00a5a5] text-white rounded-lg text-[11px] font-black uppercase flex items-center gap-2"><Eye size={14} /> View</button>
                    <button onClick={() => handleDeleteCustomDoc(doc.id)} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-black uppercase border-2 border-rose-100 flex items-center gap-2"><X size={14} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const PrintApplicationRegistry = ({ userApplications, userData, handleDownloadApplication }: any) => {
  return (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8 p-8">
    <header className="bg-[#003366] text-white py-6 px-10 rounded-2xl shadow-xl flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-[#ff9f1c] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20"><Printer size={28} /></div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Print Application Form</h3>
          <p className="text-white/60 text-sm mt-1 font-medium">Generate official enrollment records</p>
        </div>
      </div>
    </header>
    <div className="bg-white border border-black rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-slate-800 text-white py-4 px-8 font-bold text-sm tracking-wide">YOUR ADMISSION APPLICATIONS</div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border-[0.5px] border-black">
          <thead>
            <tr className="bg-slate-50 border-b-[0.5px] border-black whitespace-nowrap">
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center w-16">Sr No.</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Admission Date & Time</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Student Name</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">College</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Course Type</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Course</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-right">Fees</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Status</th>
              <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody className="border-b-[0.5px] border-black text-[15px] font-medium text-black">
            {userApplications.filter((app: any) => app.profileLocked === true).map((app: any, i: number) => (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors border-b-[0.5px] border-black whitespace-nowrap">
                <td className="px-4 py-6 border-r-[0.5px] border-black text-center font-bold">{i + 1}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black">
                   <div className="flex items-center gap-2">
                     <Clock size={14} className="text-[#00a5a5]" />
                     {(() => {
                        const d = new Date(app.appliedAt || app.date || Date.now());
                        return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                     })()}
                   </div>
                </td>
                <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{app.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim() || 'Student'}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black capitalize">{app.collegeName || 'N/A'}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                   <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-200">{app.courseType || 'Regular'}</span>
                </td>
                <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{app.courseName}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black text-right font-bold text-emerald-600">₹{parseFloat(app.fees || '0').toLocaleString()}</td>
                <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                  <span className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 shadow-sm", app.status === 'Accepted' || app.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100")}>
                    {app.status || 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-6 text-center">
                   <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleDownloadApplication(app, false, true)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90" title="Preview Application"><Eye size={18} /></button>
                      <button onClick={() => handleDownloadApplication(app, true, false)} className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-90" title="Download Application"><Download size={18} /></button>
                   </div>
                </td>
              </tr>
            ))}
            {userApplications.filter((app: any) => app.profileLocked === true).length === 0 && (
               <tr>
                 <td colSpan={9} className="px-6 py-24 text-center border-2 border-black text-slate-400 font-bold uppercase tracking-widest text-[12px]">
                   <div className="flex flex-col items-center gap-4">
                     <FileText size={48} className="text-slate-100" />
                     No active applications found to print.
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
};

const PaymentSlipModule = ({ studentReceipts, handleDownloadReceipt }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8 p-8">
     <header className="bg-[#003366] text-white py-6 px-10 rounded-2xl shadow-xl flex items-center justify-between">
       <div className="flex items-center gap-6">
         <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
           <Receipt size={28} />
         </div>
         <div>
           <h3 className="text-2xl font-bold tracking-tight">Fee Payment Slips</h3>
           <p className="text-white/60 text-sm mt-1 font-medium">Download official institutional fee receipts</p>
         </div>
       </div>
     </header>

     <div className="bg-white border border-black rounded-xl shadow-2xl overflow-hidden">
       <div className="bg-slate-800 text-white py-4 px-8 font-bold text-sm tracking-wide uppercase">Your Collected Fees</div>
       <div className="overflow-x-auto">
         <table className="w-full text-left border-collapse border-[0.5px] border-black">
           <thead>
             <tr className="bg-slate-50 border-b-[0.5px] border-black whitespace-nowrap">
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center w-16">Sr No.</th>
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Date & Time</th>
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Receipt No</th>
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Course</th>
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-right">Amount</th>
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Status</th>
               <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Action</th>
             </tr>
           </thead>
           <tbody className="border-b-[0.5px] border-black text-[15px] font-medium text-black">
             {studentReceipts.map((t: any, i: number) => (
               <tr key={t.id} className="hover:bg-slate-50 transition-colors border-b-[0.5px] border-black whitespace-nowrap">
                 <td className="px-4 py-6 border-r-[0.5px] border-black text-center font-bold">{i + 1}.</td>
                 <td className="px-4 py-6 border-r-[0.5px] border-black">
                   <div className="flex items-center gap-2">
                     <Clock size={14} className="text-[#00a5a5]" />
                     {new Date(t.date || t.timestamp).toLocaleString()}
                   </div>
                 </td>
                 <td className="px-4 py-6 border-r-[0.5px] border-black font-black text-[#00a5a5]">
                   {t.receiptNo || t.id.substring(0, 8).toUpperCase()}
                 </td>
                 <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{t.courseName}</td>
                 <td className="px-4 py-6 border-r-[0.5px] border-black text-right font-black text-emerald-600">
                   ₹{parseFloat(t.amount).toLocaleString()}
                 </td>
                 <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                   <span className="px-4 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-200 shadow-sm inline-flex items-center gap-2">
                     <CheckCircle2 size={12} /> Accepted
                   </span>
                 </td>
                 <td className="px-4 py-6 text-center">
                   <div className="flex items-center justify-center gap-3">
                     <button 
                       onClick={() => handleDownloadReceipt(t, true)}
                       className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                       title="Preview Receipt"
                     >
                       <Eye size={18} />
                     </button>
                     <button 
                       onClick={() => handleDownloadReceipt(t, false)}
                       className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-90"
                       title="Download Receipt"
                     >
                       <Download size={18} />
                     </button>
                   </div>
                 </td>
               </tr>
             ))}
             {studentReceipts.length === 0 && (
               <tr>
                 <td colSpan={7} className="px-6 py-24 text-center border-2 border-black text-slate-400 font-bold uppercase tracking-widest text-[12px]">
                   <div className="flex flex-col items-center gap-4">
                     <Receipt size={48} className="text-slate-100" />
                     No fee receipts found. Once your fee is accepted, it will appear here.
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

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  return inWords(num).trim() + " Only";
};

function DashboardContent() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [pendingDocStep, setPendingDocStep] = useState<number | null>(null);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  
  // Dynamic Admission States
  const [collegeCourses, setCollegeCourses] = useState<any[]>([]);
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedFees, setSelectedFees] = useState('');
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [modalPreview, setModalPreview] = useState<{ url: string, label: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAppForPayment, setSelectedAppForPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    upiId: '',
    utrId: '',
    email: '',
    relationship: 'Father',
    phone: '',
    amount: '',
    screenshot: ''
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [collegePaymentSettings, setCollegePaymentSettings] = useState<any>(null);
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [examSettings, setExamSettings] = useState<any>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examForm, setExamForm] = useState<any>({
    screenshot: '',
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    aadharNumber: ''
  });
  
  // Custom Documents States
  const [customDocuments, setCustomDocuments] = useState<any[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<string | null>(null);
  const [newDocFileName, setNewDocFileName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isOtherCourseMode, setIsOtherCourseMode] = useState(false);
  const [studentReceipts, setStudentReceipts] = useState<any[]>([]);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [receiptPreviewData, setReceiptPreviewData] = useState<any>(null);
  const [isAppPreviewOpen, setIsAppPreviewOpen] = useState(false);
  const [appPreviewData, setAppPreviewData] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const sortedApplications = useMemo(() => {
    return [...userApplications].sort((a, b) => {
      const dateA = new Date(a.appliedAt || a.date || 0).getTime();
      const dateB = new Date(b.appliedAt || b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [userApplications]);

  const activeApp = useMemo(() => {
    return sortedApplications.find(a => a.status === 'Accepted' || a.status === 'Confirmed') || sortedApplications[0];
  }, [sortedApplications]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('tab') || '1') || 1;
  const activeStep = parseInt(searchParams.get('step') || '1') || 1;

  const feeDue = useMemo(() => {
    const acceptedApp = sortedApplications.find(app => app.status === 'Accepted' || app.status === 'Confirmed');
    return acceptedApp ? `₹${parseFloat(acceptedApp.fees || '0').toLocaleString()}` : '₹0';
  }, [sortedApplications]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(studentAuth, async (user) => {
      if (user) {
        try {
          const profileRef = ref(realtimeDb, 'users/' + user.uid + '/profile');
          const unsubProfile = onValue(profileRef, (snap) => {
            if (snap.exists()) {
              setUserData((prev: any) => ({ ...prev, profile: snap.val() }));
            }
          });

          // Fetch Courses
          const coursesRef = ref(realtimeDb, 'courses');
          const unsubCourses = onValue(coursesRef, (snap) => {
            if (snap.exists()) {
              setAvailableCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            }
          });

          // Fetch Colleges
          const collegesRef = ref(realtimeDb, 'colleges');
          const unsubColleges = onValue(collegesRef, (snap) => {
            if (snap.exists()) {
              setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            }
          });

          const userRef = ref(realtimeDb, 'users/' + user.uid);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserData((prev: any) => ({ ...prev, ...snapshot.val(), uid: user.uid }));
          } else {
            setUserData((prev: any) => ({ ...prev, firstName: 'Student', email: user.email, uid: user.uid }));
          }
  
          // Fetch user applications
          const appsRef = ref(realtimeDb, `users/${user.uid}/applications`);
          const unsubApps = onValue(appsRef, (snap) => {
            if (snap.exists()) {
              const apps = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
              setUserApplications(apps);

              // Fetch Exam Settings for the student's college
              const activeApp = apps.find(a => a.status === 'Accepted' || a.status === 'Confirmed') || apps[0];
              if (activeApp?.collegeId) {
                const settingsRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/examSettings`);
                onValue(settingsRef, (sSnap) => {
                  if (sSnap.exists()) setExamSettings(sSnap.val());
                });

                // Fetch student's exam submissions for this college
                const subRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/examSubmissions`);
                onValue(subRef, (subSnap) => {
                  if (subSnap.exists()) {
                    const subs = Object.entries(subSnap.val())
                      .map(([id, val]: any) => ({ id, ...val }))
                      .filter(s => s.studentUid === user.uid);
                    setExamSubmissions(subs);
                  } else {
                    setExamSubmissions([]);
                  }
                });

                // Fetch College Payment Settings for QR
                const paySetRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/paymentSettings`);
                onValue(paySetRef, (pSnap) => {
                   if (pSnap.exists()) setCollegePaymentSettings(pSnap.val());
                });

                // Fetch Student Receipts (Transactions from College Panel)
                const receiptsRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/fees/transactions`);
                onValue(receiptsRef, (rSnap) => {
                   if (rSnap.exists()) {
                      const allTrans = Object.entries(rSnap.val()).map(([id, val]: any) => ({ id, ...val }));
                      const myReceipts = allTrans.filter(t => 
                         t.studentUid === user.uid || 
                         t.studentId === activeApp.id ||
                         t.studentId === activeApp.applicationId
                      );
                      setStudentReceipts(myReceipts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
                   } else {
                      setStudentReceipts([]);
                   }
                });
              }
            } else {
              setUserApplications([]);
            }
          });

          // Fetch user payments
          const paymentsRef = ref(realtimeDb, `users/${user.uid}/payments`);
          const unsubPayments = onValue(paymentsRef, (snap) => {
            if (snap.exists()) {
              setUserPayments(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            } else {
              setUserPayments([]);
            }
          });
          
          // Fetch custom documents
          const customDocsRef = ref(realtimeDb, `users/${user.uid}/customDocuments`);
          const unsubCustomDocs = onValue(customDocsRef, (snap) => {
            if (snap.exists()) {
              setCustomDocuments(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            } else {
              setCustomDocuments([]);
            }
          });
          
          setLoading(false);
          return () => {
            unsubProfile();
            unsubCourses();
            unsubColleges();
            unsubApps();
            unsubPayments();
            unsubCustomDocs();
          };
        } catch (error) {
          console.error('Error fetching student data:', error);
          setLoading(false);
        }
      } else {
        router.push('/login/student');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch courses specific to selected college
  useEffect(() => {
    if (!selectedCollege) {
      setCollegeCourses([]);
      return;
    }
    const coursesRef = ref(realtimeDb, `colleges/${selectedCollege}/courses`);
    const unsub = onValue(coursesRef, (snap) => {
      if (snap.exists()) {
        setCollegeCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setCollegeCourses([]);
      }
    });
    return () => unsub();
  }, [selectedCollege]);

  // Unique course types for selected college
  const availableCourseTypes = useMemo(() => {
    const types = new Set(collegeCourses.map(c => c.type));
    return Array.from(types);
  }, [collegeCourses]);

  // Filtered courses based on selected type
  const filteredCourses = useMemo(() => {
    return collegeCourses.filter(c => {
      const isAccepted = userApplications.some(app => app.courseId === c.id && (app.status === 'Accepted' || app.status === 'Confirmed'));
      return c.type === selectedCourseType && !isAccepted;
    });
  }, [collegeCourses, selectedCourseType, userApplications]);

  // Auto-populate duration when course is selected
  useEffect(() => {
    const course = collegeCourses.find(c => c.id === selectedCourseId);
    if (course) {
      setSelectedDuration(course.duration);
      setSelectedFees(course.fees || '0');
    } else {
      setSelectedDuration('');
      setSelectedFees('');
    }
  }, [selectedCourseId, collegeCourses]);

  // Pre-fill existing application details when opening modal
  useEffect(() => {
    if (isCourseModalOpen && userApplications.length > 0) {
      const app = userApplications[0];
      if (app.collegeId) setSelectedCollege(app.collegeId);
      if (app.courseType) setSelectedCourseType(app.courseType);
      if (app.courseId) setSelectedCourseId(app.courseId);
    }
  }, [isCourseModalOpen, userApplications]);

  const stepPercentages = useMemo(() => {
    const p = userData?.profile || {};
    const calculateStep1 = () => {
      const required = ['firstName', 'gender', 'dateOfBirth', 'aadhaarNo', 'phone'];
      const filledCount = required.filter(field => p[field]).length;
      return Math.round((filledCount / required.length) * 100);
    };

    return {
      1: calculateStep1(),
      2: p.address ? 100 : 0,
      3: p.fatherFirstName ? 100 : 0,
      4: p.casteCategory ? 100 : 0,
      5: (p.qualifications && p.qualifications.length > 0) ? 100 : 0,
      6: p.hasTraining ? 100 : 0,
      7: (p.languagesKnown && p.languagesKnown.length > 0) ? 100 : 0,
      8: p.panCardNo ? 100 : 0,
      9: p.hasWorkExperience ? 100 : 0,
      10: 0,
      221: userApplications.length > 0 ? 100 : 0,
      222: (p.profileLocked && userApplications.some(app => app.status === 'Accepted' || app.status === 'Confirmed')) ? 100 : 0
    };
  }, [userData, userApplications]);

  const hasActiveAdmission = useMemo(() => {
    // If the admin has explicitly unlocked the profile, allow editing
    if (userData?.profile?.profileLocked === false || userData?.profile?.status === 'Unlocked') return false;
    
    // Otherwise, check if there is any application that is either explicitly locked or accepted
    return userApplications.some(app => app.isLocked || app.status === 'Accepted' || app.status === 'Confirmed' || app.profileLocked === true);
  }, [userApplications, userData]);

  const handleTabChange = (tabId: number, stepId?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId.toString());
    if (stepId) {
      params.set('step', stepId.toString());
    } else {
      params.delete('step');
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDocumentUpload = (stepId: number) => {
    if (!userData?.course || userData.course === 'Not Selected') {
      setPendingDocStep(stepId);
      setIsCourseModalOpen(true);
      return;
    }
    handleTabChange(3, stepId);
  };

  const handleCourseSelect = async (courseName: string) => {
    try {
      const profileRef = ref(realtimeDb, 'users/' + userData.uid + '/profile');
      const updatedProfile = { ...(userData?.profile || {}), course: courseName };
      
      // Update Realtime DB
      await set(profileRef, updatedProfile);
      
      // Local state update for immediate feedback
      setUserData((prev: any) => ({
        ...prev,
        profile: updatedProfile,
        course: courseName
      }));

      setIsCourseModalOpen(false);
      handleTabChange(3, pendingDocStep || undefined); // Go to Admission Wizard
      setPendingDocStep(null);
    } catch (err) {
      console.error("Course selection error:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadData = (data: any, fileName: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReceipt = (trans: any, isPreview: boolean = false) => {
    if (isPreview) {
      setReceiptPreviewData(trans);
      setIsReceiptPreviewOpen(true);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const amountInWords = numberToWords(parseFloat(trans.amount));
    const receiptDate = new Date(trans.date || trans.timestamp).toLocaleDateString();
    const activeApp = userApplications.find((a: any) => a.status === 'Accepted' || a.status === 'Confirmed') || userApplications[0];
    const studentName = userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.middleName || ''} ${userData.profile.lastName || ''}`.replace(/\s+/g, ' ').trim() : (userData?.firstName || 'Student');

    const html = `
      <html>
        <head>
          <title>Fee Receipt - ${studentName}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { 
               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
               color: #e11d48; 
               margin: 0; 
               padding: 5mm; 
               background: #fff; 
               box-sizing: border-box; 
               display: flex;
               justify-content: center;
            }
            .receipt-container { 
               background: white;
               padding: 10mm; 
               position: relative; 
               width: 210mm;
               height: 296mm;
               box-sizing: border-box; 
               overflow: hidden;
            }
            .main-border {
               border: 0.5px solid #e11d48;
               padding: 5px;
               display: flex;
               flex-direction: column;
               position: relative;
               height: 100%;
               box-sizing: border-box;
            }
            .outside-border {
               margin-top: 5px;
               font-size: 13px;
               line-height: 1.4;
            }
            @media print {
              body { background: none; padding: 0; }
              .receipt-container { box-shadow: none; border: 2px solid #e11d48; }
            }
            .top-sub-header { text-align: center; font-size: 12px; font-weight: 600; margin-bottom: 2px; color: #e11d48; }
            .main-header { display: flex; align-items: center; gap: 15px; border-bottom: 2px solid #e11d48; padding-bottom: 8px; margin-bottom: 8px; }
            .institute-info { flex: 1; text-align: center; }
            .institute-name { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; white-space: nowrap; }
            .address { font-size: 14px; margin: 2px 0; font-weight: 700; }
            .receipt-tag-container { text-align: center; margin-bottom: 10px; }
            .receipt-tag { display: inline-block; border: 2px solid #e11d48; padding: 2px 25px; font-weight: 900; font-size: 18px; color: #e11d48; }
            .info-line { display: flex; align-items: baseline; margin-bottom: 8px; font-size: 14px; font-weight: 700; }
            .info-label { white-space: nowrap; margin-right: 5px; color: #e11d48; }
            .info-value { border-bottom: 2px dotted #e11d48; flex-grow: 1; padding-left: 8px; color: #000; font-weight: 900; min-height: 20px; text-transform: capitalize; }
            .flex-row { display: flex; gap: 20px; }
            .flex-1 { flex: 1; }
            .col-sr { width: 40px; text-align: center; }
            .col-amt { width: 140px; text-align: right; }
            .footer-section { font-size: 14px; font-weight: 700; margin-top: 15px; }
            .signature-area { text-align: right; margin-top: 40px; font-size: 13px; font-weight: 900; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(225, 29, 72, 0.03); font-weight: 900; pointer-events: none; z-index: -1; white-space: nowrap; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="main-border">
              <div class="main-header">
                <div class="logo-box">
                  <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" style="width: 100%; height: auto;" alt="Logo" />
                </div>
                <div class="institute-info">
                  <p class="top-sub-header">Mahavishnu Gramin Vikas &amp; Shaikshnik B. sanstha Dhamangaon ( Dhad)</p>
                  <h1 class="institute-name">Mahalaxmi Technical Institute Paradh.Bk.</h1>
                  <p class="address">Tq.Bhokardan Dist. Jalna , Paradh - 431114</p>
                </div>
              </div>
              
              <div class="receipt-tag-container">
                <div class="receipt-tag">RECEIPT</div>
              </div>
              
              <div class="flex-row">
                <div class="info-line flex-1">
                  <span class="info-label">Receipt No. :</span>
                  <span class="info-value">${trans.receiptNo || (trans.id || '').substring(0, 8).toUpperCase()}</span>
                </div>
                <div class="info-line" style="width: 200px;">
                  <span class="info-label">Date :</span>
                  <span class="info-value">${receiptDate}</span>
                </div>
              </div>
              
              <div class="info-line">
                <span class="info-label">Name of Student :</span>
                <span class="info-value">${studentName}</span>
              </div>
              
              <div class="flex-row">
                <div class="info-line flex-1">
                  <span class="info-label">Registration Number :</span>
                  <span class="info-value">${userData?.profile?.regNo || userData?.regNo || ''}</span>
                </div>
                <div class="info-line flex-1">
                  <span class="info-label">Academic Year :</span>
                  <span class="info-value">2026-2027</span>
                </div>
              </div>
              
              <div class="info-line">
                <span class="info-label">College :</span>
                <span class="info-value" style="flex-grow: 2;">${activeApp?.collegeName || 'MAHALAXMI TECHNICAL INSTITUTE'}</span>
                <span class="info-label" style="margin-left: 20px;">Course :</span>
                <span class="info-value">${activeApp?.courseName || ''}</span>
              </div>
              <div class="info-line">
                <span class="info-label">Course Type :</span>
                <span class="info-value">${activeApp?.courseType || ''}</span>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th class="col-sr">Sr.</th>
                    <th>Particular's</th>
                    <th class="col-amt">Amount ( Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  ${[
                    "Tuition Fee", "Admission Fee/Enrollment Fee", "University Eligibility Fee",
                    "Univ Exam. Fee", "Univ Sports (Per Capita) Fee", "Univ Students Welfare Fund",
                    "Student Insurance", "Caution Money Deposit", "I-Card , Magazines",
                    "Journals / Stationary", "Extra Curricular Activities Fee", "College Development Fee",
                    "Library Fee/Deposit", "Laboratory Fee/Deposit", "Professional Membership Fee",
                    "Transportation Fee", "Medical Exam Fee"
                  ].map((item, i) =>
                    '<tr>' +
                      '<td class="col-sr">' + (i + 1) + '</td>' +
                      '<td>' + item + '</td>' +
                      '<td class="col-amt">' + (i === 0 ? '&#8377;' + parseFloat(trans.amount).toLocaleString() : '') + '</td>' +
                    '</tr>'
                  ).join('')}
                  <tr style="border-top: 2px solid #e11d48;">
                    <td colspan="2" style="text-align: right; font-weight: 900; color: #e11d48; font-size: 14px;">Total Fees</td>
                    <td class="col-amt" style="font-weight: 900; font-size: 14px;">&#8377;${parseFloat(trans.amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="watermark">MAHALAXMI INSTITUTE</div>
              
              <div class="outside-border" style="margin-top: 15px;">
                <div class="flex-row">
                  <div class="info-line" style="flex: 1.5;">
                    <span class="info-label">Amount In Words Rs:</span>
                    <span class="info-value">${amountInWords}</span>
                  </div>
                  <div class="info-line" style="flex: 1;">
                    <span class="info-label">Cash/D.D. No :</span>
                    <span class="info-value">${trans.utrId || trans.id || 'N/A'}</span>
                  </div>
                </div>
                <div class="flex-row" style="margin-top: 10px;">
                  <div class="info-line" style="flex: 1.5;">
                    <span class="info-label">Bank :</span>
                    <span class="info-value">${trans.paymentMethod || (trans.type === 'Online' ? 'Online Transfer/UPI' : (trans.type || 'N/A'))}</span>
                  </div>
                  <div class="info-line" style="flex: 1;">
                    <span class="info-label">Accountant/Authorized Sign :</span>
                    <span class="info-value">&nbsp;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            window.onload = () => {
              if (!${isPreview}) {
                const element = document.querySelector('.receipt-container');
                const opt = {
                  margin: 0,
                  filename: 'Fee_Receipt_${studentName.replace(/\s+/g, '_')}.pdf',
                  image: { type: 'jpeg', quality: 1 },
                  html2canvas: { scale: 3, useCORS: true, letterRendering: true, scrollY: 0 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                  pagebreak: { mode: 'avoid-all' }
                };
                html2pdf().set(opt).from(element).save();
              }
            };
          </script>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 10000);
  };


  const handleAddNewApplication = async () => {
    // If an application already exists and is LOCKED, and NOT in other course mode, just proceed to the wizard
    if (!isOtherCourseMode && userApplications.length > 0 && hasActiveAdmission) {
      setIsCourseModalOpen(false);
      handleTabChange(3, 1); // Redirect to Step 1 of Profile Wizard
      return;
    }

    if (!selectedCollege || !selectedCourseType || !selectedCourseId || !userData?.uid) {
      alert("Please select all compulsory fields: College, Course Type, and Course.");
      return;
    }
      
    setIsSubmittingApp(true);
    try {
      const college = availableColleges.find(c => c.id === selectedCollege);
      const course = collegeCourses.find(c => c.id === selectedCourseId);
      
      // If other course mode, always push a new one. Otherwise update first one if exists.
      const existingApp = (!isOtherCourseMode && userApplications.length > 0) ? userApplications[0] : null;
      const appRef = existingApp 
        ? ref(realtimeDb, `users/${userData.uid}/applications/${existingApp.id}`)
        : push(ref(realtimeDb, `users/${userData.uid}/applications`));
      
      const applicationId = existingApp?.applicationId || `APP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const appData = {
        applicationId: applicationId,
        collegeId: selectedCollege,
        collegeName: college?.name || 'N/A',
        courseType: selectedCourseType,
        courseId: selectedCourseId,
        courseName: course?.name || 'N/A',
        duration: selectedDuration,
        fees: selectedFees,
        status: 'Pending',
        appliedAt: new Date().toISOString(),
        verificationStatus: 'Pending',
        paymentStatus: 'Pending',
        regFee: '5000',
        profileLocked: false // New application starts unlocked
      };

      await update(appRef, appData);
      
      // If other course mode, we also UNLOCK the profile globally so they can fill up all details
      if (isOtherCourseMode) {
        const profileRef = ref(realtimeDb, `users/${userData.uid}/profile`);
        await update(profileRef, { 
          profileLocked: false,
          status: 'Unlocked'
        });
      }
      
      // Update main course field for dashboard display and profile
      const userRef = ref(realtimeDb, `users/${userData.uid}`);
      const profileCourseUpdate: any = { course: course?.name || 'N/A' };
      if (userData?.profile) {
        profileCourseUpdate['profile/course'] = course?.name || 'N/A';
      }
      await update(userRef, profileCourseUpdate);
      
      // Push to College Front Office -> Admission Inquiry
      const inquiryData = {
        applicationId: applicationId,
        studentUid: userData.uid,
        studentName: (userData.profile?.firstName || userData.firstName || 'Unknown') + ' ' + (userData.profile?.lastName || userData.lastName || ''),
        studentPhone: userData.profile?.mobileNumber || userData.phone || 'N/A',
        studentEmail: userData.email || 'N/A',
        courseType: selectedCourseType,
        courseName: course?.name || 'N/A',
        fees: selectedFees,
        collegeId: selectedCollege,
        collegeName: availableColleges.find(c => c.id === selectedCollege)?.name || 'N/A',
        status: 'New', // Always New for other course applications
        profileLocked: false, // Start as unlocked
        date: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
        source: 'Student Portal',
        regNo: userData.regNo || 'N/A'
      };
      
      const inquiryRef = push(ref(realtimeDb, `colleges/${selectedCollege}/frontOffice/admissionInquiries`));
      await set(inquiryRef, inquiryData);
      
      setIsCourseModalOpen(false);
      setIsOtherCourseMode(false);
      
      // Navigate to correct section
      alert("Application submitted successfully! Please complete and LOCK your profile details for this new course.");
      handleTabChange(3, 1); // Start at Step 1 of wizard
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleCustomDocUpload = async () => {
    if (!newDocName.trim()) { alert('Please enter document name.'); return; }
    if (!newDocFile) { alert('Please select a file to upload.'); return; }
    if (!userData?.uid) return;
    setIsUploadingDoc(true);
    try {
      const docRef = push(ref(realtimeDb, `users/${userData.uid}/customDocuments`));
      await set(docRef, {
        name: newDocName.trim(),
        fileUrl: newDocFile,
        fileName: newDocFileName,
        uploadedAt: new Date().toISOString()
      });
      setNewDocName('');
      setNewDocFile(null);
      setNewDocFileName('');
      setIsUploadModalOpen(false);
      alert('Document uploaded successfully!');
    } catch (err) {
      alert('Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleCustomDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewDocFile(ev.target?.result as string);
      setNewDocFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCustomDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?') || !userData?.uid) return;
    await set(ref(realtimeDb, `users/${userData.uid}/customDocuments/${docId}`), null);
  };

  useEffect(() => {
    if (isPaymentModalOpen && selectedAppForPayment?.collegeId) {
      const settingsRef = ref(realtimeDb, `colleges/${selectedAppForPayment.collegeId}/paymentSettings`);
      get(settingsRef).then((snapshot) => {
        if (snapshot.exists()) {
          setCollegePaymentSettings(snapshot.val());
        } else {
          setCollegePaymentSettings(null);
        }
      });
    }
  }, [isPaymentModalOpen, selectedAppForPayment]);
 
  const handlePaymentSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedAppForPayment || !userData?.uid) return;
     
     const errors: Record<string, string> = {};
     if (!paymentForm.upiId) errors.upiId = "UPI ID is required";
     if (!paymentForm.relationship) errors.relationship = "Please select a relationship";
     if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) errors.amount = "Valid payment amount is required";
     if (!paymentForm.email) errors.email = "Payer email is required";
     if (!paymentForm.phone) errors.phone = "Mobile number is required";
     if (!paymentForm.screenshot) errors.screenshot = "Please upload a payment screenshot";

     const outstanding = parseFloat(selectedAppForPayment.fees || '0') - parseFloat(selectedAppForPayment.paidFees || '0');
     const inputAmount = parseFloat(paymentForm.amount || '0');
     
     if (inputAmount > outstanding) {
       errors.amount = `Amount cannot exceed outstanding balance of ₹${outstanding.toLocaleString()}`;
     }

     if (Object.keys(errors).length > 0) {
       setFormErrors(errors);
       alert("Please fill in all mandatory fields and upload a screenshot.");
       return;
     }

     setFormErrors({});
     setIsSubmittingPayment(true);
    try {
      const paymentData = {
        ...paymentForm,
        studentUid: userData.uid,
        studentName: (userData.profile?.firstName || userData.firstName || 'Unknown') + ' ' + (userData.profile?.lastName || userData.lastName || ''),
        applicationId: selectedAppForPayment.applicationId,
        collegeId: selectedAppForPayment.collegeId,
        courseName: selectedAppForPayment.courseName,
        submittedAt: new Date().toISOString(),
        status: 'Pending'
      };

      const paymentRef = push(ref(realtimeDb, `colleges/${selectedAppForPayment.collegeId}/payments/online`));
      await set(paymentRef, paymentData);

      // Also record in student's personal record
      const studentPaymentRef = push(ref(realtimeDb, `users/${userData.uid}/payments`));
      await set(studentPaymentRef, paymentData);

      alert("Payment details submitted successfully! The institution will verify your UTR and update your balance soon.");
      setIsPaymentModalOpen(false);
      setPaymentForm({ upiId: '', utrId: '', email: '', relationship: 'Father', phone: '', amount: '', screenshot: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment details.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp || !userData?.uid) return;

    if (!examForm.screenshot) {
      alert("Please upload payment screenshot to proceed.");
      return;
    }

    setIsSubmittingExam(true);
    try {
      const submissionData = {
        studentUid: userData.uid,
        studentId: userData.profile?.regNo || userData.regNo || 'N/A',
        studentName: examForm.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`,
        fatherName: examForm.fatherName || userData.profile?.fatherFirstName || 'N/A',
        motherName: examForm.motherName || userData.profile?.motherFirstName || 'N/A',
        collegeName: activeApp.collegeName,
        courseType: activeApp.courseType,
        courseName: activeApp.courseName,
        dob: examForm.dob || userData.profile?.dateOfBirth || 'N/A',
        aadharNumber: examForm.aadharNumber || userData.profile?.aadhaarNo || 'N/A',
        screenshot: examForm.screenshot,
        submittedAt: new Date().toISOString(),
        status: 'Pending',
        fees: examSettings?.fees || '0'
      };

      const subRef = push(ref(realtimeDb, `colleges/${activeApp.collegeId}/examSubmissions`));
      await set(subRef, submissionData);

      alert("Exam form submitted successfully! Waiting for institutional verification.");
      setIsExamModalOpen(false);
      setExamForm({ screenshot: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to submit exam form.");
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const profileDocs = useMemo(() => [
    { label: 'Aadhar Card Front', key: 'aadhaarFrontUrl', stepId: 1 },
    { label: 'Aadhar Card Back', key: 'aadhaarBackUrl', stepId: 1 },
    { label: 'Caste Certificate', key: 'casteCertificateUrl', stepId: 4 },
    { label: 'Training Certificate', key: 'trainingCertificateUrl', stepId: 6 },
    { label: 'PAN Card', key: 'panCardUrl', stepId: 8 },
    { label: 'Bank Passbook / Cheque', key: 'bankPassbookUrl', stepId: 8 },
    ...Object.values(userData?.profile?.qualifications || {}).map((q: any) => ({
      label: `${q.examination} Marksheet`,
      url: q.marksheetUrl,
      stepId: 5
    }))
  ], [userData]);

  const getAppHtml = (app: any, isDownload: boolean = false) => {
    const val = (v: any) => v || 'N/A';
    const p = userData?.profile || {};
    
    let docsHtml = '';
    let docIdx = 1;
    [...profileDocs, ...Object.values(userData?.customDocuments || {})].forEach((doc: any) => {
      const fileUrl = doc.url || doc.fileUrl || p[doc.key];
      if (fileUrl) {
        docsHtml += `
          <tr>
            <td style="border: 1px solid #000; text-align: center; padding: 5px;">${docIdx++}</td>
            <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${doc.label || doc.name}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 5px;">Uploaded</td>
          </tr>
        `;
      }
    });

    return `
      <html>
        <head>
          <title>Application - ${app.applicationId || 'Form'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 0; background: ${isDownload ? '#fff' : '#f3f4f6'}; }
            .a4-container { width: 210mm; min-height: 297mm; padding: 15mm; margin: ${isDownload ? '0' : '20px'} auto; box-sizing: border-box; background: #fff; box-shadow: ${isDownload ? 'none' : '0 0 10px rgba(0,0,0,0.1)'}; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 14px; font-weight: 600; margin: 5px 0 0 0; }
            .section { margin-bottom: 15px; page-break-inside: avoid; }
            .section-title { background: #002147; color: #fff; padding: 5px 10px; font-size: 13px; font-weight: 800; border: 1px solid #000; text-transform: uppercase; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
            th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; }
            th { background: #f8fafc; font-weight: 700; width: 25%; color: #334155; }
            .photo-box { width: 100%; height: 130px; border: 1px solid #000; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fafafa; }
            .sign-box { width: 100%; height: 40px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fafafa; }
            @media print {
              body { background: #fff; margin: 0; padding: 0; }
              .a4-container { margin: 0; padding: 10mm; width: 100%; box-shadow: none; border: none; }
              .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="a4-container">
            <div class="header">
              <h1 class="title">${app.collegeName || 'Institution Name'}</h1>
              <p class="subtitle">Official Admission Application Form</p>
            </div>
            
            <table style="width: 100%; margin-bottom: 15px;">
              <tr><th>Registration No.</th><td><strong>${val(p.regNo || userData?.regNo)}</strong></td><th>Application ID</th><td><strong>${val(app.applicationId)}</strong></td></tr>
              <tr><th>Course Name</th><td>${val(app.courseName)}</td><th>Course Type</th><td>${val(app.courseType)}</td></tr>
              <tr><th>Admission Date</th><td>${new Date(app.appliedAt || Date.now()).toLocaleDateString()}</td><th>Status</th><td>${val(app.status)}</td></tr>
            </table>

            <div class="section">
               <div class="section-title">1. Primary Details</div>
               <table style="border: none; margin-bottom: 0;">
                 <tr style="border: none;">
                   <td style="width: 75%; border: none; padding: 0; vertical-align: top;">
                     <table style="width: 100%; margin-bottom: 0;">
                       <tr><th>First Name</th><td>${val(p.firstName)}</td><th>Last Name</th><td>${val(p.lastName)}</td></tr>
                       <tr><th>Father/Middle Name</th><td>${val(p.middleName)}</td><th>Gender</th><td>${val(p.gender)}</td></tr>
                       <tr><th>Date of Birth</th><td>${formatDOB(val(p.dateOfBirth))}</td><th>Aadhaar No.</th><td>${val(p.aadhaarNo)}</td></tr>
                       <tr><th>Mobile No.</th><td>${val(p.phone)}</td><th>Secondary Mobile</th><td>${val(p.secondaryPhone)}</td></tr>
                       <tr><th>Email ID</th><td colspan="3">${val(userData?.email || p.email)}</td></tr>
                     </table>
                   </td>
                   <td style="width: 25%; border: none; padding-left: 15px; text-align: center; vertical-align: top;">
                      <div class="photo-box">
                         ${p.photoUrl ? '<img src="' + p.photoUrl + '" style="width: 100%; height: 100%; object-fit: cover;" />' : 'Photo'}
                      </div>
                      <div class="sign-box">
                         ${p.signUrl ? '<img src="' + p.signUrl + '" style="max-height: 40px; max-width: 100%; object-fit: contain;" />' : 'Signature'}
                      </div>
                   </td>
                 </tr>
               </table>
            </div>

            <div class="section">
               <div class="section-title">2. Address Details</div>
               <table>
                 <tr><th colspan="4" style="background: #f1f5f9; text-align: center;">Correspondence Address</th></tr>
                 <tr><th>Address</th><td colspan="3">${val(p.address)}</td></tr>
                 <tr><th>City/Village</th><td>${val(p.city)}</td><th>Taluka</th><td>${val(p.taluka)}</td></tr>
                 <tr><th>District</th><td>${val(p.district)}</td><th>State & Pincode</th><td>${val(p.state)} - ${val(p.pincode)}</td></tr>
                 
                 <tr><th colspan="4" style="background: #f1f5f9; text-align: center; border-top: 2px solid #000;">Permanent Address</th></tr>
                 <tr><th>Address</th><td colspan="3">${val(p.permAddress)}</td></tr>
                 <tr><th>City/Village</th><td>${val(p.permCity)}</td><th>Taluka</th><td>${val(p.permTaluka)}</td></tr>
                 <tr><th>District</th><td>${val(p.permDistrict)}</td><th>State & Pincode</th><td>${val(p.permState)} - ${val(p.permPincode)}</td></tr>
               </table>
            </div>

            <div class="section">
               <div class="section-title">3. Parent Details</div>
               <table>
                 <tr><th>Orphan Candidate</th><td>${val(p.isOrphan)}</td><th>Marital Status</th><td>${val(p.maritalStatus)}</td></tr>
                 <tr><th>Father's Name</th><td>${val(p.fatherFirstName)} ${val(p.fatherMiddleName || '')} ${val(p.fatherLastName)}</td><th>Father's Mobile</th><td>${val(p.fatherPhone)}</td></tr>
                 <tr><th>Mother's Name</th><td>${val(p.motherFirstName)} ${val(p.motherMiddleName || '')} ${val(p.motherLastName)}</td><th>Mother's Mobile</th><td>${val(p.motherPhone)}</td></tr>
                 <tr><th>Father's Occupation</th><td>${val(p.fatherOccupation)}</td><th>Annual Income</th><td>${val(p.annualIncome)}</td></tr>
               </table>
            </div>

            <div class="section">
               <div class="section-title">4. Category Details</div>
               <table>
                 <tr><th>Nationality</th><td>${val(p.nationality)}</td><th>Domicile (MH)</th><td>${val(p.isMaharashtraDomiciled)}</td></tr>
                 <tr><th>Religion</th><td>${val(p.religion)}</td><th>Caste Category</th><td>${val(p.casteCategory)}</td></tr>
                 <tr><th>Person with Disability</th><td>${val(p.isPWD)}</td><th>Disability Type</th><td>${val(p.disabilityType)}</td></tr>
               </table>
            </div>

            <div class="section">
               <div class="section-title">5. Qualifications</div>
               <table>
                 <thead>
                   <tr>
                     <th style="width: 15%;">Exam</th>
                     <th style="width: 20%;">Board/University</th>
                     <th style="width: 25%;">School/College</th>
                     <th style="width: 10%;">Year</th>
                     <th style="width: 15%;">Marks</th>
                     <th style="width: 15%;">Percentage</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${Object.values(p.qualifications || {}).map((q: any) => 
                     '<tr>' +
                       '<td>' + val(q.examination) + '</td>' +
                       '<td>' + val(q.board) + '</td>' +
                       '<td>' + val(q.college) + '</td>' +
                       '<td>' + val(q.passingDate) + '</td>' +
                       '<td>' + val(q.marksObtained) + '/' + val(q.outOfMarks) + '</td>' +
                       '<td>' + val(q.percentage) + '% (' + val(q.grade) + ')</td>' +
                     '</tr>'
                   ).join('') || '<tr><td colspan="6" style="text-align: center;">No qualifications added</td></tr>'}
                 </tbody>
               </table>
            </div>

            <div class="section">
               <div class="section-title">6. Training Details</div>
               <table>
                 <tr><th>Training Completed?</th><td colspan="3">${val(p.hasTraining)}</td></tr>
                 ${p.hasTraining === 'Yes' ? `
                   <tr><th>Start Date</th><td>${val(p.trainingStartDate)}</td><th>End Date</th><td>${val(p.trainingEndDate)}</td></tr>
                 ` : ''}
               </table>
            </div>

            <div class="section">
               <div class="section-title">7. Additional Details</div>
               <table>
                 <tr><th>Blood Group</th><td>${val(p.bloodGroup)}</td><th>Mother Tongue</th><td>${val(p.motherTongue)}</td></tr>
               </table>
               <p style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">Languages Known:</p>
               <table>
                 <tr style="background: #f8fafc;"><th>Language</th><th>Read</th><th>Write</th><th>Speak</th></tr>
                 ${Object.values(p.languagesKnown || {}).map((l: any) => 
                   '<tr><td>' + val(l.language) + '</td><td>' + (l.read ? 'Yes' : 'No') + '</td><td>' + (l.write ? 'Yes' : 'No') + '</td><td>' + (l.speak ? 'Yes' : 'No') + '</td></tr>'
                 ).join('') || '<tr><td colspan="4" style="text-align: center;">No languages added</td></tr>'}
               </table>
            </div>

            <div class="section">
               <div class="section-title">8. Bank & Identification</div>
               <table>
                 <tr><th>Has Bank Account?</th><td colspan="3">${val(p.hasBankAccount)}</td></tr>
                 ${p.hasBankAccount === 'Yes' ? `
                   <tr><th>Bank Name</th><td>${val(p.bankName)}</td><th>Branch</th><td>${val(p.branchName)}</td></tr>
                   <tr><th>Account No.</th><td>${val(p.accountNumber)}</td><th>IFSC Code</th><td>${val(p.ifscCode)}</td></tr>
                   <tr><th>Account Holder</th><td colspan="3">${val(p.accountHolderName)}</td></tr>
                 ` : ''}
                 <tr><th>PAN Card No.</th><td colspan="3">${val(p.panCardNo)}</td></tr>
               </table>
            </div>

            <div class="section">
               <div class="section-title">9. Work Experience</div>
               <table>
                 <thead>
                   <tr>
                     <th style="width: 35%;">Organization</th>
                     <th style="width: 25%;">Designation</th>
                     <th style="width: 20%;">From</th>
                     <th style="width: 20%;">To</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${Object.values(p.workExperiences || {}).map((exp: any) => 
                     '<tr>' +
                       '<td>' + val(exp.organization) + '</td>' +
                       '<td>' + val(exp.designation) + '</td>' +
                       '<td>' + val(exp.fromDate) + '</td>' +
                       '<td>' + val(exp.toDate) + '</td>' +
                     '</tr>'
                   ).join('') || '<tr><td colspan="4" style="text-align: center;">No work experience added</td></tr>'}
                 </tbody>
               </table>
            </div>

            <div class="section">
               <div class="section-title">10. Uploaded Documents</div>
               <table>
                 <tr><th style="width: 10%; text-align: center;">Sr.</th><th style="width: 60%;">Document Name</th><th style="width: 30%; text-align: center;">Status</th></tr>
                 ${docsHtml || '<tr><td colspan="3" style="text-align: center;">No documents uploaded</td></tr>'}
               </table>
            </div>
            
            <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
               <div style="text-align: center;">
                 <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px; height: 30px;"></div>
                 <strong>Student Signature</strong>
               </div>
               <div style="text-align: center;">
                 <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px; height: 30px;"></div>
                 <strong>Authorized Signatory</strong>
               </div>
            </div>
          </div>
          
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            window.onload = () => {
              const element = document.querySelector('.a4-container');
              const opt = {
                margin: 0,
                filename: 'Application_${app.applicationId || 'Form'}.pdf',
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              if (window.parent !== window) {
                // Inside iframe (Download mode)
                html2pdf().set(opt).from(element).toPdf().get('pdf').save().then(() => {
                  setTimeout(() => { window.parent.document.body.removeChild(window.frameElement); }, 2000);
                });
              } else {
                // New Window (Print mode)
                setTimeout(() => { window.print(); }, 500);
              }
            };
          </script>
        </body>
      </html>
    `;
  };

  const handleDownloadApplication = (app: any, isDownload: boolean, isPreview: boolean = false) => {
    if (isPreview) {
      setAppPreviewData(app);
      setIsAppPreviewOpen(true);
      return;
    }

    const html = getAppHtml(app, isDownload);
    
    if (isDownload) {
      const iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.write(html);
        doc.close();
      }
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert('Please allow popups to preview/download the application.');
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };




  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <DashboardHome 
            userData={userData}
            userApplications={sortedApplications}
            stepPercentages={stepPercentages}
            feeDue={feeDue}
            hasActiveAdmission={hasActiveAdmission}
            setIsOtherCourseMode={setIsOtherCourseMode}
            setIsCourseModalOpen={setIsCourseModalOpen}
            handleTabChange={handleTabChange}
            studentReceipts={studentReceipts}
          />
        );
      case 2:
        return (
          <ApplicationManager 
            selectedCollege={selectedCollege}
            setSelectedCollege={setSelectedCollege}
            availableColleges={availableColleges}
            selectedCourseType={selectedCourseType}
            setSelectedCourseType={setSelectedCourseType}
            availableCourseTypes={availableCourseTypes}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            filteredCourses={filteredCourses}
            selectedDuration={selectedDuration}
            selectedFees={selectedFees}
            handleAddNewApplication={handleAddNewApplication}
            isSubmittingApp={isSubmittingApp}
            sortedApplications={sortedApplications}
            userData={userData}
            handleTabChange={handleTabChange}
          />
        );
      case 3:
        return (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <header className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => handleTabChange(2)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                title="Back to Applications"
              >
                <ArrowLeft size={24} className="text-[#ff9f1c] group-hover:scale-110 transition-transform" />
              </button>
              <h2 className="text-2xl font-light text-[#ff9f1c] tracking-tight">Identity & Profile Center</h2>
            </header>
            <ProfileWizard 
               userId={userData?.uid} 
               initialData={{ ...userData?.profile, ...userData }} 
               initialStep={activeStep}
               isAdmitted={userApplications.some(app => app.status === 'Accepted' || app.status === 'Confirmed')}
               onStepComplete={(step, perc) => {
                 console.log(`Step ${step} completed: ${perc}%`);
               }}
            />
          </div>
        );
      case 4:
        return (
          <ExaminationCenter 
            activeApp={activeApp}
            examSettings={examSettings}
            examSubmissions={examSubmissions}
            setIsExamModalOpen={setIsExamModalOpen}
            userData={userData}
          />
        );
      case 5: {
        const acceptedApps = userApplications
          .filter(app => app.status === 'Accepted' || app.status === 'Confirmed')
          .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
        const totalFees = acceptedApps.reduce((acc, app) => acc + parseFloat(app.fees || '0'), 0);
        const totalPaid = acceptedApps.reduce((acc, app) => acc + parseFloat(app.paidFees || '0'), 0);
        const balanceDue = totalFees - totalPaid;
        return (
          <FeePaymentPortal 
            acceptedApps={acceptedApps}
            totalFees={totalFees}
            totalPaid={totalPaid}
            balanceDue={balanceDue}
            userPayments={userPayments}
            setSelectedAppForPayment={setSelectedAppForPayment}
            setPaymentForm={setPaymentForm}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
          />
        );
      }
      case 7:
        return (
          <TransactionHistory 
            userPayments={userPayments}
            availableColleges={availableColleges}
          />
        );
      case 15:
        return (
          <PaymentSlipModule 
            studentReceipts={studentReceipts}
            handleDownloadReceipt={handleDownloadReceipt}
          />
        );
      case 11: {
        return (
          <DocumentVault 
            profileDocs={profileDocs}
            userData={userData}
            customDocuments={customDocuments}
            setIsUploadModalOpen={setIsUploadModalOpen}
            setModalPreview={setModalPreview}
            handleDocumentUpload={handleDocumentUpload}
            handleDeleteCustomDoc={handleDeleteCustomDoc}
          />
        );
      }
      case 22:
        return (
          <PrintApplicationRegistry 
            userApplications={sortedApplications}
            userData={userData}
            handleDownloadApplication={handleDownloadApplication}
          />
        );
      default:
        return (
          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl">
             <h3 className="text-2xl font-medium text-slate-800 tracking-tighter">Student Module</h3>
             <p className="text-slate-400 font-normal mt-2">This feature is being updated. Please check back later.</p>
          </div>
        );
    }
  };

  if (loading || !userData) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <div className="w-20 h-20 border-4 border-t-[#ff9f1c] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="flex flex-col items-center gap-2">
         <div className="text-[#ff9f1c] font-black capitalize tracking-normal text-[13px]">
           Initializing Student Session
         </div>
         <div className="flex gap-1">
            <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce" />
         </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <main className="max-w-[1600px] mx-auto min-h-screen">
        {renderTabContent()}
      </main>

      {/* Receipt Preview Modal (In-App) */}
      {isReceiptPreviewOpen && receiptPreviewData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsReceiptPreviewOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e11d48]/10 flex items-center justify-center text-[#e11d48]">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Fee Receipt Preview</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">A4 Institutional Format</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setIsReceiptPreviewOpen(false); handleDownloadReceipt(receiptPreviewData, false); }}
                  className="px-6 py-2.5 bg-[#e11d48] text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button onClick={() => setIsReceiptPreviewOpen(false)} className="p-3 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-100 no-scrollbar flex justify-center">
              <div className="origin-top transition-transform duration-300 shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                <div className="bg-white p-10 border-[0.5px] border-[#e11d48] relative min-h-full flex flex-col" style={{ color: '#e11d48' }}>
                  <div className="flex items-center gap-6 border-b-2 border-[#e11d48] pb-4 mb-4">
                    <div className="w-20 h-20 border border-[#e11d48] p-1 shrink-0 flex items-center justify-center bg-white">
                      <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" className="w-full h-full object-contain" alt="Logo" />
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[12px] font-bold mb-1">Mahavishnu Gramin Vikas &amp; Shaikshnik B. sanstha Dhamangaon ( Dhad)</p>
                      <h1 className="text-[24px] font-black uppercase whitespace-nowrap">Mahalaxmi Technical Institute Paradh.Bk.</h1>
                      <p className="text-[14px] font-bold">Tq.Bhokardan Dist. Jalna , Paradh - 431114</p>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="inline-block border-2 border-[#e11d48] px-10 py-1 font-black text-xl text-[#e11d48]">RECEIPT</div>
                  </div>

                  <div className="space-y-4 font-bold text-[14px]">
                    <div className="flex gap-10">
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Receipt No. :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{receiptPreviewData.receiptNo || (receiptPreviewData.id || '').substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="w-48 flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Date :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">{new Date(receiptPreviewData.date || receiptPreviewData.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#e11d48] whitespace-nowrap">Name of Student :</span>
                      <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">
                        {userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.middleName || ''} ${userData.profile.lastName || ''}`.replace(/\s+/g, ' ').trim() : (userData?.firstName || 'Student')}
                      </span>
                    </div>
                    <div className="flex gap-10">
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Registration Number :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{userData?.profile?.regNo || userData?.regNo || ''}</span>
                      </div>
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Academic Year :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">2026-2027</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#e11d48] whitespace-nowrap">College :</span>
                      <span className="flex-[2] border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{activeApp?.collegeName || 'MAHALAXMI TECHNICAL INSTITUTE'}</span>
                      <span className="ml-6 text-[#e11d48] whitespace-nowrap">Course :</span>
                      <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{activeApp?.courseName || ''}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#e11d48] whitespace-nowrap">Course Type :</span>
                      <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{activeApp?.courseType || ''}</span>
                    </div>
                  </div>

                  <table className="w-full border-collapse border border-[#e11d48] mt-6 text-[13px] font-bold">
                    <thead>
                      <tr>
                        <th className="border border-[#e11d48] w-12 py-2">Sr.</th>
                        <th className="border border-[#e11d48] py-2">Particular's</th>
                        <th className="border border-[#e11d48] w-40 py-2">Amount ( Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "Tuition Fee", "Admission Fee/Enrollment Fee", "University Eligibility Fee",
                        "Univ Exam. Fee", "Univ Sports (Per Capita) Fee", "Univ Students Welfare Fund",
                        "Student Insurance", "Caution Money Deposit", "I-Card , Magazines",
                        "Journals / Stationary", "Extra Curricular Activities Fee", "College Development Fee",
                        "Library Fee/Deposit", "Laboratory Fee/Deposit", "Professional Membership Fee",
                        "Transportation Fee", "Medical Exam Fee"
                      ].map((item, i) => (
                        <tr key={i}>
                          <td className="border border-[#e11d48] text-center py-1.5">{i + 1}</td>
                          <td className="border border-[#e11d48] px-3 py-1.5">{item}</td>
                          <td className="border border-[#e11d48] text-right px-3 py-1.5 text-black font-black">
                            {i === 0 ? '₹' + parseFloat(receiptPreviewData.amount).toLocaleString() : ''}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-[#e11d48]">
                        <td colSpan={2} className="border border-[#e11d48] text-right px-4 py-2 font-black uppercase text-[#e11d48] text-[15px]">Total Fees</td>
                        <td className="border border-[#e11d48] text-right px-3 py-2 text-black font-black text-[15px]">₹{parseFloat(receiptPreviewData.amount).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-10 space-y-5 font-bold text-[14px]">
                    <div className="flex gap-10">
                      <div className="flex-[1.5] flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Amount In Words Rs:</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black capitalize">{numberToWords(parseFloat(receiptPreviewData.amount))}</span>
                      </div>
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Cash/D.D. No :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{receiptPreviewData.utrId || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-10 mt-6">
                      <div className="flex-[1.5] flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Bank :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">{receiptPreviewData.type === 'Online' ? 'Online Transfer/UPI' : (receiptPreviewData.type || 'N/A')}</span>
                      </div>
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-[#e11d48] whitespace-nowrap">Accountant/Authorized Sign :</span>
                        <span className="flex-1 border-b-2 border-dotted border-[#e11d48]">&nbsp;</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center -rotate-[35deg] text-8xl font-black pointer-events-none whitespace-nowrap opacity-[0.05]" style={{ color: '#e11d48' }}>
                    MAHALAXMI INSTITUTE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Preview Modal (In-App) */}
      {isAppPreviewOpen && appPreviewData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsAppPreviewOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-[#002147] border-b border-white/10 p-6 flex items-center justify-between shrink-0 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff9f1c]/20 flex items-center justify-center text-[#ff9f1c]">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Application Preview</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">A4 Official Document Format</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { handleDownloadApplication(appPreviewData, true, false); }}
                  className="px-6 py-2.5 bg-[#ff9f1c] text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button onClick={() => setIsAppPreviewOpen(false)} className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-100 no-scrollbar flex justify-center">
               <div className="origin-top shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                  <div className="bg-white" dangerouslySetInnerHTML={{ __html: getAppHtml(appPreviewData, false) }} />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => { setIsCourseModalOpen(false); setIsOtherCourseMode(false); }} />
          
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-[#003366] p-8 text-white text-center relative">
               <button 
                 onClick={() => { setIsCourseModalOpen(false); setIsOtherCourseMode(false); }}
                 className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
               >
                 <X size={22} />
               </button>
               <div className="w-14 h-14 bg-[#00a5a5] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <BookOpen size={28} />
               </div>
               <h3 className="text-xl font-bold tracking-tight capitalize">Apply For Admission</h3>
               <p className="text-[13px] font-bold text-black capitalize tracking-normal mt-1">Select your institution & course to continue</p>
               
               {/* Already Accepted Courses List */}
               {userApplications.filter(a => a.status === 'Accepted').length > 0 && (
                 <div className="mt-6 flex flex-wrap justify-center gap-3">
                   {userApplications.filter(a => a.status === 'Accepted').map((app, idx) => (
                     <span key={idx} className="bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                       <Check size={12} className="text-emerald-400" /> you are already select previous: {app.courseName}
                     </span>
                   ))}
                 </div>
               )}
            </div>

            {/* Form Body */}
            <div className="p-8 space-y-6">
              {/* Row 1: College, Course Type, Course */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Target Institution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    Target Institution / College <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedCollege}
                    onChange={(e) => {
                      setSelectedCollege(e.target.value);
                      setSelectedCourseType('');
                      setSelectedCourseId('');
                    }}
                    disabled={!isOtherCourseMode && (hasActiveAdmission || (userApplications.length > 0 && userData?.profile?.status !== 'Unlocked'))}
                    className="w-full border border-slate-300 rounded-md p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed shadow-inner"
                  >
                    <option value="">— Select Official College —</option>
                    {availableColleges.map((col) => (
                      <option key={col.id} value={col.id}>{col.name} (ID: {col.collegeId})</option>
                    ))}
                  </select>
                </div>

                {/* Course Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedCourseType}
                    onChange={(e) => {
                      setSelectedCourseType(e.target.value);
                      setSelectedCourseId('');
                    }}
                    disabled={!selectedCollege || (!isOtherCourseMode && (hasActiveAdmission || (userApplications.length > 0 && userData?.profile?.status !== 'Unlocked')))}
                    className="w-full border border-slate-300 rounded-md p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed shadow-inner"
                  >
                    <option value="">— Select Type —</option>
                    {availableCourseTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    disabled={!selectedCourseType || (!isOtherCourseMode && (hasActiveAdmission || (userApplications.length > 0 && userData?.profile?.status !== 'Unlocked')))}
                    className="w-full border border-[#00a5a5] rounded-md p-3 text-sm text-slate-700 outline-none bg-white disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed shadow-inner"
                  >
                    <option value="">Select Course</option>
                    {filteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Duration */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Duration</label>
                  <input
                    readOnly
                    type="text"
                    value={selectedDuration}
                    placeholder="Automatic from course"
                    className="w-full border border-slate-300 rounded-md p-3 text-sm text-slate-500 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              {/* No courses notice */}
              {selectedCollege && collegeCourses.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                   <AlertCircle className="text-amber-500 shrink-0" size={18} />
                   <p className="text-[11px] font-bold text-amber-700 capitalize tracking-tight">No courses found for this college. Please contact administration.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex items-center justify-between">
               <div className="flex items-center gap-2 text-[#00a5a5]">
                  <ShieldCheck size={14} />
                  <span className="text-[13px] font-black capitalize tracking-tight">Verified Portal</span>
               </div>
               <button
                 onClick={handleAddNewApplication}
                 disabled={isSubmittingApp || (!userApplications.length && (!selectedCollege || !selectedCourseId))}
                 className="bg-[#00a5a5] text-white px-10 py-3.5 rounded-xl text-[11px] font-black capitalize tracking-tight shadow-lg hover:bg-[#003366] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
               >
                 {isSubmittingApp ? 'Submitting...' : userApplications.length > 0 ? <>CONFIRM & PROCEED <ArrowRight size={14} /></> : <>SUBMIT <ArrowRight size={14} /></>}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {modalPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalPreview(null)} />
          <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00a5a5] flex items-center justify-center text-white">
                  <FileBadge size={16} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 capitalize tracking-tight">{modalPreview.label}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(modalPreview.url, '_blank')}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#00a5a5] transition-all"
                  title="Open in New Tab"
                >
                  <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => setModalPreview(null)}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-100/50 flex items-center justify-center">
              <img 
                src={modalPreview.url} 
                alt={modalPreview.label}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-4 border-white"
              />
            </div>
          </div>
        </div>
      )}
      {/* Payment Submission Modal */}
      {isPaymentModalOpen && selectedAppForPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingPayment && setIsPaymentModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#5D5fb1] p-10 text-white relative shrink-0">
                 <button onClick={() => setIsPaymentModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter capitalize">Online Fee Payment</h3>
                    <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Submit your transaction details for verification</p>
                 </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-10 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                 {/* Scan & Pay Section */}
                 {collegePaymentSettings?.isActive && collegePaymentSettings?.upiId && (
                    <div className="bg-indigo-50/50 rounded-3xl p-8 border-2 border-dashed border-[#5D5fb1]/20 flex flex-col md:flex-row items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                       <div className="p-4 bg-white rounded-2xl shadow-xl border border-indigo-100 shrink-0">
                          <QRCodeCanvas 
                             value={`upi://pay?pa=${collegePaymentSettings.upiId}&pn=${encodeURIComponent(collegePaymentSettings.merchantName || 'College')}&cu=INR`}
                             size={140}
                             level="H"
                          />
                       </div>
                       <div className="text-center md:text-left space-y-3">
                          <p className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest">Scan to pay directly</p>
                          <h4 className="text-xl font-black text-slate-800 tracking-tighter capitalize leading-tight">
                             {collegePaymentSettings.merchantName || selectedAppForPayment?.collegeName || 'Official College Account'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                <CreditCard size={14} className="text-[#5D5fb1]" />
                                <span className="text-[13px] font-bold text-slate-600">{collegePaymentSettings.upiId}</span>
                             </div>
                             <button 
                               type="button"
                               onClick={() => {
                                 navigator.clipboard.writeText(collegePaymentSettings.upiId);
                                 alert("UPI ID copied to clipboard!");
                               }}
                               className="p-2 rounded-xl bg-white text-[#5D5fb1] hover:bg-[#5D5fb1] hover:text-white transition-all border border-indigo-100 shadow-sm active:scale-95"
                               title="Copy UPI ID"
                             >
                                <Copy size={16} />
                             </button>
                             <button 
                               type="button"
                               onClick={() => {
                                 const canvas = document.querySelector('canvas');
                                 if (canvas) {
                                   const url = canvas.toDataURL("image/png");
                                   const link = document.createElement("a");
                                   link.href = url;
                                   link.download = `QR_${collegePaymentSettings.merchantName || 'Payment'}.png`;
                                   link.click();
                                 }
                               }}
                               className="p-2 rounded-xl bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm active:scale-95"
                               title="Download QR Code"
                             >
                                <Download size={16} />
                             </button>
                          </div>
                       </div>
                    </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                       <p className="text-sm font-bold text-slate-800 capitalize">{(userData.profile?.firstName || userData.firstName || 'Student')} {(userData.profile?.lastName || userData.lastName || '')}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
                       <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="bg-[#5D5fb1]/5 p-4 rounded-2xl border border-[#5D5fb1]/20">
                       <p className="text-[10px] font-bold text-[#5D5fb1] uppercase tracking-widest mb-1">College</p>
                       <p className="text-sm font-bold text-[#002147] capitalize">{selectedAppForPayment.collegeName}</p>
                    </div>
                    <div className="bg-[#00a5a5]/5 p-4 rounded-2xl border border-[#00a5a5]/20 md:col-span-1">
                       <p className="text-[10px] font-bold text-[#00a5a5] uppercase tracking-widest mb-1">Course</p>
                       <p className="text-sm font-bold text-[#002147] capitalize">{selectedAppForPayment.courseName}</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UPI ID</label>
                          <input 
                            required
                            type="text" 
                            placeholder="e.g. name@upi"
                            className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                            value={paymentForm.upiId}
                            onChange={(e) => setPaymentForm({...paymentForm, upiId: e.target.value})}
                          />
                          {formErrors.upiId && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.upiId}</span>}
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UTR / Transaction ID</label>
                          <input 
                            type="text" 
                            placeholder="12-digit transaction number (Optional)"
                            className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                            value={paymentForm.utrId}
                            onChange={(e) => setPaymentForm({...paymentForm, utrId: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Payer Relationship</label>
                          <select 
                            required
                            className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all cursor-pointer"
                            value={paymentForm.relationship}
                            onChange={(e) => setPaymentForm({...paymentForm, relationship: e.target.value})}
                          >
                             <option value="Self">Self (Student)</option>
                             <option value="Father">Father</option>
                             <option value="Mother">Mother</option>
                             <option value="Uncle">Uncle</option>
                             <option value="Brother">Brother</option>
                             <option value="Sister">Sister</option>
                             <option value="Other">Other</option>
                          </select>
                          {formErrors.relationship && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.relationship}</span>}
                       </div>
                       <div className="space-y-2">
                           <div className="flex justify-between items-center pl-1">
                             <label className="text-[13px] font-normal text-black capitalize tracking-tight">Amount Paid (₹)</label>
                             <span className="text-[10px] font-bold text-[#ff9f1c]">Max: ₹{(parseFloat(selectedAppForPayment.fees || '0') - parseFloat(selectedAppForPayment.paidFees || '0')).toLocaleString()}</span>
                           </div>
                          <input 
                            required
                            type="number" 
                            className="w-full bg-emerald-50 border border-emerald-500 rounded-2xl p-4 text-lg font-black text-emerald-700 outline-none"
                            value={paymentForm.amount}
                            onChange={(e) => {
                               const maxVal = parseFloat(selectedAppForPayment.fees || '0') - parseFloat(selectedAppForPayment.paidFees || '0');
                               const inputVal = parseFloat(e.target.value);
                               setPaymentForm({...paymentForm, amount: inputVal > maxVal ? maxVal.toString() : e.target.value});
                             }}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          />
                          {formErrors.amount && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.amount}</span>}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Email ID</label>
                          <input 
                            required
                            type="email" 
                            placeholder="Contact email for payment"
                            className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                            value={paymentForm.email}
                            onChange={(e) => setPaymentForm({...paymentForm, email: e.target.value})}
                          />
                          {formErrors.email && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.email}</span>}
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mobile Number</label>
                          <input 
                            required
                            type="tel" 
                            placeholder="10-digit mobile number"
                            className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                            value={paymentForm.phone}
                            onChange={(e) => setPaymentForm({...paymentForm, phone: e.target.value})}
                          />
                          {formErrors.phone && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.phone}</span>}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:col-span-2">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Upload Payment Screenshot / Photo</label>
                          <div className="flex items-center gap-4">
                             <div className="flex-1">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  id="payment-screenshot"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setPaymentForm({...paymentForm, screenshot: reader.result as string});
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor="payment-screenshot"
                                  className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-black rounded-2xl p-6 cursor-pointer hover:bg-slate-100 transition-all group"
                                >
                                   <Camera size={20} className="text-slate-400 group-hover:text-[#5D5fb1]" />
                                   <span className="text-[13px] font-medium text-slate-500 group-hover:text-black">
                                      {paymentForm.screenshot ? 'Change Photo' : 'Click to Upload Receipt Photo'}
                                   </span>
                                </label>
                                {formErrors.screenshot && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize block mt-2">{formErrors.screenshot}</span>}
                             </div>
                             {paymentForm.screenshot && (
                                <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500 overflow-hidden shrink-0 shadow-lg cursor-pointer" onClick={() => setModalPreview({ url: paymentForm.screenshot, label: 'Payment Receipt Preview' })}>
                                   <img src={paymentForm.screenshot} className="w-full h-full object-cover" alt="Preview" />
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={isSubmittingPayment}
                   className="w-full bg-[#002147] text-white py-5 rounded-[2rem] text-sm font-black capitalize tracking-widest shadow-2xl hover:bg-[#5D5fb1] transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isSubmittingPayment ? 'Verifying Transaction...' : 'SUBMIT PAYMENT DETAILS'}
                 </button>
              </form>
           </div>
        </div>
      )}
      {/* Exam Submission Modal */}
      {isExamModalOpen && activeApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingExam && setIsExamModalOpen(false)} />
           <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#002147] p-10 text-white relative shrink-0">
                 <button onClick={() => setIsExamModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-xl">
                       <FileText size={32} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black tracking-tighter capitalize">Examination Form</h3>
                       <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Academic Session 2026-2027</p>
                    </div>
                 </div>
              </div>

              <form onSubmit={handleExamSubmit} className="p-10 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                 {/* Student Particulars */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <User size={18} className="text-[#00a5a5]" />
                       <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Particulars</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Student Name</label>
                          <input 
                            type="text" 
                            defaultValue={`${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`}
                            onChange={(e) => setExamForm({...examForm, studentName: e.target.value})}
                            placeholder="Full Name"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Father's Name</label>
                          <input 
                            type="text" 
                            defaultValue={userData.profile?.fatherFirstName || ''}
                            onChange={(e) => setExamForm({...examForm, fatherName: e.target.value})}
                            placeholder="Father's Full Name"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mother's Name</label>
                          <input 
                            type="text" 
                            defaultValue={userData.profile?.motherFirstName || ''}
                            onChange={(e) => setExamForm({...examForm, motherName: e.target.value})}
                            placeholder="Mother's Full Name"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                          <input 
                            type="date" 
                            defaultValue={userData.profile?.dateOfBirth || ''}
                            onChange={(e) => setExamForm({...examForm, dob: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                          />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Aadhar Number</label>
                          <input 
                            type="text" 
                            defaultValue={userData.profile?.aadhaarNo || ''}
                            onChange={(e) => setExamForm({...examForm, aadharNumber: e.target.value})}
                            placeholder="12-Digit Aadhar No."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                          />
                       </div>

                       {/* Institutional Read-Only Info */}
                       {[
                          { label: 'College / Institution', value: activeApp.collegeName },
                          { label: 'Course Type', value: activeApp.courseType },
                          { label: 'Program / Course', value: activeApp.courseName },
                       ].map((item, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 opacity-60">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                             <p className="text-sm font-black text-slate-800 capitalize tracking-tight">{item.value}</p>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Payment & QR Section */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <CreditCard size={18} className="text-[#00a5a5]" />
                       <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fee Payment (₹{examSettings?.fees || '0'})</h4>
                    </div>
                    
                    {collegePaymentSettings?.isActive && (
                       <div className="bg-indigo-50/50 rounded-[2.5rem] p-8 border-2 border-dashed border-[#5D5fb1]/20 flex flex-col md:flex-row items-center gap-10">
                          <div className="p-4 bg-white rounded-3xl shadow-2xl border border-indigo-100 shrink-0">
                             <QRCodeCanvas 
                                value={`upi://pay?pa=${collegePaymentSettings.upiId}&pn=${encodeURIComponent(activeApp.collegeName)}&am=${examSettings?.fees || '0'}&cu=INR`}
                                size={150}
                                level="H"
                             />
                          </div>
                          <div className="space-y-4 text-center md:text-left flex-1">
                             <div>
                                <p className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest mb-1">Official Payment Gateway</p>
                                <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-tight capitalize">{activeApp.collegeName}</h4>
                             </div>
                             <div className="flex flex-col gap-2">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-indigo-100 shadow-sm self-center md:self-start">
                                   <ShieldCheck size={16} className="text-emerald-500" />
                                   <span className="text-sm font-bold text-slate-600">{collegePaymentSettings.upiId}</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 italic">Scan the QR code or pay to the UPI ID above to complete registration.</p>
                             </div>
                          </div>
                       </div>
                    )}

                    <div className="space-y-4">
                       <label className="text-[13px] font-black text-slate-800 capitalize tracking-tight pl-1">Upload Payment Receipt / Screenshot <span className="text-red-500">*</span></label>
                       <div className="flex items-center gap-6">
                          <div className="flex-1">
                             <input 
                               type="file" 
                               accept="image/*"
                               className="hidden"
                               id="exam-payment-screenshot"
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const reader = new FileReader();
                                   reader.onloadend = () => setExamForm({...examForm, screenshot: reader.result as string});
                                   reader.readAsDataURL(file);
                                 }
                               }}
                             />
                             <label 
                               htmlFor="exam-payment-screenshot"
                               className="w-full flex items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] p-8 cursor-pointer hover:bg-white hover:border-[#00a5a5] transition-all group"
                             >
                                <Camera size={24} className="text-slate-400 group-hover:text-[#00a5a5]" />
                                <span className="text-sm font-bold text-slate-500 group-hover:text-black">
                                   {examForm.screenshot ? 'Update Receipt Photo' : 'Upload Transaction Screenshot'}
                                </span>
                             </label>
                          </div>
                          {examForm.screenshot && (
                             <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl overflow-hidden shrink-0 animate-in zoom-in-50" onClick={() => setModalPreview({ url: examForm.screenshot, label: 'Payment Receipt' })}>
                                <img src={examForm.screenshot} className="w-full h-full object-cover" alt="Preview" />
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={isSubmittingExam}
                   className="w-full bg-[#00a5a5] text-white py-6 rounded-[2.5rem] text-sm font-black capitalize tracking-widest shadow-2xl hover:bg-[#002147] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSubmittingExam ? 'Processing Submission...' : <><Save size={20} /> Submit Examination Form</>}
                 </button>
              </form>
           </div>
        </div>
      )}
      
      {/* Receipt Preview Modal */}
      {isReceiptPreviewOpen && receiptPreviewData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => setIsReceiptPreviewOpen(false)} />
           <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
              <div className="bg-[#e11d48] p-6 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                       <Receipt size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tighter">Official Fee Receipt</h3>
                       <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Institutional Registry — Verified</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDownloadReceipt(receiptPreviewData, false)}
                      className="px-6 py-2.5 bg-white text-[#e11d48] rounded-xl text-[12px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-lg flex items-center gap-2 active:scale-95"
                    >
                       <Download size={16} /> Download PDF
                    </button>
                    <button onClick={() => setIsReceiptPreviewOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white">
                       <X size={20} />
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 bg-slate-100 flex justify-center no-scrollbar">
                 <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl relative transform scale-[var(--receipt-scale,1)] origin-top text-[#e11d48]">
                    <style>{`
                       @media (max-width: 900px) {
                          :root { --receipt-scale: 0.8; }
                       }
                       @media (max-width: 700px) {
                          :root { --receipt-scale: 0.6; }
                       }
                       @media (max-width: 500px) {
                          :root { --receipt-scale: 0.4; }
                       }
                    `}</style>
                    <div className="text-center font-bold text-[12px] mb-1">Mahavishnu Gramin Vikas & Shaikshnik B. sanstha Dhamangaon ( Dhad)</div>
                    <div className="flex items-center gap-6 border-b-2 border-[#e11d48] pb-4 mb-4">
                       <div className="w-20 h-20 border border-[#e11d48] p-1 shrink-0 flex items-center justify-center bg-white">
                         <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" className="w-full h-full object-contain" alt="Logo" />
                       </div>
                       <div className="flex-1 text-center">
                          <h1 className="text-[24px] font-black uppercase whitespace-nowrap">Mahalaxmi Technical Institued Paradh.Bk.</h1>
                          <p className="text-[14px] font-bold">Tq.Bhokardan Dist. jalna , Paradh - 431114</p>
                       </div>
                    </div>
                    
                    <div className="text-center mb-4">
                       <div className="inline-block border border-[#e11d48] px-8 py-0.5 font-black text-lg">RECEIPT</div>
                    </div>
                    
                    <div className="space-y-3 font-bold text-[14px]">
                       <div className="flex gap-10">
                          <div className="flex-1 flex items-baseline gap-2">
                             <span>Receipt No. :</span>
                             <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{receiptPreviewData.receiptNo || receiptPreviewData.id.substring(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="w-48 flex items-baseline gap-2">
                             <span>Date :</span>
                             <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{new Date(receiptPreviewData.date || receiptPreviewData.timestamp).toLocaleDateString()}</span>
                          </div>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <span>Name of Student :</span>
                          <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.lastName || ''}`.trim() : (userData?.studentName || userData?.firstName || 'Student')}</span>
                       </div>
                       <div className="flex gap-10">
                          <div className="flex-1 flex items-baseline gap-2">
                             <span>Registration Number :</span>
                             <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{userData?.profile?.regNo || userData?.regNo || ''}</span>
                          </div>
                          <div className="flex-1 flex items-baseline gap-2">
                             <span>Academic Year :</span>
                             <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">2026-2027</span>
                          </div>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <span>College :</span>
                          <span className="flex-[2] border-b border-dotted border-[#e11d48] text-black font-black">{activeApp?.collegeName || 'MAHALAXMI TECHNICAL INSTITUTE'}</span>
                          <span className="ml-6">Course :</span>
                          <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{activeApp?.courseName || ''}</span>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <span>Course Type :</span>
                          <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{activeApp?.courseType || ''}</span>
                       </div>
                    </div>
                    
                    <table className="w-full border-collapse border border-[#e11d48] mt-6 text-[13px] font-bold">
                       <thead>
                          <tr>
                             <th className="border border-[#e11d48] w-12 py-2">Sr.</th>
                             <th className="border border-[#e11d48] py-2">Particular's</th>
                             <th className="border border-[#e11d48] w-40 py-2">Amount ( Rs)</th>
                          </tr>
                       </thead>
                       <tbody>
                          {[
                             "Tuition Fee", "Admission Fee/Enrollment Fee", "University Eligibility Fee", 
                             "Univ Exam. Fee", "Univ Sports (Per Capita) Fee", "Univ Students Welfare Fund", 
                             "Student Insurance", "Caution Money Deposit", "I-Card , Magazines", 
                             "Journals / Stationary", "Extra Curricular Activities Fee", "College Development Fee", 
                             "Library Fee/Deposit", "Laboratory Fee/Deposit", "Professional Membership Fee", 
                             "Transpertation Fee", "Medical Exam Fee"
                          ].map((item, i) => (
                             <tr key={i}>
                                <td className="border border-[#e11d48] text-center py-1.5">{i + 1}</td>
                                <td className="border border-[#e11d48] px-3 py-1.5">{item}</td>
                                <td className="border border-[#e11d48] text-right px-3 py-1.5 text-black font-black">
                                   {i === 0 ? '₹' + parseFloat(receiptPreviewData.amount).toLocaleString() : ''}
                                </td>
                             </tr>
                          ))}
                          <tr>
                             <td colSpan={2} className="border border-[#e11d48] text-right px-4 py-2 font-black uppercase">Total Fees</td>
                             <td className="border border-[#e11d48] text-right px-3 py-2 text-black font-black">₹{parseFloat(receiptPreviewData.amount).toLocaleString()}</td>
                          </tr>
                       </tbody>
                    </table>
                    
                    <div className="mt-8 space-y-4 font-bold text-[14px]">
                        <div className="flex gap-10">
                             <div className="flex-1 flex items-baseline gap-2">
                                 <span>Amount In Words Rs:</span>
                                 <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{numberToWords(parseFloat(receiptPreviewData.amount))}</span>
                             </div>
                             <div className="flex-[0.6] flex items-baseline gap-2">
                                 <span>Cash/D.D. No :</span>
                                 <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black uppercase">{receiptPreviewData.utrId || receiptPreviewData.id || 'N/A'}</span>
                             </div>
                         </div>
                        <div className="flex gap-10 mt-6">
                           <div className="flex-1 flex items-baseline gap-2">
                              <span>Bank :</span>
                              <span className="flex-1 border-b border-dotted border-[#e11d48] text-black font-black">{receiptPreviewData.paymentMethod || (receiptPreviewData.type === 'Online' ? 'Online Transfer/UPI' : (receiptPreviewData.type || 'N/A'))}</span>
                           </div>
                           <div className="flex-[1.5] flex items-baseline gap-2">
                              <span className="font-bold text-slate-700 whitespace-nowrap">Accountant/Authorized Sign :</span>
                              <span className="flex-1 border-b border-dotted border-[#e11d48]"></span>
                           </div>
                        </div>
                    </div>
                    
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center -rotate-[35deg] text-8xl font-black pointer-events-none whitespace-nowrap opacity-[0.05]" style={{ color: '#e11d48' }}>
                       MAHALAXMI INSTITUTE
                    </div>
                    <div className="border-t-2 border-[#e11d48] mt-8"></div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Student Portal...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
