'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get, set, push, update, remove } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { 
  PhoneCall, X, CheckCircle2, XCircle, Eye, User, Users, MapPin, Tag, 
  GraduationCap, Briefcase, Landmark, FileText, Image as ImageIcon, 
  Download, Mail, Phone, Calendar, Trash2, Award as AwardIcon, 
  Building2, FileBadge, Unlock, Plus, PenTool, ShieldCheck 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdmissionInquiryManager({ collegeId, collegeName, mode = 'inquiry' }: { collegeId: string | undefined, collegeName?: string, mode?: 'inquiry' | 'list' | 'cancelled' | 'pending' }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [currentDocs, setCurrentDocs] = useState<any[]>([]);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmDate, setConfirmDate] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear().toString());
  const [confirmError, setConfirmError] = useState('');

  const handleConfirmAdmission = async () => {
    setConfirmError('');
    if (!confirmDate) {
      setConfirmError('Please select an admission date.');
      return;
    }
    if (!selectedInquiry || !collegeId) return;

    try {
      setIsProcessing(true);
      
      const admissionsRef = ref(realtimeDb, `colleges/${collegeId}/studentAdmissions`);
      const admissionsSnap = await get(admissionsRef);
      
      // 1. Optional Roll Number Duplicate Check
      if (rollNumber) {
        let duplicateRoll = false;
        if (admissionsSnap.exists()) {
          const admissions = admissionsSnap.val();
          duplicateRoll = Object.values(admissions).some((adm: any) => 
            adm.rollNumber === rollNumber && adm.courseId === selectedInquiry.courseId
          );
        }

        if (duplicateRoll) {
          setConfirmError('Roll number already assigned to another student for this course.');
          setIsProcessing(false);
          return;
        }
      }

      // 2. Auto-generate Registration Number (YYYYMMRXXX)
      const dateObj = new Date(confirmDate);
      const year = String(dateObj.getFullYear());
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}${month}R`;

      let sequence = 1;
      if (admissionsSnap.exists()) {
        const admissions = admissionsSnap.val();
        const samePrefixAdmissions = Object.values(admissions)
          .filter((adm: any) => adm.registrationNumber && adm.registrationNumber.startsWith(prefix));
        
        if (samePrefixAdmissions.length > 0) {
          const maxSeq = Math.max(...samePrefixAdmissions.map((adm: any) => {
            const seqStr = adm.registrationNumber.replace(prefix, '');
            return parseInt(seqStr) || 0;
          }));
          sequence = maxSeq + 1;
        }
      }
      const registrationNumber = `${prefix}${String(sequence).padStart(3, '0')}`;

      // 3. Update inquiry status
      const inquiryRef = ref(realtimeDb, `colleges/${collegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);
      await update(inquiryRef, { status: 'Confirmed' });

      // 4. Create admission record
      const newAdmissionRef = push(ref(realtimeDb, `colleges/${collegeId}/studentAdmissions`));
      await set(newAdmissionRef, {
        ...selectedInquiry,
        admissionDate: confirmDate,
        admissionYear: year,
        rollNumber: rollNumber || 'N/A',
        registrationNumber,
        regNo: registrationNumber, // Support legacy regNo field
        status: 'Confirmed',
        confirmedAt: Date.now()
      });

      // 5. Update student's application and main profile with full confirmed details
      if (selectedInquiry.studentUid) {
        const userRef = ref(realtimeDb, `users/${selectedInquiry.studentUid}`);
        const appsRef = ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        
        const updateData = {
          ...selectedInquiry,
          status: 'Confirmed',
          registrationNumber: registrationNumber,
          regNo: registrationNumber,
          admissionDate: confirmDate,
          rollNumber: rollNumber || 'N/A',
          confirmedAt: Date.now(),
          verificationStatus: 'Verified',
          paymentStatus: 'Pending'
        };

        const updates: any = {};
        // Find the correct application by matching the applicationId property
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [key, app] of Object.entries(apps)) {
            if ((app as any).applicationId === selectedInquiry.applicationId || 
                ((app as any).courseName === selectedInquiry.courseName && (app as any).collegeId === selectedInquiry.collegeId)) {
              updates[`applications/${key}`] = updateData;
              break;
            }
          }
        }
        
        // Always update primary profile fields for immediate dashboard feedback
        updates['course'] = selectedInquiry.courseName;
        updates['collegeId'] = selectedInquiry.collegeId;
        updates['collegeName'] = selectedInquiry.collegeName;
        updates['fees'] = selectedInquiry.fees || '0';
        updates['regNo'] = registrationNumber;
        updates['status'] = 'Confirmed';

        await update(userRef, updates);
      }

      setIsConfirmModalOpen(false);
      setSelectedInquiry(null);
      setIsProcessModalOpen(false);
      setConfirmDate('');
      setRollNumber('');
    } catch (err) {
      console.error(err);
      setConfirmError('Failed to confirm admission. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchStudentDocs = async (uid: string) => {
    if (!uid) { alert("UID missing for this portal application."); return; }
    setIsFetchingDocs(true);
    setIsDocsModalOpen(true);
    try {
      const customDocsRef = ref(realtimeDb, `users/${uid}/customDocuments`);
      const profileRef = ref(realtimeDb, `users/${uid}/profile`);
      
      const [customSnap, profileSnap] = await Promise.all([get(customDocsRef), get(profileRef)]);
      
      let allDocs: any[] = [];
      
      if (profileSnap.exists()) {
        const p = profileSnap.val();
        const profileDocs = [
          { name: 'Aadhar Front', url: p.aadhaarFrontUrl },
          { name: 'Aadhar Back', url: p.aadhaarBackUrl },
          { name: 'Caste Certificate', url: p.casteCertificateUrl },
          { name: 'Training Certificate', url: p.trainingCertificateUrl },
          { name: 'PAN Card', url: p.panCardUrl },
          { name: 'Bank Passbook', url: p.bankPassbookUrl }
        ].filter(d => d.url);
        allDocs = [...profileDocs];
      }
      
      if (customSnap.exists()) {
        const custom = Object.entries(customSnap.val()).map(([id, val]: any) => ({
          name: val.name,
          url: val.fileUrl
        }));
        allDocs = [...allDocs, ...custom];
      }
      
      setCurrentDocs(allDocs);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch documents.");
    } finally {
      setIsFetchingDocs(false);
    }
  };

  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

  const openImagePreview = (url: string, title: string) => {
    setPreviewImage({ url, title });
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    if (!realtimeDb) {
      setLoading(false);
      return;
    }

    if (collegeId) {
      // Institutional View (College/Staff)
      const inquiryRef = ref(realtimeDb, `colleges/${collegeId}/frontOffice/admissionInquiries`);
      const unsub = onValue(inquiryRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const sortedInqs = Object.entries(data)
            .map(([id, val]: any) => ({ ...val, id }))
            .sort((a, b) => new Date(b.appliedAt || b.date || 0).getTime() - new Date(a.appliedAt || a.date || 0).getTime());
          setInquiries(sortedInqs);
        } else {
          setInquiries([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Inquiry fetch error:", error);
        setLoading(false);
      });
      return () => unsub();
    } else {
      // Global View for Admin - Only fetch colleges here
      const collegesRef = ref(realtimeDb, 'colleges');
      const unsubColleges = onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          const colleges = snap.val();
          setAvailableColleges(Object.entries(colleges).map(([id, val]: any) => ({ id, ...val })));
          
          let allInquiries: any[] = [];
          Object.entries(colleges).forEach(([cId, cData]: [string, any]) => {
            if (cData && typeof cData === 'object' && cData.frontOffice?.admissionInquiries) {
              const inqData = cData.frontOffice.admissionInquiries;
              const inqs = Object.entries(inqData).map(([id, val]: any) => ({ 
                ...val,
                id, 
                collegeId: cId, 
                collegeName: cData.name || 'Unknown Institution'
              }));
              allInquiries = [...allInquiries, ...inqs];
            }
          });
          setInquiries(allInquiries.sort((a, b) => new Date(b.appliedAt || b.date || 0).getTime() - new Date(a.appliedAt || a.date || 0).getTime()));
        } else {
          setInquiries([]);
          setAvailableColleges([]);
        }
        setLoading(false);
      });
      return () => unsubColleges();
    }
  }, [collegeId]);


  const filteredInquiries = inquiries.filter(inq => {
    const isFromStudentPortal = inq.source === 'Student Portal' || inq.source === 'Online Student Portal' || !!inq.studentUid;
    const isPendingOrAccepted = !inq.status || ['Pending', 'New', 'Submitted', 'Accepted', 'Confirmed', 'Unlocked', 'Updated', 'Viewed'].includes(inq.status);
    
    const matchesCollege = collegeId 
      ? true 
      : (!selectedCollegeId || inq.collegeId === selectedCollegeId);

    if (mode === 'list') {
      // Admission Confirm: Show only processed/verified applications
      const confirmStatuses = ['Accepted', 'Confirmed', 'Updated'];
      return matchesCollege && isFromStudentPortal && confirmStatuses.includes(inq.status || '');
    } else if (mode === 'pending') {
      // Pending Admission: Show applications awaiting initial verification (ONLY LOCKED)
      const pendingStatuses = ['Pending', 'New', 'Submitted', 'Unlocked', 'Updated', 'Viewed'];
      return matchesCollege && isFromStudentPortal && pendingStatuses.includes(inq.status || 'New') && (inq.profileLocked || inq.isLocked);
    } else if (mode === 'cancelled') {
      // Cancel Admission: Show rejected applications
      return matchesCollege && inq.status === 'Rejected';
    } else {
      // Admission Inquiry: Show non-student-portal entries (website walk-ins etc.)
      if (isFromStudentPortal) return false;
      return matchesCollege && isPendingOrAccepted;
    }
  });

  const handleProcessClick = async (inq: any) => {
    setSelectedInquiry(inq);
    setStudentProfile(null);
    setShowPreview(true);
    setIsProcessModalOpen(true);
    if (inq.studentUid) {
      const userRef = ref(realtimeDb, `users/${inq.studentUid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        setStudentProfile(snap.val());
      }
    }
  };


  const handleUnlockProfile = async () => {
    if (!selectedInquiry || !selectedInquiry.studentUid) {
      alert("No linked student account found to unlock.");
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to unlock ${selectedInquiry.studentName || 'this student'}'s profile? They will be able to edit their details again.`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const uid = selectedInquiry.studentUid;
      const targetCollegeId = selectedInquiry.collegeId || collegeId;

      // 1. Update global users node
      await update(ref(realtimeDb, `users/${uid}/profile`), {
        profileLocked: false,
        status: 'Unlocked'
      });
      
      // 2. Update admission inquiry record
      const inqRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);
      await update(inqRef, {
        profileLocked: false,
        status: 'Unlocked'
      });

      alert('Profile unlocked successfully. The student can now edit their details and the status is set to "Unlocked".');
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error('Error unlocking profile:', error);
      alert('Failed to unlock profile.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (action: 'Accept' | 'Reject') => {
    const targetCollegeId = selectedInquiry.collegeId || collegeId;
    if (!selectedInquiry || !targetCollegeId) return;
    setIsProcessing(true);
    try {
      const inqRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);
      const inquiryStatus = action === 'Accept' ? 'Confirmed' : 'Rejected';
      
      // 1. Update Inquiry Status
      await update(inqRef, { status: inquiryStatus, processedAt: new Date().toISOString() });
      
      // 2. Update Student's Application Status
      if (selectedInquiry.studentUid) {
        const appsRef = ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
           const apps = appsSnap.val();
           for (const [appId, appData] of Object.entries(apps)) {
              if ((appData as any).applicationId === selectedInquiry.applicationId ||
                  (appData as any).courseName === selectedInquiry.courseName) {
                  await update(ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications/${appId}`), {
                    ...selectedInquiry,
                    status: inquiryStatus,
                    isActive: action === 'Accept' ? true : false
                  });
                 break;
              }
           }
        }

        // Also update profile status
        await update(ref(realtimeDb, `users/${selectedInquiry.studentUid}/profile`), {
          status: action === 'Accept' ? 'Confirmed' : 'Rejected',
          isAdmitted: action === 'Accept'
        });
      }

      if (action === 'Accept') {
          // 3. Create full student admission record with complete profile data
          const admissionRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/studentAdmissions`));
          await set(admissionRef, {
            // Full profile data spread from inquiry (contains ...formData from lock)
            ...selectedInquiry,
            // Overwrite key admission fields
            id: undefined, // Remove the inquiry ID
            studentUid: selectedInquiry.studentUid,
            studentName: selectedInquiry.studentName || `${selectedInquiry.firstName || ''} ${selectedInquiry.lastName || ''}`.trim(),
            studentEmail: selectedInquiry.studentEmail || selectedInquiry.email,
            studentPhone: selectedInquiry.studentPhone || selectedInquiry.phone,
            courseName: selectedInquiry.courseName,
            courseType: selectedInquiry.courseType || 'Regular',
            fees: selectedInquiry.fees || '0',
            admissionDate: new Date().toISOString(),
            admissionStatus: 'Confirmed',
            status: 'Confirmed',
            inquiryId: selectedInquiry.id,
            applicationId: selectedInquiry.applicationId,
            regNo: selectedInquiry.regNo || 'PENDING',
            collegeId: targetCollegeId,
            collegeName: selectedInquiry.collegeName,
            confirmedAt: new Date().toISOString(),
            isActive: true
          });

          alert(`SUCCESS: Application from ${selectedInquiry.studentName} has been CONFIRMED. Admission record created.`);
      } else if (action === 'Reject') {
         // Move to institutional trash
         const trashRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/trash`));
         await set(trashRef, {
           type: 'Admission Inquiry',
           data: selectedInquiry,
           deletedAt: new Date().toISOString(),
           reason: 'Rejected by Admin'
         });
         
         // Move to global admin trash
         const adminTrashRef = push(ref(realtimeDb, `admin/trash`));
         await set(adminTrashRef, {
           type: 'Admission Inquiry Rejected',
           collegeId: targetCollegeId,
           data: selectedInquiry,
           deletedAt: new Date().toISOString()
         });

         alert(`Application for ${selectedInquiry.studentName} has been REJECTED and moved to trash.`);
      }

      setIsProcessModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to process inquiry. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleQuickAction = async (inq: any, action: 'Accept' | 'Reject') => {
    const targetCollegeId = inq.collegeId || collegeId;
    if (!targetCollegeId) return;
    
    const status = action === 'Accept' ? 'Viewed' : 'Rejected';
    const confirmed = window.confirm(`Are you sure you want to mark ${inq.studentName}'s inquiry as ${status.toLowerCase()}?`);
    if (!confirmed) return;
    
    try {
      const inqRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${inq.id}`);
      
      // 1. Update Inquiry
      await update(inqRef, { status, processedAt: new Date().toISOString() });

      // 2. Update Student User App
      if (inq.studentUid) {
        const appsRef = ref(realtimeDb, `users/${inq.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appId, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === inq.applicationId) {
              await set(ref(realtimeDb, `users/${inq.studentUid}/applications/${appId}/status`), status);
              break;
            }
          }
        }
      }

      if (action === 'Accept') {
        alert(`Inquiry from ${inq.studentName} marked as VIEWED.`);
      } else {
        const trashRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/trash`));
        await set(trashRef, { type: 'Admission Inquiry', data: inq, deletedAt: new Date().toISOString() });
        const adminTrashRef = push(ref(realtimeDb, `admin/trash`));
        await set(adminTrashRef, { type: 'Admission Inquiry Rejected', collegeId: targetCollegeId, data: inq, deletedAt: new Date().toISOString() });
        alert(`Admission for ${inq.studentName} Rejected.`);
      }

    } catch (err) {
      console.error(err);
      alert('Failed to process quick action.');
    }
  };

  const handleDeleteInquiry = async (inq: any) => {
    if (!window.confirm('Are you sure you want to delete this inquiry? it will be moved to trash.')) return;
    
    try {
      const targetCollegeId = inq.collegeId || collegeId;
      if (!targetCollegeId) return;

      // 1. Add to Global Trash
      const adminTrashRef = push(ref(realtimeDb, `admin/trash`));
      await set(adminTrashRef, { 
        type: 'Admission Inquiry', 
        data: inq, 
        originalId: inq.id,
        collegeId: targetCollegeId,
        deletedAt: Date.now()
      });

      // 2. Remove from Student's personal application panel and reset profile
      if (inq.studentUid) {
        const uid = inq.studentUid;
        
        // Reset profile status to allow re-application
        const userProfileRef = ref(realtimeDb, `users/${uid}/profile`);
        await update(userProfileRef, {
          profileLocked: false,
          course: 'Not Selected',
          status: 'In Progress'
        });

        // Also update the main user node if course is there
        await update(ref(realtimeDb, `users/${uid}`), {
          course: 'Not Selected'
        });

        if (inq.applicationId) {
          const userAppsRef = ref(realtimeDb, `users/${uid}/applications`);
          const snapshot = await get(userAppsRef);
          if (snapshot.exists()) {
            const apps = snapshot.val();
            for (const [key, val] of Object.entries(apps)) {
              if ((val as any).applicationId === inq.applicationId) {
                await remove(ref(realtimeDb, `users/${uid}/applications/${key}`));
                break;
              }
            }
          }
        }
      }

      // 3. Remove from Original Path
      const inqRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${inq.id}`);
      await set(inqRef, null);

      alert('Inquiry deleted and removed from student panel successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete inquiry.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-black rounded-full" />
          <div className="w-12 h-12 border-4 border-t-[#5D5fb1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-normal capitalize tracking-normal text-black animate-pulse">Synchronizing Applications</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className={cn(
        "rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden transition-all duration-500",
        mode === 'inquiry' ? "bg-[#5D5fb1]" : "bg-[#002147]"
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            {mode === 'inquiry' ? <PhoneCall size={14} className="text-[#00a5a5]" /> : mode === 'cancelled' ? <XCircle size={14} className="text-red-400" /> : <FileBadge size={14} className="text-[#00a5a5]" />} 
            {mode === 'inquiry' ? 'Front Office' : mode === 'cancelled' ? 'Cancellation Registry' : 'Student Registry'}
          </div>
          <h2 className="text-4xl font-normal tracking-tighter capitalize leading-none text-white">
            {mode === 'inquiry' ? 'Admission Inquiry' : mode === 'cancelled' ? 'Cancel Admission' : 'Admission List'}
          </h2>
          <p className="text-sm font-normal text-white/70">
            {mode === 'inquiry' 
              ? 'Monitor and manage incoming admission requests from candidates.' 
              : mode === 'cancelled'
              ? 'Review rejected admission applications and cancelled requests.'
              : 'Formal list of applicants awaiting institutional admission processing.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-black shadow-sm overflow-hidden p-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl font-bold text-black capitalize tracking-tight">Student Application List</h3>
            <div className="flex flex-col md:flex-row items-center gap-4">
               {!collegeId && (
                 <select 
                   value={selectedCollegeId}
                   onChange={(e) => setSelectedCollegeId(e.target.value)}
                   className="bg-slate-50 border border-black rounded-xl px-4 py-2 text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#5D5fb1] transition-all"
                 >
                    <option value="">All Colleges</option>
                    {availableColleges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                 </select>
               )}
               <div className="text-[13px] font-normal text-black capitalize tracking-tight bg-[#5D5fb1]/10 px-4 py-2 rounded-full whitespace-nowrap">
                 {filteredInquiries.length} Total Requests
               </div>
            </div>
         </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
              <thead>
                <tr className="bg-slate-50/50 border-b border-black">
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black text-center w-16">Sr No.</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Date & Time</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">College</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Student Name</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Application Type</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Course</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight border-r border-black">Contact Info</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight text-center border-r border-black">Status</th>
                  <th className="px-6 py-5 text-[13px] font-normal text-black uppercase tracking-tight">Actions</th>
                </tr>
              </thead>
              <tbody className="border-b border-black">
                {Array.isArray(filteredInquiries) && filteredInquiries.length > 0 ? (
                  filteredInquiries.map((inq, i) => (
                    <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                      <td className="px-6 py-6 border-r border-black text-center text-[13px] font-normal text-black">
                        {i + 1}
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                        <div className="flex flex-col gap-1">
                          <p className="text-[14px] font-medium text-black">
                            {(() => {
                              const dateVal = inq.appliedAt || inq.date;
                              if (!dateVal) return 'N/A';
                              const d = new Date(dateVal);
                              return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                            })()}
                          </p>
                          {mode === 'inquiry' && (
                            <p className="text-[12px] text-[#5D5fb1] font-bold tracking-tight capitalize bg-indigo-50 px-2 py-0.5 rounded inline-block w-fit">
                              {inq.source || 'Website'}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                              <Building2 size={14} />
                            </div>
                             <span className="text-[13px] font-bold text-black capitalize tracking-tight">
                               {inq.collegeName || collegeName || 'N/A'}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                         <p className="text-[14px] font-medium text-black capitalize tracking-tight">
                           {inq.studentName || `${inq.firstName || ''} ${inq.lastName || ''}`.trim() || 'N/A'}
                         </p>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                         <span className="text-[12px] font-black text-indigo-500 capitalize tracking-tight bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                           {inq.courseType || inq.applicationType || 'Reg'}
                         </span>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                         <p className="text-[14px] font-medium text-black capitalize">{inq.courseName}</p>
                      </td>
                      <td className="px-6 py-6 border-r border-black">
                         <div className="space-y-1">
                            <p className="text-[12px] font-medium text-black flex items-center gap-2">
                               <Phone size={12} className="text-[#00a5a5]" /> {inq.studentPhone || 'N/A'}
                            </p>
                            <p className="text-[12px] font-medium text-black flex items-center gap-2">
                               <Mail size={12} className="text-[#00a5a5]" /> {inq.studentEmail || 'N/A'}
                            </p>
                         </div>
                      </td>
                       <td className="px-6 py-6 text-center border-r border-black">
                           <span className={`px-3 py-1.5 rounded-full text-[14px] font-black tracking-tight capitalize border border-black ${
                             inq.status === 'Accepted' || inq.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                             inq.status === 'Rejected' ? 'bg-red-50 text-red-600' : 
                             inq.status === 'Unlocked' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                             inq.status === 'Updated' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                             (inq.profileLocked || inq.isLocked) ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                             'bg-amber-50 text-amber-500'
                           }`}>
                             {(inq.profileLocked || inq.isLocked) && inq.status !== 'Updated' ? 'LOCKED' : inq.status || 'New'}
                           </span>
                       </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            {mode === 'pending' ? (
                              <button
                                onClick={() => handleProcessClick(inq)}
                                className="flex items-center gap-2 bg-[#5D5fb1] text-white px-6 py-2 rounded-xl text-[14px] font-bold capitalize tracking-tight hover:bg-black transition-all shadow-sm border border-black"
                              >
                                <PenTool size={14} /> Process
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleProcessClick(inq)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-black"
                                  title="Preview Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInquiry(inq)}
                                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-black"
                                  title="Delete Inquiry"
                                >
                                  <Trash2 size={16} />
                                </button>
                                 {(!inq.status || inq.status === 'Pending' || inq.status === 'New' || inq.status === 'Unlocked' || inq.status === 'Updated') ? (
                                  <button
                                    onClick={() => handleProcessClick(inq)}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-black uppercase"
                                  >
                                    Accept
                                  </button>
                                ) : (
                                   <div className="px-4 py-2 bg-slate-50 text-slate-400 text-[11px] font-black rounded-lg border border-slate-200 uppercase cursor-not-allowed">
                                     Processed
                                   </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <Mail size={48} className="opacity-10" />
                        <p className="text-[13px] font-normal text-black capitalize tracking-normal">No admission inquiries found in the institutional registry</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

      {/* Process Modal */}
      {isProcessModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsProcessModalOpen(false)} />
          <div className="bg-[#f8fafc] w-full max-w-5xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
             <div className="bg-[#5D5fb1] p-8 text-white relative shrink-0">
                <button 
                  onClick={() => setIsProcessModalOpen(false)}
                  className="absolute right-8 top-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl">
                     {(selectedInquiry.photoUrl || studentProfile?.profile?.photoUrl) ? (
                       <img src={selectedInquiry.photoUrl || studentProfile.profile.photoUrl} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                         <User size={32} />
                       </div>
                     )}
                   </div>
                   <div>
                     <div className="flex items-center gap-3 mb-1">
                       <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">
                         {selectedInquiry.studentName || `${selectedInquiry.firstName || ''} ${selectedInquiry.lastName || ''}`.trim() || 'New Applicant'}
                       </h3>
                       <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black capitalize tracking-tight border border-emerald-500/30 flex items-center gap-1">
                         <Tag size={10} /> {selectedInquiry.applicationId || 'PENDING'}
                       </span>
                     </div>
                     <div className="flex items-center gap-6 text-white/60">
                       <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2">
                         <Mail size={12} className="text-[#5D5fb1]" /> {selectedInquiry.studentEmail}
                       </p>
                       <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2">
                         <Phone size={12} className="text-[#5D5fb1]" /> {selectedInquiry.studentPhone}
                       </p>
                       <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2">
                         <Calendar size={12} className="text-[#5D5fb1]" /> Course: {selectedInquiry.courseName}
                       </p>
                     </div>
                   </div>
                </div>
             </div>
             
             <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-12">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  
                  {/* Detailed Profile Summary (Replicated from Student Portal) */}
                  {(studentProfile || selectedInquiry.profileLocked) && (
                    <div className="bg-white border-[0.5px] border-black rounded-md shadow-sm overflow-hidden text-[#343a40]">
                      <div className="bg-[#002147] text-white py-4 px-8 font-black text-sm tracking-widest flex items-center justify-between uppercase">
                        <span>LOCKED PROFILE SUMMARY</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[10px]">
                          <ShieldCheck size={12} className="text-[#00a5a5]" /> VERIFIED DATA
                        </div>
                      </div>
                      <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <tbody>
                              <tr className="border-b-[0.5px] border-black">
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase w-1/4">Registration Number</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.regNo || studentProfile?.regNo || 'N/A'}</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase w-1/4">Full Name</td>
                                <td className="px-8 py-5 text-sm font-bold capitalize">{selectedInquiry.studentName || `${studentProfile?.profile?.firstName || ''} ${studentProfile?.profile?.lastName || ''}`.trim() || 'N/A'}</td>
                              </tr>
                              <tr className="border-b-[0.5px] border-black">
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase">Gender</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.gender || studentProfile?.profile?.gender || 'N/A'}</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase">Date of Birth</td>
                                <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.dateOfBirth || studentProfile?.profile?.dateOfBirth || 'N/A'}</td>
                              </tr>
                              <tr className="border-b-[0.5px] border-black">
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase">Mobile Number</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.studentPhone || studentProfile?.profile?.phone || 'N/A'}</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase">Email ID</td>
                                <td className="px-8 py-5 text-sm font-bold">{selectedInquiry.studentEmail || studentProfile?.email || 'N/A'}</td>
                              </tr>
                              <tr className="border-b-[0.5px] border-black">
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase">Aadhaar Number</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.aadhaarNo || studentProfile?.profile?.aadhaarNo || 'N/A'}</td>
                                <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#00a5a5] uppercase">Admission Status</td>
                                <td className={cn(
                                  "px-8 py-5 text-sm font-black uppercase",
                                  selectedInquiry.status === 'Accepted' || selectedInquiry.status === 'Confirmed' || selectedInquiry.status === 'Updated' ? "text-emerald-600" : "text-amber-600"
                                )}>
                                  {selectedInquiry.status || 'SUBMITTED'}
                                </td>
                              </tr>
                           </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {/* Candidate Details Section */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                        <User size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Candidate Information</h4>
                    </div>
                     <div className="space-y-3">
                        <DetailItem label="Full Name" value={selectedInquiry.studentName || `${selectedInquiry.firstName || ''} ${selectedInquiry.lastName || ''}`.trim() || 'N/A'} />
                        <DetailItem label="Gender" value={selectedInquiry.gender || 'N/A'} />
                        <DetailItem label="Date of Birth" value={selectedInquiry.dateOfBirth || selectedInquiry.dob || 'N/A'} />
                        <DetailItem label="Aadhaar Number" value={selectedInquiry.aadhaarNo || selectedInquiry.aadharNumber || 'N/A'} />
                        <DetailItem label="Email Address" value={selectedInquiry.studentEmail || selectedInquiry.email || 'N/A'} />
                        <DetailItem label="Phone Number" value={selectedInquiry.studentPhone || selectedInquiry.phone || 'N/A'} />
                     </div>
                  </section>

                   {/* Academic Interest Section */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                        <GraduationCap size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Academic Interest</h4>
                    </div>
                    <div className="space-y-3">
                      <DetailItem label="Applied Institution" value={selectedInquiry.collegeName} />
                      <DetailItem label="Selected Course" value={selectedInquiry.courseName} />
                      <DetailItem label="Course Type" value={selectedInquiry.courseType || 'N/A'} />
                      <DetailItem label="Current Address" value={selectedInquiry.address || 'N/A'} />
                      <DetailItem label="Permanent Address" value={selectedInquiry.permanentAddress || 'N/A'} />
                    </div>
                  </section>

                  {/* Parental Information */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                        <Users size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Parental Information</h4>
                    </div>
                    <div className="space-y-3">
                      <DetailItem label="Father Name" value={`${selectedInquiry.fatherFirstName || ''} ${selectedInquiry.fatherMiddleName || ''} ${selectedInquiry.fatherLastName || ''}`} />
                      <DetailItem label="Mother Name" value={selectedInquiry.motherName} />
                      <DetailItem label="Father Phone" value={selectedInquiry.fatherPhone} />
                      <DetailItem label="Father Occupation" value={selectedInquiry.fatherOccupation} />
                    </div>
                  </section>

                  {/* Category & Domicile */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                        <Tag size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Category & Domicile</h4>
                    </div>
                    <div className="space-y-3">
                      <DetailItem label="Caste Category" value={selectedInquiry.casteCategory} />
                      <DetailItem label="Sub-Caste" value={selectedInquiry.subCaste} />
                      <DetailItem label="Religion" value={selectedInquiry.religion} />
                      <DetailItem label="Nationality" value={selectedInquiry.nationality} />
                      <DetailItem label="Maharashtra Domicile" value={selectedInquiry.isMaharashtraDomiciled} />
                    </div>
                  </section>

                  {/* Additional Information */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                        <Plus size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Additional Details</h4>
                    </div>
                    <div className="space-y-3">
                      <DetailItem label="Blood Group" value={selectedInquiry.bloodGroup} />
                      <DetailItem label="Mother Tongue" value={selectedInquiry.motherTongue} />
                      <DetailItem label="Completed Training" value={selectedInquiry.hasTraining} />
                      {selectedInquiry.hasTraining === 'Yes' && (
                        <DetailItem label="Training Details" value={selectedInquiry.trainingDetails} />
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {(selectedInquiry.languagesKnown || []).map((l: any, idx: number) => (
                           <div key={idx} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                              {l.language} ({l.read ? 'R' : ''}{l.write ? 'W' : ''}{l.speak ? 'S' : ''})
                           </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Bank & Identity */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                        <Landmark size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Bank & Identity</h4>
                    </div>
                    <div className="space-y-3">
                      <DetailItem label="PAN Card Number" value={selectedInquiry.panCardNo} />
                      {selectedInquiry.hasBankAccount === 'Yes' && (
                        <>
                          <DetailItem label="Bank Name" value={selectedInquiry.bankName} />
                          <DetailItem label="Account Number" value={selectedInquiry.accountNumber} />
                          <DetailItem label="IFSC Code" value={selectedInquiry.ifscCode} />
                          <DetailItem label="Holder Name" value={selectedInquiry.accountHolderName} />
                        </>
                      )}
                    </div>
                  </section>

                  {/* Work Experience */}
                  {selectedInquiry.hasWorkExperience === 'Yes' && (selectedInquiry.workExperiences || []).length > 0 && (
                    <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                      <div className="flex items-center gap-3 border-b border-black pb-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                          <Briefcase size={20} />
                        </div>
                        <h4 className="text-sm font-normal text-black capitalize tracking-tight">Work Experience</h4>
                      </div>
                      <div className="space-y-4">
                         {selectedInquiry.workExperiences.map((exp: any, idx: number) => (
                           <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                              <div className="flex justify-between">
                                 <p className="text-sm font-bold text-black">{exp.organization}</p>
                                 <p className="text-[11px] font-medium text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                                   {exp.fromDate} to {exp.toDate}
                                 </p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{exp.designation}</p>
                           </div>
                         ))}
                      </div>
                    </section>
                  )}

                  {/* Qualifications Table */}
                  {selectedInquiry.qualifications && selectedInquiry.qualifications.length > 0 && (
                    <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                      <div className="flex items-center gap-3 border-b border-black pb-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                          <AwardIcon size={20} />
                        </div>
                        <h4 className="text-sm font-normal text-black capitalize tracking-tight">Educational Qualifications</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-black">
                          <thead>
                            <tr className="bg-slate-50 text-[13px] font-normal text-black uppercase tracking-wider border-b border-black">
                              <th className="px-4 py-3 border-r border-black">Examination</th>
                              <th className="px-4 py-3 border-r border-black">Board/University</th>
                              <th className="px-4 py-3 border-r border-black">Passing Year</th>
                              <th className="px-4 py-3 border-r border-black">Marks/Grade</th>
                              <th className="px-4 py-3 text-center">Marksheet</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInquiry.qualifications.map((q: any, i: number) => (
                              <tr key={i} className="text-xs border-b border-black last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4 font-bold border-r border-black">{q.exam}</td>
                                <td className="px-4 py-4 border-r border-black">{q.board}</td>
                                <td className="px-4 py-4 border-r border-black">{q.passingYear}</td>
                                <td className="px-4 py-4 border-r border-black font-medium">{q.marks}</td>
                                <td className="px-4 py-4 text-center">
                                  {q.marksheetUrl ? (
                                    <button 
                                      onClick={() => window.open(q.marksheetUrl, '_blank')}
                                      className="text-[#5D5fb1] hover:underline flex items-center gap-1 justify-center mx-auto"
                                    >
                                      <ImageIcon size={14} /> View
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 italic">No File</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* Uploaded Documents — Inline with View Buttons */}
                  <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-black pb-4">
                      <div className="w-10 h-10 bg-[#00a5a5]/10 rounded-xl flex items-center justify-center text-[#00a5a5]">
                        <FileBadge size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Uploaded Documents</h4>
                    </div>
                    {(() => {
                      const inq = selectedInquiry;
                      const sp = studentProfile?.profile || {};
                      const docs = [
                        { label: 'Student Photo', url: inq.photoUrl || sp.photoUrl },
                        { label: 'Student Signature', url: inq.signatureUrl || sp.signatureUrl },
                        { label: 'Aadhaar Front', url: inq.aadhaarFrontUrl || sp.aadhaarFrontUrl },
                        { label: 'Aadhaar Back', url: inq.aadhaarBackUrl || sp.aadhaarBackUrl },
                        { label: 'Domicile Certificate', url: inq.domicileCertificateUrl || sp.domicileCertificateUrl },
                        { label: 'Caste Certificate', url: inq.casteCertificateUrl || sp.casteCertificateUrl },
                        { label: 'Training Certificate', url: inq.trainingCertificateUrl || sp.trainingCertificateUrl },
                        { label: 'Bank Passbook / Cheque', url: inq.bankPassbookUrl || sp.bankPassbookUrl },
                        { label: 'PAN Card', url: inq.panCardUrl || sp.panCardUrl },
                      ].filter(d => d.url);
                      return docs.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {docs.map((doc, idx) => (
                            <div key={idx} className="border border-black rounded-2xl overflow-hidden bg-slate-50 flex flex-col">
                              <div className="relative h-28 bg-slate-100 overflow-hidden flex items-center justify-center">
                                <img 
                                  src={doc.url} 
                                  alt={doc.label}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all" />
                              </div>
                              <div className="p-3 flex items-center justify-between border-t border-black">
                                <span className="text-[10px] font-bold text-black uppercase tracking-tight leading-tight flex-1 pr-2">{doc.label}</span>
                                <button
                                  onClick={() => window.open(doc.url, '_blank')}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#002147] text-white rounded-xl text-[10px] font-bold hover:bg-[#00a5a5] transition-all shrink-0"
                                >
                                  <Eye size={11} /> View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                          <p className="text-xs text-slate-400">No documents uploaded yet. Student may not have completed all sections.</p>
                          {selectedInquiry.studentUid && (
                            <button
                              onClick={() => fetchStudentDocs(selectedInquiry.studentUid)}
                              className="mt-4 px-6 py-2 bg-[#002147] text-white rounded-xl text-[11px] font-bold hover:bg-black transition-all mx-auto flex items-center gap-2"
                            >
                              <Download size={12} /> Fetch Documents from Portal
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </section>
                </div>
             </div>

             <div className="p-8 border-t border-black bg-slate-50/50 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full ${selectedInquiry.status === 'Accepted' || selectedInquiry.status === 'Confirmed' ? 'bg-emerald-500' : selectedInquiry.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                       <span className="text-[13px] font-normal text-black capitalize tracking-tight">Current Status: {selectedInquiry.status}</span>
                    </div>
                    
                 </div>
                 <div className="flex gap-4">
                   {selectedInquiry.profileLocked && (
                     <button 
                       onClick={handleUnlockProfile}
                       disabled={isProcessing}
                       className="px-6 py-4 bg-orange-50 text-black rounded-2xl text-[13px] font-normal capitalize tracking-tight hover:bg-orange-600 hover:text-black transition-all flex items-center gap-2 border border-orange-100"
                     >
                       <Unlock size={16} /> UNLOCK PROFILE
                     </button>
                   )}
                   <button 
                     onClick={() => handleAction('Reject')}
                     disabled={isProcessing || selectedInquiry.status === 'Rejected' || selectedInquiry.status === 'Confirmed'}
                     className="px-8 py-4 bg-rose-50 text-black rounded-2xl text-[13px] font-normal capitalize tracking-tight hover:bg-rose-600 hover:text-black transition-all disabled:opacity-50"
                   >
                     REJECT
                   </button>
                   <button 
                     onClick={() => setIsConfirmModalOpen(true)}
                     disabled={isProcessing || selectedInquiry.status === 'Confirmed' || selectedInquiry.status === 'Rejected'}
                     className="px-12 py-4 bg-emerald-500 text-black rounded-2xl text-[13px] font-normal capitalize tracking-tight hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                   >
                     <CheckCircle2 size={16} /> CONFIRM ADMISSION
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Confirm Admission Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative z-10">
            <h3 className="text-xl font-bold text-center mb-4">Confirm Admission</h3>
            {confirmError && <p className="text-red-600 text-sm mb-2 text-center">{confirmError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Admission Date</label>
                <input type="date" value={confirmDate} onChange={e => setConfirmDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Roll Number (Optional)</label>
                <input 
                  type="text" 
                  value={rollNumber} 
                  onChange={e => setRollNumber(e.target.value)} 
                  placeholder="Leave blank if not assigned"
                  className="w-full border border-gray-300 rounded-md p-3 text-sm focus:border-[#5D5fb1] outline-none transition-all" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">
                  Cancel
                </button>
                <button onClick={handleConfirmAdmission} disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Documents Modal */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsDocsModalOpen(false)} />
          
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="bg-[#003366] p-8 text-white relative shrink-0">
              <button 
                onClick={() => setIsDocsModalOpen(false)}
                className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center mb-4 shadow-xl border-2 border-white/20">
                <FileBadge size={32} />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Student Documents</h3>
              <p className="text-white/60 text-sm mt-1">Verification of uploaded credentials</p>
            </div>

            <div className="p-8 overflow-y-auto no-scrollbar space-y-4">
              {isFetchingDocs ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00a5a5] rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving secure documents...</p>
                </div>
              ) : currentDocs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {currentDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-[#00a5a5] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#00a5a5] shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 capitalize">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Uploaded Document</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => openImagePreview(doc.url, doc.name)}
                        className="px-6 py-2.5 bg-[#00a5a5] text-white rounded-xl text-[11px] font-bold tracking-tight hover:bg-[#002147] transition-all shadow-md active:scale-95"
                      >
                        VIEW DOCUMENT
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <XCircle size={48} className="mx-auto text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No documents found for this applicant</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 border-t-2 border-slate-100 text-center shrink-0">
               <button 
                 onClick={() => setIsDocsModalOpen(false)}
                 className="px-10 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg"
               >
                 CLOSE VIEWER
               </button>
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
              <h5 className="font-normal text-[#5D5fb1] capitalize tracking-tight text-sm flex items-center gap-2">
                <ImageIcon size={18} className="text-[#5D5fb1]" /> {previewImage.title}
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
  if (!value || value === 'N/A' || value === '') return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
      <p className="text-[13px] font-normal text-black uppercase tracking-tight shrink-0">{label}</p>
      <p className="text-sm font-medium text-black capitalize tracking-tight break-words text-right">{value}</p>
    </div>
  );
}

function PreviewButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-black rounded-xl text-[13px] font-normal text-black capitalize tracking-tight hover:bg-[#5D5fb1] hover:text-black hover:border-[#5D5fb1] transition-all shadow-sm active:scale-95 group"
    >
      <Eye size={12} className="text-[#5D5fb1] group-hover:text-white" /> {label}
    </button>
  );
}
