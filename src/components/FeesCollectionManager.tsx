'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get, set, push, remove, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { CreditCard, Search, IndianRupee, User, BookOpen, Clock, X, Save, Eye, Check, Receipt, Trash2, Building2, Calendar, History, Download, Mail, Phone, Hash, Tag, Landmark, ShieldCheck, Camera, Copy, Edit, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { safeHtml2Canvas as html2canvas } from '@/lib/safeHtml2Canvas';
import jsPDF from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import GlobalDataFilter, { FilterState, applyGlobalFilters } from './GlobalDataFilter';

import { getDefaultAdminUid } from '@/lib/adminUtils';

export default function FeesCollectionManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {
  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || '');

  useEffect(() => {
    if (adminUid) {
      setResolvedAdminUid(adminUid);
    } else {
      getDefaultAdminUid().then(setResolvedAdminUid);
    }
  }, [adminUid]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(collegeId || '');
  const [onlinePayments, setOnlinePayments] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [studentTransactions, setStudentTransactions] = useState<any[]>([]);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [collegePaymentSettings, setCollegePaymentSettings] = useState<any>(null);
  const [activeLedgerTab, setActiveLedgerTab] = useState<'students' | 'pendingOnline' | 'history'>('students');
  const [historyFilterName, setHistoryFilterName] = useState('');
  const [historyFilterDate, setHistoryFilterDate] = useState('');
  const [historyFilterCourseType, setHistoryFilterCourseType] = useState('');
  const [historyFilterCourse, setHistoryFilterCourse] = useState('');
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editTransAmount, setEditTransAmount] = useState('');
  const [editTransDate, setEditTransDate] = useState('');
  const [editTransReceiptNo, setEditTransReceiptNo] = useState('');
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false);
  const [paymentType, setPaymentType] = useState('Cash');
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionRefId, setTransactionRefId] = useState('');
  const [transactionRemarks, setTransactionRemarks] = useState('');

  const handleDownloadReceiptPDF = async () => {
    const printContent = document.getElementById('receipt-print');
    if (!printContent) return;
    setIsDownloadingReceipt(true);
    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const fileName = `Receipt_${lastReceipt?.receiptNo || 'N/A'}_${(lastReceipt?.studentName || 'Student').replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error: any) {
      console.error('PDF Download Error:', error);
      alert(`Failed to download receipt: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const getDbRef = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return ref(realtimeDb, cleanPath);
  };

  useEffect(() => {
    if (!realtimeDb || !resolvedAdminUid) {
      setLoading(false);
      return;
    }

    // Fetch colleges for filtering if admin
    if (!collegeId) {
      const collegesRef = getDbRef('colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      });
    }

    const fetchAllData = () => {
      setLoading(true);
      const collegesRef = getDbRef('colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          const colleges = snap.val();
          let allStudents: any[] = [];
          let allOnlinePayments: any[] = [];
          let transactions: any[] = [];
          
          Object.entries(colleges).forEach(([cId, cData]: [string, any]) => {
            if (collegeId && cId !== collegeId) return;

            // Collect Online Payments
            if (cData?.payments?.online) {
              Object.entries(cData.payments.online).forEach(([pId, pData]: [string, any]) => {
                allOnlinePayments.push({ id: pId, collegeId: cId, ...pData });
              });
            }

            // Collect All Transactions
            if (cData?.fees?.transactions) {
              Object.entries(cData.fees.transactions).forEach(([tId, tData]: [string, any]) => {
                transactions.push({ id: tId, collegeId: cId, ...tData });
              });
            }

            // Local map for this college to handle deduplication prioritizing Admissions
            const collegeStudentMap = new Map();

            // 1. From admitted students (admissions) - HIGHER PRIORITY
            if (cData?.studentAdmissions) {
              Object.entries(cData.studentAdmissions).forEach(([aId, aData]: [string, any]) => {
                // Use applicationId as the unique merge key
                const mergeKey = (aData as any).applicationId || aId;
                collegeStudentMap.set(mergeKey, {
                  id: aId,
                  ...aData,
                  studentName: `${aData?.firstName || ''} ${aData?.middleName || ''} ${aData?.lastName || ''}`.trim() || aData?.studentName || '',
                  collegeId: cId,
                  collegeName: cData.name,
                  collegeLogo: cData.logoUrl || cData.logo || '',
                  collegeAddress: cData.address || 'Tq.Bhokardan Dist. jalna , Paradh - 431114',
                  collegeParentOrg: cData.parentOrg || 'Mahavishnu Gramin Vikas & Shaikshnik B. sanstha Dhamangaon ( Dhad )',
                  source: 'Admitted'
                });
              });
            }

            // 2. From registered students - ONLY IF NOT ALREADY IN ADMISSIONS (via mergeKey)
            if (cData?.students) {
              Object.entries(cData.students).forEach(([sId, sData]: [string, any]) => {
                const mergeKey = (sData as any).applicationId || sId;
                if (!collegeStudentMap.has(mergeKey)) {
                   collegeStudentMap.set(mergeKey, {
                     id: sId,
                     ...sData,
                     studentName: `${sData?.firstName || ''} ${sData?.middleName || ''} ${sData?.lastName || ''}`.trim() || sData?.studentName || '',
                     collegeId: cId,
                     collegeName: cData.name,
                     collegeLogo: cData.logoUrl || cData.logo || '',
                     collegeAddress: cData.address || 'Tq.Bhokardan Dist. jalna , Paradh - 431114',
                     collegeParentOrg: cData.parentOrg || 'Mahavishnu Gramin Vikas & Shaikshnik B. sanstha Dhamangaon ( Dhad )',
                     source: 'Registered'
                   });
                }
              });
            }

            allStudents.push(...Array.from(collegeStudentMap.values()));
          });
          
           setOnlinePayments(allOnlinePayments);
           setAllTransactions(transactions);
          
          const validStudents = allStudents.filter(s => {
             const name = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim() || s.studentName || '';
             return name && name.length > 0 && s.collegeId !== "undefined";
          });
          
          const sortedStudents = validStudents.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.admissionDate || a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.updatedAt || a.admissionDate || a.date || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          
          setStudents(sortedStudents);
          try {
            localStorage.setItem(collegeId ? `cache_admin_fees_students_${collegeId}` : 'cache_admin_fees_students_global', JSON.stringify(sortedStudents));
            localStorage.setItem(collegeId ? `cache_admin_fees_online_${collegeId}` : 'cache_admin_fees_online_global', JSON.stringify(allOnlinePayments));
            localStorage.setItem(collegeId ? `cache_admin_fees_trans_${collegeId}` : 'cache_admin_fees_trans_global', JSON.stringify(transactions));
          } catch (e) {}
        } else {
          setStudents([]);
          setOnlinePayments([]);
          setAllTransactions([]);
        }
        setLoading(false);
      });
    };

    try {
      const cachedStudents = localStorage.getItem(collegeId ? `cache_admin_fees_students_${collegeId}` : 'cache_admin_fees_students_global');
      const cachedOnline = localStorage.getItem(collegeId ? `cache_admin_fees_online_${collegeId}` : 'cache_admin_fees_online_global');
      const cachedTrans = localStorage.getItem(collegeId ? `cache_admin_fees_trans_${collegeId}` : 'cache_admin_fees_trans_global');
      
      if (cachedStudents && cachedOnline && cachedTrans) {
        setStudents(JSON.parse(cachedStudents));
        setOnlinePayments(JSON.parse(cachedOnline));
        setAllTransactions(JSON.parse(cachedTrans));
        setLoading(false);
      }
    } catch (e) {}

    fetchAllData();
  }, [collegeId, resolvedAdminUid]);

  const [filterCourseType, setFilterCourseType] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesName = !filterName || 
      (`${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim() || s.studentName || '').toLowerCase().includes(filterName.toLowerCase()) ||
      (s.applicationId || '').toLowerCase().includes(filterName.toLowerCase()) ||
      (s.courseName || '').toLowerCase().includes(filterName.toLowerCase());
    const matchesCollege = !selectedCollegeId || s.collegeId === selectedCollegeId;
    const matchesCourseType = !filterCourseType || (s.courseType || s.type || 'Regular') === filterCourseType;

    return matchesName && matchesCollege && matchesCourseType;
  });

  const [globalFilters, setGlobalFilters] = useState<FilterState>({
    collegeName: '', courseType: '', courseName: '', duration: '', semester: '', stream: '', academicYear: '', paymentStatus: ''
  });
  
  const finalFilteredStudents = applyGlobalFilters(filteredStudents, globalFilters);

  const handleCollectOpen = (student: any) => {
    setSelectedStudent(student);
    setCollectAmount('');
    setPaymentType('Cash');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionRefId('');
    setTransactionRemarks('');
    setIsCollectModalOpen(true);
    
    // Fetch payment settings for QR (from v2)
    if (student.collegeId) {
       const paySetRef = getDbRef(`colleges/${student.collegeId}/paymentSettings`);
       get(paySetRef).then(snap => {
          if (snap.exists()) setCollegePaymentSettings(snap.val());
          else setCollegePaymentSettings(null);
       });
    }
  };

  const handleProcessOpen = (student: any, payment: any) => {
    setSelectedStudent(student);
    setPendingPayment(payment);
    setIsProcessModalOpen(true);
  };

  const handleApproveOnlinePayment = async () => {
    if (!selectedStudent || !pendingPayment) return;
    const amount = parseFloat(pendingPayment.amount);
    
    try {
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = currentPaid + amount;

      // 1. Update ONLY the source node (do not move to admissions if they are Registered)
      const path = selectedStudent.source === 'Registered' 
        ? `colleges/${selectedStudent.collegeId}/students/${selectedStudent.id}`
        : `colleges/${selectedStudent.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const studentRef = getDbRef(path);
      // Use update instead of set to avoid creating new records if ID is missing or accidentally promoting student
      await update(studentRef, {
        paidFees: newPaid.toString(),
        updatedAt: new Date().toISOString()
      });

      const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
      // 2. Update student's application record
      if (selectedStudent.studentUid && selectedStudent.applicationId) {
        const appsRef = getDbRef(`users/${selectedStudent.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appKey, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedStudent.applicationId) {
              await update(ref(realtimeDb, `users/${selectedStudent.studentUid}/applications/${appKey}`), {
                paidFees: newPaid.toString()
              });
              if (resolvedAdminUid) {
                await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedStudent.studentUid}/applications/${appKey}`), {
                  paidFees: newPaid.toString()
                });
              }
              break;
            }
          }
        }

        // 3. Update the online payment status in College node
        await update(getDbRef(`colleges/${pendingPayment.collegeId}/payments/online/${pendingPayment.id}`), {
          status: 'Accepted'
        });

        // 4. Update the online payment status in Student node
        const studentPaymentsRef = getDbRef(`users/${selectedStudent.studentUid}/payments`);
        const studPaySnap = await get(studentPaymentsRef);
        if (studPaySnap.exists()) {
          const studPays = studPaySnap.val();
          for (const [pKey, pData] of Object.entries(studPays)) {
            if ((pData as any).applicationId === pendingPayment.applicationId && (pData as any).utrId === pendingPayment.utrId) {
              await update(ref(realtimeDb, `users/${selectedStudent.studentUid}/payments/${pKey}`), {
                status: 'Accepted',
                receiptNo: receiptNo,
                approvedAt: new Date().toISOString()
              });
              if (resolvedAdminUid) {
                await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedStudent.studentUid}/payments/${pKey}`), {
                  status: 'Accepted',
                  receiptNo: receiptNo,
                  approvedAt: new Date().toISOString()
                });
              }
              break;
            }
          }
        }
      }

      // 5. Record transaction ledger
      const transRef = push(getDbRef(`colleges/${selectedStudent.collegeId}/fees/transactions`));
      const transData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        amount: amount,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        courseName: selectedStudent.courseName || selectedStudent.courseId,
        type: 'Online',
        utrId: pendingPayment.utrId || 'N/A',
        academicYear: academicYear,
        receiptNo: receiptNo,
        particulars: 'Tuition Fees',
        regNo: selectedStudent.regNo || selectedStudent.applicationId || 'N/A',
        screenshot: pendingPayment.screenshot || '',
        collegeLogo: selectedStudent.collegeLogo || '',
        collegeAddress: selectedStudent.collegeAddress || '',
        collegeParentOrg: selectedStudent.collegeParentOrg || '',
        stream: selectedStudent.stream || selectedStudent.branch || ''
      };
      await set(transRef, transData);

      setLastReceipt({
        ...transData,
        collegeName: selectedStudent.collegeName,
        courseType: selectedStudent.courseType,
        stream: selectedStudent.stream || selectedStudent.branch || '',
        rollNo: selectedStudent.rollNo || 'N/A'
      });
      setShowReceipt(true);

      alert("Online payment approved and ledger updated!");
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to approve payment");
      setIsProcessModalOpen(false);
    }
  };

  const handleRejectOnlinePayment = async () => {
    if (!selectedStudent || !pendingPayment) return;
    if (!window.confirm("Are you sure you want to reject this payment?")) return;

    try {
      // 1. Update in College node
      await update(getDbRef(`colleges/${pendingPayment.collegeId}/payments/online/${pendingPayment.id}`), {
        status: 'Rejected'
      });

      // 2. Update in Student node
      if (selectedStudent.studentUid) {
        const studentPaymentsRef = getDbRef(`users/${selectedStudent.studentUid}/payments`);
        const studPaySnap = await get(studentPaymentsRef);
        if (studPaySnap.exists()) {
          const studPays = studPaySnap.val();
          for (const [pKey, pData] of Object.entries(studPays)) {
            if ((pData as any).applicationId === pendingPayment.applicationId && (pData as any).utrId === pendingPayment.utrId) {
              await update(ref(realtimeDb, `users/${selectedStudent.studentUid}/payments/${pKey}`), {
                status: 'Rejected'
              });
              if (resolvedAdminUid) {
                await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedStudent.studentUid}/payments/${pKey}`), {
                  status: 'Rejected'
                });
              }
              break;
            }
          }
        }
      }

      alert("Payment rejected.");
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to reject payment");
    }
  };

  const handleCollectFees = async () => {
    if (!selectedStudent || !collectAmount) return;
    const amount = parseFloat(collectAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const currentPaid = parseFloat(selectedStudent.paidFees?.toString().replace(/,/g, '') || '0');
      const totalFees = parseFloat(selectedStudent.fees?.toString().replace(/,/g, '') || '0');
      const newPaid = currentPaid + amount;

      // Update ONLY the source node
      const path = selectedStudent.source === 'Registered' 
        ? `colleges/${selectedStudent.collegeId}/students/${selectedStudent.id}`
        : `colleges/${selectedStudent.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const studentRef = getDbRef(path);
      await update(studentRef, {
        paidFees: newPaid.toString(),
        updatedAt: new Date().toISOString()
      });

      // Update student's application record
      if (selectedStudent.studentUid && selectedStudent.applicationId) {
        const appsRef = getDbRef(`users/${selectedStudent.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appKey, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedStudent.applicationId) {
              await update(ref(realtimeDb, `users/${selectedStudent.studentUid}/applications/${appKey}`), {
                paidFees: newPaid.toString()
              });
              if (resolvedAdminUid) {
                await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedStudent.studentUid}/applications/${appKey}`), {
                  paidFees: newPaid.toString()
                });
              }
              break;
            }
          }
        }
      }

      // Record transaction
      const existingTrans = allTransactions.find(t => t.studentId === selectedStudent.id && t.collegeId === selectedStudent.collegeId);
      
      let receiptNo = `REC-${Date.now().toString().slice(-6)}`;
      let transRef;
      let totalAmountToSave = amount;
      
      if (existingTrans) {
         transRef = getDbRef(`colleges/${selectedStudent.collegeId}/fees/transactions/${existingTrans.id}`);
         totalAmountToSave = parseFloat(existingTrans.amount?.toString().replace(/,/g, '') || '0') + amount;
         receiptNo = existingTrans.receiptNo || receiptNo;
      } else {
         transRef = push(getDbRef(`colleges/${selectedStudent.collegeId}/fees/transactions`));
      }

      const transData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        amount: totalAmountToSave,
        date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
        timestamp: existingTrans ? existingTrans.timestamp : Date.now(),
        courseName: selectedStudent.courseName || selectedStudent.courseId,
        type: paymentType || 'Manual',
        academicYear: academicYear,
        receiptNo: receiptNo,
        particulars: 'Tuition Fees',
        utrId: transactionRefId || 'N/A',
        remarks: transactionRemarks || '',
        regNo: selectedStudent.regNo || selectedStudent.applicationId || 'N/A',
        collegeLogo: selectedStudent.collegeLogo || '',
        collegeAddress: selectedStudent.collegeAddress || '',
        collegeParentOrg: selectedStudent.collegeParentOrg || '',
        stream: selectedStudent.stream || selectedStudent.branch || ''
      };
      
      if (existingTrans) {
         await update(transRef, transData);
      } else {
         await set(transRef, transData);
      }

      // Add to student's payment slips for student portal
      if (selectedStudent.studentUid) {
        const studentPaymentsRef = getDbRef(`users/${selectedStudent.studentUid}/payments`);
        const paymentsSnap = await get(studentPaymentsRef);
        let existingUserPaymentKey = null;
        
        if (paymentsSnap.exists()) {
           const payments = paymentsSnap.val();
           for (const [pKey, pData] of Object.entries(payments)) {
              if ((pData as any).applicationId === selectedStudent.applicationId) {
                 existingUserPaymentKey = pKey;
                 break;
              }
           }
        }
        
        const paymentData = {
          applicationId: selectedStudent.applicationId || '',
          collegeId: selectedStudent.collegeId || '',
          collegeName: selectedStudent.collegeName || '',
          courseName: selectedStudent.courseName || '',
          courseType: selectedStudent.courseType || 'Regular',
          stream: selectedStudent.stream || selectedStudent.branch || '',
          amount: totalAmountToSave.toString(),
          date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          status: 'Accepted',
          receiptNo: receiptNo,
          paymentMode: paymentType || 'Manual',
          utrId: transactionRefId || 'N/A'
        };
        
        if (existingUserPaymentKey) {
           await update(ref(realtimeDb, `users/${selectedStudent.studentUid}/payments/${existingUserPaymentKey}`), paymentData);
           if (resolvedAdminUid) {
              await update(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedStudent.studentUid}/payments/${existingUserPaymentKey}`), paymentData);
           }
        } else {
           const newGlobalPayRef = push(studentPaymentsRef);
           await set(newGlobalPayRef, paymentData);
           if (resolvedAdminUid) {
              const adminPayRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedStudent.studentUid}/payments/${newGlobalPayRef.key}`);
              await set(adminPayRef, paymentData);
           }
        }
      }

      setLastReceipt({
        ...transData,
        collegeName: selectedStudent.collegeName,
        courseType: selectedStudent.courseType,
        stream: selectedStudent.stream || selectedStudent.branch || '',
        rollNo: selectedStudent.rollNo || 'N/A'
      });
      setShowReceipt(true);

      alert("Fees collected successfully!");
      setIsCollectModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to collect fees");
      setIsCollectModalOpen(false);
    }
  };

  const handleDelete = async (student: any) => {
    if (!window.confirm(`Are you sure you want to delete ${student.studentName}? This will remove the student across ALL panels.`)) return;
    
    try {
      if (!student.collegeId || !student.id) {
        alert("Missing record information. Cannot delete.");
        return;
      }

      // 1. Determine correct path based on source
      const targetCollegeId = student.collegeId || collegeId;
      if (!targetCollegeId) {
        alert("Critical Error: College ID not found for this student. Deletion aborted.");
        return;
      }

      let path = '';
      if (student.source === 'Registered' || student.source === 'Registered Student') {
        path = `colleges/${targetCollegeId}/students/${student.id}`;
      } else if (student.source === 'Inquiry') {
        path = `colleges/${targetCollegeId}/frontOffice/admissionInquiries/${student.id}`;
      } else if (student.source === 'Admitted' || student.source === 'Admission' || !student.source) {
        path = `colleges/${targetCollegeId}/studentAdmissions/${student.id}`;
      } else {
        path = `colleges/${targetCollegeId}/studentAdmissions/${student.id}`;
      }
      
      console.log(`Deleting record at path: ${path}`);
      await remove(getDbRef(path));
      
      // 2. Remove from student's personal application panel
      const uid = student.studentUid || student.uid;
      const appId = student.applicationId;

      if (uid && appId) {
        const userAppsRef = getDbRef(`users/${uid}/applications`);
        const snapshot = await get(userAppsRef);
        if (snapshot.exists()) {
          const apps = snapshot.val();
          for (const [key, val] of Object.entries(apps)) {
            if ((val as any).applicationId === appId) {
              await remove(getDbRef(`users/${uid}/applications/${key}`));
              console.log(`Removed application ${appId} from user ${uid}`);
              break;
            }
          }
        }
      }

      // 3. Remove from College Online Payments
      if (appId) {
        const onlinePaymentsRef = getDbRef(`colleges/${student.collegeId}/payments/online`);
        const paymentsSnap = await get(onlinePaymentsRef);
        if (paymentsSnap.exists()) {
          const payments = paymentsSnap.val();
          for (const [pKey, pVal] of Object.entries(payments)) {
            if ((pVal as any).applicationId === appId) {
              await remove(getDbRef(`colleges/${student.collegeId}/payments/online/${pKey}`));
              console.log(`Removed online payment ${pKey}`);
            }
          }
        }
      }

      // 4. Remove from College Transactions
      const transRef = getDbRef(`colleges/${student.collegeId}/fees/transactions`);
      const transSnap = await get(transRef);
      if (transSnap.exists()) {
        const transactions = transSnap.val();
        for (const [tKey, tVal] of Object.entries(transactions)) {
          if ((tVal as any).studentId === student.id) {
            await remove(getDbRef(`colleges/${student.collegeId}/fees/transactions/${tKey}`));
            console.log(`Removed transaction record ${tKey}`);
          }
        }
      }
      
      alert('Record and all associated fees deleted successfully across all panels.');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete record.');
    }
  };

  // filteredStudents is defined above with CourseType and College filters

  const handleHistoryOpen = (student: any) => {
    setSelectedStudent(student);
    const trans = allTransactions.filter(t => t.studentId === student.id && t.collegeId === student.collegeId);
    setStudentTransactions(trans.sort((a, b) => b.timestamp - a.timestamp));
    setIsHistoryModalOpen(true);
  };

  const handleDeleteTransaction = async (trans: any) => {
    if (!window.confirm(`Are you sure you want to delete this payment of ₹${parseFloat(trans.amount).toLocaleString()}?`)) return;
    
    setIsDeletingTransaction(true);
    try {
      // 1. Remove transaction entry
      await remove(getDbRef(`colleges/${trans.collegeId}/fees/transactions/${trans.id}`));

      // 2. Resolve target student
      const targetStudent = students.find(s => s.id === trans.studentId || s.applicationId === trans.studentId);
      if (targetStudent) {
         const amountToSubtract = parseFloat(trans.amount?.toString().replace(/,/g, '') || '0');
         const studentPath = targetStudent.source === 'Registered' 
           ? `colleges/${trans.collegeId}/students/${targetStudent.id}`
           : `colleges/${trans.collegeId}/studentAdmissions/${targetStudent.id}`;
         
         const currentPaid = parseFloat(targetStudent.paidFees?.toString().replace(/,/g, '') || '0');
         const newPaid = Math.max(0, currentPaid - amountToSubtract);
         
         await update(getDbRef(studentPath), {
           paidFees: newPaid.toString()
         });

         // Update users node if online registered
         if (targetStudent.studentUid) {
            // Update applications paidFees
            if (targetStudent.applicationId) {
               const appsRef = getDbRef(`users/${targetStudent.studentUid}/applications`);
               const appsSnap = await get(appsRef);
               if (appsSnap.exists()) {
                  const apps = appsSnap.val();
                  for (const [appKey, appData] of Object.entries(apps)) {
                     if ((appData as any).applicationId === targetStudent.applicationId) {
                        await update(getDbRef(`users/${targetStudent.studentUid}/applications/${appKey}`), {
                           paidFees: newPaid.toString()
                        });
                        if (resolvedAdminUid) {
                           await update(getDbRef(`users/${resolvedAdminUid}/modules/registrations/${targetStudent.studentUid}/applications/${appKey}`), {
                              paidFees: newPaid.toString()
                           });
                        }
                        break;
                     }
                  }
               }
            }
            
            // Delete corresponding payment slip from student portal
            if (trans.receiptNo) {
               const paymentsRef = getDbRef(`users/${targetStudent.studentUid}/payments`);
               const paymentsSnap = await get(paymentsRef);
               if (paymentsSnap.exists()) {
                  const payments = paymentsSnap.val();
                  for (const [pKey, pData] of Object.entries(payments)) {
                     if ((pData as any).receiptNo === trans.receiptNo) {
                        await remove(getDbRef(`users/${targetStudent.studentUid}/payments/${pKey}`));
                        if (resolvedAdminUid) {
                           await remove(getDbRef(`users/${resolvedAdminUid}/modules/registrations/${targetStudent.studentUid}/payments/${pKey}`));
                        }
                     }
                  }
               }
            }
         }
      }
      
      // Update local state for modal
      setStudentTransactions(prev => prev.filter(t => t.id !== trans.id));
      alert('Transaction deleted and balance updated successfully.');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction.');
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  const handleEditTransactionSubmit = async () => {
     if (!editingTransaction) return;
     if (!editTransAmount || isNaN(parseFloat(editTransAmount))) {
        alert("Please enter a valid amount.");
        return;
     }

     setIsUpdatingTransaction(true);
     try {
        const newAmount = parseFloat(editTransAmount);
        const oldAmount = parseFloat(editingTransaction.amount || '0');
        const amountDiff = newAmount - oldAmount;

        const targetStudent = students.find(s => s.id === editingTransaction.studentId || s.applicationId === editingTransaction.studentId);
        
        if (targetStudent && amountDiff !== 0) {
           const studentPath = targetStudent.source === 'Registered' 
              ? `colleges/${editingTransaction.collegeId}/students/${targetStudent.id}`
              : `colleges/${editingTransaction.collegeId}/studentAdmissions/${targetStudent.id}`;
           
           const currentPaid = parseFloat(targetStudent.paidFees || '0');
           const newPaid = Math.max(0, currentPaid + amountDiff);

           await update(getDbRef(studentPath), {
              paidFees: newPaid.toString()
           });

           // Update user application if online
           if (targetStudent.studentUid && targetStudent.applicationId) {
              const appsRef = getDbRef(`users/${targetStudent.studentUid}/applications`);
              const appsSnap = await get(appsRef);
              if (appsSnap.exists()) {
                 const apps = appsSnap.val();
                 for (const [appKey, appData] of Object.entries(apps)) {
                    if ((appData as any).applicationId === targetStudent.applicationId) {
                       await update(getDbRef(`users/${targetStudent.studentUid}/applications/${appKey}`), {
                          paidFees: newPaid.toString()
                       });
                       if (resolvedAdminUid) {
                          await update(getDbRef(`users/${resolvedAdminUid}/modules/registrations/${targetStudent.studentUid}/applications/${appKey}`), {
                             paidFees: newPaid.toString()
                          });
                       }
                       break;
                    }
                 }
              }
           }
        }

        // Update transaction node
        await update(getDbRef(`colleges/${editingTransaction.collegeId}/fees/transactions/${editingTransaction.id}`), {
           amount: newAmount.toString(),
           date: editTransDate || new Date().toISOString(),
           receiptNo: editTransReceiptNo || 'N/A'
        });

        // Update local modal array
        setStudentTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, amount: newAmount.toString(), date: editTransDate, receiptNo: editTransReceiptNo } : t));
        
        alert("Transaction updated successfully!");
        setIsEditTransactionModalOpen(false);
     } catch (err) {
        console.error(err);
        alert("Failed to update transaction.");
     } finally {
        setIsUpdatingTransaction(false);
     }
  };

  const numberToWords = (num: number | string) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const numStr = num.toString();
    if (numStr.length > 9) return 'Overflow';
    const n = ('000000000' + numStr).substring(numStr.length).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (parseInt(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (parseInt(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (parseInt(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (parseInt(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (parseInt(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Only ' : 'Only';
    return str;
  };
  if (loading) return <div className="p-10 text-center text-slate-300 font-bold capitalize tracking-tight animate-pulse">Synchronizing Ledger...</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#5D5fb1] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
            <CreditCard size={14} className="text-[#00a5a5]" /> Fees Collection
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize leading-tight">Collect Fees</h2>
          <p className="text-xs sm:text-sm font-normal text-white/60">Manage student tuition payments and outstanding balances.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border-[0.5px] border-black shadow-sm p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
         {/* Premium Tab Navigation */}
         <div className="flex border-b-[0.5px] border-slate-200 pb-2 sm:pb-4 gap-2 sm:gap-6 no-print overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveLedgerTab('students')}
              className={`pb-3 sm:pb-4 px-3 sm:px-6 text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 \${
                activeLedgerTab === 'students'
                  ? 'text-[#00a5a5]'
                  : 'text-slate-400 hover:text-black'
              }`}
            >
              <User size={14} /> All Students Ledger
              {activeLedgerTab === 'students' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a5a5] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveLedgerTab('history')}
              className={`pb-3 sm:pb-4 px-3 sm:px-6 text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 \${
                activeLedgerTab === 'history'
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-black'
              }`}
            >
              <History size={14} /> Recent Fee Collections
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-600`}>
                {allTransactions.length}
              </span>
              {activeLedgerTab === 'history' && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />
              )}
            </button>
         </div>

         {activeLedgerTab === 'students' && (
           <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 border-b border-black pb-6 sm:pb-8">
             <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input 
                     type="text" 
                     placeholder="Search Student Name..." 
                     value={filterName}
                     onChange={(e) => setFilterName(e.target.value)}
                     className="w-full bg-slate-50 border-[0.5px] border-black rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-11 pr-4 text-xs sm:text-[14px] font-medium text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                   />
                </div>
                {!collegeId && (
                  <select 
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                    className="bg-slate-50 border-[0.5px] border-black rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-xs sm:text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#00a5a5] transition-all"
                  >
                     <option value="">All Institutions</option>
                     {availableColleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <select
                  value={filterCourseType}
                  onChange={(e) => setFilterCourseType(e.target.value)}
                  className="bg-slate-50 border-[0.5px] border-black rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-xs sm:text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#00a5a5] transition-all"
                >
                  <option value="">All Course Types</option>
                  <option value="Regular">Regular</option>
                  <option value="Distance">Distance</option>
                  <option value="Professional">Professional</option>
                </select>
             </div>
             <div className="flex items-center gap-3">
                <div className="text-xs sm:text-[13px] font-normal text-black capitalize tracking-tight bg-[#00a5a5]/10 px-4 py-2 rounded-full whitespace-nowrap">
                  {filteredStudents.length} Records Found
                </div>
              </div>
          </div>

          <GlobalDataFilter 
            data={filteredStudents} 
            filters={globalFilters} 
            setFilters={setGlobalFilters} 
          />

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border-[0.5px] border-black">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-r border-black">
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Sr. No</th>
                     {!collegeId && <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">College</th>}
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Student Name</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course Type</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Duration</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Semester</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Stream/Branch</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Outstanding Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Paid Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Total Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="border-b border-black">
                  {finalFilteredStudents.map((s, i) => {
                    const total = parseFloat(s.fees?.toString().replace(/,/g, '') || '0');
                    const basePaid = parseFloat(s.paidFees?.toString().replace(/,/g, '') || '0');
                    
                    // Sum up all transactions from history to ensure 100% accuracy
                    const studentTrans = allTransactions.filter(t => (t.studentId === s.id || t.studentId === s.applicationId) && t.collegeId === s.collegeId);
                    const transactionSum = studentTrans.reduce((sum, t) => sum + parseFloat(t.amount?.toString().replace(/,/g, '') || '0'), 0);
                    
                    // If the sum of transactions is higher (e.g. recent collection), use it. 
                    // This dynamically calculates the EXACT paid amount shown in history.
                    const paid = Math.max(basePaid, transactionSum);
                    const outstanding = total - paid;
                    const name = s.studentName || `${s.firstName || ''} ${s.lastName || ''}`;

                    // Find pending online payment for this student
                    const pendingPay = onlinePayments.find(p => 
                      p.status === 'Pending' && 
                      (p.applicationId === s.applicationId || (p.studentUid === s.studentUid && p.courseName === s.courseName && p.courseType === s.courseType))
                    );

                    return (
                      <tr key={`${s.id}-${i}`} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                        <td className="px-6 py-6 text-[14px] font-medium text-black border-r border-black">{i + 1}.</td>
                        {!collegeId && (
                           <td className="px-6 py-6 border-r border-black">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border-[0.5px] border-emerald-100">
                                    <Building2 size={12} />
                                 </div>
                                 <span className="text-[12px] font-bold text-slate-600 capitalize truncate max-w-[150px]">
                                    {s.collegeName || 'N/A'}
                                 </span>
                              </div>
                           </td>
                        )}
                        <td className="px-6 py-6 border-r border-black">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00a5a5]">
                                 <User size={18} />
                              </div>
                              <div>
                                 <p className="text-sm font-normal text-black capitalize tracking-tight">{name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 capitalize tracking-tight">{s.collegeName}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                           <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase border-[0.5px] border-indigo-100 shadow-sm">
                              {s.courseType || 'Reg'}
                           </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <p className="text-[13px] font-bold text-black capitalize tracking-tight">{s.courseName}</p>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                           <p className="text-[13px] font-bold text-black capitalize tracking-tight">{s.duration || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                           <p className="text-[13px] font-bold text-black capitalize tracking-tight">{s.semester || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                           <p className="text-[13px] font-bold text-black capitalize tracking-tight">{s.streamBranch || s.stream || s.branch || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <span className={`text-sm font-black ${outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              ₹{outstanding.toLocaleString()}
                           </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <span className="text-sm font-normal text-black">₹{paid.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <span className="text-sm font-normal text-black">₹{total.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-right">
                           <div className="flex items-center justify-end gap-2">
                             {pendingPay ? (
                               <button 
                                 onClick={() => handleProcessOpen(s, pendingPay)}
                                 className="bg-amber-500 text-black px-8 py-3 rounded-xl text-[13px] font-black capitalize shadow-xl hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[120px]"
                               >
                                  <Check size={16} /> Collect
                               </button>
                             ) : (
                               <button 
                                  onClick={() => { setSelectedStudent(s); setIsCollectModalOpen(true); }}
                                  className="bg-[#00a5a5] text-white px-8 py-3 rounded-xl text-[13px] font-black capitalize tracking-tight border border-black shadow-lg hover:bg-black transition-all active:scale-95 min-w-[120px]"
                                >
                                   Collect Fee
                                </button>
                             )}
                             <button 
                               onClick={() => handleHistoryOpen(s)}
                               className="p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-[0.5px] border-indigo-100 shadow-md"
                               title="Payment History"
                             >
                                <History size={16} />
                             </button>
                             <button 
                               onClick={() => handleDelete(s)}
                               className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border-[0.5px] border-rose-100 shadow-md"
                               title="Delete Record"
                             >
                                <Trash2 size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={collegeId ? 9 : 10} className="py-20 text-center">
                        <CreditCard size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-[13px] font-normal text-black capitalize tracking-tight">No fee records synchronized</p>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
         </>
         )}



         {activeLedgerTab === 'history' && (() => {
           const filteredTransactions = allTransactions.filter(t => {
             const sName = (t.studentName || '').toLowerCase();
             const searchMatch = sName.includes(historyFilterName.toLowerCase());
             
             let dateMatch = true;
             if (historyFilterDate) {
                const tDate = t.date ? new Date(t.date).toISOString().split('T')[0] : '';
                dateMatch = tDate === historyFilterDate;
             }
             
             let courseMatch = true;
             if (historyFilterCourse) {
                courseMatch = t.courseName === historyFilterCourse;
             }
             
             let courseTypeMatch = true;
             if (historyFilterCourseType) {
                const student = students.find(s => s.id === t.studentId || s.applicationId === t.studentId);
                const sCourseType = student?.courseType || 'Reg';
                courseTypeMatch = sCourseType === historyFilterCourseType;
             }

             return searchMatch && dateMatch && courseMatch && courseTypeMatch;
           });

           return (
           <div className="space-y-6">
             <div className="flex flex-col gap-4 border-b border-black pb-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-[16px] font-black text-black uppercase tracking-tight flex items-center gap-2">
                   <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                   Fee Collection Ledger Log
                 </h3>
                 <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase border-[0.5px] border-indigo-100">
                   {filteredTransactions.length} Transactions
                 </span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="text"
                       placeholder="Search Student..."
                       value={historyFilterName}
                       onChange={(e) => setHistoryFilterName(e.target.value)}
                       className="w-full bg-slate-50 border-[0.5px] border-black rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium outline-none focus:border-indigo-600 focus:bg-white transition-all"
                     />
                  </div>
                  <input 
                    type="date"
                    value={historyFilterDate}
                    onChange={(e) => setHistoryFilterDate(e.target.value)}
                    className="w-full bg-slate-50 border-[0.5px] border-black rounded-xl px-4 py-3 text-[13px] font-medium outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-500"
                  />
                  <select
                    value={historyFilterCourseType}
                    onChange={(e) => setHistoryFilterCourseType(e.target.value)}
                    className="w-full bg-slate-50 border-[0.5px] border-black rounded-xl px-4 py-3 text-[13px] font-medium outline-none focus:border-indigo-600 focus:bg-white transition-all capitalize"
                  >
                     <option value="">All Course Types</option>
                     {Array.from(new Set(students.map(s => s.courseType).filter(Boolean))).map((type: any) => (
                       <option key={type} value={type}>{type}</option>
                     ))}
                  </select>
                  <select
                    value={historyFilterCourse}
                    onChange={(e) => setHistoryFilterCourse(e.target.value)}
                    className="w-full bg-slate-50 border-[0.5px] border-black rounded-xl px-4 py-3 text-[13px] font-medium outline-none focus:border-indigo-600 focus:bg-white transition-all capitalize"
                  >
                     <option value="">All Courses</option>
                     {Array.from(new Set(allTransactions.map(t => t.courseName).filter(Boolean))).map((course: any) => (
                       <option key={course} value={course}>{course}</option>
                     ))}
                  </select>
               </div>
             </div>
             <div className="overflow-x-auto no-scrollbar border-[0.5px] border-black">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50 border-b border-black">
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Sr. No</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Receipt No</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Date & Time</th>
                     {!collegeId && <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">College</th>}
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Student Name</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Mode</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Amount</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {[...filteredTransactions].sort((a, b) => b.timestamp - a.timestamp).map((t, i) => {
                     return (
                        <tr key={`${t.id}-${i}`} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                         <td className="px-6 py-6 text-[14px] font-medium text-black border-r border-black">{i + 1}.</td>
                         <td className="px-6 py-6 border-r border-black whitespace-nowrap">
                           <span className="text-[12px] font-black text-slate-800 uppercase tracking-tighter bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                             {t.receiptNo || 'N/A'}
                           </span>
                         </td>
                         <td className="px-6 py-6 border-r border-black whitespace-nowrap">
                           <p className="text-[13px] font-medium text-black">
                             {t.date ? `${new Date(t.date).toLocaleDateString()} | ` + new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                           </p>
                         </td>
                         {!collegeId && (
                           <td className="px-6 py-6 border-r border-black">
                             <span className="text-[12px] font-bold text-slate-600 capitalize truncate max-w-[150px]">
                               {availableColleges.find(c => c.id === t.collegeId)?.name || 'N/A'}
                             </span>
                           </td>
                         )}
                         <td className="px-6 py-6 border-r border-black">
                           <p className="text-sm font-normal text-black capitalize tracking-tight">{t.studentName || 'N/A'}</p>
                         </td>
                         <td className="px-6 py-6 border-r border-black">
                           <p className="text-[13px] font-bold text-black capitalize tracking-tight">{t.courseName || 'N/A'}</p>
                         </td>
                         <td className="px-6 py-6 border-r border-black text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                             t.type === 'Online'
                               ? 'bg-amber-50 text-amber-600 border-amber-100'
                               : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                             {t.type || 'Manual'}
                           </span>
                         </td>
                         <td className="px-6 py-6 border-r border-black">
                           <span className="text-sm font-black text-black">₹{parseFloat(t.amount || '0').toLocaleString()}</span>
                         </td>
                         <td className="px-6 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => {
                                 const student = students.find(s => s.id === t.studentId || s.applicationId === t.studentId);
                                 const college = availableColleges.find(c => c.id === t.collegeId);
                                 setLastReceipt({
                                   ...t,
                                   collegeName: student?.collegeName || college?.name || 'N/A',
                                   courseType: student?.courseType || 'Reg',
                                   stream: t.stream || student?.stream || student?.branch || 'N/A',
                                   rollNo: student?.rollNo || 'N/A'
                                 });
                                 setShowReceipt(true);
                               }}
                               className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"
                               title="Print Receipt"
                             >
                               <Receipt size={15} />
                             </button>
                             <button
                               onClick={() => {
                                 setEditingTransaction(t);
                                 setEditTransAmount(t.amount || '');
                                 setEditTransDate(t.date ? new Date(t.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
                                 setEditTransReceiptNo(t.receiptNo || '');
                                 setIsEditTransactionModalOpen(true);
                               }}
                               className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all border border-amber-100 shadow-sm"
                               title="Edit Transaction"
                             >
                               <Edit size={15} />
                             </button>
                             <button
                               onClick={() => handleDeleteTransaction(t)}
                               className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
                               title="Revoke / Delete Transaction"
                             >
                               <Trash2 size={15} />
                             </button>
                           </div>
                         </td>
                       </tr>
                     );
                   })}
                   {filteredTransactions.length === 0 && (
                     <tr>
                       <td colSpan={collegeId ? 8 : 9} className="py-20 text-center">
                         <History size={48} className="mx-auto text-slate-100 mb-4" />
                         <p className="text-[13px] font-normal text-black capitalize tracking-tight">No transactions found</p>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
           );
         })()}
      </div>

      {isCollectModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsCollectModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-[#5D5fb1] p-10 text-white relative">
                 <button onClick={() => setIsCollectModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white"><X size={20} /></button>
                 <h3 className="text-2xl font-black tracking-tighter capitalize">Fee Collection</h3>
                 <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight mt-2">{selectedStudent.studentName}</p>
              </div>
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border-[0.5px] border-black">
                       <p className="text-[9px] font-black text-slate-400 capitalize tracking-tight">Total Fees</p>
                       <p className="text-lg font-black text-slate-800 capitalize tracking-tight">₹{parseFloat(selectedStudent.fees?.toString().replace(/,/g, '') || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border-[0.5px] border-black">
                       <p className="text-[9px] font-black text-red-400 capitalize tracking-tight">Due Amount</p>
                       <p className="text-lg font-black text-red-600 capitalize tracking-tight">
                          ₹{(() => {
                             const total = parseFloat(selectedStudent.fees?.toString().replace(/,/g, '') || '0');
                             const basePaid = parseFloat(selectedStudent.paidFees?.toString().replace(/,/g, '') || '0');
                             const studentTrans = allTransactions.filter(t => (t.studentId === selectedStudent.id || t.studentId === selectedStudent.applicationId) && t.collegeId === selectedStudent.collegeId);
                             const transactionSum = studentTrans.reduce((sum, t) => sum + parseFloat(t.amount?.toString().replace(/,/g, '') || '0'), 0);
                             const dynamicPaid = Math.max(basePaid, transactionSum);
                             return (total - dynamicPaid).toLocaleString();
                          })()}
                       </p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Academic Year</label>
                       <select 
                         value={academicYear}
                         onChange={(e) => setAcademicYear(e.target.value)}
                         className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5]"
                       >
                          <option value="2022-23">2022-23</option>
                          <option value="2023-24">2023-24</option>
                          <option value="2024-25">2024-25</option>
                          <option value="2025-26">2025-26</option>
                          <option value="2026-27">2026-27</option>
                          <option value="2027-28">2027-28</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Collect Amount (₹)</label>
                       <input 
                         type="number" 
                         value={collectAmount}
                         onChange={(e) => setCollectAmount(e.target.value)}
                         placeholder="Enter amount to pay..."
                         className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-5 text-lg font-black text-slate-700 outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-inner"
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Payment Type</label>
                          <select 
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5]"
                          >
                             <option value="Cash">Cash</option>
                             <option value="Online">Online</option>
                             <option value="Bank">Bank</option>
                             <option value="Other">Other</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Transaction Date</label>
                          <input 
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5]"
                          />
                       </div>
                    </div>
                    {(paymentType === 'Online' || paymentType === 'Bank' || paymentType === 'Other') && (
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Transaction Ref ID / UTR</label>
                          <input 
                            type="text"
                            value={transactionRefId}
                            onChange={(e) => setTransactionRefId(e.target.value)}
                            placeholder="Enter Reference ID"
                            className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5]"
                          />
                       </div>
                    )}
                    <div className="space-y-2">
                       <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Transaction Remarks</label>
                       <textarea 
                         value={transactionRemarks}
                         onChange={(e) => setTransactionRemarks(e.target.value)}
                         placeholder="Optional remarks..."
                         rows={2}
                         className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] resize-none"
                       />
                    </div>
                 </div>
                 <button 
                   onClick={handleCollectFees}
                   className="w-full bg-[#5D5fb1] text-white py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-xl hover:bg-[#00a5a5] transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <Save size={20} /> Finalize Payment
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Process Online Modal - Refactored to match Student Portal Style */}
      {isProcessModalOpen && selectedStudent && pendingPayment && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => setIsProcessModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              {/* Sticky Header */}
              <div className="bg-[#5D5fb1] p-10 text-white relative shrink-0">
                 {/* Academic Year Selector - Left of Cross Button */}
                 <div className="absolute right-20 top-10 flex items-center gap-2">
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-tighter whitespace-nowrap">Academic Year:</p>
                    <select 
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="bg-white border-[0.5px] border-black rounded-lg px-2 py-0.5 text-[10px] font-black text-black outline-none"
                    >
                       <option value="2022-23">2022-23</option>
                       <option value="2023-24">2023-24</option>
                       <option value="2024-25">2024-25</option>
                       <option value="2025-26">2025-26</option>
                       <option value="2026-27">2026-27</option>
                       <option value="2027-28">2027-28</option>
                    </select>
                 </div>
                 
                 <button onClick={() => setIsProcessModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter capitalize">Verify Fee Payment</h3>
                    <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Review transaction details submitted by student</p>
                 </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-10 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                 {/* Financial Snapshot (Admin specific) */}
                 <div className="p-6 bg-red-50 rounded-[2rem] border-[0.5px] border-black flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-white border-[0.5px] border-black flex items-center justify-center text-red-600 shadow-sm">
                          <IndianRupee size={20} />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-0.5">Outstanding Balance</p>
                          <h4 className="text-2xl font-black text-red-600 tracking-tighter">₹{(parseFloat(selectedStudent.fees || '0') - parseFloat(selectedStudent.paidFees || '0')).toLocaleString()}</h4>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Total Fees</p>
                       <p className="text-sm font-black text-black">₹{parseFloat(selectedStudent.fees || '0').toLocaleString()}</p>
                    </div>
                 </div>

                 {/* Student/Course Info Grid - Matching Student Portal */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border-[0.5px] border-slate-200">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                       <p className="text-sm font-bold text-slate-800 capitalize truncate">{selectedStudent.studentName}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border-[0.5px] border-slate-200">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submission Date</p>
                       <p className="text-sm font-bold text-slate-800">
                          {pendingPayment.submittedAt ? new Date(pendingPayment.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                       </p>
                    </div>
                    <div className="bg-[#5D5fb1]/5 p-4 rounded-2xl border-[0.5px] border-[#5D5fb1]/20">
                       <p className="text-[10px] font-bold text-[#5D5fb1] uppercase tracking-widest mb-1">College</p>
                       <p className="text-sm font-bold text-[#002147] capitalize truncate">{selectedStudent.collegeName}</p>
                    </div>
                    <div className="bg-[#00a5a5]/5 p-4 rounded-2xl border-[0.5px] border-[#00a5a5]/20">
                       <p className="text-[10px] font-bold text-[#00a5a5] uppercase tracking-widest mb-1">Course</p>
                       <p className="text-sm font-bold text-[#002147] capitalize truncate">{pendingPayment.courseName || selectedStudent.courseName}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border-[0.5px] border-indigo-200 md:col-span-2">
                       <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Registration / Application Number</p>
                       <p className="text-sm font-black text-[#002147] uppercase">
                          {selectedStudent.regNo || selectedStudent.applicationId || 'Pending Assignment'}
                       </p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {/* Transaction Details Form Section - Matching Student Portal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UPI ID</label>
                          <div className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-medium text-slate-800">
                             {pendingPayment.upiId || 'N/A'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UTR / Transaction ID</label>
                          <div className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-medium text-slate-800">
                             {pendingPayment.utrId || 'N/A'}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Payer Relation</label>
                          <div className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-medium text-slate-800">
                             {pendingPayment.relationship || 'Self'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 text-emerald-600">Amount Paid (₹)</label>
                          <div className="w-full bg-emerald-50 border-[0.5px] border-emerald-500 rounded-2xl p-4 text-lg font-black text-emerald-700">
                             ₹{parseFloat(pendingPayment.amount).toLocaleString()}
                          </div>
                       </div>
                    </div>

                    {/* Contact Information Section - Matching Student Portal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Email ID</label>
                          <div className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-medium text-slate-800">
                             {pendingPayment.email || selectedStudent.email || 'N/A'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mobile Number</label>
                          <div className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl p-4 text-sm font-medium text-slate-800">
                             {pendingPayment.mobile || selectedStudent.mobile || pendingPayment.phone || 'N/A'}
                          </div>
                       </div>
                    </div>

                    {/* Screenshot Section - Matching Student Portal */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between pl-1">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight">Payment Screenshot / Photo</label>
                          {pendingPayment.screenshot && (
                            <button 
                              type="button"
                              onClick={() => {
                                setPreviewImage(pendingPayment.screenshot);
                                setIsPreviewModalOpen(true);
                              }}
                              className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-[#00a5a5] flex items-center gap-1 transition-colors"
                            >
                               <Eye size={14} /> View Full Size
                            </button>
                          )}
                       </div>
                       <div className="w-full bg-slate-100 rounded-[2.5rem] p-6 flex items-center justify-center border-[0.5px] border-dashed border-black">
                          {pendingPayment.screenshot ? (
                            <img 
                              src={pendingPayment.screenshot} 
                              className="max-w-[200px] h-auto rounded-2xl shadow-xl border-[0.5px] border-black cursor-pointer hover:scale-105 transition-transform" 
                              alt="Payment Proof" 
                              onClick={() => {
                                setPreviewImage(pendingPayment.screenshot);
                                setIsPreviewModalOpen(true);
                              }}
                            />
                          ) : (
                            <div className="text-center py-8 space-y-2">
                               <Camera size={32} className="mx-auto text-slate-300" />
                               <p className="text-[12px] font-bold text-slate-400 italic uppercase">No screenshot uploaded</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Sticky Footer Actions */}
              <div className="p-8 border-t border-black bg-slate-50 flex gap-4 shrink-0">
                 <button 
                   onClick={handleRejectOnlinePayment}
                   className="flex-1 bg-white border-[0.5px] border-black text-rose-500 py-4 rounded-[2rem] text-[13px] font-black capitalize hover:bg-rose-50 transition-all active:scale-95"
                 >
                    Reject Payment
                 </button>
                 <button 
                   onClick={handleApproveOnlinePayment}
                   className="flex-[2] bg-[#002147] text-white py-4 rounded-[2rem] text-[13px] font-black capitalize shadow-2xl hover:bg-[#5D5fb1] transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <Check size={20} /> Approve & Collect
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black tracking-tighter">Payment History</h3>

                    <p className="text-[12px] font-medium text-white/60 capitalize tracking-tight">{selectedStudent.studentName}</p>
                 </div>
                 <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white">
                    <X size={20} />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
                  {studentTransactions.length > 0 ? (
                    <table className="w-full text-left border-collapse border-[0.5px] border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 border-b-[0.5px] border-slate-200">
                          <th className="px-6 py-4 text-[13px] font-bold text-slate-800 uppercase border-r-[0.5px] border-slate-200 w-16 text-center">Sr. No</th>
                          <th className="px-6 py-4 text-[13px] font-bold text-slate-800 uppercase border-r-[0.5px] border-slate-200">Date & Time</th>
                          <th className="px-6 py-4 text-[13px] font-bold text-slate-800 uppercase border-r-[0.5px] border-slate-200">Receipt No</th>
                          <th className="px-6 py-4 text-[13px] font-bold text-slate-800 uppercase border-r-[0.5px] border-slate-200 text-right">Collected Amount</th>
                          <th className="px-6 py-4 text-[13px] font-bold text-slate-800 uppercase text-center w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentTransactions.map((t, idx) => (
                           <tr key={`${t.id}-${idx}`} className="border-b-[0.5px] border-slate-200 hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4 text-[13px] font-medium text-slate-600 border-r-[0.5px] border-slate-200 text-center">{idx + 1}.</td>
                              <td className="px-6 py-4 border-r-[0.5px] border-slate-200">
                                 <p className="text-[13px] font-medium text-slate-800">
                                    {new Date(t.timestamp).toLocaleDateString()}
                                 </p>
                                 <p className="text-[11px] font-medium text-slate-400">
                                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </td>
                              <td className="px-6 py-4 border-r-[0.5px] border-slate-200">
                                 <span className="text-[12px] font-black text-[#00a5a5] uppercase tracking-widest bg-[#e6f7f7] px-2 py-1 rounded">
                                    {t.receiptNo || 'N/A'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 border-r-[0.5px] border-slate-200 text-right">
                                 <span className="text-[14px] font-black text-slate-800">₹{parseFloat(t.amount).toLocaleString()}</span>
                                 <p className="text-[9px] font-bold tracking-widest uppercase mt-1">
                                    <span className={t.type === 'Online' ? 'text-emerald-500' : 'text-blue-500'}>{t.type || 'Cash'}</span>
                                 </p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingTransaction(t);
                                        setEditTransAmount(t.amount || '');
                                        setEditTransDate(t.date ? new Date(t.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
                                        setEditTransReceiptNo(t.receiptNo || '');
                                        setIsEditTransactionModalOpen(true);
                                      }}
                                      className="p-2 rounded-lg bg-amber-50 text-amber-500 transition-all hover:bg-amber-500 hover:text-white"
                                      title="Edit Transaction"
                                    >
                                       <Edit size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTransaction(t)}
                                      disabled={isDeletingTransaction}
                                      className="p-2 rounded-lg bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                                      title="Delete Transaction"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                 ) : (
                    <div className="py-20 text-center text-slate-300">
                       <History size={48} className="mx-auto opacity-10 mb-4" />
                       <p className="text-sm font-medium">No transaction history found</p>
                    </div>
                 )}
               </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Current Total Paid</p>
                    <p className="text-lg font-black text-indigo-600">₹{parseFloat(selectedStudent.paidFees || '0').toLocaleString()}</p>
                 </div>
                 <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[12px] font-black text-slate-600 hover:bg-slate-50 transition-all">
                    Close History
                 </button>
              </div>
           </div>
        </div>
      )}


      {/* Edit Transaction Modal */}
      {isEditTransactionModalOpen && editingTransaction && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => setIsEditTransactionModalOpen(false)} />
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="bg-amber-500 p-8 text-white flex items-center justify-between">
                  <div>
                     <h3 className="text-xl font-black tracking-tighter">Edit Receipt</h3>
                     <p className="text-[12px] font-medium text-white/80 capitalize tracking-tight">{editingTransaction.studentName || 'Student'} | {editingTransaction.receiptNo}</p>
                  </div>
                  <button onClick={() => setIsEditTransactionModalOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4">Receipt Number</label>
                     <div className="relative">
                        <Receipt size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                           type="text"
                           value={editTransReceiptNo}
                           onChange={(e) => setEditTransReceiptNo(e.target.value)}
                           className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all uppercase"
                        />
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4">Collection Date & Time</label>
                     <div className="relative">
                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                           type="datetime-local"
                           value={editTransDate}
                           onChange={(e) => setEditTransDate(e.target.value)}
                           className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4">Fee Amount</label>
                     <div className="relative">
                        <IndianRupee size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                           type="number"
                           value={editTransAmount}
                           onChange={(e) => setEditTransAmount(e.target.value)}
                           className="w-full bg-slate-50 border-[0.5px] border-black rounded-2xl py-4 pl-12 pr-4 text-xl font-black text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                     </div>
                  </div>

                  <button
                     onClick={handleEditTransactionSubmit}
                     disabled={isUpdatingTransaction}
                     className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-tight flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                  >
                     {isUpdatingTransaction ? 'Updating...' : 'Save Changes'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Receipt Modal - A4 Modern Institutional Style */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-[900px] h-[95vh] shadow-2xl relative flex flex-col rounded-3xl overflow-hidden border-[0.5px] border-black">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 no-print">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                       <Receipt size={20} />
                    </div>
                    <div>
                       <span className="text-[14px] font-black text-red-600 uppercase tracking-tighter block">A4 Institutional Receipt</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Official Document Preview</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                       onClick={handleDownloadReceiptPDF}
                       disabled={isDownloadingReceipt}
                       className={cn(
                          "px-8 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2 text-[12px] font-black shadow-xl active:scale-95",
                          isDownloadingReceipt && "opacity-50 cursor-not-allowed"
                       )}
                    >
                       {isDownloadingReceipt ? (
                          <>
                             <Loader2 size={16} className="animate-spin" /> GENERATING PDF...
                          </>
                       ) : (
                          <>
                             <Download size={16} /> DOWNLOAD RECEIPT (A4)
                          </>
                       )}
                    </button>
                    <button onClick={() => setShowReceipt(false)} className="p-3 rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors border-[0.5px] border-slate-200">
                       <X size={20} />
                    </button>
                 </div>
              </div>

              <div className="bg-slate-800 p-8 overflow-y-auto custom-scrollbar flex-1 flex justify-center">
                 <div 
                    id="receipt-print" 
                    className="bg-white font-serif border-[1px] border-black shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden text-red-700 shrink-0"
                    style={{ 
                       width: '210mm', 
                       height: '297mm', 
                       padding: '12mm',
                       boxSizing: 'border-box',
                       display: 'flex',
                       flexDirection: 'column'
                    }}
                 >
                    <div className="flex items-start gap-4 pb-2 relative border-b border-red-100 shrink-0">
                       <div className="shrink-0 pt-1">
                          <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                             <img 
                               src={lastReceipt.collegeLogo || "/logo.png"} 
                               alt="Logo" 
                               className="w-16 h-16 object-contain" 
                               onError={(e) => (e.currentTarget.style.display = 'none')} 
                             />
                          </div>
                       </div>
                       <div className="flex-1 text-center pr-20">
                          <h5 className="text-[10px] font-bold uppercase leading-tight tracking-tight text-red-600">
                             {lastReceipt.collegeParentOrg || "Mahavishnu Gramin Vikas & Shaikshnik B. sanstha Dhamangaon ( Dhad )"}
                          </h5>
                          <h1 className="text-[18px] font-black text-red-700 uppercase leading-none tracking-tighter mt-2">
                             {lastReceipt.collegeName}
                          </h1>
                          <p className="text-[12px] font-bold uppercase tracking-widest mt-1 text-red-600">
                             {lastReceipt.collegeAddress || "Tq.Bhokardan Dist. jalna , Paradh - 431114"}
                          </p>
                       </div>
                    </div>

                    <div className="flex items-end justify-between mt-4 shrink-0">
                       <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-bold uppercase italic">Receipt No :</span>
                          <span className="text-[14px] font-black border-b-[1px] border-dotted border-red-400 min-w-[100px] text-center px-4">{lastReceipt.receiptNo}</span>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-bold uppercase italic">Date :</span>
                          <span className="text-[14px] font-black border-b-[1px] border-dotted border-red-400 min-w-[150px] text-center px-4">{new Date(lastReceipt.date || lastReceipt.timestamp).toLocaleDateString()}</span>
                       </div>
                    </div>

                    <div className="mt-4 space-y-4 shrink-0">
                       <div className="flex items-center gap-10">
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Name of Student :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black uppercase pl-4">
                                {lastReceipt.studentName}
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-10">
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Registration No :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black pl-4">
                                {lastReceipt.regNo || 'N/A'}
                             </div>
                          </div>
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Roll No :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black pl-4">
                                {lastReceipt.rollNo || 'N/A'}
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-10">
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Academic Year :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black pl-4">
                                {lastReceipt.academicYear}
                             </div>
                          </div>
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Course Type :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black pl-4 uppercase">
                                {lastReceipt.courseType || 'Reg'}
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-10">
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Course :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black uppercase pl-4">
                                {lastReceipt.courseName}
                             </div>
                          </div>
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Stream/Branch :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black uppercase pl-4">
                                {lastReceipt.stream || 'N/A'}
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-10">
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Semester :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black uppercase pl-4">
                                {lastReceipt.semester || 'N/A'}
                             </div>
                          </div>
                          <div className="flex items-baseline gap-4 flex-1">
                             <span className="text-[13px] font-bold uppercase shrink-0">Duration :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-1 text-[14px] font-black uppercase pl-4">
                                {lastReceipt.duration || 'N/A'}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-4 border-[1.5px] border-red-600 rounded-sm overflow-hidden flex-1">
                       <table className="w-full border-collapse">
                          <thead>
                             <tr className="bg-red-50/20 border-b-[1.5px] border-red-600">
                                <th className="px-3 py-1.5 text-center text-[11px] font-black uppercase border-r-[1.5px] border-red-600 w-12">Sr.</th>
                                <th className="px-4 py-1.5 text-left text-[11px] font-black uppercase border-r-[1.5px] border-red-600">Particular's</th>
                                <th className="px-4 py-1.5 text-left text-[11px] font-black uppercase border-r-[1.5px] border-red-600 w-32">Remark</th>
                                <th className="px-4 py-1.5 text-right text-[11px] font-black uppercase w-40">Amount (Rs)</th>
                             </tr>
                          </thead>
                          <tbody>
                             {[
                                "Tuition Fee",
                                "Admission Fee/Enrollment Fee",
                                "University Eligibility Fee",
                                "Univ Exam. Fee",
                                "Univ Sports (Per Capita) Fee",
                                "Univ Students Welfare Fund",
                                "Student Insurance",
                                "Caution Money Deposit",
                                "I-Card, Magazines",
                                "Journals / Stationary",
                                "Extra Curricular Activities Fee",
                                "College Development Fee",
                                "Library Fee/Deposit",
                                "Laboratory Fee/Deposit",
                                "Professional Membership Fee",
                                "Transpertation Fee",
                                "Medical Exam Fee",
                                "Development Fee",
                                "Other Fees"
                             ].map((item, idx) => (
                                <tr key={idx} className="border-b-[1px] border-red-400">
                                   <td className="px-3 py-1 text-center text-[12px] font-bold border-r-[1.5px] border-red-600">{idx + 1}</td>
                                   <td className="px-4 py-1 text-[12px] font-medium border-r-[1.5px] border-red-600">{item}</td>
                                   <td className="px-4 py-1 text-[12px] font-medium border-r-[1.5px] border-red-600">-</td>
                                   <td className="px-4 py-1 text-right text-[13px] font-black">
                                      {idx === 0 ? `₹${parseFloat(lastReceipt.amount).toLocaleString()}` : '-'}
                                   </td>
                                </tr>
                             ))}
                             <tr className="border-t-[1.5px] border-red-600 font-black bg-red-50/10">
                                <td colSpan={3} className="px-4 py-2 text-right text-[12px] uppercase tracking-widest border-r-[1.5px] border-red-600">Total Fess</td>
                                <td className="px-4 py-2 text-right text-[14px] text-red-800">₹{parseFloat(lastReceipt.amount).toLocaleString()}</td>
                             </tr>
                          </tbody>
                       </table>
                    </div>

                    <div className="mt-4 space-y-4 shrink-0">
                       <div className="flex items-baseline gap-4 w-full">
                          <span className="text-[13px] font-bold uppercase shrink-0 italic">Amount In Words Rs :</span>
                          <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-0.5 text-[14px] font-black uppercase pl-4">
                             {numberToWords(parseFloat(lastReceipt.amount))}
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-x-10 gap-y-2">
                          <div className="flex items-baseline gap-4">
                             <span className="text-[12px] font-bold uppercase shrink-0 italic">Cash/D.D. No :</span>
                             <div className="flex-1 border-b-[2px] border-dotted border-red-300 pb-0.5 text-[12px] font-bold pl-4">
                                {lastReceipt.utrId || 'Online Payment'}
                             </div>
                          </div>
                       </div>

                       <div className="pt-6 flex justify-end">
                          <div className="text-center space-y-2">
                             <div className="w-56 h-16 flex items-center justify-center border border-red-100 rounded bg-red-50/5">
                                <span className="text-[9px] font-bold text-red-100 uppercase italic">Institutional Stamp</span>
                             </div>
                             <p className="text-[13px] font-black text-red-700 uppercase tracking-tighter">(Accountant / Authorized Sign.)</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-auto text-center text-[9px] text-red-400 font-bold uppercase tracking-[0.2em] border-t-[1px] border-red-50 pt-2 shrink-0">
                       * Computer Generated Official Receipt - Mahalaxmi Nursing and technical institute *
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for Modal Details//
function DetailItem({ label, value, icon, highlight = false, bold = false }: { label: string, value: string, icon?: React.ReactNode, highlight?: boolean, bold?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border-[0.5px] transition-all ${highlight ? 'bg-indigo-50 border-black' : 'bg-slate-50 border-black'}`}>
       <div className="flex items-center gap-2 mb-1">
          <span className="text-[#5D5fb1]">{icon}</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</p>
       </div>
       <p className={`text-[14px] font-black leading-tight ${highlight ? 'text-[#5D5fb1]' : 'text-black'} ${bold ? 'text-lg text-emerald-600' : ''} uppercase`}>
          {value || 'N/A'}
       </p>
    </div>
  );
}

function numberToWords(amount: number): string {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (amount === 0) return 'Zero';
  
  const convert = (n: number): string => {
    if (n < 20) return words[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
    if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  return convert(Math.floor(amount)) + ' Only';
}
