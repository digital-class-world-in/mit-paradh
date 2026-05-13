'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { User, UserPlus, X, FileText, MapPin, Users, Tag, GraduationCap, Briefcase, Landmark, History, CheckCircle2, Mail, Phone, Calendar, Eye, EyeOff, Trash2, Image as ImageIcon, Download, Lock } from 'lucide-react';
import { remove, update } from 'firebase/database';

export default function StudentRegistrationManager({ collegeId }: { collegeId?: string }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [fullUserData, setFullUserData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!realtimeDb || Object.keys(realtimeDb).length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Fetch colleges for filtering (Admin only)
      if (!collegeId) {
        const collegesRef = ref(realtimeDb, 'colleges');
        onValue(collegesRef, (snap) => {
          if (snap.exists()) {
            setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
          }
        });
      }

      const usersRef = ref(realtimeDb, 'users');
      const unsub = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lockedProfs = Object.entries(data)
            .filter(([_, user]: [string, any]) => user.profile?.profileLocked === true)
            .map(([id, user]: [string, any]) => {
              // Check if they have applied to any college
              const appList = user.applications ? Object.values(user.applications) : [];
              const appliedColleges = appList.map((a: any) => a.collegeId);
              
              return {
                id,
                ...user.profile,
                email: user.email,
                password: user.password,
                regNo: user.regNo || 'PENDING',
                appliedColleges
              };
            });

          // If collegeId is provided, only show students who applied to this college
          if (collegeId) {
            setRegistrations(lockedProfs.filter(reg => reg.appliedColleges?.includes(collegeId)));
          } else {
            setRegistrations(lockedProfs);
          }
        } else {
          setRegistrations([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Realtime DB Error:', error);
        setLoading(false);
      });
      return () => unsub();
    } catch (err) {
      console.error('Error setting up registrations listener:', err);
      setLoading(false);
    }
  }, [collegeId]);

  const filteredRegistrations = collegeId 
    ? registrations 
    : registrations.filter(reg => !selectedCollegeId || reg.appliedColleges?.includes(selectedCollegeId));

  const handleViewDetails = async (regId: string) => {
    setLoading(true);
    try {
      const userRef = ref(realtimeDb, `users/${regId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        setFullUserData(snap.val());
        setSelectedReg(registrations.find(r => r.id === regId));
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching full user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (regId: string) => {
    if (!window.confirm("Are you sure you want to delete this student registration? This action cannot be undone.")) return;
    
    try {
      // We don't actually delete the user usually in ERP, we might just mark as deleted or remove the profile status
      // But user asked for "delete button", so let's remove the registration from the list by unlocking or removing status
      const userRef = ref(realtimeDb, `users/${regId}/profile`);
      await update(userRef, { 
        profileLocked: false,
        status: 'Deleted' // or just remove it
      });
      alert("Registration removed from processing list.");
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete registration.");
    }
  };

  const openImagePreview = (url: string, title: string) => {
    setPreviewImage({ url, title });
    setIsPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-black rounded-full" />
          <div className="w-12 h-12 border-4 border-t-[#00a5a5] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-normal capitalize tracking-normal text-black animate-pulse">Loading Registrations</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {!collegeId && (
        <div className="bg-[#003366] text-white py-6 px-10 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-6">
             <select 
               value={selectedCollegeId}
               onChange={(e) => setSelectedCollegeId(e.target.value)}
               className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[14px] font-medium capitalize tracking-tight text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
             >
                <option value="" className="text-black">Filter by College</option>
                {availableColleges.map(c => (
                  <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                ))}
             </select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-black shadow-xl p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50/50 border-b border-r border-black">
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black text-center w-16">Sr No.</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black">Applicant Details</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black">Login Credentials</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal text-center border-r border-black">Status</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal text-right border-r border-black">Actions</th>
              </tr>
            </thead>
            <tbody className="border-b border-black">
              {filteredRegistrations.length > 0 ? filteredRegistrations.map((reg, index) => (
                <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors border-b border-black">
                  <td className="px-4 py-6 border-r border-black text-center text-[14px] font-medium text-black">
                    {index + 1}
                  </td>
                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-black overflow-hidden">
                        {reg.photoUrl ? (
                          <img src={reg.photoUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-normal text-black  tracking-tight ">{reg.firstName} {reg.lastName}</p>
                        <p className="text-[13px] font-medium text-black mt-0.5">REG ID: {reg.regNo}</p>
                        <p className="text-[11px] font-bold text-[#00a5a5] mt-0.5">PH: {reg.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6 border-r border-black">
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Mail size={10} /> {reg.email}
                      </p>
                      <p className="text-[11px] font-mono font-bold text-[#003366] flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 w-fit">
                        <Lock size={10} /> {reg.password || '********'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-semibold border border-emerald-100  tracking-tight">
                      SUBMITTED
                    </span>
                  </td>
                  <td className="px-4 py-6 border-r border-black text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleViewDetails(reg.id)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                        title="Preview Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRegistration(reg.id)}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Delete Registration"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center gap-4 text-slate-300">
                        <UserPlus size={48} className="opacity-20" />
                        <p className="text-xs font-medium  tracking-tight">No locked registrations found</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {isDetailsModalOpen && fullUserData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)} />
          <div className="bg-[#f8fafc] w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="bg-[#003366] p-8 text-white relative shrink-0">
               <button 
                 onClick={() => setIsDetailsModalOpen(false)}
                 className="absolute right-8 top-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
               >
                 <X size={24} />
               </button>
               
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl">
                    {fullUserData.profile?.photoUrl ? (
                      <img src={fullUserData.profile.photoUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">
                        {fullUserData.profile?.firstName} {fullUserData.profile?.lastName}
                      </h3>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black capitalize tracking-tight border border-emerald-500/30">
                        Profile Locked
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-white/60">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Login Email</span>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                          <Mail size={12} className="text-[#00a5a5]" />
                          <input 
                            type="text"
                            value={fullUserData.email || ''} 
                            onChange={(e) => setFullUserData({...fullUserData, email: e.target.value})}
                            className="bg-transparent border-none outline-none text-[13px] font-medium text-white/80 w-48"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Login Password</span>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 group">
                          <Lock size={12} className="text-[#00a5a5]" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={fullUserData.password || ''} 
                            onChange={(e) => setFullUserData({...fullUserData, password: e.target.value})}
                            className="bg-transparent border-none outline-none text-[13px] font-medium text-white/80 w-32"
                          />
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Contact Phone</span>
                        <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                          <Phone size={12} className="text-[#00a5a5]" /> {fullUserData.profile?.phone || 'No Phone'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Registration No</span>
                        <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                          <Calendar size={12} className="text-[#00a5a5]" /> {fullUserData.regNo}
                        </p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              
              {/* Grid for Primary Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Personal Information */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <User size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Personal Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Full Name" value={`${fullUserData.profile?.firstName} ${fullUserData.profile?.middleName || ''} ${fullUserData.profile?.lastName}`} />
                    <DetailItem label="Gender" value={fullUserData.profile?.gender} />
                    <DetailItem label="Date of Birth" value={fullUserData.profile?.dateOfBirth} />
                    <DetailItem label="Marital Status" value={fullUserData.profile?.maritalStatus} />
                    <DetailItem label="Blood Group" value={fullUserData.profile?.bloodGroup} />
                    <DetailItem label="Religion" value={fullUserData.profile?.religion} />
                    <DetailItem label="Aadhaar Number" value={fullUserData.profile?.aadhaarNo} />
                  </div>
                </section>

                {/* Parent Details */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                      <Users size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Parent Details</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <DetailItem label="Father Name" value={`${fullUserData.profile?.fatherFirstName} ${fullUserData.profile?.fatherLastName}`} />
                      <DetailItem label="Father Phone" value={fullUserData.profile?.fatherPhone} />
                      <DetailItem label="Mother Name" value={`${fullUserData.profile?.motherFirstName} ${fullUserData.profile?.motherLastName}`} />
                      <DetailItem label="Mother Phone" value={fullUserData.profile?.motherPhone} />
                    </div>
                  </div>
                </section>

                {/* Address Information */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <MapPin size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Address Details</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailItem label="Residential Address" value={fullUserData.profile?.address} />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <DetailItem label="State" value={fullUserData.profile?.state} />
                      <DetailItem label="District" value={fullUserData.profile?.district} />
                      <DetailItem label="Taluka" value={fullUserData.profile?.taluka} />
                      <DetailItem label="Pincode" value={fullUserData.profile?.pincode} />
                    </div>
                  </div>
                </section>

                {/* Category & Caste */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                      <Tag size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Category & Caste</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Category" value={fullUserData.profile?.category} />
                    <DetailItem label="Caste" value={fullUserData.profile?.caste} />
                    <DetailItem label="Physically Handicapped" value={fullUserData.profile?.isPhysicallyHandicapped} />
                    {fullUserData.profile?.disabilityType && (
                      <DetailItem label="Disability Type" value={fullUserData.profile?.disabilityType} />
                    )}
                  </div>
                </section>
              </div>

              {/* Educational Qualifications */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Educational Qualifications</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[13px] font-normal text-black capitalize tracking-tight">
                        <th className="px-4 py-3 rounded-l-xl">Exam</th>
                        <th className="px-4 py-3">Board/University</th>
                        <th className="px-4 py-3">Result</th>
                        <th className="px-4 py-3">Passing Date</th>
                        <th className="px-4 py-3 text-right">Marks/Percentage</th>
                        <th className="px-4 py-3 rounded-r-xl text-center">Marksheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(fullUserData.qualifications || []).map((q: any, i: number) => (
                        <tr key={i} className="text-xs font-normal text-slate-600">
                          <td className="px-4 py-4 capitalize">{q.examination}</td>
                          <td className="px-4 py-4 capitalize">{q.board}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded ${q.result === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {q.result}
                            </span>
                          </td>
                          <td className="px-4 py-4">{q.passingDate}</td>
                          <td className="px-4 py-4 text-right">
                            {q.marksObtained}/{q.outOfMarks} ({q.percentage}%)
                          </td>
                          <td className="px-4 py-4 flex justify-center">
                            {q.marksheetUrl ? (
                               <PreviewButton label="View" onClick={() => openImagePreview(q.marksheetUrl, `${q.examination} Marksheet`)} />
                            ) : (
                               <span className="text-[13px] text-black">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Work Experience */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                      <Briefcase size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Work Experience</h4>
                  </div>
                  <div className="space-y-4">
                    {fullUserData.profile?.hasWorkExperience === 'Yes' && (fullUserData.workExperiences || []).length > 0 ? (
                      (fullUserData.workExperiences || []).map((exp: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-black">
                          <p className="text-xs font-normal text-slate-800 capitalize">{exp.organization}</p>
                          <p className="text-[13px] font-normal text-black capitalize mt-1">{exp.designation}</p>
                          <p className="text-[9px] font-bold text-[#00a5a5] mt-1">{exp.fromDate} - {exp.toDate}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] font-normal text-black capitalize tracking-tight text-center py-4">No Work Experience Recorded</p>
                    )}
                  </div>
                  {/* Training Section */}
                  {fullUserData.profile?.hasTraining === 'Yes' && (
                    <div className="pt-6 border-t border-black space-y-4">
                       <h4 className="text-[13px] font-normal text-black capitalize tracking-tight">Vocational Training</h4>
                       <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">Training Period</p>
                            <p className="text-[13px] text-black font-normal">{fullUserData.profile.trainingStartDate} to {fullUserData.profile.trainingEndDate}</p>
                          </div>
                        </div>
                    </div>
                  )}
                </section>

                {/* Bank Details */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-500">
                      <Landmark size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Bank Details</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-y-4">
                    <DetailItem label="Bank Name" value={fullUserData.bankDetails?.bankName} />
                    <DetailItem label="Account Number" value={fullUserData.bankDetails?.accountNumber} />
                    <DetailItem label="IFSC Code" value={fullUserData.bankDetails?.ifscCode} />
                    <DetailItem label="Branch Name" value={fullUserData.bankDetails?.branchName} />
                    <DetailItem label="PAN Card No" value={fullUserData.profile?.panCardNo} />
                  </div>
                </section>
              </div>

              {/* Uploaded Documents Section */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">All Uploaded Documents</h4>
                </div>
                <div className="flex flex-wrap gap-4">
                  {fullUserData.profile?.photoUrl && (
                    <PreviewButton label="Student Photo" onClick={() => openImagePreview(fullUserData.profile.photoUrl, "Student Photo")} />
                  )}
                  {fullUserData.profile?.signUrl && (
                    <PreviewButton label="Signature" onClick={() => openImagePreview(fullUserData.profile.signUrl, "Student Signature")} />
                  )}
                  {fullUserData.profile?.aadhaarFrontUrl && (
                    <PreviewButton label="Aadhaar Front" onClick={() => openImagePreview(fullUserData.profile.aadhaarFrontUrl, "Aadhaar Card Front")} />
                  )}
                  {fullUserData.profile?.aadhaarBackUrl && (
                    <PreviewButton label="Aadhaar Back" onClick={() => openImagePreview(fullUserData.profile.aadhaarBackUrl, "Aadhaar Card Back")} />
                  )}
                  {fullUserData.profile?.casteCertificateUrl && (
                    <PreviewButton label="Caste Certificate" onClick={() => openImagePreview(fullUserData.profile.casteCertificateUrl, "Caste Certificate")} />
                  )}
                  {fullUserData.profile?.domicileUrl && (
                    <PreviewButton label="Domicile Certificate" onClick={() => openImagePreview(fullUserData.profile.domicileUrl, "Domicile Certificate")} />
                  )}
                  {fullUserData.profile?.pwdCertificateUrl && (
                    <PreviewButton label="PWD Certificate" onClick={() => openImagePreview(fullUserData.profile.pwdCertificateUrl, "PWD Certificate")} />
                  )}
                  {fullUserData.profile?.trainingCertificateUrl && (
                    <PreviewButton label="Training Certificate" onClick={() => openImagePreview(fullUserData.profile.trainingCertificateUrl, "Training Certificate")} />
                  )}
                  {fullUserData.profile?.bankPassbookUrl && (
                    <PreviewButton label="Bank Passbook/Cheque" onClick={() => openImagePreview(fullUserData.profile.bankPassbookUrl, "Bank Document")} />
                  )}
                  {fullUserData.profile?.panCardUrl && (
                    <PreviewButton label="PAN Card" onClick={() => openImagePreview(fullUserData.profile.panCardUrl, "PAN Card")} />
                  )}
                  {(fullUserData.qualifications || []).map((q: any, i: number) => 
                    q.marksheetUrl ? (
                      <PreviewButton key={i} label={`${q.examination} Marksheet`} onClick={() => openImagePreview(q.marksheetUrl, `${q.examination} Marksheet`)} />
                    ) : null
                  )}
                </div>
                {(!fullUserData.profile?.photoUrl && !fullUserData.profile?.signUrl && !fullUserData.profile?.aadhaarFrontUrl && !fullUserData.profile?.aadhaarBackUrl && !fullUserData.profile?.bankPassbookUrl) && (
                   <p className="text-[13px] font-normal text-black capitalize tracking-tight text-center w-full py-4">No Documents Uploaded</p>
                )}
              </section>

            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white border-t border-black flex items-center justify-end shrink-0 gap-4">
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 capitalize tracking-tight hover:bg-slate-100 transition-all border border-black"
                >
                  Close View
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const userRef = ref(realtimeDb, `users/${selectedReg.id}`);
                      await update(userRef, {
                        email: fullUserData.email,
                        password: fullUserData.password
                      });
                      alert('Student credentials updated successfully.');
                      setIsDetailsModalOpen(false);
                    } catch (err) {
                      console.error(err);
                      alert('Failed to update student data.');
                    }
                  }}
                  className="bg-[#003366] hover:bg-black text-white font-black px-12 py-4 rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-xl flex items-center gap-3"
                >
                  Update Information
                </button>
            </div>

          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {isPreviewOpen && previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsPreviewOpen(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-white border-b border-black flex items-center justify-between">
              <h5 className="font-normal text-[#003366] capitalize tracking-tight text-sm flex items-center gap-2">
                <ImageIcon size={18} className="text-[#00a5a5]" /> {previewImage.title}
              </h5>
              <div className="flex gap-3">
                <a 
                  href={previewImage.url} 
                  download={`${previewImage.title.replace(/\s+/g, '_')}.png`}
                  className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all"
                  title="Download Image"
                >
                  <Download size={20} />
                </a>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              <img 
                src={previewImage.url} 
                alt={previewImage.title} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 capitalize tracking-tight mb-1">{label}</p>
      <p className="text-xs font-normal text-slate-700 capitalize tracking-tight break-words">{value || 'N/A'}</p>
    </div>
  );
}

function PreviewButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-black rounded-xl text-[13px] font-normal text-black capitalize tracking-tight hover:bg-[#00a5a5] hover:text-black hover:border-[#00a5a5] transition-all shadow-sm active:scale-95 group"
    >
      <Eye size={12} className="text-[#00a5a5] group-hover:text-white" /> {label}
    </button>
  );
}






