'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove, get, push, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Users, Edit2, Trash2, X, Save, Clock, User, Mail, Lock, Phone, Unlock, ShieldCheck, Eye, CheckCircle2, XCircle, MapPin, Tag, GraduationCap, Briefcase, Landmark, Calendar, Image as ImageIcon, Download, Loader2 } from 'lucide-react';

const EditField = ({ label, value, onChange, type = "text", placeholder = "", readOnly = false }: any) => (
  <div className="space-y-2">
     <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
     <input 
       type={type} 
       placeholder={placeholder}
       value={value || ''} 
       readOnly={readOnly}
       onChange={(e) => !readOnly && onChange(e.target.value)} 
       className={`w-full ${readOnly ? 'bg-slate-100' : 'bg-white'} border-2 border-black rounded-2xl p-4 text-[15px] font-bold text-black outline-none ${!readOnly && 'focus:bg-slate-50'} transition-all shadow-sm`} 
     />
  </div>
);

const EditSelect = ({ label, value, onChange, options }: any) => (
  <div className="space-y-2">
     <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
     <select 
       value={value || ''} 
       onChange={(e) => onChange(e.target.value)} 
       className="w-full bg-white border-2 border-black rounded-2xl p-4 text-[15px] font-bold text-black outline-none focus:bg-slate-50 transition-all shadow-sm appearance-none cursor-pointer" 
     >
       <option value="">Select {label}</option>
       {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
     </select>
  </div>
);

const DocUpload = ({ label, value, onFile, onPreview }: any) => (
  <div className="space-y-3 p-6 bg-white border-2 border-black rounded-[2rem] shadow-sm hover:shadow-md transition-all">
     <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-black uppercase tracking-widest">{label}</label>
        {value && (
          <button type="button" onClick={onPreview} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
             <Eye size={14} />
          </button>
        )}
     </div>
     <div className="relative group">
        <div className="absolute inset-0 bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 group-hover:border-black transition-all">
           {value ? (
             <div className="w-full h-24 overflow-hidden rounded-xl">
               <img src={value} className="w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <ImageIcon size={24} className="text-black" />
                  <span className="text-[10px] font-black uppercase text-black">Replace File</span>
               </div>
             </div>
           ) : (
             <>
               <Download size={24} className="text-slate-300 mb-2" />
               <span className="text-[10px] font-black uppercase text-slate-400">Click to Upload</span>
             </>
           )}
        </div>
        <input 
          type="file" 
          accept="image/*"
          onChange={onFile}
          className="relative z-10 w-full h-24 opacity-0 cursor-pointer" 
        />
     </div>
  </div>
);

export default function StudentAdmissionManager({ collegeId }: { collegeId: string | undefined }) {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  useEffect(() => {
    if (!realtimeDb) {
      setLoading(false);
      return;
    }

    // Fetch colleges for filtering
    const collegesRef = ref(realtimeDb, 'colleges');
    const unsubColleges = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      }
    });

    if (collegeId) {
      const refDB = ref(realtimeDb, `colleges/${collegeId}/studentAdmissions`);
      const unsub = onValue(refDB, (snap) => {
        if (snap.exists()) {
          const sortedAdms = Object.entries(snap.val())
            .map(([id, val]: any) => ({ ...val, id, collegeId }))
            .sort((a, b) => new Date(b.admissionDate || 0).getTime() - new Date(a.admissionDate || 0).getTime());
          setAdmissions(sortedAdms);
        } else {
          setAdmissions([]);
        }
        setLoading(false);
      });
      return () => { unsub(); unsubColleges(); };
    } else {
      // Global View for Admin
      const allCollegesRef = ref(realtimeDb, 'colleges');
      const unsub = onValue(allCollegesRef, (snap) => {
        if (snap.exists()) {
          const colleges = snap.val();
          let allAdmissions: any[] = [];
          Object.entries(colleges).forEach(([cId, cData]: [string, any]) => {
            if (cData.studentAdmissions) {
              const adms = Object.entries(cData.studentAdmissions).map(([id, val]: any) => ({ 
                ...(val || {}),
                id, 
                collegeId: cId, 
                collegeName: cData?.name 
              }));
              allAdmissions = [...allAdmissions, ...adms];
            }
          });
          setAdmissions(allAdmissions.sort((a, b) => new Date(b.admissionDate || 0).getTime() - new Date(a.admissionDate || 0).getTime()));
        } else {
          setAdmissions([]);
        }
        setLoading(false);
      });
      return () => { unsub(); unsubColleges(); };
    }
  }, [collegeId]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState<any>({});
  
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processingStudent, setProcessingStudent] = useState<any>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

  const openImagePreview = (url: string, title: string) => {
    setPreviewImage({ url, title });
    setIsPreviewOpen(true);
  };

  const handleProcessOpen = (student: any) => {
    setProcessingStudent(student);
    setIsProcessModalOpen(true);
  };

  const handleAcceptAdmission = async () => {
    if (!processingStudent) return;
    if (!window.confirm("Are you sure you want to accept this admission?")) return;
    
    setIsSubmitting(true);
    try {
      const admissionRef = ref(realtimeDb, `colleges/${processingStudent.collegeId}/studentAdmissions/${processingStudent.id}/admissionStatus`);
      await set(admissionRef, 'Confirmed');
      alert('Admission Confirmed successfully.');
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error('Error accepting admission:', error);
      alert('Failed to accept admission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAdmission = async () => {
    if (!processingStudent) return;
    if (!window.confirm("Are you sure you want to reject this admission? This will move the application to the trash module.")) return;
    
    setIsSubmitting(true);
    try {
      const admissionRef = ref(realtimeDb, `colleges/${processingStudent.collegeId}/studentAdmissions/${processingStudent.id}`);
      const adminTrashRef = push(ref(realtimeDb, `admin/trash`));
      
      await set(adminTrashRef, {
        type: 'Student Admission',
        data: processingStudent,
        originalId: processingStudent.id,
        collegeId: processingStudent.collegeId,
        deletedAt: Date.now(),
        metadata: `${processingStudent.studentName} (${processingStudent.courseName})`
      });

      await remove(admissionRef);
      alert('Admission Rejected and moved to Global Trash Bin.');
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error('Error rejecting admission:', error);
      alert('Failed to reject admission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (student: any) => {
    if (!window.confirm(`Are you sure you want to delete ${student.studentName}? The record will be moved to the trash bin.`)) return;
    
    try {
      const adminTrashRef = push(ref(realtimeDb, `admin/trash`));
      await set(adminTrashRef, {
        type: 'Student Admission',
        data: student,
        originalId: student.id,
        collegeId: student.collegeId,
        deletedAt: Date.now(),
        metadata: `${student.studentName} (${student.courseName})`
      });

      const admissionRef = ref(realtimeDb, `colleges/${student.collegeId}/studentAdmissions/${student.id}`);
      await remove(admissionRef);
      
      const uid = student.studentUid || student.uid || student.profileData?.uid;
      const appId = student.applicationId;

      if (uid) {
        const userProfileRef = ref(realtimeDb, `users/${uid}/profile`);
        await update(userProfileRef, {
          profileLocked: false,
          course: 'Not Selected',
          status: 'In Progress'
        });

        await update(ref(realtimeDb, `users/${uid}`), { course: 'Not Selected' });

        if (appId) {
          const userAppsRef = ref(realtimeDb, `users/${uid}/applications`);
          const snapshot = await get(userAppsRef);
          if (snapshot.exists()) {
            const apps = snapshot.val();
            for (const [key, val] of Object.entries(apps)) {
              if ((val as any).applicationId === appId) {
                await remove(ref(realtimeDb, `users/${uid}/applications/${key}`));
                break;
              }
            }
          }
        }
      }

      if (student.collegeId && student.inquiryId) {
        const sourceInqRef = ref(realtimeDb, `colleges/${student.collegeId}/frontOffice/admissionInquiries/${student.inquiryId}`);
        await remove(sourceInqRef);
      }

      alert('Student record moved to Global Trash successfully.');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student.');
    }
  };

  const handleEditOpen = (student: any) => {
    setEditingStudent(student);
    const profile = student.profileData || {};
    setStudentForm({
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      studentEmail: student.studentEmail || '',
      studentPhone: student.studentPhone || '',
      courseName: student.courseName || '',
      courseType: student.courseType || '',
      password: student.password || '',
      
      // Admission Data
      admissionDate: student.admissionDate || '',
      regNo: student.regNo || '',
      rollNumber: student.rollNumber || '',
      fees: student.fees || '',
      admissionStatus: student.admissionStatus || 'Pending',

      gender: profile.gender || '',
      dateOfBirth: profile.dateOfBirth || '',
      bloodGroup: profile.bloodGroup || '',
      religion: profile.religion || '',
      category: profile.category || '',
      caste: profile.caste || '',
      aadhaarNo: profile.aadhaarNo || '',
      panCardNo: profile.panCardNo || '',
      fatherFirstName: profile.fatherFirstName || '',
      fatherMiddleName: profile.fatherMiddleName || '',
      fatherLastName: profile.fatherLastName || '',
      fatherPhone: profile.fatherPhone || '',
      motherFirstName: profile.motherFirstName || '',
      motherMiddleName: profile.motherMiddleName || '',
      motherLastName: profile.motherLastName || '',
      motherPhone: profile.motherPhone || '',
      address: profile.address || '',
      state: profile.state || '',
      district: profile.district || '',
      taluka: profile.taluka || '',
      pincode: profile.pincode || '',
      photoUrl: profile.photoUrl || student.photo || '',
      signUrl: profile.signUrl || '',
      aadhaarFrontUrl: profile.aadhaarFrontUrl || '',
      aadhaarBackUrl: profile.aadhaarBackUrl || '',
      casteCertificateUrl: profile.casteCertificateUrl || '',
      domicileUrl: profile.domicileUrl || '',
      pwdCertificateUrl: profile.pwdCertificateUrl || '',
      bankPassbookUrl: profile.bankPassbookUrl || '',
      panCardUrl: profile.panCardUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert('File size must be less than 1MB');

    const reader = new FileReader();
    reader.onload = (event) => {
      setStudentForm((prev: any) => ({ ...prev, [fieldName]: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsSubmitting(true);
    try {
      const admissionRef = ref(realtimeDb, `colleges/${editingStudent.collegeId}/studentAdmissions/${editingStudent.id}`);
      const fullName = `${studentForm.firstName} ${studentForm.lastName}`;
      
      const profileUpdates = {
        firstName: studentForm.firstName,
        middleName: studentForm.middleName,
        lastName: studentForm.lastName,
        studentName: fullName,
        phone: studentForm.studentPhone,
        email: studentForm.studentEmail,
        gender: studentForm.gender,
        dateOfBirth: studentForm.dateOfBirth,
        bloodGroup: studentForm.bloodGroup,
        religion: studentForm.religion,
        category: studentForm.category,
        caste: studentForm.caste,
        aadhaarNo: studentForm.aadhaarNo,
        panCardNo: studentForm.panCardNo,
        fatherFirstName: studentForm.fatherFirstName,
        fatherMiddleName: studentForm.fatherMiddleName,
        fatherLastName: studentForm.fatherLastName,
        fatherPhone: studentForm.fatherPhone,
        motherFirstName: studentForm.motherFirstName,
        motherMiddleName: studentForm.motherMiddleName,
        motherLastName: studentForm.motherLastName,
        motherPhone: studentForm.motherPhone,
        address: studentForm.address,
        state: studentForm.state,
        district: studentForm.district,
        taluka: studentForm.taluka,
        pincode: studentForm.pincode,
        photoUrl: studentForm.photoUrl,
        signUrl: studentForm.signUrl,
        aadhaarFrontUrl: studentForm.aadhaarFrontUrl,
        aadhaarBackUrl: studentForm.aadhaarBackUrl,
        casteCertificateUrl: studentForm.casteCertificateUrl,
        domicileUrl: studentForm.domicileUrl,
        pwdCertificateUrl: studentForm.pwdCertificateUrl,
        bankPassbookUrl: studentForm.bankPassbookUrl,
        panCardUrl: studentForm.panCardUrl,
        regNo: studentForm.regNo,
        rollNumber: studentForm.rollNumber,
        admissionDate: studentForm.admissionDate
      };

      const updatedAdmission = {
        ...editingStudent,
        studentName: fullName,
        studentEmail: studentForm.studentEmail,
        studentPhone: studentForm.studentPhone,
        photo: studentForm.photoUrl,
        password: studentForm.password,
        
        // Admission updates
        admissionDate: studentForm.admissionDate,
        regNo: studentForm.regNo,
        rollNumber: studentForm.rollNumber,
        fees: studentForm.fees,
        admissionStatus: studentForm.admissionStatus,

        profileData: { ...editingStudent.profileData, ...profileUpdates },
        updatedAt: new Date().toISOString()
      };
      
      delete updatedAdmission.id;
      delete updatedAdmission.collegeName;

      await set(admissionRef, updatedAdmission);

      if (editingStudent.studentUid) {
        await update(ref(realtimeDb, `users/${editingStudent.studentUid}`), {
          email: studentForm.studentEmail,
          password: studentForm.password,
          firstName: studentForm.firstName,
          lastName: studentForm.lastName,
          regNo: studentForm.regNo // Added to root node
        });
        await update(ref(realtimeDb, `users/${editingStudent.studentUid}/profile`), profileUpdates);
      }

      alert('Profile updated successfully.');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlockProfile = async () => {
    if (!editingStudent || !editingStudent.studentUid) return alert("No linked account.");
    if (!window.confirm(`Unlock ${editingStudent.studentName}'s profile?`)) return;

    setIsSubmitting(true);
    try {
      await update(ref(realtimeDb, `users/${editingStudent.studentUid}/profile`), { profileLocked: false });
      await update(ref(realtimeDb, `colleges/${editingStudent.collegeId}/studentAdmissions/${editingStudent.id}`), { profileLocked: false, isLocked: false });
      alert('Profile unlocked.');
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Unlock failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmissions = admissions.filter(adm => 
    !selectedCollegeId || adm.collegeId === selectedCollegeId
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-black rounded-full" />
          <div className="w-12 h-12 border-4 border-t-[#003366] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-normal capitalize tracking-normal text-black animate-pulse">Retrieving Admissions</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#003366] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            <Users size={14} className="text-[#003366]" /> Student Information
          </div>
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Student Admission</h2>
          <p className="text-sm font-normal text-white/60">View and manage admitted students.</p>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-black shadow-sm p-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h3 className="text-xl font-black text-slate-800 capitalize tracking-tight">Admitted Students</h3>
            {!collegeId && (
              <select 
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="bg-slate-50 border border-black rounded-xl px-4 py-2 text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#003366] transition-all"
              >
                 <option value="">All Colleges</option>
                 {availableColleges.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
              </select>
            )}
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-r border-black whitespace-nowrap">
                     <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Sr No.</th>
                     <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Admission Date & Time</th>
                     <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Action</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Student Name</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Reg. No.</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Roll No.</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Course</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Session</th>
                     <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Gender</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">DOB</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Father Name</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Father Mobile</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Mother Name</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Mother Mobile</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-right">Course Fees</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Category</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Aadhar No</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Blood Group</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Mother Tongue</th>
                     <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Address</th>
                  </tr>
               </thead>
               <tbody className="border-b border-black">
                  {filteredAdmissions.map((adm, i) => {
                     const p = adm.profileData || {};
                     const fatherName = p.fatherFirstName ? `${p.fatherFirstName} ${p.fatherMiddleName || ''} ${p.fatherLastName || ''}` : (adm.fatherName || '-');
                     const motherName = p.motherFirstName ? `${p.motherFirstName} ${p.motherMiddleName || ''} ${p.motherLastName || ''}` : (adm.motherName || '-');
                     
                     return (
                        <tr key={adm.id || i} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap border-b border-black">
                           <td className="px-4 py-6 border-r border-black text-center text-[16px] font-medium text-black">
                              {i + 1}
                           </td>
                           <td className="px-4 py-6 border-r border-black">
                              <p className="text-[14px] font-medium text-black">
                                {adm.admissionDate ? `${new Date(adm.admissionDate).toLocaleDateString()} | ${new Date(adm.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'N/A'}
                              </p>
                              {!collegeId && (
                                <p className="text-[11px] font-bold text-indigo-600 capitalize tracking-tight mt-1 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                                  {adm.collegeName}
                                </p>
                              )}
                           </td>
                           <td className="px-4 py-6 border-r border-black">
                              <div className="flex items-center justify-center gap-2">
                                 <button 
                                   onClick={() => handleProcessOpen(adm)}
                                   className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                   title="Process Admission"
                                 >
                                    <Eye size={14} />
                                 </button>
                                 <button 
                                   onClick={() => handleEditOpen(adm)}
                                   className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
                                   title="Edit Student Admission"
                                 >
                                    <Edit2 size={14} />
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(adm)}
                                   className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                   title="Delete Admission Record"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </td>
                           <td className="px-6 py-6 border-r border-black">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-black shrink-0 overflow-hidden border border-black">
                                    {adm.photo || p.photoUrl ? (
                                      <img src={adm.photo || p.photoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={14} />
                                    )}
                                 </div>
                                 <div>
                                    <p className="text-[16px] font-medium text-black capitalize tracking-tight">{adm.studentName}</p>
                                    <span className="text-[9px] font-medium text-black capitalize tracking-tighter">{adm.studentEmail}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-6 border-r border-black">
                              <p className="text-[16px] font-medium text-black capitalize tracking-tight">{adm.registrationNumber || adm.regNo || 'PENDING'}</p>
                           </td>
                           <td className="px-6 py-6 border-r border-black text-center">
                              <p className="text-[16px] font-medium text-black capitalize tracking-tight">{adm.rollNumber || '-'}</p>
                           </td>
                           <td className="px-6 py-6 border-r border-black">
                              <p className="text-[16px] font-medium text-black capitalize">{adm.courseName}</p>
                              <span className="text-[9px] font-medium bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded capitalize mt-1 inline-block border border-indigo-100">{adm.courseType}</span>
                           </td>
                           <td className="px-6 py-6 border-r border-black text-center">
                              <span className="text-[16px] font-medium text-black">2026-2027</span>
                           </td>
                           <td className="px-4 py-6 border-r border-black text-center capitalize text-[16px] font-medium text-black">
                              {p.gender || adm.gender || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-center text-[16px] font-medium text-black">
                              {p.dateOfBirth || adm.dateOfBirth || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black capitalize">
                              {fatherName}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black">
                              {p.fatherPhone || adm.fatherPhone || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black capitalize">
                              {motherName}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black">
                              {p.motherPhone || adm.motherPhone || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-right">
                              <p className="text-[16px] font-medium text-emerald-600">₹{parseFloat(adm.fees || '0').toLocaleString()}</p>
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black capitalize">
                              {p.category || adm.category || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black">
                              {p.aadharNumber || adm.aadharNumber || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-center text-[16px] font-medium text-black">
                              {p.bloodGroup || adm.bloodGroup || '-'}
                           </td>
                           <td className="px-6 py-6 border-r border-black text-[16px] font-medium text-black capitalize">
                              {p.motherTongue || adm.motherTongue || '-'}
                           </td>
                           <td className="px-6 py-6 min-w-[300px] border-r border-black">
                              <p className="text-[16px] font-medium text-black leading-relaxed capitalize whitespace-normal">
                                 {p.address || adm.address || 'Address not provided'}
                              </p>
                           </td>
                        </tr>
                     );
                  })}
                  {filteredAdmissions.length === 0 && (
                     <tr>
                        <td colSpan={15} className="py-20 text-center text-[13px] font-normal text-black capitalize tracking-tight">No admitted students found.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>

    {/* Edit Student Admission Modal */}
    {isEditModalOpen && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#002147]/90 backdrop-blur-md" onClick={() => !isSubmitting && setIsEditModalOpen(false)} />
        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-black">
          
          <div className="bg-[#003366] p-8 text-white relative shrink-0 border-b-4 border-black">
             <button 
               onClick={() => setIsEditModalOpen(false)}
               className="absolute right-8 top-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all border border-white/20"
               disabled={isSubmitting}
             >
               <X size={24} />
             </button>
             <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                   <Edit2 size={24} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">Global Profile Editor</h3>
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mt-1">Institutional Registry & Student Portal Sync</p>
                </div>
             </div>
          </div>

          <form onSubmit={handleEditSave} className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar bg-slate-50">
             
             {/* 0. Institutional Admission Details */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <Landmark className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Institutional Admission Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <EditField label="Course Name" value={studentForm.courseName} onChange={() => {}} readOnly />
                   <EditField label="Course Type" value={studentForm.courseType} onChange={() => {}} readOnly />
                   <EditField label="Admission Date" type="datetime-local" value={studentForm.admissionDate} onChange={(v: any) => setStudentForm({...studentForm, admissionDate: v})} />
                   <EditField label="Registration No." value={studentForm.regNo} onChange={(v: any) => setStudentForm({...studentForm, regNo: v})} />
                   <EditField label="Roll Number" value={studentForm.rollNumber} onChange={(v: any) => setStudentForm({...studentForm, rollNumber: v})} />
                   <EditField label="Course Fees (₹)" type="number" value={studentForm.fees} onChange={(v: any) => setStudentForm({...studentForm, fees: v})} />
                   <EditSelect label="Admission Status" value={studentForm.admissionStatus} options={['Pending', 'Confirmed', 'Rejected', 'Verified']} onChange={(v: any) => setStudentForm((p: any) => ({ ...p, admissionStatus: v }))} />
                </div>
             </section>
             
             {/* 1. Personal Information */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <User className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Personal Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <EditField label="First Name" value={studentForm.firstName} onChange={(v: any) => setStudentForm({...studentForm, firstName: v})} />
                   <EditField label="Middle Name" value={studentForm.middleName} onChange={(v: any) => setStudentForm({...studentForm, middleName: v})} />
                   <EditField label="Last Name" value={studentForm.lastName} onChange={(v: any) => setStudentForm({...studentForm, lastName: v})} />
                   <EditField label="Date of Birth" type="date" value={studentForm.dateOfBirth} onChange={(v: any) => setStudentForm({...studentForm, dateOfBirth: v})} />
                   <EditSelect label="Gender" value={studentForm.gender} options={['Male', 'Female', 'Other']} onChange={(v: any) => setStudentForm({...studentForm, gender: v})} />
                   <EditSelect label="Blood Group" value={studentForm.bloodGroup} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} onChange={(v: any) => setStudentForm({...studentForm, bloodGroup: v})} />
                   <EditField label="Religion" value={studentForm.religion} onChange={(v: any) => setStudentForm({...studentForm, religion: v})} />
                   <EditField label="Category" value={studentForm.category} onChange={(v: any) => setStudentForm({...studentForm, category: v})} />
                   <EditField label="Caste" value={studentForm.caste} onChange={(v: any) => setStudentForm({...studentForm, caste: v})} />
                   <EditField label="Aadhaar Number" value={studentForm.aadhaarNo} onChange={(v: any) => setStudentForm({...studentForm, aadhaarNo: v})} />
                   <EditField label="PAN Card Number" value={studentForm.panCardNo} onChange={(v: any) => setStudentForm({...studentForm, panCardNo: v})} />
                </div>
             </section>

             {/* 2. Contact & Security */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <ShieldCheck className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Contact & Security</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <EditField label="Email Address (Login ID)" value={studentForm.studentEmail} onChange={(v: any) => setStudentForm({...studentForm, studentEmail: v})} />
                   <EditField label="Mobile Number" value={studentForm.studentPhone} onChange={(v: any) => setStudentForm({...studentForm, studentPhone: v})} />
                   <EditField label="Account Password" value={studentForm.password} onChange={(v: any) => setStudentForm({...studentForm, password: v})} placeholder="Set new password..." />
                </div>
             </section>

             {/* 3. Parent Details */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <Users className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Parent Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <EditField label="Father First Name" value={studentForm.fatherFirstName} onChange={(v: any) => setStudentForm({...studentForm, fatherFirstName: v})} />
                   <EditField label="Father Last Name" value={studentForm.fatherLastName} onChange={(v: any) => setStudentForm({...studentForm, fatherLastName: v})} />
                   <EditField label="Father Mobile" value={studentForm.fatherPhone} onChange={(v: any) => setStudentForm({...studentForm, fatherPhone: v})} />
                   <div />
                   <EditField label="Mother First Name" value={studentForm.motherFirstName} onChange={(v: any) => setStudentForm({...studentForm, motherFirstName: v})} />
                   <EditField label="Mother Last Name" value={studentForm.motherLastName} onChange={(v: any) => setStudentForm({...studentForm, motherLastName: v})} />
                   <EditField label="Mother Mobile" value={studentForm.motherPhone} onChange={(v: any) => setStudentForm({...studentForm, motherPhone: v})} />
                </div>
             </section>

             {/* 4. Residential Address */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <MapPin className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Residential Address</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="md:col-span-2">
                      <EditField label="Street Address" value={studentForm.address} onChange={(v: any) => setStudentForm({...studentForm, address: v})} />
                   </div>
                   <EditField label="District" value={studentForm.district} onChange={(v: any) => setStudentForm({...studentForm, district: v})} />
                   <EditField label="Taluka" value={studentForm.taluka} onChange={(v: any) => setStudentForm({...studentForm, taluka: v})} />
                   <EditField label="State" value={studentForm.state} onChange={(v: any) => setStudentForm({...studentForm, state: v})} />
                   <EditField label="Pincode" value={studentForm.pincode} onChange={(v: any) => setStudentForm({...studentForm, pincode: v})} />
                </div>
             </section>

             {/* 5. Document Management */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <ImageIcon className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Document Management</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <DocUpload label="Student Photograph" value={studentForm.photoUrl} onFile={(e: any) => handleFileChange(e, 'photoUrl')} onPreview={() => openImagePreview(studentForm.photoUrl, "Student Photograph")} />
                   <DocUpload label="Student Signature" value={studentForm.signUrl} onFile={(e: any) => handleFileChange(e, 'signUrl')} onPreview={() => openImagePreview(studentForm.signUrl, "Student Signature")} />
                   <DocUpload label="Aadhaar Front" value={studentForm.aadhaarFrontUrl} onFile={(e: any) => handleFileChange(e, 'aadhaarFrontUrl')} onPreview={() => openImagePreview(studentForm.aadhaarFrontUrl, "Aadhaar Front")} />
                   <DocUpload label="Aadhaar Back" value={studentForm.aadhaarBackUrl} onFile={(e: any) => handleFileChange(e, 'aadhaarBackUrl')} onPreview={() => openImagePreview(studentForm.aadhaarBackUrl, "Aadhaar Back")} />
                   <DocUpload label="Caste Certificate" value={studentForm.casteCertificateUrl} onFile={(e: any) => handleFileChange(e, 'casteCertificateUrl')} onPreview={() => openImagePreview(studentForm.casteCertificateUrl, "Caste Certificate")} />
                   <DocUpload label="Domicile Certificate" value={studentForm.domicileUrl} onFile={(e: any) => handleFileChange(e, 'domicileUrl')} onPreview={() => openImagePreview(studentForm.domicileUrl, "Domicile Certificate")} />
                   <DocUpload label="PWD Certificate" value={studentForm.pwdCertificateUrl} onFile={(e: any) => handleFileChange(e, 'pwdCertificateUrl')} onPreview={() => openImagePreview(studentForm.pwdCertificateUrl, "PWD Certificate")} />
                   <DocUpload label="Bank Passbook/Cheque" value={studentForm.bankPassbookUrl} onFile={(e: any) => handleFileChange(e, 'bankPassbookUrl')} onPreview={() => openImagePreview(studentForm.bankPassbookUrl, "Bank Document")} />
                   <DocUpload label="PAN Card" value={studentForm.panCardUrl} onFile={(e: any) => handleFileChange(e, 'panCardUrl')} onPreview={() => openImagePreview(studentForm.panCardUrl, "PAN Card")} />
                </div>
             </section>

             <div className="pt-10 border-t-2 border-black flex flex-col md:flex-row justify-between items-center gap-6">
                 <button 
                   type="button"
                   onClick={handleUnlockProfile}
                   className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-orange-50 text-black text-[13px] font-black uppercase tracking-tight hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-black"
                   disabled={isSubmitting}
                 >
                   <Unlock size={18} /> Administrative Unlock
                 </button>

                 <div className="flex w-full md:w-auto gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-10 py-5 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-black hover:bg-[#003366] text-white font-black px-16 py-5 rounded-2xl text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-2xl flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Update Registry
                    </button>
                 </div>
              </div>
          </form>
        </div>
      </div>
    )}
    {/* Process Admission Modal */}
    {isProcessModalOpen && processingStudent && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => !isSubmitting && setIsProcessModalOpen(false)} />
        <div className="bg-[#f8fafc] w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#003366] to-[#003366] p-8 text-white relative shrink-0">
             <button 
               onClick={() => setIsProcessModalOpen(false)}
               className="absolute right-8 top-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
             >
               <X size={24} />
             </button>
             
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl">
                  {processingStudent.photo || processingStudent.profileData?.photoUrl ? (
                    <img src={processingStudent.photo || processingStudent.profileData?.photoUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">
                      {processingStudent.studentName}
                    </h3>
                    <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[9px] font-black capitalize tracking-tight backdrop-blur-sm border border-white/30">
                      {processingStudent.admissionStatus || 'Pending Processing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-white/80">
                    <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2">
                      <Mail size={12} /> {processingStudent.studentEmail}
                    </p>
                    <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2">
                      <Phone size={12} /> {processingStudent.studentPhone || processingStudent.profileData?.phone || 'No Phone'}
                    </p>
                    <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2">
                      <Calendar size={12} /> Reg: {processingStudent.regNo}
                    </p>
                  </div>
                </div>
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Admission Info */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Admission Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <DetailItem label="Course Enrolled" value={processingStudent.courseName} />
                  <DetailItem label="Course Type" value={processingStudent.courseType} />
                  <DetailItem label="Admission Date" value={processingStudent.admissionDate ? new Date(processingStudent.admissionDate).toLocaleDateString() : 'N/A'} />
                  <DetailItem label="Fees Paid" value={`₹${processingStudent.fees || '0'}`} />
                  <DetailItem label="College" value={processingStudent.collegeName} />
                </div>
              </section>

              {/* Personal Information */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <User size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Personal Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <DetailItem label="Full Name" value={processingStudent.studentName} />
                  <DetailItem label="Gender" value={processingStudent.profileData?.gender || processingStudent.gender} />
                  <DetailItem label="Date of Birth" value={processingStudent.profileData?.dateOfBirth || processingStudent.dateOfBirth} />
                  <DetailItem label="Blood Group" value={processingStudent.profileData?.bloodGroup} />
                  <DetailItem label="Category" value={processingStudent.profileData?.category || processingStudent.profileData?.casteCategory} />
                  <DetailItem label="Aadhaar Number" value={processingStudent.profileData?.aadhaarNo} />
                </div>
                
                {/* Document Previews */}
                <div className="pt-4 border-t border-black flex flex-wrap gap-3">
                  {processingStudent.profileData?.aadhaarFrontUrl && (
                    <PreviewButton label="Aadhaar Front" onClick={() => openImagePreview(processingStudent.profileData.aadhaarFrontUrl, "Aadhaar Card Front")} />
                  )}
                  {processingStudent.profileData?.aadhaarBackUrl && (
                    <PreviewButton label="Aadhaar Back" onClick={() => openImagePreview(processingStudent.profileData.aadhaarBackUrl, "Aadhaar Card Back")} />
                  )}
                  {processingStudent.profileData?.signUrl && (
                    <PreviewButton label="Signature" onClick={() => openImagePreview(processingStudent.profileData.signUrl, "Student Signature")} />
                  )}
                  {processingStudent.profileData?.casteCertificateUrl && (
                    <PreviewButton label="Caste Certificate" onClick={() => openImagePreview(processingStudent.profileData.casteCertificateUrl, "Caste Certificate")} />
                  )}
                  {processingStudent.profileData?.domicileUrl && (
                    <PreviewButton label="Domicile Certificate" onClick={() => openImagePreview(processingStudent.profileData.domicileUrl, "Domicile Certificate")} />
                  )}
                  {processingStudent.profileData?.pwdCertificateUrl && (
                    <PreviewButton label="PWD Certificate" onClick={() => openImagePreview(processingStudent.profileData.pwdCertificateUrl, "PWD Certificate")} />
                  )}
                  {processingStudent.profileData?.trainingCertificateUrl && (
                    <PreviewButton label="Training Certificate" onClick={() => openImagePreview(processingStudent.profileData.trainingCertificateUrl, "Training Certificate")} />
                  )}
                  {processingStudent.profileData?.bankPassbookUrl && (
                    <PreviewButton label="Bank Document" onClick={() => openImagePreview(processingStudent.profileData.bankPassbookUrl, "Bank Document")} />
                  )}
                  {processingStudent.profileData?.panCardUrl && (
                    <PreviewButton label="PAN Card" onClick={() => openImagePreview(processingStudent.profileData.panCardUrl, "PAN Card")} />
                  )}
                </div>
              </section>

              {/* Parent & Contact Details */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                    <Users size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Parent & Contact</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <DetailItem label="Father Name" value={processingStudent.fatherName || `${processingStudent.profileData?.fatherFirstName || ''} ${processingStudent.profileData?.fatherLastName || ''}`} />
                  <DetailItem label="Father Mobile" value={processingStudent.fatherPhone || processingStudent.profileData?.fatherPhone} />
                  <DetailItem label="Mother Name" value={processingStudent.motherName || `${processingStudent.profileData?.motherFirstName || ''} ${processingStudent.profileData?.motherLastName || ''}`} />
                  <DetailItem label="Mother Mobile" value={processingStudent.motherPhone || processingStudent.profileData?.motherPhone} />
                  <div className="col-span-2">
                    <DetailItem label="Address" value={processingStudent.address || processingStudent.profileData?.address} />
                  </div>
                </div>
              </section>
              
              {/* Educational Qualifications */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6 md:col-span-2">
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
                      {(processingStudent.profileData?.qualifications || []).map((q: any, i: number) => (
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

            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-white border-t border-black flex items-center justify-between shrink-0 rounded-b-[3rem]">
             <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${processingStudent.admissionStatus === 'Confirmed' || processingStudent.admissionStatus === 'Accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <p className="text-[13px] font-black text-black capitalize tracking-tight">
                   Current Status: <span className={processingStudent.admissionStatus === 'Confirmed' || processingStudent.admissionStatus === 'Accepted' ? 'text-emerald-600' : 'text-amber-600'}>{processingStudent.admissionStatus || 'Pending Processing'}</span>
                </p>
             </div>
             
             <div className="flex gap-4">
                {(processingStudent.admissionStatus !== 'Confirmed' && processingStudent.admissionStatus !== 'Accepted') && (
                  <>
                    <button 
                      onClick={handleRejectAdmission}
                      disabled={isSubmitting}
                      className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-black px-8 py-4 rounded-2xl text-[11px] capitalize tracking-normal transition-all flex items-center gap-3 border border-rose-100 disabled:opacity-50"
                    >
                      <XCircle size={18} /> Reject Admission
                    </button>
                    <button 
                      onClick={handleAcceptAdmission}
                      disabled={isSubmitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl text-[11px] capitalize tracking-normal transition-all shadow-lg flex items-center gap-3 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} /> Accept Admission
                    </button>
                  </>
                )}
                {(processingStudent.admissionStatus === 'Confirmed' || processingStudent.admissionStatus === 'Accepted') && (
                  <button 
                    disabled
                    className="bg-slate-100 text-slate-400 font-black px-8 py-4 rounded-2xl text-[11px] capitalize tracking-normal border border-slate-200 flex items-center gap-3 cursor-not-allowed"
                  >
                    <CheckCircle2 size={18} /> Admission Confirmed
                  </button>
                )}
             </div>
          </div>

        </div>
      </div>
    )}

    {/* Image Preview Modal */}
    {isPreviewOpen && previewImage && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsPreviewOpen(false)} />
        <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-6 bg-white border-b border-black flex items-center justify-between">
            <h5 className="font-normal text-[#003366] capitalize tracking-tight text-sm flex items-center gap-2">
              <ImageIcon size={18} className="text-[#003366]" /> {previewImage.title}
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
  </>
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
      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-black rounded-xl text-[13px] font-normal text-black capitalize tracking-tight hover:bg-[#003366] hover:text-black hover:border-[#003366] transition-all shadow-sm active:scale-95 group"
    >
      <Eye size={12} className="text-[#003366] group-hover:text-white" /> {label}
    </button>
  );
}





