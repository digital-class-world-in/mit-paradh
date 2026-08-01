'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove, get, push, update, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';
import { realtimeDb, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Users, Edit2, Trash2, X, Save, Clock, User, Mail, Lock, Phone, Unlock, ShieldCheck, Eye, CheckCircle2, XCircle, MapPin, Tag, GraduationCap, Briefcase, Landmark, Calendar, Image as ImageIcon, Download, Loader2, FileText } from 'lucide-react';

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

import { getDefaultAdminUid } from '@/lib/adminUtils';

export default function StudentAdmissionManager({ collegeId, adminUid }: { collegeId: string | undefined; adminUid?: string }) {
  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || '');

  useEffect(() => {
    if (adminUid) {
      setResolvedAdminUid(adminUid);
    } else {
      getDefaultAdminUid().then(setResolvedAdminUid);
    }
  }, [adminUid]);
  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const PAGE_SIZE = 20;

  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Accepted');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getDbRef = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Just return the global path directly instead of scoped under admin
    return ref(realtimeDb, cleanPath);
  };

  const fetchPage = async (direction: 'first' | 'next' | 'prev' = 'first') => {
    if (!realtimeDb || !resolvedAdminUid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      let currentColleges = availableColleges;
      if (currentColleges.length === 0) {
        const collegesRef = ref(realtimeDb, 'colleges');
        const colSnap = await get(collegesRef);
        if (colSnap.exists()) {
           currentColleges = Object.entries(colSnap.val()).map(([id, val]: any) => ({ id, ...val }));
           setAvailableColleges(currentColleges);
        }
      }

      let data: any[] = [];
      const targetCid = collegeId || selectedCollegeId;
      
      if (targetCid) {
        const targetRef = ref(realtimeDb, `colleges/${targetCid}/studentAdmissions`);
        let q;
        if (direction === 'first') {
           q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
           setPageHistory([]);
           setCurrentPage(1);
        } else if (direction === 'next' && lastKey) {
           setPageHistory(prev => [...prev, firstKey as string]);
           q = query(targetRef, orderByKey(), startAfter(lastKey), limitToFirst(PAGE_SIZE));
           setCurrentPage(prev => prev + 1);
        } else if (direction === 'prev' && pageHistory.length > 0) {
           const newHistory = [...pageHistory];
           const prevFirstKey = newHistory.pop();
           setPageHistory(newHistory);
           if (newHistory.length > 0) {
              q = query(targetRef, orderByKey(), startAfter(newHistory[newHistory.length - 1]), limitToFirst(PAGE_SIZE));
           } else {
              q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
           }
           setCurrentPage(prev => prev - 1);
        } else {
           q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
        }

        const snapshot = await get(q);
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
             let val = child.val();
             if (val.profile) val = { ...val, ...val.profile };
             data.push({
               id: child.key,
               source: 'Admission',
               studentName: val.studentName || `${val.firstName || ''} ${val.middleName || ''} ${val.lastName || ''}`.trim(),
               studentEmail: val.studentEmail || val.email,
               studentPhone: val.studentPhone || val.phone,
               admissionDate: val.admissionDate || val.createdAt || val.date,
               ...val
             });
          });
        }
      } else {
        // If no college selected, fetch from all available colleges
        for (const col of currentColleges) {
          const colRef = ref(realtimeDb, `colleges/${col.id}/studentAdmissions`);
          const snapshot = await get(query(colRef, limitToFirst(PAGE_SIZE)));
          if (snapshot.exists()) {
            snapshot.forEach((child) => {
               let val = child.val();
               if (val.profile) val = { ...val, ...val.profile };
               data.push({
                 id: child.key,
                 collegeId: col.id,
                 collegeName: col.name,
                 source: 'Admission',
                 studentName: val.studentName || `${val.firstName || ''} ${val.middleName || ''} ${val.lastName || ''}`.trim(),
                 studentEmail: val.studentEmail || val.email,
                 studentPhone: val.studentPhone || val.phone,
                 admissionDate: val.admissionDate || val.createdAt || val.date,
                 ...val
               });
            });
          }
        }
      }

      let filteredData = data.filter(adm => {
        if (statusFilter === 'All') return true;
        const st = adm.admissionStatus || adm.status || 'Pending';
        if (statusFilter === 'Accepted') return ['Accepted', 'Approved', 'Verified', 'Confirmed'].includes(st) || adm.source === 'Manual';
        return st === statusFilter;
      });

      // Apply search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredData = filteredData.filter(adm => {
          const name = (adm.studentName || '').toLowerCase();
          const email = (adm.studentEmail || '').toLowerCase();
          const phone = (adm.studentPhone || '').toLowerCase();
          const reg = (adm.regNo || adm.manualRegNo || '').toLowerCase();
          return name.includes(q) || email.includes(q) || phone.includes(q) || reg.includes(q);
        });
      }

      if (filteredData.length > 0) {
         setFirstKey(filteredData[0].id);
         setLastKey(filteredData[filteredData.length - 1].id);
         setAdmissions(filteredData);
      } else if (direction === 'first') {
         setAdmissions([]);
      }

      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAdmissions([]);
    fetchPage('first');
  }, [statusFilter, selectedCollegeId, collegeId, resolvedAdminUid, searchQuery]);

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
      const targetCollegeId = processingStudent.collegeId;
      const admissionId = processingStudent.id;
      const uid = processingStudent.studentUid || processingStudent.uid;
      const appId = processingStudent.applicationId;

      // 1. Update Admission Record
      const admissionRef = getDbRef(`colleges/${targetCollegeId}/studentAdmissions/${admissionId}`);
      await update(admissionRef, { admissionStatus: 'Accepted', processedAt: new Date().toISOString() });

      // 2. Update Student's Personal Application Ledger
      if (uid && appId) {
        const userAppsRef = ref(realtimeDb, `users/${uid}/applications`);
        const appsSnap = await get(userAppsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [key, val] of Object.entries(apps)) {
            if ((val as any).applicationId === appId) {
              await set(ref(realtimeDb, `users/${uid}/applications/${key}/status`), 'Accepted');
              if (resolvedAdminUid) {
                await set(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}/applications/${key}/status`), 'Accepted');
              }
              break;
            }
          }
        }
      }

      alert('Admission Accepted successfully and student dashboard updated.');
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
      const admissionRef = getDbRef(`colleges/${processingStudent.collegeId}/studentAdmissions/${processingStudent.id}`);
      const adminTrashRef = push(getDbRef(`trash`));
      
      await set(adminTrashRef, {
        type: 'Student Admission',
        data: processingStudent,
        originalId: processingStudent.id,
        collegeId: processingStudent.collegeId,
        deletedAt: Date.now(),
        metadata: `${processingStudent.studentName} (${processingStudent.courseName})`
      });

      await remove(admissionRef);
      alert('Admission Rejected and moved to Trash.');
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
      const adminTrashRef = push(getDbRef(`trash`));
      await set(adminTrashRef, {
        type: 'Student Admission',
        data: student,
        originalId: student.id,
        collegeId: student.collegeId,
        deletedAt: Date.now(),
        metadata: `${student.studentName} (${student.courseName})`
      });

      const admissionRef = getDbRef(`colleges/${student.collegeId}/studentAdmissions/${student.id}`);
      await remove(admissionRef);
      
      const uid = student.studentUid || student.uid || student.profileData?.uid;
      const appId = student.applicationId;

      if (uid) {
        // Unlock global user profile
        const userProfileRef = ref(realtimeDb, `users/${uid}/profile`);
        const unlockData = {
          profileLocked: false,
          course: 'Not Selected',
          status: 'In Progress'
        };
        await update(userProfileRef, unlockData);
        await update(ref(realtimeDb, `users/${uid}`), { course: 'Not Selected' });

        // Unlock admin registrations profile
        if (resolvedAdminUid) {
          const adminProfileRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}/profile`);
          await update(adminProfileRef, unlockData);
          await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}`), { course: 'Not Selected' });
        }

        if (appId) {
          const userAppsRef = ref(realtimeDb, `users/${uid}/applications`);
          const snapshot = await get(userAppsRef);
          if (snapshot.exists()) {
            const apps = snapshot.val();
            for (const [key, val] of Object.entries(apps)) {
              if ((val as any).applicationId === appId) {
                await remove(ref(realtimeDb, `users/${uid}/applications/${key}`));
                if (resolvedAdminUid) {
                  await remove(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}/applications/${key}`));
                }
                break;
              }
            }
          }
        }
      }

      if (student.collegeId && student.inquiryId) {
        const sourceInqRef = getDbRef(`colleges/${student.collegeId}/frontOffice/admissionInquiries/${student.inquiryId}`);
        await remove(sourceInqRef);
      }

      alert('Student record moved to Trash successfully.');
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
      manualRegNo: student.manualRegNo || profile.manualRegNo || '',
      rollNumber: student.rollNumber || '',
      fees: student.fees || '',
      paidFees: student.paidFees || '',
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
      aadhaarFrontUrl: profile.aadhaarFrontUrl || student.aadhaarFrontUrl || '',
      aadhaarBackUrl: profile.aadhaarBackUrl || student.aadhaarBackUrl || '',
      casteCertificateUrl: profile.casteCertificateUrl || student.casteCertificateUrl || '',
      domicileUrl: profile.domicileUrl || student.domicileUrl || '',
      pwdCertificateUrl: profile.pwdCertificateUrl || student.pwdCertificateUrl || '',
      bankPassbookUrl: profile.bankPassbookUrl || student.bankPassbookUrl || '',
      panCardUrl: profile.panCardUrl || student.panCardUrl || '',
      transferCertificateUrl: profile.transferCertificateUrl || student.transferCertificateUrl || '',
      bonafideCertificateUrl: profile.bonafideCertificateUrl || student.bonafideCertificateUrl || '',
      isActive: student.isActive !== undefined ? student.isActive : true
    });
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert('File size must be less than 1MB');

    const fileRef = storageRef(storage, `students/${editingStudent?.studentUid || 'admin'}/documents/${fieldName}_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('File upload failed:', error);
        alert('Failed to upload file.');
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setStudentForm((prev: any) => ({ ...prev, [fieldName]: downloadURL }));
      }
    );
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsSubmitting(true);
    try {
      const admissionRef = getDbRef(`colleges/${editingStudent.collegeId}/studentAdmissions/${editingStudent.id}`);
      const fullName = `${studentForm.firstName || ''} ${studentForm.middleName || ''} ${studentForm.lastName || ''}`.trim();
      const cleanData = (obj: any) => JSON.parse(JSON.stringify(obj));
      
      const profileUpdates = cleanData({
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
        photoUrl: studentForm.photoUrl || null,
        signUrl: studentForm.signUrl || null,
        aadhaarFrontUrl: studentForm.aadhaarFrontUrl || null,
        aadhaarBackUrl: studentForm.aadhaarBackUrl || null,
        casteCertificateUrl: studentForm.casteCertificateUrl || null,
        domicileUrl: studentForm.domicileUrl || null,
        pwdCertificateUrl: studentForm.pwdCertificateUrl || null,
        trainingCertificateUrl: studentForm.trainingCertificateUrl || null,
        bankPassbookUrl: studentForm.bankPassbookUrl || null,
        panCardUrl: studentForm.panCardUrl || null,
        transferCertificateUrl: studentForm.transferCertificateUrl || null,
        bonafideCertificateUrl: studentForm.bonafideCertificateUrl || null,
        regNo: studentForm.regNo,
        manualRegNo: studentForm.manualRegNo,
        rollNumber: studentForm.rollNumber,
        admissionDate: studentForm.admissionDate
      });

      const updatedAdmission = cleanData({
        ...editingStudent,
        studentName: fullName,
        studentEmail: studentForm.studentEmail,
        studentPhone: studentForm.studentPhone,
        photo: studentForm.photoUrl,
        password: studentForm.password,
        
        // Admission updates
        admissionDate: studentForm.admissionDate,
        regNo: studentForm.regNo,
        manualRegNo: studentForm.manualRegNo,
        rollNumber: studentForm.rollNumber,
        fees: studentForm.fees,
        paidFees: studentForm.paidFees,
        admissionStatus: studentForm.admissionStatus,

        profileData: { ...editingStudent.profileData, ...profileUpdates },
        isActive: studentForm.isActive,
        updatedAt: new Date().toISOString()
      });
      
      delete updatedAdmission.id;
      delete updatedAdmission.collegeName;

      await set(admissionRef, updatedAdmission);

      if (editingStudent.studentUid) {
        const uid = editingStudent.studentUid;
        const appId = editingStudent.applicationId;

        // 1. Update Global User Info
        await update(ref(realtimeDb, `users/${uid}`), cleanData({
          email: studentForm.studentEmail,
          password: studentForm.password,
          firstName: studentForm.firstName,
          lastName: studentForm.lastName,
          regNo: studentForm.regNo,
          manualRegNo: studentForm.manualRegNo,
          rollNumber: studentForm.rollNumber,
          adminUid: resolvedAdminUid
        }));

        // 2. Update Profile Node
        await update(ref(realtimeDb, `users/${uid}/profile`), profileUpdates);

        // 3. Update Admin Registrations Info
        if (resolvedAdminUid) {
          const adminRegPath = `users/${resolvedAdminUid}/modules/registrations/${uid}`;
          await update(ref(realtimeDb, adminRegPath), cleanData({
            email: studentForm.studentEmail,
            password: studentForm.password,
            firstName: studentForm.firstName,
            lastName: studentForm.lastName,
            regNo: studentForm.regNo,
            manualRegNo: studentForm.manualRegNo,
            rollNumber: studentForm.rollNumber,
            adminUid: resolvedAdminUid
          }));
          await update(ref(realtimeDb, `${adminRegPath}/profile`), profileUpdates);
        }

        // 4. Update Application Node (for Dashboard Sync)
        if (appId) {
          const userAppsRef = ref(realtimeDb, `users/${uid}/applications`);
          const appsSnap = await get(userAppsRef);
          if (appsSnap.exists()) {
            const apps = appsSnap.val();
            for (const [key, val] of Object.entries(apps)) {
              if ((val as any).applicationId === appId) {
                const appUpdate = cleanData({
                  regNo: studentForm.regNo,
                  manualRegNo: studentForm.manualRegNo,
                  fees: studentForm.fees,
                  paidFees: studentForm.paidFees,
                  status: studentForm.admissionStatus,
                  isActive: studentForm.isActive
                });
                await update(ref(realtimeDb, `users/${uid}/applications/${key}`), appUpdate);
                if (resolvedAdminUid) {
                  await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}/applications/${key}`), appUpdate);
                }
                break;
              }
            }
          }
        }
      }

      alert('Profile and Application ledger updated successfully.');
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
      const uid = editingStudent.studentUid;
      const appId = editingStudent.applicationId;
      const unlockProfileData = { profileLocked: false, status: 'Unlocked' };

      // Unlock Global profile
      await update(ref(realtimeDb, `users/${uid}/profile`), unlockProfileData);

      // Unlock Admin Registrations profile
      if (resolvedAdminUid) {
        await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}/profile`), unlockProfileData);
      }

      // Unlock College Admission Record
      await update(getDbRef(`colleges/${editingStudent.collegeId}/studentAdmissions/${editingStudent.id}`), { profileLocked: false, isLocked: false, status: 'Unlocked' });

      // Unlock application ledger
      if (appId) {
        const appsRef = ref(realtimeDb, `users/${uid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [key, val] of Object.entries(apps)) {
            if ((val as any).applicationId === appId) {
              const appUnlockData = {
                profileLocked: false,
                status: 'Unlocked'
              };
              await update(ref(realtimeDb, `users/${uid}/applications/${key}`), appUnlockData);
              if (resolvedAdminUid) {
                await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}/applications/${key}`), appUnlockData);
              }
              break;
            }
          }
        }
      }
      alert('Profile unlocked.');
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Unlock failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginatedAdmissions = admissions;

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

         {/* Filter Bar - Top */}
         <div className="mb-8 space-y-4">
           <div className="flex flex-col md:flex-row gap-3">
             {/* Search */}
             <div className="relative flex-1">
               <input
                 type="text"
                 value={searchQuery}
                 onChange={e => { setSearchQuery(e.target.value); }}
                 placeholder="Search by name, email, phone, or reg no..."
                 className="w-full bg-slate-50 border border-black rounded-xl px-4 py-2.5 pl-10 text-[14px] font-medium text-black outline-none focus:border-[#003366] transition-all"
               />
               <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
             </div>
             {/* Status */}
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="bg-slate-50 border border-black rounded-xl px-4 py-2.5 text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#003366] transition-all"
             >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Approved / Accepted</option>
                <option value="Rejected">Rejected</option>
             </select>
             {/* College */}
             {!collegeId && (
               <select 
                 value={selectedCollegeId}
                 onChange={(e) => setSelectedCollegeId(e.target.value)}
                 className="bg-slate-50 border border-black rounded-xl px-4 py-2.5 text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#003366] transition-all"
               >
                  <option value="">All Colleges</option>
                  {availableColleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
               </select>
             )}
           </div>
           {/* Result Count */}
           <div className="flex items-center justify-between">
             <p className="text-[13px] font-medium text-slate-500">
               Showing <span className="font-black text-black">{admissions.length}</span> student{admissions.length !== 1 ? 's' : ''}
               {searchQuery && <span className="text-indigo-500"> matching "{searchQuery}"</span>}
             </p>
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="text-[12px] font-bold text-rose-500 hover:text-rose-700 transition-all">
                 ✕ Clear Search
               </button>
             )}
           </div>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-black">
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black text-center w-16">Sr No.</th>
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Date & Time</th>
                    {!collegeId && <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">College</th>}
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Student Name</th>
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Course</th>
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Contact Info</th>
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight text-center border-r border-black">Status</th>
                    <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-b border-black">
                    {paginatedAdmissions.map((adm, i) => {
                      const p = adm.profileData || {};
                      const studentName = adm.studentName || `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim() || 'No Name';
                      const studentEmail = adm.studentEmail || p.email || 'No Email';
                      const studentPhone = adm.studentPhone || p.phone || adm.phone || 'No Phone';
                      
                      return (
                        <tr key={adm.id || i} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                          <td className="px-6 py-6 border-r border-black text-center text-[13px] font-normal text-black">
                            {i + 1}
                          </td>
                          <td className="px-6 py-6 border-r border-black">
                            <p className="text-[14px] font-medium text-black">
                              {(() => {
                                const dateVal = adm.processedAt || adm.admissionDate;
                                if (!dateVal) return 'N/A';
                                const d = new Date(dateVal);
                                return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                              })()}
                            </p>
                          </td>
                          {!collegeId && (
                            <td className="px-6 py-6 border-r border-black">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <Landmark size={14} />
                                  </div>
                                   <span className="text-[13px] font-bold text-black capitalize tracking-tight">
                                     {adm.collegeName || 'N/A'}
                                  </span>
                               </div>
                            </td>
                          )}
                          <td className="px-6 py-6 border-r border-black">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-black shrink-0 overflow-hidden border border-black shadow-sm">
                                  {adm.photo || p.photoUrl ? (
                                    <img src={adm.photo || p.photoUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={18} />
                                  )}
                               </div>
                               <div>
                                 <p className="text-[14px] font-medium text-black capitalize tracking-tight">
                                   {studentName}
                                 </p>
                                 <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                                   ID: {adm.regNo || 'PENDING'}
                                 </p>
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-6 border-r border-black">
                             <p className="text-[14px] font-medium text-black capitalize">{adm.courseName}</p>
                             <span className="text-[10px] font-black text-indigo-500 capitalize tracking-tight bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1 inline-block">
                               {adm.courseType || 'Reg'}
                             </span>
                          </td>
                          <td className="px-6 py-6 border-r border-black">
                             <div className="space-y-1">
                                <p className="text-[12px] font-medium text-black flex items-center gap-2">
                                   <Phone size={12} className="text-indigo-500" /> {studentPhone}
                                </p>
                                <p className="text-[12px] font-medium text-black flex items-center gap-2">
                                   <Mail size={12} className="text-indigo-500" /> {studentEmail}
                                </p>
                                <p className="text-[11px] font-bold text-emerald-600 tracking-tighter bg-emerald-50 px-2 py-0.5 rounded inline-block">
                                   Pass: {adm.password || '********'}
                                </p>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-center border-r border-black">
                             <span className={`px-3 py-1.5 rounded-full text-[12px] font-black tracking-tight capitalize border shadow-sm inline-block min-w-[90px] ${adm.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {adm.isActive !== false ? 'Active' : 'Deactive'}
                             </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleProcessOpen(adm)}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                title="Process Admission"
                              >
                                 <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => handleEditOpen(adm)}
                                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
                                title="Edit Student Admission"
                              >
                                 <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(adm)}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                title="Delete Admission Record"
                              >
                                 <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedAdmissions.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Users size={48} className="opacity-10" />
                            <p className="text-[13px] font-normal text-black capitalize tracking-normal">No admitted students found in the registry</p>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-6 bg-slate-50 border border-black p-4 rounded-2xl">
            <button
              onClick={() => fetchPage('prev')}
              disabled={loading || currentPage === 1}
              className="px-6 py-2 bg-white border border-black text-black rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
            >
              Previous Page
            </button>
            <span className="text-[13px] font-black text-black tracking-tight">
              Page {currentPage}
            </span>
            <button
              onClick={() => fetchPage('next')}
              disabled={loading || !hasMore}
              className="px-6 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 disabled:opacity-50 transition-all"
            >
              Next Page
            </button>
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
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                       <Edit2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">Global Profile Editor</h3>
                      <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mt-1">Institutional Registry & Student Portal Sync</p>
                    </div>
                 </div>

                 {/* Active/Deactive Toggle */}
                 <div className="flex items-center gap-4 mr-16">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${studentForm.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {studentForm.isActive ? 'Active' : 'Deactive'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setStudentForm({ ...studentForm, isActive: !studentForm.isActive })}
                      className={`w-14 h-8 rounded-full border-2 border-black transition-all relative ${studentForm.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    >
                       <div className={`absolute top-1 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${studentForm.isActive ? 'left-7' : 'left-1'}`} />
                    </button>
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
                   <EditField label="Auto Registration No." value={studentForm.regNo} onChange={(v: any) => setStudentForm({...studentForm, regNo: v})} />
                   <EditField label="Manual Reg No." value={studentForm.manualRegNo} onChange={(v: any) => setStudentForm({...studentForm, manualRegNo: v})} />
                   <EditField label="Roll Number" value={studentForm.rollNumber} onChange={(v: any) => setStudentForm({...studentForm, rollNumber: v})} />
                   <EditField label="Course Fees (₹)" type="number" value={studentForm.fees} onChange={(v: any) => setStudentForm({...studentForm, fees: v})} />
                   <EditField label="Amount Paid (₹)" type="number" value={studentForm.paidFees} onChange={(v: any) => setStudentForm({...studentForm, paidFees: v})} />
                   <EditSelect label="Admission Status" value={studentForm.admissionStatus} options={['Pending', 'Accepted', 'Rejected', 'Verified', 'Confirmed']} onChange={(v: any) => setStudentForm({...studentForm, admissionStatus: v})} />
                </div>
             </section>
             
             {/* 1. Personal Information */}
             <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                   <User className="text-[#003366]" size={20} />
                   <h4 className="text-lg font-black text-black capitalize tracking-tight">Personal Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <EditField label="First Name" value={studentForm.firstName} onChange={(v: any) => setStudentForm({...studentForm, firstName: capitalizeWords(v)})} />
                   <EditField label="Middle Name" value={studentForm.middleName} onChange={(v: any) => setStudentForm({...studentForm, middleName: capitalizeWords(v)})} />
                   <EditField label="Last Name" value={studentForm.lastName} onChange={(v: any) => setStudentForm({...studentForm, lastName: capitalizeWords(v)})} />
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
                   <EditField label="Father First Name" value={studentForm.fatherFirstName} onChange={(v: any) => setStudentForm({...studentForm, fatherFirstName: capitalizeWords(v)})} />
                   <EditField label="Father Last Name" value={studentForm.fatherLastName} onChange={(v: any) => setStudentForm({...studentForm, fatherLastName: capitalizeWords(v)})} />
                   <EditField label="Father Mobile" value={studentForm.fatherPhone} onChange={(v: any) => setStudentForm({...studentForm, fatherPhone: v})} />
                   <div />
                   <EditField label="Mother First Name" value={studentForm.motherFirstName} onChange={(v: any) => setStudentForm({...studentForm, motherFirstName: capitalizeWords(v)})} />
                   <EditField label="Mother Last Name" value={studentForm.motherLastName} onChange={(v: any) => setStudentForm({...studentForm, motherLastName: capitalizeWords(v)})} />
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
                    <DocUpload label="Transfer Certificate" value={studentForm.transferCertificateUrl} onFile={(e: any) => handleFileChange(e, 'transferCertificateUrl')} onPreview={() => openImagePreview(studentForm.transferCertificateUrl, "Transfer Certificate")} />
                    <DocUpload label="Bonafide Certificate" value={studentForm.bonafideCertificateUrl} onFile={(e: any) => handleFileChange(e, 'bonafideCertificateUrl')} onPreview={() => openImagePreview(studentForm.bonafideCertificateUrl, "Bonafide Certificate")} />
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
                      <Calendar size={12} /> Reg: {processingStudent.manualRegNo ? `${processingStudent.manualRegNo} / ` : ''}{processingStudent.regNo}
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
                  <DetailItem label="Manual Reg No." value={processingStudent.manualRegNo || 'N/A'} />
                  <DetailItem label="Course Fees" value={`₹${processingStudent.fees || '0'}`} />
                  <DetailItem label="Amount Paid" value={`₹${processingStudent.paidFees || '0'}`} />
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
                  {(processingStudent.profileData?.aadhaarFrontUrl || processingStudent.aadhaarFrontUrl) && (
                    <PreviewButton label="Aadhaar Front" onClick={() => openImagePreview(processingStudent.profileData?.aadhaarFrontUrl || processingStudent.aadhaarFrontUrl, "Aadhaar Card Front")} />
                  )}
                  {(processingStudent.profileData?.aadhaarBackUrl || processingStudent.aadhaarBackUrl) && (
                    <PreviewButton label="Aadhaar Back" onClick={() => openImagePreview(processingStudent.profileData?.aadhaarBackUrl || processingStudent.aadhaarBackUrl, "Aadhaar Card Back")} />
                  )}
                  {(processingStudent.profileData?.signUrl || processingStudent.signUrl) && (
                    <PreviewButton label="Signature" onClick={() => openImagePreview(processingStudent.profileData?.signUrl || processingStudent.signUrl, "Student Signature")} />
                  )}
                  {(processingStudent.profileData?.casteCertificateUrl || processingStudent.casteCertificateUrl) && (
                    <PreviewButton label="Caste Certificate" onClick={() => openImagePreview(processingStudent.profileData?.casteCertificateUrl || processingStudent.casteCertificateUrl, "Caste Certificate")} />
                  )}
                  {(processingStudent.profileData?.domicileUrl || processingStudent.domicileUrl) && (
                    <PreviewButton label="Domicile Certificate" onClick={() => openImagePreview(processingStudent.profileData?.domicileUrl || processingStudent.domicileUrl, "Domicile Certificate")} />
                  )}
                  {(processingStudent.profileData?.pwdCertificateUrl || processingStudent.pwdCertificateUrl) && (
                    <PreviewButton label="PWD Certificate" onClick={() => openImagePreview(processingStudent.profileData?.pwdCertificateUrl || processingStudent.pwdCertificateUrl, "PWD Certificate")} />
                  )}
                  {(processingStudent.profileData?.transferCertificateUrl || processingStudent.transferCertificateUrl) && (
                    <PreviewButton label="Transfer Certificate" onClick={() => openImagePreview(processingStudent.profileData?.transferCertificateUrl || processingStudent.transferCertificateUrl, "Transfer Certificate")} />
                  )}
                  {(processingStudent.profileData?.bonafideCertificateUrl || processingStudent.bonafideCertificateUrl) && (
                    <PreviewButton label="Bonafide Certificate" onClick={() => openImagePreview(processingStudent.profileData?.bonafideCertificateUrl || processingStudent.bonafideCertificateUrl, "Bonafide Certificate")} />
                  )}
                  {(processingStudent.profileData?.trainingCertificateUrl || processingStudent.trainingCertificateUrl) && (
                    <PreviewButton label="Training Certificate" onClick={() => openImagePreview(processingStudent.profileData?.trainingCertificateUrl || processingStudent.trainingCertificateUrl, "Training Certificate")} />
                  )}
                  {(processingStudent.profileData?.bankPassbookUrl || processingStudent.bankPassbookUrl) && (
                    <PreviewButton label="Bank Document" onClick={() => openImagePreview(processingStudent.profileData?.bankPassbookUrl || processingStudent.bankPassbookUrl, "Bank Document")} />
                  )}
                  {(processingStudent.profileData?.panCardUrl || processingStudent.panCardUrl) && (
                    <PreviewButton label="PAN Card" onClick={() => openImagePreview(processingStudent.profileData?.panCardUrl || processingStudent.panCardUrl, "PAN Card")} />
                  )}
                  {(processingStudent.profileData?.sscMarksheetUrl || processingStudent.sscMarksheetUrl) && (
                    <PreviewButton label="SSC Marksheet" onClick={() => openImagePreview(processingStudent.profileData?.sscMarksheetUrl || processingStudent.sscMarksheetUrl, "SSC Marksheet")} />
                  )}
                  {(processingStudent.profileData?.hscMarksheetUrl || processingStudent.hscMarksheetUrl) && (
                    <PreviewButton label="HSC Marksheet" onClick={() => openImagePreview(processingStudent.profileData?.hscMarksheetUrl || processingStudent.hscMarksheetUrl, "HSC Marksheet")} />
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
                  <DetailItem label="Marital Status" value={processingStudent.profileData?.maritalStatus} />
                  <DetailItem label="Religion" value={processingStudent.profileData?.religion} />
                  <DetailItem label="Caste" value={processingStudent.profileData?.caste} />
                  <DetailItem label="Mother Tongue" value={processingStudent.profileData?.motherTongue} />
                  <div className="col-span-2">
                    <DetailItem label="Full Address" value={processingStudent.address || processingStudent.profileData?.address} />
                  </div>
                </div>
              </section>

              {/* Bank & Work Info */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <Landmark size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Bank & Experience</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <DetailItem label="Bank Name" value={processingStudent.profileData?.bankName} />
                  <DetailItem label="Account Number" value={processingStudent.profileData?.accountNumber} />
                  <DetailItem label="IFSC Code" value={processingStudent.profileData?.ifscCode} />
                  <DetailItem label="Bank Branch" value={processingStudent.profileData?.bankBranch} />
                  <div className="col-span-2 pt-2 border-t border-slate-100">
                    <DetailItem label="Work Experience" value={processingStudent.profileData?.workExperience || 'No previous experience recorded'} />
                  </div>
                </div>
              </section>

              {/* Security Credentials */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <Lock size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Security Credentials</h4>
                </div>
                <div className="grid grid-cols-1 gap-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <DetailItem label="Login Email" value={processingStudent.studentEmail} />
                    <div className="mt-3">
                       <p className="text-[9px] font-black text-slate-400 capitalize tracking-tight mb-1">Account Password</p>
                       <p className="text-sm font-black text-indigo-600 tracking-widest">{processingStudent.password || '********'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Document Repository */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Document Repository</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {processingStudent.profileData?.photoUrl && (
                    <PreviewButton label="Profile Photo" onClick={() => openImagePreview(processingStudent.profileData.photoUrl, "Student Photo")} />
                  )}
                  {processingStudent.profileData?.signUrl && (
                    <PreviewButton label="Signature" onClick={() => openImagePreview(processingStudent.profileData.signUrl, "Student Signature")} />
                  )}
                  {processingStudent.profileData?.aadhaarFrontUrl && (
                    <PreviewButton label="Aadhaar Front" onClick={() => openImagePreview(processingStudent.profileData.aadhaarFrontUrl, "Aadhaar Card Front")} />
                  )}
                  {processingStudent.profileData?.aadhaarBackUrl && (
                    <PreviewButton label="Aadhaar Back" onClick={() => openImagePreview(processingStudent.profileData.aadhaarBackUrl, "Aadhaar Card Back")} />
                  )}
                  {processingStudent.profileData?.casteCertificateUrl && (
                    <PreviewButton label="Caste Certificate" onClick={() => openImagePreview(processingStudent.profileData.casteCertificateUrl, "Caste Certificate")} />
                  )}
                  {processingStudent.profileData?.domicileUrl && (
                    <PreviewButton label="Domicile Certificate" onClick={() => openImagePreview(processingStudent.profileData.domicileUrl, "Domicile Certificate")} />
                  )}
                  {processingStudent.profileData?.bankPassbookUrl && (
                    <PreviewButton label="Bank Passbook" onClick={() => openImagePreview(processingStudent.profileData.bankPassbookUrl, "Bank Passbook")} />
                  )}
                  {processingStudent.profileData?.panCardUrl && (
                    <PreviewButton label="PAN Card" onClick={() => openImagePreview(processingStudent.profileData.panCardUrl, "PAN Card")} />
                  )}
                  {processingStudent.profileData?.transferCertificateUrl && (
                    <PreviewButton label="Transfer Certificate" onClick={() => openImagePreview(processingStudent.profileData.transferCertificateUrl, "Transfer Certificate")} />
                  )}
                  {processingStudent.profileData?.bonafideCertificateUrl && (
                    <PreviewButton label="Bonafide Certificate" onClick={() => openImagePreview(processingStudent.profileData.bonafideCertificateUrl, "Bonafide Certificate")} />
                  )}
                  {processingStudent.profileData?.trainingCertificateUrl && (
                    <PreviewButton label="Other Documents" onClick={() => openImagePreview(processingStudent.profileData.trainingCertificateUrl, "Other Documents")} />
                  )}
                  {processingStudent.profileData?.sscMarksheetUrl && (
                    <PreviewButton label="SSC Marksheet (10th)" onClick={() => openImagePreview(processingStudent.profileData.sscMarksheetUrl, "SSC Marksheet")} />
                  )}
                  {processingStudent.profileData?.hscMarksheetUrl && (
                    <PreviewButton label="HSC Marksheet (12th)" onClick={() => openImagePreview(processingStudent.profileData.hscMarksheetUrl, "HSC Marksheet")} />
                  )}
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
          <div className="p-8 bg-white border-t border-black flex flex-col sm:flex-row items-center justify-between shrink-0 rounded-b-[3rem] gap-4">
             <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${processingStudent.admissionStatus === 'Confirmed' || processingStudent.admissionStatus === 'Accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                 <p className="text-[13px] font-black text-black capitalize tracking-tight">
                    Current Status: <span className={processingStudent.admissionStatus === 'Confirmed' || processingStudent.admissionStatus === 'Accepted' ? 'text-emerald-600' : 'text-amber-600'}>{processingStudent.admissionStatus || 'Pending Processing'}</span>
                </p>
             </div>
             
             <div className="flex flex-wrap gap-3 justify-end">
                {/* Edit Application Form */}
                <button 
                  onClick={() => { setIsProcessModalOpen(false); handleEditOpen(processingStudent); }}
                  className="bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white font-black px-6 py-3 rounded-2xl text-[11px] capitalize tracking-normal transition-all flex items-center gap-2 border border-amber-200"
                >
                  <Edit2 size={16} /> Edit Application Form
                </button>

                {(processingStudent.admissionStatus !== 'Confirmed' && processingStudent.admissionStatus !== 'Accepted') && (
                  <>
                    <button 
                      onClick={handleRejectAdmission}
                      disabled={isSubmitting}
                      className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-black px-6 py-3 rounded-2xl text-[11px] capitalize tracking-normal transition-all flex items-center gap-2 border border-rose-100 disabled:opacity-50"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                    <button 
                      onClick={handleAcceptAdmission}
                      disabled={isSubmitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl text-[11px] capitalize tracking-normal transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} /> Accept Admission
                    </button>
                  </>
                )}
                {(processingStudent.admissionStatus === 'Confirmed' || processingStudent.admissionStatus === 'Accepted') && (
                  <button 
                    disabled
                    className="bg-slate-100 text-slate-400 font-black px-6 py-3 rounded-2xl text-[11px] capitalize tracking-normal border border-slate-200 flex items-center gap-2 cursor-not-allowed"
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





