'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get, set, push, update, remove, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { getDefaultAdminUid } from '@/lib/adminUtils';
import {
  PhoneCall, X, CheckCircle2, XCircle, Eye, User, Users, MapPin, Tag,
  GraduationCap, Briefcase, Landmark, FileText, Image as ImageIcon,
  Download, Mail, Phone, Calendar, Trash2, Award as AwardIcon,
  Building2, FileBadge, Unlock, Plus, PenTool, ShieldCheck, Settings, Edit2, Check
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import GlobalDataFilter, { FilterState, applyGlobalFilters } from './GlobalDataFilter';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdmissionInquiryManager({ collegeId, collegeName, mode = 'inquiry', adminUid }: { collegeId: string | undefined, collegeName?: string, mode?: 'inquiry' | 'list' | 'cancelled' | 'pending', adminUid?: string }) {
  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || '');

  useEffect(() => {
    if (adminUid) {
      setResolvedAdminUid(adminUid);
    } else {
      getDefaultAdminUid().then(setResolvedAdminUid);
    }
  }, [adminUid]);

  const getDbRef = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return ref(realtimeDb, cleanPath);
  };

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [globalFilters, setGlobalFilters] = useState<FilterState>({
    collegeName: '', courseType: '', courseName: '', duration: '', semester: '', stream: '', academicYear: '', paymentStatus: ''
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [mode, collegeId, searchQuery, statusFilter, globalFilters]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [processSession, setProcessSession] = useState('');
  const [processDate, setProcessDate] = useState('');
  const [processAutoRegNo, setProcessAutoRegNo] = useState('');
  const [processManualRegNo, setProcessManualRegNo] = useState('');
  const [processTotalFees, setProcessTotalFees] = useState('');
  const [processAmountPaid, setProcessAmountPaid] = useState('');
  const [processRejectReason, setProcessRejectReason] = useState('');
  const [processRemark, setProcessRemark] = useState('');

  const [rejectionReasons, setRejectionReasons] = useState<any[]>([]);
  const [isManageReasonsOpen, setIsManageReasonsOpen] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');
  const [editingReasonKey, setEditingReasonKey] = useState<string | null>(null);
  const [editReasonText, setEditReasonText] = useState('');

  const [sessions, setSessions] = useState<any[]>([]);
  const [isManageSessionsOpen, setIsManageSessionsOpen] = useState(false);
  const [newSessionText, setNewSessionText] = useState('');
  const [editingSessionKey, setEditingSessionKey] = useState<string | null>(null);
  const [editSessionText, setEditSessionText] = useState('');

  useEffect(() => {
    if (!selectedInquiry) return;
    const targetCollegeId = selectedInquiry.collegeId || collegeId;
    if (!targetCollegeId) return;

    const reasonsRef = ref(realtimeDb, `colleges/${targetCollegeId}/settings/rejectionReasons`);
    const unsubscribeReasons = onValue(reasonsRef, (snap) => {
      if (snap.exists()) {
        setRejectionReasons(Object.entries(snap.val()).map(([key, val]: any) => ({ key, text: val.text })));
      } else {
        setRejectionReasons([]);
      }
    });

    const sessionsRef = ref(realtimeDb, `colleges/${targetCollegeId}/settings/sessions`);
    const unsubscribeSessions = onValue(sessionsRef, (snap) => {
      if (snap.exists()) {
        setSessions(Object.entries(snap.val()).map(([key, val]: any) => ({ key, text: val.text })));
      } else {
        setSessions([]);
      }
    });

    return () => {
      unsubscribeReasons();
      unsubscribeSessions();
    };
  }, [selectedInquiry, collegeId]);

  const handleAddReason = async () => {
    if (!newReasonText.trim()) return;
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;

    try {
      const newRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/settings/rejectionReasons`));
      await set(newRef, { text: newReasonText.trim() });
      setNewReasonText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReason = async () => {
    if (!editReasonText.trim() || !editingReasonKey) return;
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;
    try {
      await update(ref(realtimeDb, `colleges/${targetCollegeId}/settings/rejectionReasons/${editingReasonKey}`), { text: editReasonText.trim() });
      setEditingReasonKey(null);
      setEditReasonText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReason = async (key: string) => {
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;
    try {
      await remove(ref(realtimeDb, `colleges/${targetCollegeId}/settings/rejectionReasons/${key}`));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSession = async () => {
    if (!newSessionText.trim()) return;
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;
    try {
      const newRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/settings/sessions`));
      await set(newRef, { text: newSessionText.trim() });
      setNewSessionText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSession = async () => {
    if (!editSessionText.trim() || !editingSessionKey) return;
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;
    try {
      await update(ref(realtimeDb, `colleges/${targetCollegeId}/settings/sessions/${editingSessionKey}`), { text: editSessionText.trim() });
      setEditingSessionKey(null);
      setEditSessionText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (key: string) => {
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;
    try {
      await remove(ref(realtimeDb, `colleges/${targetCollegeId}/settings/sessions/${key}`));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedInquiry) {
      setProcessSession(selectedInquiry.processSession || '');
      setProcessDate(selectedInquiry.processDate || '');
      setProcessAutoRegNo(selectedInquiry.processAutoRegNo || '');
      setProcessManualRegNo(selectedInquiry.processManualRegNo || '');
      setProcessTotalFees(selectedInquiry.processTotalFees || '');
      setProcessAmountPaid(selectedInquiry.processAmountPaid || '');
      setProcessRejectReason(selectedInquiry.processRejectReason || '');
      setProcessRemark(selectedInquiry.processRemark || '');
    }
  }, [selectedInquiry]);

  const handleProcessDateChange = async (date: string) => {
    setProcessDate(date);
    if (!date) {
      setProcessAutoRegNo('');
      return;
    }
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!targetCollegeId) return;

    try {
      const admissionsRef = ref(realtimeDb, `colleges/${targetCollegeId}/studentAdmissions`);
      const inquiriesRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries`);

      const [admissionsSnap, inquiriesSnap] = await Promise.all([
        get(admissionsRef),
        get(inquiriesRef)
      ]);

      const dateObj = new Date(date);
      const year = String(dateObj.getFullYear());
      const prefix = `MIT-${year}-`;

      const usedSequences = new Set<number>();

      const checkRecord = (item: any) => {
        if (!item || typeof item !== 'object') return;
        const candidates = [item.registrationNumber, item.regNo, item.processAutoRegNo];
        for (const val of candidates) {
          if (typeof val === 'string' && val.startsWith(prefix)) {
            const seqStr = val.replace(prefix, '');
            const parsed = parseInt(seqStr, 10);
            if (!isNaN(parsed) && parsed > 0) {
              usedSequences.add(parsed);
            }
          }
        }
      };

      if (admissionsSnap.exists()) {
        Object.values(admissionsSnap.val()).forEach(checkRecord);
      }
      if (inquiriesSnap.exists()) {
        Object.entries(inquiriesSnap.val()).forEach(([key, item]: [string, any]) => {
          // If this inquiry is currently being edited, don't count its old number
          if (selectedInquiry && key === selectedInquiry.id) return;
          checkRecord(item);
        });
      }

      let sequence = 15;
      while (usedSequences.has(sequence)) {
        sequence++;
      }

      const registrationNumber = `${prefix}${String(sequence).padStart(5, '0')}`;
      setProcessAutoRegNo(registrationNumber);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessManage = async () => {
    if (!selectedInquiry) return;
    const targetCollegeId = selectedInquiry.collegeId || collegeId;
    if (!targetCollegeId) return;
    try {
      setIsProcessing(true);
      const updateData = {
        processSession,
        processDate,
        processAutoRegNo,
        processManualRegNo,
        processTotalFees,
        processAmountPaid,
        processBalance: (Number(processTotalFees) || 0) - (Number(processAmountPaid) || 0),
        processRejectReason,
        processRemark,
        collegeId: targetCollegeId,
        collegeName: selectedInquiry.collegeName
      };
      const inquiryRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);

      // If the college was changed, we need to save the full inquiry to the new college and delete from the old
      if (selectedInquiry.originalCollegeId && selectedInquiry.originalCollegeId !== targetCollegeId) {
        await set(inquiryRef, { ...selectedInquiry, ...updateData });
        await remove(ref(realtimeDb, `colleges/${selectedInquiry.originalCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`));
      } else {
        await update(inquiryRef, updateData);
      }

      // Also update the student's profile application if they are linked
      if (selectedInquiry.studentUid && selectedInquiry.applicationId) {
        const appsRef = ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appKey, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedInquiry.applicationId) {
              await update(ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications/${appKey}`), {
                collegeId: targetCollegeId,
                collegeName: selectedInquiry.collegeName
              });
              break;
            }
          }
        }
      }

      setSelectedInquiry((prev: any) => ({ ...prev, ...updateData, originalCollegeId: targetCollegeId }));
      alert("Process details saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save process details");
    } finally {
      setIsProcessing(false);
    }
  };

  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [currentDocs, setCurrentDocs] = useState<any[]>([]);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmDate, setConfirmDate] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [admissionYear, setAdmissionYear] = useState(new Date().getFullYear().toString());
  const [confirmError, setConfirmError] = useState('');

  const handleConfirmAdmission = async () => {
    const finalRegNo = processManualRegNo || processAutoRegNo;
    if (!processDate || !finalRegNo) {
      alert('Please select a Date and ensure a Registration Number is provided before accepting.');
      return;
    }
    const targetCollegeId = selectedInquiry?.collegeId || collegeId;
    if (!selectedInquiry || !targetCollegeId) return;

    try {
      setIsProcessing(true);
      const dateObj = new Date(processDate);
      const year = String(dateObj.getFullYear());
      const registrationNumber = finalRegNo;

      // 3. Update inquiry status
      const inquiryRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);
      await update(inquiryRef, { status: 'Confirmed' });

      // 4. Create admission record
      const newAdmissionRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/studentAdmissions`));
      await set(newAdmissionRef, {
        ...selectedInquiry,
        admissionDate: processDate,
        admissionYear: year,
        rollNumber: 'N/A',
        registrationNumber,
        processAutoRegNo: processAutoRegNo,
        regNo: registrationNumber, // Support legacy regNo field
        manualRegNo: processManualRegNo,
        status: 'Confirmed',
        fees: processTotalFees || selectedInquiry.fees || '0',
        paidFees: processAmountPaid || '0',
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
          registrationNumber: registrationNumber || '',
          processAutoRegNo: processAutoRegNo || '',
          regNo: registrationNumber || '',
          manualRegNo: processManualRegNo || '',
          admissionDate: processDate || '',
          rollNumber: 'N/A',
          confirmedAt: Date.now(),
          verificationStatus: 'Verified',
          paymentStatus: 'Pending',
          fees: processTotalFees || selectedInquiry.fees || '0',
          paidFees: processAmountPaid || '0'
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
        updates['course'] = selectedInquiry.courseName || '';
        updates['collegeId'] = selectedInquiry.collegeId || '';
        updates['collegeName'] = selectedInquiry.collegeName || '';
        updates['fees'] = processTotalFees || selectedInquiry.fees || '0';
        updates['paidFees'] = processAmountPaid || '0';
        updates['processAutoRegNo'] = processAutoRegNo || '';
        updates['regNo'] = registrationNumber || '';
        updates['manualRegNo'] = processManualRegNo || '';
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
          { name: 'Transfer Certificate', url: p.transferCertificateUrl },
          { name: 'Bonafide Certificate', url: p.bonafideCertificateUrl },
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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCollegeId]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [admissionDate, setAdmissionDate] = useState({
    day: new Date().getDate().toString().padStart(2, '0'),
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    year: new Date().getFullYear().toString(),
    admissionYear: new Date().getFullYear().toString()
  });
  const openImagePreview = (url: string, title: string) => {
    setPreviewImage({ url, title });
    setIsPreviewOpen(true);
  };

  const updateDocVerificationInDb = async (docKey: string, field: 'verified' | 'originalSubmitted', value: string) => {
    if (!selectedInquiry) return;
    const targetCollegeId = selectedInquiry.collegeId || collegeId;
    if (!targetCollegeId) return;

    try {
      const docVerifications = {
        ...(selectedInquiry.docVerifications || {}),
        [docKey]: {
          ...(selectedInquiry.docVerifications?.[docKey] || { verified: 'Not Verified', originalSubmitted: 'No' }),
          [field]: value
        }
      };

      // Update local state immediately
      setSelectedInquiry((prev: any) => ({ ...prev, docVerifications }));

      // Update in Firebase
      const inquiryRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);
      await update(inquiryRef, { docVerifications });

      // Also update user's applications array if it exists
      if (selectedInquiry.studentUid) {
        const appsRef = ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [key, app] of Object.entries(apps)) {
            if ((app as any).applicationId === selectedInquiry.applicationId ||
              ((app as any).courseName === selectedInquiry.courseName && (app as any).collegeId === selectedInquiry.collegeId)) {
              await update(ref(realtimeDb, `users/${selectedInquiry.studentUid}/applications/${key}`), { docVerifications });
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to update doc verification", err);
    }
  };

  useEffect(() => {
    if (!realtimeDb || !resolvedAdminUid) return;

    if (availableColleges.length === 0) {
      get(getDbRef('colleges')).then(colSnap => {
        if (colSnap.exists()) {
          setAvailableColleges(Object.entries(colSnap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      });
    }

    setLoading(true);
    const targetCid = collegeId || selectedCollegeId;
    const targetRef = targetCid
      ? getDbRef(`colleges/${targetCid}/frontOffice/admissionInquiries`)
      : ref(realtimeDb, 'users');

    const q = query(targetRef, orderByKey(), limitToFirst(2000));

    const unsubscribe = onValue(q, (snapshot) => {
      let data: any[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const val = child.val();
          if (!targetCid) {
            if (val.profile || val.courseName) {
              data.push({
                id: child.key,
                studentUid: child.key,
                source: 'Student Portal',
                status: val.status || val.profile?.status || 'Submitted',
                ...val.profile,
                collegeId: val.collegeId || val.profile?.collegeId || '',
                collegeName: val.collegeName || val.profile?.collegeName || 'Online Registration',
                studentName: `${val.profile?.firstName || ''} ${val.profile?.middleName || ''} ${val.profile?.lastName || ''}`.trim(),
                studentEmail: val.email || val.profile?.email,
                studentPhone: val.phone || val.profile?.phone,
                appliedAt: val.createdAt || val.profile?.createdAt || new Date().toISOString(),
              });
            }
          } else {
            data.push({ id: child.key, ...val });
          }
        });
      }
      setInquiries(data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collegeId, resolvedAdminUid, selectedCollegeId, mode]);

  const baseFilteredInquiries = inquiries.filter(inq => {
    const isLocked = inq.profileLocked === true || inq.profileLocked === 'true' || inq.isLocked === true;
    const isFromStudentPortal = inq.source === 'Student Portal' || inq.source === 'Online Student Portal' || !!inq.studentUid;
    const isPendingOrAccepted = !inq.status || ['Pending', 'New', 'Submitted', 'Accepted', 'Confirmed', 'Unlocked', 'Updated', 'Viewed'].includes(inq.status);

    const matchesCollege = collegeId
      ? true
      : (!selectedCollegeId || inq.collegeId === selectedCollegeId);

    let modeMatches = false;
    if (mode === 'list') {
      const confirmStatuses = ['Accepted', 'Confirmed', 'Updated'];
      modeMatches = matchesCollege && confirmStatuses.includes(inq.status || '');
    } else if (mode === 'pending') {
      const pendingStatuses = ['Pending', 'New', 'Submitted', 'Unlocked', 'Updated', 'Viewed'];
      modeMatches = matchesCollege && pendingStatuses.includes(inq.status || 'New') && (inq.profileLocked || inq.isLocked || isFromStudentPortal);
    } else if (mode === 'cancelled') {
      modeMatches = matchesCollege && inq.status === 'Rejected';
    } else {
      modeMatches = matchesCollege && isPendingOrAccepted;
    }

    if (!modeMatches) return false;

    if (statusFilter !== 'All') {
      if (inq.status !== statusFilter && inq.admissionStatus !== statusFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (inq.studentName || '').toLowerCase();
      const email = (inq.studentEmail || '').toLowerCase();
      const phone = (inq.studentPhone || '').toLowerCase();
      const reg = (inq.regNo || inq.manualRegNo || '').toLowerCase();
      const roll = (inq.rollNumber || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !reg.includes(q) && !roll.includes(q)) return false;
    }

    return true;
  });

  const filteredInquiries = applyGlobalFilters(baseFilteredInquiries, globalFilters);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedInquiries = filteredInquiries.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(filteredInquiries.length / PAGE_SIZE);

  const handleProcessClick = async (inq: any) => {
    setSelectedInquiry({ ...inq, originalCollegeId: inq.collegeId });
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

      // 3. Update student's application record
      if (selectedInquiry.applicationId) {
        const appsRef = ref(realtimeDb, `users/${uid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appId, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedInquiry.applicationId) {
              await update(ref(realtimeDb, `users/${uid}/applications/${appId}`), {
                profileLocked: false,
                status: 'Unlocked'
              });
              break;
            }
          }
        }
      }

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
                rejectReason: action === 'Reject' ? processRejectReason : '',
                rejectRemark: action === 'Reject' ? processRemark : '',
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
          studentName: selectedInquiry.studentName || `${selectedInquiry.firstName || ''} ${selectedInquiry.middleName || ''} ${selectedInquiry.lastName || ''}`.trim(),
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

  const handleAcceptSubmit = async () => {
    const targetCollegeId = selectedInquiry.collegeId || collegeId;
    if (!selectedInquiry || !targetCollegeId) return;

    setIsProcessing(true);
    try {
      const formattedDate = `${admissionDate.year}-${admissionDate.month}-${admissionDate.day}`;

      // Generate Registration Number: YYYYMMR###
      const admissionsRef = ref(realtimeDb, `colleges/${targetCollegeId}/studentAdmissions`);
      const inquiriesRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries`);

      const [admissionsSnap, inquiriesSnap] = await Promise.all([
        get(admissionsRef),
        get(inquiriesRef)
      ]);

      const prefix = `MIT-${admissionDate.year}-`;
      const usedSequences = new Set<number>();

      const checkRecord = (item: any) => {
        if (!item || typeof item !== 'object') return;
        const candidates = [item.registrationNumber, item.regNo, item.processAutoRegNo];
        for (const val of candidates) {
          if (typeof val === 'string' && val.startsWith(prefix)) {
            const seqStr = val.replace(prefix, '');
            const parsed = parseInt(seqStr, 10);
            if (!isNaN(parsed) && parsed > 0) {
              usedSequences.add(parsed);
            }
          }
        }
      };

      if (admissionsSnap.exists()) {
        Object.values(admissionsSnap.val()).forEach(checkRecord);
      }
      if (inquiriesSnap.exists()) {
        Object.entries(inquiriesSnap.val()).forEach(([key, item]: [string, any]) => {
          if (selectedInquiry && key === selectedInquiry.id) return;
          checkRecord(item);
        });
      }

      let sequence = 15;
      while (usedSequences.has(sequence)) {
        sequence++;
      }

      const regNo = `${prefix}${String(sequence).padStart(5, '0')}`;

      const inqRef = ref(realtimeDb, `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`);
      const status = 'Accepted';

      // 1. Update Inquiry Status
      if (selectedInquiry.collegeId !== targetCollegeId || !selectedInquiry.collegeId) {
        await set(inqRef, {
          ...selectedInquiry,
          status,
          processedAt: new Date().toISOString(),
          admissionDate: formattedDate,
          admissionYear: admissionDate.admissionYear,
          processAutoRegNo: processAutoRegNo,
          regNo: regNo,
          manualRegNo: processManualRegNo,
          collegeId: targetCollegeId
        });
        // Remove from old college if applicable
        if (selectedInquiry.collegeId && selectedInquiry.collegeId !== targetCollegeId) {
          await set(ref(realtimeDb, `colleges/${selectedInquiry.collegeId}/frontOffice/admissionInquiries/${selectedInquiry.id}`), null);
        }
      } else {
        await update(inqRef, {
          status,
          processedAt: new Date().toISOString(),
          admissionDate: formattedDate,
          admissionYear: admissionDate.admissionYear,
          processAutoRegNo: processAutoRegNo,
          regNo: regNo,
          manualRegNo: processManualRegNo
        });
      }

      // 2. Update Student's Application Status and Profile
      if (selectedInquiry.studentUid) {
        const uid = selectedInquiry.studentUid;

        // Update applications
        const appsRef = ref(realtimeDb, `users/${uid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appId, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedInquiry.applicationId) {
              await update(ref(realtimeDb, `users/${uid}/applications/${appId}`), {
                status,
                processAutoRegNo: processAutoRegNo,
                regNo: regNo,
                manualRegNo: processManualRegNo,
                admissionDate: formattedDate,
                admissionYear: admissionDate.admissionYear
              });
              break;
            }
          }
        }

        // Update profile
        await update(ref(realtimeDb, `users/${uid}/profile`), {
          processAutoRegNo: processAutoRegNo,
          regNo: regNo,
          manualRegNo: processManualRegNo,
          admissionDate: formattedDate,
          admissionYear: admissionDate.admissionYear
        });
        await update(ref(realtimeDb, `users/${uid}`), {
          processAutoRegNo: processAutoRegNo,
          regNo: regNo,
          manualRegNo: processManualRegNo
        });
      }

      // 3. Move to Student Admission List
      const studentAdmissionsRef = ref(realtimeDb, `colleges/${targetCollegeId}/studentAdmissions`);
      const newAdmissionRef = push(studentAdmissionsRef);

      const feesAmount = processTotalFees || selectedInquiry.fees || '0';
      const paidAmount = processAmountPaid || selectedInquiry.paidFees || '0';

      const admissionData = {
        ...selectedInquiry,
        admissionDate: formattedDate,
        admissionYear: admissionDate.admissionYear,
        admissionStatus: 'Confirmed',
        isActive: true, // Default to active when admitted
        processAutoRegNo: processAutoRegNo,
        regNo: regNo,
        manualRegNo: processManualRegNo,
        inquiryId: selectedInquiry.id,
        status: 'Accepted',
        processedAt: new Date().toISOString(),
        fees: feesAmount,
        paidFees: paidAmount
      };






      await set(newAdmissionRef, admissionData);

      // Record transaction if paidAmount > 0
      if (parseFloat(paidAmount) > 0) {
        const transRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/fees/transactions`));
        await set(transRef, {
          studentId: newAdmissionRef.key,
          studentName: selectedInquiry.studentName || `${selectedInquiry.firstName || ''} ${selectedInquiry.middleName || ''} ${selectedInquiry.lastName || ''}`.trim(),
          amount: parseFloat(paidAmount),
          date: new Date().toISOString(),
          timestamp: Date.now(),
          courseName: selectedInquiry.courseName || selectedInquiry.courseId || '',
          type: 'Cash', // Defaulting to Cash for process admission popup
          academicYear: admissionDate.admissionYear,
          receiptNo: `REC-${Date.now().toString().slice(-6)}`,
          particulars: 'Admission Fees',
          regNo: regNo
        });
      }

      alert(`SUCCESS: Admission Confirmed!\nAuto Registration No: ${regNo}\nDate: ${formattedDate}`);
      setIsAcceptModalOpen(false);
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to accept admission. Please check your connection.');
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

  const handleExportData = async () => {
    if (!filteredInquiries || filteredInquiries.length === 0) {
      alert("No data available to export.");
      return;
    }

    setIsProcessing(true);
    try {
      // Fetch full profiles for all filtered inquiries to get documents/photos
      const enrichedData = await Promise.all(
        filteredInquiries.map(async (inq) => {
          let profile = null;
          if (inq.studentUid) {
            const userRef = ref(realtimeDb, `users/${inq.studentUid}`);
            const snap = await get(userRef);
            if (snap.exists()) {
              profile = snap.val();
            }
          }
          return { ...inq, fullProfile: profile };
        })
      );

      const headers = [
        "Registration Number (Auto/Manual)",
        "Student Name",
        "Phone Number",
        "Email ID",
        "Gender",
        "Date of Birth",
        "Session",
        "Admission Date",
        "Total Fees",
        "Amount Paid",
        "Balance",
        "Reject Reason",
        "Process Remark",
        "College Name",
        "Course Name",
        "Application Status",
        "Photo URL",
        "Signature URL",
        "Aadhaar Front URL",
        "Aadhaar Back URL",
        "Transfer Certificate URL",
        "Bonafide Certificate URL",
        "Domicile Certificate URL",
        "Caste Certificate URL",
        "PWD Certificate URL"
      ];

      const csvRows = [headers.join(",")];

      enrichedData.forEach((inq) => {
        const sp = inq.fullProfile?.profile || {};

        const photoUrl = inq.photoUrl || sp.photoUrl || '';
        const signatureUrl = inq.signatureUrl || sp.signatureUrl || inq.signUrl || sp.signUrl || '';
        const aadhaarFrontUrl = inq.aadhaarFrontUrl || sp.aadhaarFrontUrl || '';
        const aadhaarBackUrl = inq.aadhaarBackUrl || sp.aadhaarBackUrl || '';
        const tcUrl = inq.transferCertificateUrl || sp.transferCertificateUrl || '';
        const bonafideUrl = inq.bonafideCertificateUrl || sp.bonafideCertificateUrl || '';
        const domicileUrl = inq.domicileCertificateUrl || inq.domicileUrl || sp.domicileCertificateUrl || sp.domicileUrl || '';
        const casteUrl = inq.casteCertificateUrl || sp.casteCertificateUrl || '';
        const pwdUrl = inq.pwdCertificateUrl || sp.pwdCertificateUrl || '';

        const name = inq.studentName || `${inq.firstName || ''} ${inq.middleName || ''} ${inq.lastName || ''}`.trim() || '';
        const gender = inq.gender || sp.gender || '';
        const dob = inq.dateOfBirth || sp.dateOfBirth || '';

        const row = [
          `"${inq.processManualRegNo || inq.processAutoRegNo || inq.registrationNumber || ''}"`,
          `"${name}"`,
          `"${inq.studentPhone || sp.phone || ''}"`,
          `"${inq.studentEmail || inq.fullProfile?.email || ''}"`,
          `"${gender}"`,
          `"${dob}"`,
          `"${inq.processSession || ''}"`,
          `"${inq.processDate || ''}"`,
          `"${inq.processTotalFees || ''}"`,
          `"${inq.processAmountPaid || ''}"`,
          `"${inq.processBalance || ''}"`,
          `"${inq.processRejectReason || ''}"`,
          `"${inq.processRemark || ''}"`,
          `"${inq.collegeName || ''}"`,
          `"${inq.courseName || ''}"`,
          `"${inq.status || 'New'}"`,
          `"${photoUrl}"`,
          `"${signatureUrl}"`,
          `"${aadhaarFrontUrl}"`,
          `"${aadhaarBackUrl}"`,
          `"${tcUrl}"`,
          `"${bonafideUrl}"`,
          `"${domicileUrl}"`,
          `"${casteUrl}"`,
          `"${pwdUrl}"`
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export data.");
    } finally {
      setIsProcessing(false);
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
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className={cn(
        "rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white shadow-xl relative overflow-hidden transition-all duration-500",
        mode === 'inquiry' ? "bg-[#5D5fb1]" : "bg-[#002147]"
      )}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 sm:space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
            {mode === 'inquiry' ? <PhoneCall size={14} className="text-[#00a5a5]" /> : mode === 'cancelled' ? <XCircle size={14} className="text-red-400" /> : <FileBadge size={14} className="text-[#00a5a5]" />}
            {mode === 'inquiry' ? 'Front Office' : mode === 'cancelled' ? 'Cancellation Registry' : 'Student Registry'}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight capitalize leading-tight text-white">
            {mode === 'inquiry' ? 'Admission Inquiry' : mode === 'cancelled' ? 'Cancel Admission' : 'Admission List'}
          </h2>
          <p className="text-xs sm:text-sm font-normal text-white/70">
            {mode === 'inquiry'
              ? 'Monitor and manage incoming admission requests from candidates.'
              : mode === 'cancelled'
                ? 'Review rejected admission applications and cancelled requests.'
                : 'Formal list of applicants awaiting institutional admission processing.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 md:p-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h3 className="text-xl sm:text-2xl font-bold text-black capitalize tracking-tight">Student Application List</h3>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search by name, email, phone, reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[240px] bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-[14px] font-medium text-black tracking-tight outline-none focus:border-[#003366] transition-all min-h-[42px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#003366] transition-all min-h-[42px]"
            >
              <option value="All">All Statuses</option>
              <option value="Accepted">Accepted / Verified</option>
              <option value="Pending">Pending / New</option>
              <option value="Rejected">Rejected</option>
              <option value="Confirmed">Confirmed</option>
            </select>
            {!collegeId && (
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#5D5fb1] transition-all min-h-[42px]"
              >
                <option value="">All Colleges</option>
                {availableColleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <div className="text-xs sm:text-[13px] font-bold text-slate-700 capitalize tracking-tight bg-[#5D5fb1]/10 px-3.5 py-2 rounded-xl whitespace-nowrap text-center">
              {filteredInquiries.length} Requests
            </div>
            <button
              onClick={handleExportData}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 bg-[#00a5a5] hover:bg-[#008f8f] text-white px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold uppercase tracking-tight transition-all shadow-md disabled:opacity-50 min-h-[42px]"
            >
              <Download size={15} /> {isProcessing ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>

        <div className="mb-8">
          <GlobalDataFilter
            data={baseFilteredInquiries}
            filters={globalFilters}
            setFilters={setGlobalFilters}
          />
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
              {Array.isArray(paginatedInquiries) && paginatedInquiries.length > 0 ? (
                paginatedInquiries.map((inq, i) => (
                  <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                    <td className="px-6 py-6 border-r border-black text-center text-[13px] font-normal text-black">
                      {startIndex + i + 1}
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
                        {`${inq.firstName || ''} ${inq.middleName || ''} ${inq.lastName || ''}`.trim() || inq.studentName || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <span className="text-[12px] font-black text-indigo-500 capitalize tracking-tight bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {inq.courseType || inq.applicationType || 'Reg'}
                      </span>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <p className="text-[14px] font-medium text-black capitalize">{inq.courseName}</p>
                      {(inq.duration || inq.semester || inq.stream) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {inq.duration && <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">{inq.duration}</span>}
                          {inq.semester && <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">{inq.semester}</span>}
                          {inq.stream && <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">{inq.stream}</span>}
                        </div>
                      )}
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
                      <span className={`px-3 py-1.5 rounded-full text-[14px] font-black tracking-tight capitalize border border-black ${inq.status === 'Accepted' || inq.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
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
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6 bg-slate-50 border border-black p-4 rounded-2xl">
          <button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
            className="px-6 py-2 bg-white border border-black text-black rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
          >
            Previous Page
          </button>
          <span className="text-[13px] font-black text-black tracking-tight">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="px-6 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 disabled:opacity-50 transition-all"
          >
            Next Page
          </button>
        </div>
      </div>

      {/* Process Modal */}
      {isProcessModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsProcessModalOpen(false)} />
          <div className="bg-[#f8fafc] w-[95vw] max-w-none h-[95vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
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
                {/* Formal Application Form Data */}
                <div className="bg-white border-[0.5px] border-black rounded-md shadow-sm overflow-hidden text-[#343a40]">
                  <div className="bg-[#5D5fb1] text-white py-4 px-8 font-black text-sm tracking-widest flex items-center justify-between uppercase">
                    <span>APPLICATION FORM DATA</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[10px]">
                      <FileText size={12} className="text-white" /> SUBMITTED DETAILS
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {/* Section: Academic Interest */}
                        <tr>
                          <td colSpan={4} className="px-8 py-3 bg-slate-200 font-bold text-xs uppercase border-b-[0.5px] border-black text-black">Academic Details</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase w-1/4">Applied Institution</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase w-1/4">{selectedInquiry.collegeName || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase w-1/4">Selected Course</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase w-1/4">{selectedInquiry.courseName || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Course Type</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase w-1/4">{selectedInquiry.courseType || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Duration</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.duration || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Semester</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase w-1/4">{selectedInquiry.semester || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Branch / Stream</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.stream || 'N/A'}</td>
                        </tr>

                        {/* Section: Candidate Information */}
                        <tr>
                          <td colSpan={4} className="px-8 py-3 bg-slate-200 font-bold text-xs uppercase border-b-[0.5px] border-black text-black">Candidate Information</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Full Name</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.studentName || `${selectedInquiry.firstName || ''} ${selectedInquiry.lastName || ''}`.trim() || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Gender</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.gender || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Date of Birth</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.dateOfBirth || selectedInquiry.dob || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Aadhaar Number</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.aadhaarNo || selectedInquiry.aadharNumber || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Email Address</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold lowercase">{selectedInquiry.studentEmail || selectedInquiry.email || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Phone Number</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.studentPhone || selectedInquiry.phone || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Current Address</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.address || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Permanent Address</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.permanentAddress || 'N/A'}</td>
                        </tr>

                        {/* Section: Parental Information */}
                        <tr>
                          <td colSpan={4} className="px-8 py-3 bg-slate-200 font-bold text-xs uppercase border-b-[0.5px] border-black text-black">Parental Information</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Father Name</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{`${selectedInquiry.fatherFirstName || ''} ${selectedInquiry.fatherMiddleName || ''} ${selectedInquiry.fatherLastName || ''}`.trim() || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Mother Name</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.motherName || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Father Phone</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.fatherPhone || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Father Occupation</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.fatherOccupation || 'N/A'}</td>
                        </tr>

                        {/* Section: Category & Domicile */}
                        <tr>
                          <td colSpan={4} className="px-8 py-3 bg-slate-200 font-bold text-xs uppercase border-b-[0.5px] border-black text-black">Category & Domicile</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Caste Category</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.casteCategory || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Sub-Caste</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.subCaste || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Religion</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.religion || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Nationality</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.nationality || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Maharashtra Domicile</td>
                          <td colSpan={3} className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.isMaharashtraDomiciled || 'N/A'}</td>
                        </tr>

                        {/* Section: Additional Details & Identity */}
                        <tr>
                          <td colSpan={4} className="px-8 py-3 bg-slate-200 font-bold text-xs uppercase border-b-[0.5px] border-black text-black">Additional Details & Identity</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Blood Group</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.bloodGroup || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Mother Tongue</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.motherTongue || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Completed Training</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.hasTraining || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Training Details</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">{selectedInquiry.trainingDetails || 'N/A'}</td>
                        </tr>
                        <tr className="border-b-[0.5px] border-black">
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">PAN Card Number</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black text-sm font-bold uppercase">{selectedInquiry.panCardNo || 'N/A'}</td>
                          <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Languages Known</td>
                          <td className="px-8 py-5 text-sm font-bold uppercase">
                            {(selectedInquiry.languagesKnown || []).map((l: any) => `${l.language} (${l.read ? 'R' : ''}${l.write ? 'W' : ''}${l.speak ? 'S' : ''})`).join(', ') || 'N/A'}
                          </td>
                        </tr>
                        {selectedInquiry.hasBankAccount === 'Yes' && (
                          <tr className="border-b-[0.5px] border-black">
                            <td className="px-8 py-5 border-r-[0.5px] border-black bg-slate-50 font-black text-[11px] text-[#5D5fb1] uppercase">Bank Information</td>
                            <td colSpan={3} className="px-8 py-5 text-sm font-bold uppercase space-x-6">
                              <span><span className="text-[#5D5fb1] text-[10px]">BANK:</span> {selectedInquiry.bankName}</span>
                              <span><span className="text-[#5D5fb1] text-[10px]">A/C NO:</span> {selectedInquiry.accountNumber}</span>
                              <span><span className="text-[#5D5fb1] text-[10px]">IFSC:</span> {selectedInquiry.ifscCode}</span>
                              <span><span className="text-[#5D5fb1] text-[10px]">HOLDER:</span> {selectedInquiry.accountHolderName}</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

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
                    let customDocsList: any[] = [];
                    if (studentProfile?.customDocuments) {
                      customDocsList = Object.entries(studentProfile.customDocuments).map(([key, val]: any) => ({
                        id: key,
                        label: val.name,
                        url: val.fileUrl
                      }));
                    }
                    let qualificationsDocs: any[] = [];
                    const qualifications = inq.qualifications || sp.qualifications || [];
                    if (qualifications.length > 0) {
                      qualificationsDocs = qualifications.filter((q: any) => q.marksheetUrl).map((q: any, idx: number) => ({
                        id: `marksheet_${idx}`,
                        label: `${q.examination || 'Education'} Marksheet`,
                        url: q.marksheetUrl
                      }));
                    }
                    const docs = [
                      { id: 'photo', label: 'Student Photo', url: inq.photoUrl || sp.photoUrl },
                      { id: 'signature', label: 'Student Signature', url: inq.signatureUrl || sp.signatureUrl || inq.signUrl || sp.signUrl },
                      { id: 'aadhaarFront', label: 'Aadhaar Front', url: inq.aadhaarFrontUrl || sp.aadhaarFrontUrl },
                      { id: 'aadhaarBack', label: 'Aadhaar Back', url: inq.aadhaarBackUrl || sp.aadhaarBackUrl },
                      { id: 'transferCertificate', label: 'Transfer Certificate', url: inq.transferCertificateUrl || sp.transferCertificateUrl },
                      { id: 'bonafideCertificate', label: 'Bonafide Certificate', url: inq.bonafideCertificateUrl || sp.bonafideCertificateUrl },
                      { id: 'domicile', label: 'Domicile Certificate', url: inq.domicileCertificateUrl || inq.domicileUrl || sp.domicileCertificateUrl || sp.domicileUrl },
                      { id: 'casteCertificate', label: 'Caste Certificate', url: inq.casteCertificateUrl || sp.casteCertificateUrl },
                      { id: 'pwdCertificate', label: 'PWD Certificate', url: inq.pwdCertificateUrl || sp.pwdCertificateUrl },
                      ...qualificationsDocs,
                      { id: 'trainingCertificate', label: 'Training Certificate', url: inq.trainingCertificateUrl || sp.trainingCertificateUrl },
                      { id: 'bankPassbook', label: 'Bank Passbook / Cheque', url: inq.bankPassbookUrl || sp.bankPassbookUrl },
                      { id: 'panCard', label: 'PAN Card', url: inq.panCardUrl || sp.panCardUrl },
                      ...customDocsList
                    ].filter(d => d.url);
                    return docs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-black">
                          <thead>
                            <tr className="bg-slate-50 text-[13px] font-normal text-black uppercase tracking-wider border-b border-black">
                              <th className="px-4 py-3 border-r border-black">Document Name</th>
                              <th className="px-4 py-3 border-r border-black w-48">Verified by Institute</th>
                              <th className="px-4 py-3 border-r border-black w-56">Original Document Submitted at Institute</th>
                              <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {docs.map((doc, idx) => {
                              const docState = inq.docVerifications?.[doc.id] || { verified: 'Not Verified', originalSubmitted: 'No' };
                              return (
                                <tr key={idx} className="text-xs border-b border-black last:border-0 hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-4 font-bold border-r border-black">{doc.label}</td>
                                  <td className="px-4 py-4 border-r border-black">
                                    <select
                                      value={docState.verified}
                                      onChange={(e) => updateDocVerificationInDb(doc.id, 'verified', e.target.value)}
                                      className="bg-white border border-black rounded-lg px-3 py-1.5 outline-none focus:border-[#5D5fb1] text-xs w-full cursor-pointer"
                                    >
                                      <option value="Not Verified">Not Verified</option>
                                      <option value="Verified">Verified</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-4 border-r border-black">
                                    <select
                                      value={docState.originalSubmitted}
                                      onChange={(e) => updateDocVerificationInDb(doc.id, 'originalSubmitted', e.target.value)}
                                      className="bg-white border border-black rounded-lg px-3 py-1.5 outline-none focus:border-[#5D5fb1] text-xs w-full cursor-pointer"
                                    >
                                      <option value="No">No</option>
                                      <option value="Yes">Yes</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <button
                                      onClick={() => openImagePreview(doc.url, doc.label)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-[#002147] text-white rounded-xl text-[10px] font-bold hover:bg-[#00a5a5] transition-all mx-auto"
                                    >
                                      <Eye size={11} /> View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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

                {/* Admission Processing */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-black pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="text-sm font-normal text-black capitalize tracking-tight">Admission Processing</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Select College / Institute</label>
                        <select
                          value={selectedInquiry?.collegeId || collegeId || ''}
                          onChange={(e) => {
                            const newCid = e.target.value;
                            const newCol = availableColleges.find(c => c.id === newCid);
                            setSelectedInquiry((prev: any) => ({ ...prev, collegeId: newCid, collegeName: newCol ? newCol.name : '' }));
                          }}
                          className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1]"
                        >
                          <option value="">Select Institute...</option>
                          {availableColleges.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-black uppercase tracking-tight">Select Session</label>
                          <button
                            onClick={() => setIsManageSessionsOpen(true)}
                            className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold hover:bg-indigo-200 transition-all"
                          >
                            Manage
                          </button>
                        </div>
                        <select
                          value={processSession}
                          onChange={(e) => setProcessSession(e.target.value)}
                          className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1]"
                        >
                          <option value="">Select Session...</option>
                          {sessions.map(s => (
                            <option key={s.key} value={s.text}>{s.text}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Select Date</label>
                        <input
                          type="date"
                          max="9999-12-31"
                          value={processDate}
                          onChange={(e) => handleProcessDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Auto Generated Registration Number</label>
                        <input
                          type="text"
                          readOnly
                          value={processAutoRegNo}
                          className="w-full bg-slate-100 border border-black rounded-xl px-4 py-3 text-sm outline-none text-slate-500 cursor-not-allowed"
                          placeholder="Generated after selecting date..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Manual Registration Number</label>
                        <input
                          type="text"
                          value={processManualRegNo}
                          onChange={(e) => setProcessManualRegNo(e.target.value)}
                          className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Total Fees</label>
                        <input
                          type="number"
                          value={processTotalFees}
                          onChange={(e) => setProcessTotalFees(e.target.value)}
                          className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Amount Paid by Candidate</label>
                        <input
                          type="number"
                          value={processAmountPaid}
                          onChange={(e) => setProcessAmountPaid(e.target.value)}
                          className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Balance</label>
                        <div className="w-full bg-slate-100 border border-black rounded-xl px-4 py-3 text-sm outline-none text-slate-500">
                          ₹ {((Number(processTotalFees) || 0) - (Number(processAmountPaid) || 0)).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-red-500 uppercase tracking-tight">Reason For Rejection (If Rejecting)</label>
                          <button
                            onClick={() => setIsManageReasonsOpen(true)}
                            className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold hover:bg-red-200 transition-all"
                          >
                            Manage
                          </button>
                        </div>
                        <select
                          value={processRejectReason}
                          onChange={(e) => setProcessRejectReason(e.target.value)}
                          className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 text-red-700 placeholder:text-red-300"
                        >
                          <option value="">Select a reason...</option>
                          {rejectionReasons.map(r => (
                            <option key={r.key} value={r.text}>{r.text}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-black uppercase tracking-tight mb-2">Remark</label>
                      <textarea
                        value={processRemark}
                        onChange={(e) => setProcessRemark(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-black rounded-xl px-4 py-3 text-sm outline-none focus:border-[#5D5fb1] resize-none"
                        placeholder="Any additional remarks..."
                      />
                    </div>
                  </div>
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

                {mode === 'pending' && selectedInquiry.status !== 'Confirmed' && selectedInquiry.status !== 'Accepted' && selectedInquiry.status !== 'Rejected' && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to reject this admission? This will move the application to trash.")) {
                          handleAction('Reject');
                        }
                      }}
                      disabled={isProcessing}
                      className="px-8 py-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold rounded-2xl text-[13px] capitalize tracking-tight transition-all flex items-center gap-2 border border-rose-100 disabled:opacity-50"
                    >
                      <XCircle size={18} /> Reject Admission
                    </button>
                    <button
                      onClick={handleConfirmAdmission}
                      disabled={isProcessing}
                      className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-[13px] capitalize tracking-tight transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={18} /> Accept Admission
                    </button>
                  </>
                )}

                {mode === 'pending' && (selectedInquiry.status === 'Confirmed' || selectedInquiry.status === 'Accepted') && (
                  <button
                    disabled
                    className="px-8 py-4 bg-slate-100 text-slate-400 font-bold rounded-2xl text-[13px] capitalize tracking-tight border border-slate-200 flex items-center gap-2 cursor-not-allowed"
                  >
                    <CheckCircle2 size={18} /> Admission Confirmed
                  </button>
                )}

                {mode === 'pending' && selectedInquiry.status === 'Rejected' && (
                  <button
                    disabled
                    className="px-8 py-4 bg-red-50 text-red-400 font-bold rounded-2xl text-[13px] capitalize tracking-tight border border-red-100 flex items-center gap-2 cursor-not-allowed"
                  >
                    <XCircle size={18} /> Admission Rejected
                  </button>
                )}
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

      {/* Manage Rejection Reasons Modal */}
      {isManageReasonsOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsManageReasonsOpen(false)} />
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-black">
            <div className="p-6 border-b border-black flex items-center justify-between bg-red-50">
              <h3 className="text-lg font-black text-black capitalize tracking-tight flex items-center gap-2">
                <Settings size={20} className="text-red-500" /> Manage Rejection Reasons
              </h3>
              <button onClick={() => setIsManageReasonsOpen(false)} className="text-slate-400 hover:text-black transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReasonText}
                  onChange={(e) => setNewReasonText(e.target.value)}
                  placeholder="Add new reason..."
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-black"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
                />
                <button onClick={handleAddReason} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">Add</button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {rejectionReasons.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No reasons added yet.</p>}
                {rejectionReasons.map((r) => (
                  <div key={r.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group">
                    {editingReasonKey === r.key ? (
                      <div className="flex flex-1 gap-2 mr-2">
                        <input
                          type="text"
                          value={editReasonText}
                          onChange={(e) => setEditReasonText(e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateReason();
                            if (e.key === 'Escape') setEditingReasonKey(null);
                          }}
                        />
                        <button onClick={handleUpdateReason} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"><Check size={16} /></button>
                        <button onClick={() => setEditingReasonKey(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-black">{r.text}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingReasonKey(r.key); setEditReasonText(r.text); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteReason(r.key)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Sessions Modal */}
      {isManageSessionsOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsManageSessionsOpen(false)} />
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-black">
            <div className="p-6 border-b border-black flex items-center justify-between bg-indigo-50">
              <h3 className="text-lg font-black text-black capitalize tracking-tight flex items-center gap-2">
                <Settings size={20} className="text-indigo-500" /> Manage Sessions
              </h3>
              <button onClick={() => setIsManageSessionsOpen(false)} className="text-slate-400 hover:text-black transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSessionText}
                  onChange={(e) => setNewSessionText(e.target.value)}
                  placeholder="Add new session (e.g. 2026-2027)..."
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-black"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                />
                <button onClick={handleAddSession} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">Add</button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {sessions.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No sessions added yet.</p>}
                {sessions.map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group">
                    {editingSessionKey === s.key ? (
                      <div className="flex flex-1 gap-2 mr-2">
                        <input
                          type="text"
                          value={editSessionText}
                          onChange={(e) => setEditSessionText(e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSession();
                            if (e.key === 'Escape') setEditingSessionKey(null);
                          }}
                        />
                        <button onClick={handleUpdateSession} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"><Check size={16} /></button>
                        <button onClick={() => setEditingSessionKey(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-black">{s.text}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingSessionKey(s.key); setEditSessionText(s.text); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteSession(s.key)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
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
