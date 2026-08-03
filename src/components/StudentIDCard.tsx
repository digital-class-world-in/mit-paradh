import { useState, useRef } from 'react';
import { Download, FileBadge, ShieldCheck } from 'lucide-react';

import { formatAutoRegNo } from '@/lib/formatUtils';

export default function StudentIDCard({ userData, activeApp }: { userData: any, activeApp?: any }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    window.print();
  };

  if (!userData) {
    return <div className="p-10 text-center">Loading ID Card data...</div>;
  }

  const profile = userData.profile || {};
  const app = activeApp || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-[#002147] tracking-tighter uppercase flex items-center gap-2">
            <ShieldCheck className="text-teal-500" /> Official ID Card
          </h2>
          <p className="text-[12px] font-medium text-slate-500 mt-1">Digital Identity Card for the current academic session.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-[#002147] text-white rounded-xl font-bold text-[13px] uppercase tracking-widest shadow-lg hover:bg-[#00a5a5] transition-all"
        >
          <Download size={16} /> Print ID Card
        </button>
      </div>

      <div className="flex justify-center py-10" id="id-card-print-area">
        {/* ID Card Front */}
        <div ref={cardRef} className="w-[54mm] h-[86mm] bg-white border border-slate-300 rounded-lg shadow-xl relative overflow-hidden flex flex-col items-center print:shadow-none print:border-black shrink-0" style={{ transformOrigin: 'top center', transform: 'scale(1.2)' }}>
          {/* Header */}
          <div className="w-full bg-[#003366] text-white p-2 flex flex-col items-center justify-center shrink-0 border-b-4 border-[#ff9f1c]">
            <h3 className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">
              Mahalaxmi Nursing and technical institute Paradh
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
              <div className="flex items-center text-[7.5px] leading-tight">
                <span className="font-bold w-12 text-[#003366] shrink-0">Reg No:</span>
                <span className="font-semibold text-red-600 uppercase truncate">
                  {userData.manualRegNo || profile.manualRegNo ? `${userData.manualRegNo || profile.manualRegNo} / ` : ''}
                  {userData.regNo ? formatAutoRegNo(userData.regNo) : 'PENDING'}
                </span>
              </div>
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
