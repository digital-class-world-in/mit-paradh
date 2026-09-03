import { useState, useRef } from 'react';
import { Download, ShieldCheck, Clock, AlertCircle, Building2, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { formatAutoRegNo } from '@/lib/formatUtils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StudentIDCardProps {
  userData: any;
  activeApp?: any;
  userApplications?: any[];
}

export default function StudentIDCard({ userData, activeApp, userApplications }: StudentIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    window.print();
  };

  if (!userData) {
    return <div className="p-10 text-center">Loading ID Card data...</div>;
  }

  const profile = userData.profile || {};
  const app = activeApp || {};

  // Check whether the college has approved/confirmed the student's admission
  const isApproved = Boolean(
    (activeApp && (
      activeApp.status === 'Accepted' || 
      activeApp.status === 'Confirmed' || 
      activeApp.status === 'Approved' || 
      activeApp.status === 'Verified' ||
      activeApp.admissionStatus === 'Accepted' || 
      activeApp.admissionStatus === 'Confirmed' ||
      activeApp.admissionStatus === 'Approved'
    )) ||
    userApplications?.some((a: any) => 
      a.status === 'Accepted' || 
      a.status === 'Confirmed' || 
      a.status === 'Approved' || 
      a.status === 'Verified' ||
      a.admissionStatus === 'Accepted' || 
      a.admissionStatus === 'Confirmed' ||
      a.admissionStatus === 'Approved'
    ) ||
    userData?.status === 'Accepted' || 
    userData?.status === 'Confirmed' ||
    userData?.status === 'Approved' ||
    userData?.profile?.status === 'Accepted' ||
    userData?.profile?.status === 'Confirmed' ||
    userData?.profile?.status === 'Approved' ||
    userData?.profile?.admissionStatus === 'Accepted'
  );

  // If admission is not approved by the college, do not show ID card or print button
  if (!isApproved) {
    const isRejected = Boolean(
      (activeApp && (activeApp.status === 'Rejected' || activeApp.admissionStatus === 'Rejected')) ||
      userApplications?.some((a: any) => a.status === 'Rejected' || a.admissionStatus === 'Rejected')
    );

    const rejectionRemark = activeApp?.remarks || activeApp?.rejectionReason || userApplications?.find((a: any) => a.remarks)?.remarks;
    const collegeName = activeApp?.collegeName || userData?.collegeName || userData?.profile?.collegeName || 'College Administration';
    const courseName = activeApp?.courseName || profile?.courseName;
    const streamName = activeApp?.stream || activeApp?.branch || activeApp?.streamBranch || profile?.stream;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#002147] tracking-tighter uppercase flex items-center gap-2">
              <ShieldAlert className={isRejected ? "text-rose-500" : "text-amber-500"} /> Official Student ID Card
            </h2>
            <p className="text-xs sm:text-[12px] font-medium text-slate-500 mt-1">Digital Identity Card for the current academic session.</p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 w-fit",
            isRejected ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
          )}>
            {isRejected ? <AlertCircle size={15} /> : <Clock size={15} className="animate-spin [animation-duration:4s]" />}
            {isRejected ? "Admission Not Approved" : "Pending College Approval"}
          </div>
        </div>

        {/* Informative message container */}
        <div className="bg-white/80 backdrop-blur-md p-5 sm:p-14 rounded-2xl sm:rounded-3xl border-2 border-slate-200/80 shadow-xl text-center space-y-6 sm:space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#002147]/5 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Status Icon */}
            <div className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-xl mb-4 sm:mb-6 relative",
              isRejected ? "bg-rose-50 text-rose-600 border-2 border-rose-100" : "bg-amber-50 text-amber-600 border-2 border-amber-100"
            )}>
              <div className={cn(
                "absolute inset-0 rounded-2xl sm:rounded-3xl animate-pulse",
                isRejected ? "bg-rose-500/10" : "bg-amber-500/10"
              )} />
              {isRejected ? (
                <ShieldAlert size={40} className="relative z-10" />
              ) : (
                <Clock size={40} className="relative z-10 animate-spin [animation-duration:8s]" />
              )}
            </div>

            {/* Main Headings */}
            <div className="space-y-2 sm:space-y-3 max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-3xl font-black text-[#002147] tracking-tight">
                {isRejected 
                  ? "Admission Application Not Approved" 
                  : "Your College Has Still Not Approved Your Admission"}
              </h3>
              <p className="text-xs sm:text-base text-slate-500 font-medium leading-relaxed">
                {isRejected
                  ? "Your admission application was reviewed and not approved by the college administration. Your official Student ID Card cannot be issued."
                  : "Your admission application is currently under review by the college administration. Your official Student ID Card will be automatically available to view and download here once the college approves your admission."}
              </p>
            </div>

            {/* Rejection Remark if available */}
            {isRejected && rejectionRemark && (
              <div className="mt-6 max-w-lg mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-left">
                <span className="font-black uppercase tracking-wider block text-rose-600 mb-1">Reason from College:</span>
                {rejectionRemark}
              </div>
            )}

            {/* Application Details Summary */}
            <div className="mt-6 sm:mt-8 max-w-lg mx-auto bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 text-left space-y-2.5 sm:space-y-3 shadow-inner">
              <div className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1 sm:mb-2">
                Admission Application Summary
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Institution / College:</span>
                <span className="text-slate-800 font-bold text-right max-w-[200px] sm:max-w-[240px] truncate">{collegeName}</span>
              </div>
              {courseName && (
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Course:</span>
                  <span className="text-slate-800 font-bold uppercase">{courseName}</span>
                </div>
              )}
              {streamName && (
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Stream / Branch:</span>
                  <span className="text-slate-800 font-bold uppercase">{streamName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500 font-medium">Admission Status:</span>
                <span className={cn(
                  "font-black uppercase px-2.5 py-0.5 rounded-full text-[10px]",
                  isRejected ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                )}>
                  {activeApp?.status || activeApp?.admissionStatus || (isRejected ? 'Rejected' : 'Pending College Approval')}
                </span>
              </div>
            </div>

            {/* Support Note */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200/80 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium text-center">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              <span>For urgent admission inquiries, please reach out to your college administrative office.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#002147] tracking-tighter uppercase flex items-center gap-2">
            <ShieldCheck className="text-teal-500" /> Official ID Card
          </h2>
          <p className="text-xs sm:text-[12px] font-medium text-slate-500 mt-1">Digital Identity Card for the current academic session.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#002147] text-white rounded-xl font-bold text-xs sm:text-[13px] uppercase tracking-widest shadow-lg hover:bg-[#00a5a5] transition-all active:scale-95 w-full sm:w-fit"
        >
          <Download size={16} /> Print ID Card
        </button>
      </div>

      <div className="flex justify-center py-6 sm:py-10 overflow-x-auto" id="id-card-print-area">
        {/* ID Card Front */}
        <div ref={cardRef} className="w-[54mm] h-[86mm] bg-white border border-slate-300 rounded-lg shadow-xl relative overflow-hidden flex flex-col items-center print:shadow-none print:border-black shrink-0" style={{ transformOrigin: 'top center', transform: 'scale(1.2)' }}>
          {/* Header */}
          <div className="w-full bg-[#003366] text-white p-2 flex flex-col items-center justify-center shrink-0 border-b-4 border-[#ff9f1c]">
            <h3 className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">
              {app.collegeName || userData?.collegeName || 'Mahalaxmi Nursing and technical institute Paradh'}
            </h3>
            <p className="text-[5px] uppercase tracking-widest mt-0.5 opacity-80 text-center leading-none">
              Recognized by Govt. of India
            </p>
          </div>
          
          {/* Photo */}
          <div className="mt-3 w-16 h-20 border-2 border-[#003366] rounded-md overflow-hidden bg-slate-100 flex items-center justify-center relative shrink-0">
            {profile.photoUrl || profile.photo || userData.photo ? (
              <img src={profile.photoUrl || profile.photo || userData.photo} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[8px] text-slate-400">No Photo</span>
            )}
            <div className="absolute bottom-0 w-full bg-[#003366]/80 text-white text-center text-[5px] py-0.5 font-bold uppercase backdrop-blur-sm">
              Valid: 2026-27
            </div>
          </div>

          {/* Details */}
          <div className="w-full px-3 pt-3 flex-1 flex flex-col items-center">
            <h4 className="text-[11px] font-black text-black uppercase text-center mb-1 leading-tight w-full truncate">
              {userData.fullName || userData.studentName || `${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`.trim() || 'Student'}
            </h4>
            
            <div className="w-full space-y-1 mt-1">
              <div className="flex items-center text-[7.5px] leading-tight">
                <span className="font-bold w-12 text-[#003366] shrink-0">Course:</span>
                <span className="font-semibold text-black uppercase truncate">{app.courseName || profile.courseName || 'N/A'}</span>
              </div>
              {(app.stream || app.branch || app.streamBranch) && (
                <div className="flex items-center text-[7.5px] leading-tight">
                  <span className="font-bold w-12 text-[#003366] shrink-0">Stream:</span>
                  <span className="font-semibold text-black uppercase truncate">{app.stream || app.branch || app.streamBranch}</span>
                </div>
              )}
              <div className="flex items-center text-[7.5px] leading-tight">
                <span className="font-bold w-12 text-[#003366] shrink-0">Auto Reg:</span>
                <span className="font-semibold text-red-600 uppercase truncate">
                  {userData.regNo ? formatAutoRegNo(userData.regNo) : 'PENDING'}
                </span>
              </div>
              {(userData.manualRegNo || profile.manualRegNo) && (
                <div className="flex items-center text-[7.5px] leading-tight">
                  <span className="font-bold w-12 text-[#003366] shrink-0">Manual Reg:</span>
                  <span className="font-semibold text-red-600 uppercase truncate">
                    {userData.manualRegNo || profile.manualRegNo}
                  </span>
                </div>
              )}
              <div className="flex items-center text-[7.5px] leading-tight">
                <span className="font-bold w-12 text-[#003366] shrink-0">Phone:</span>
                <span className="font-semibold text-black uppercase truncate">{profile.phone || profile.mobileNumber || profile.mobileNo || userData.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-[7.5px] leading-tight">
                <span className="font-bold w-12 text-[#003366] shrink-0">DOB:</span>
                <span className="font-semibold text-black uppercase">{profile.dateOfBirth || 'N/A'}</span>
              </div>
              <div className="flex items-center text-[7.5px] leading-tight">
                <span className="font-bold w-12 text-[#003366] shrink-0">Blood:</span>
                <span className="font-semibold text-red-600 font-black">{profile.bloodGroup || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full p-2 bg-slate-50 border-t border-slate-200 mt-auto flex items-end justify-between shrink-0">
            <div className="h-6 w-12 flex items-center justify-center">
               {profile.signatureUrl || profile.signUrl ? (
                 <img src={profile.signatureUrl || profile.signUrl} alt="Sign" className="max-h-full max-w-full object-contain mix-blend-multiply" />
               ) : (
                 <div className="w-full border-b border-black"></div>
               )}
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 border-b border-black mb-1"></div>
              <span className="text-[5px] font-bold text-slate-500 uppercase tracking-tight">Principal Sign</span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card-print-area, #id-card-print-area * {
            visibility: visible;
          }
          #id-card-print-area {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
