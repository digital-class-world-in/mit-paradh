'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, get, set, push, remove } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { CreditCard, Search, DollarSign, User, BookOpen, Clock, X, Save, Eye, Check, Receipt, Trash2, Building2, Calendar, History, Copy, Download, ShieldCheck, Tag, Mail, Phone, Edit2, IndianRupee } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export default function FeesCollectionManager({ collegeId }: { collegeId?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [generatedReceiptNo, setGeneratedReceiptNo] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(collegeId || '');
  const [onlinePayments, setOnlinePayments] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [collegePaymentSettings, setCollegePaymentSettings] = useState<any>(null);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [receiptPreviewData, setReceiptPreviewData] = useState<any>(null);
  const [collectPaymentMethod, setCollectPaymentMethod] = useState('Cash');

  useEffect(() => {
    if (!realtimeDb) {
      setLoading(false);
      return;
    }

    const collegesRef = ref(realtimeDb, 'colleges');
    const unsubscribe = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        const collegesData = snap.val();
        
        if (!collegeId) {
          setAvailableColleges(Object.entries(collegesData).map(([id, val]: any) => ({ id, ...val })));
        }

        setLoading(true);
        let allStudents: any[] = [];
        let allOnlinePayments: any[] = [];
        let allTrans: any[] = [];
        
        Object.entries(collegesData).forEach(([cId, cData]: [string, any]) => {
          if (collegeId && cId !== collegeId) return;

          if (cData?.payments?.online) {
            Object.entries(cData.payments.online).forEach(([pId, pData]: [string, any]) => {
              allOnlinePayments.push({ id: pId, collegeId: cId, ...pData });
            });
          }

          if (cData?.fees?.transactions) {
            Object.entries(cData.fees.transactions).forEach(([tId, tData]: [string, any]) => {
              if (!allTrans.some(t => t.id === tId)) {
                allTrans.push({ id: tId, collegeId: cId, ...tData });
              }
            });
          }

          if (cData?.students) {
            Object.entries(cData.students).forEach(([sId, sData]: [string, any]) => {
              if (!allStudents.some(s => s.id === sId || (s.uid && s.uid === sData.studentUid))) {
                allStudents.push({
                  id: sId,
                  ...sData,
                  studentName: sData?.studentName || `${sData?.firstName || ''} ${sData?.lastName || ''}`,
                  collegeId: cId,
                  collegeName: cData.name,
                  source: 'Registered'
                });
              }
            });
          }

          if (cData?.studentAdmissions) {
            Object.entries(cData.studentAdmissions).forEach(([aId, aData]: [string, any]) => {
              if (!allStudents.some(s => s.id === aId || (s.studentUid && s.studentUid === aData?.studentUid))) {
                 allStudents.push({
                   id: aId,
                   ...aData,
                   studentName: aData?.studentName || `${aData?.firstName || ''} ${aData?.lastName || ''}`,
                   collegeId: cId,
                   collegeName: cData.name,
                   source: 'Admitted'
                 });
              }
            });
          }
        });
        
        setOnlinePayments(allOnlinePayments);
        setAllTransactions(allTrans);
        
        const sortedStudents = allStudents.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.admissionDate || a.date || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.admissionDate || b.date || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        setStudents(sortedStudents);
      } else {
        setStudents([]);
        setOnlinePayments([]);
        setAllTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collegeId]);

  const handleCollectOpen = (student: any) => {
    setSelectedStudent(student);
    setCollectAmount('');
    setIsCollectModalOpen(true);
    
    if (student.collegeId) {
       const paySetRef = ref(realtimeDb, `colleges/${student.collegeId}/paymentSettings`);
       get(paySetRef).then(snap => {
          if (snap.exists()) setCollegePaymentSettings(snap.val());
          else setCollegePaymentSettings(null);
       });
    }
  };

  const handleProcessOpen = (student: any, payment: any) => {
    setSelectedStudent(student);
    setPendingPayment(payment);
    
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const rcptNo = `MITP/RCPT/${year}/${randomStr}`;
    setGeneratedReceiptNo(rcptNo);
    
    setIsProcessModalOpen(true);
  };

  const handleApproveOnlinePayment = async () => {
    if (!selectedStudent || !pendingPayment) return;
    const amount = parseFloat(pendingPayment.amount);
    
    try {
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = currentPaid + amount;

      const path = selectedStudent.source === 'Registered' 
        ? `colleges/${selectedStudent.collegeId}/students/${selectedStudent.id}`
        : `colleges/${selectedStudent.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const studentRef = ref(realtimeDb, path);
      await set(studentRef, {
        ...selectedStudent,
        paidFees: newPaid.toString(),
        updatedAt: new Date().toISOString()
      });

      if (selectedStudent.studentUid && selectedStudent.applicationId) {
        const appsRef = ref(realtimeDb, `users/${selectedStudent.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appKey, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedStudent.applicationId) {
              await set(ref(realtimeDb, `users/${selectedStudent.studentUid}/applications/${appKey}/paidFees`), newPaid.toString());
              break;
            }
          }
        }

        await set(ref(realtimeDb, `colleges/${pendingPayment.collegeId}/payments/online/${pendingPayment.id}/status`), 'Accepted');

        const studentPaymentsRef = ref(realtimeDb, `users/${selectedStudent.studentUid}/payments`);
        const studPaySnap = await get(studentPaymentsRef);
        if (studPaySnap.exists()) {
          const studPays = studPaySnap.val();
          for (const [pKey, pData] of Object.entries(studPays)) {
            if ((pData as any).applicationId === pendingPayment.applicationId && (pData as any).utrId === pendingPayment.utrId) {
              await set(ref(realtimeDb, `users/${selectedStudent.studentUid}/payments/${pKey}/status`), 'Accepted');
              break;
            }
          }
        }
      }

      const transRef = push(ref(realtimeDb, `colleges/${selectedStudent.collegeId}/fees/transactions`));
      await set(transRef, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        amount: amount,
        date: new Date().toISOString(),
        courseName: selectedStudent.courseName || selectedStudent.courseId,
        type: 'Online',
        utrId: pendingPayment.utrId || 'N/A',
        receiptNo: generatedReceiptNo,
        screenshot: pendingPayment.screenshot || null,
        studentUid: selectedStudent.studentUid || selectedStudent.uid || null
      });

      alert("Online payment approved and ledger updated!");
      setIsProcessModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to approve payment");
    }
  };

  const handleRejectOnlinePayment = async () => {
    if (!selectedStudent || !pendingPayment) return;
    if (!window.confirm("Are you sure you want to reject this payment?")) return;

    try {
      await set(ref(realtimeDb, `colleges/${pendingPayment.collegeId}/payments/online/${pendingPayment.id}/status`), 'Rejected');

      if (selectedStudent.studentUid) {
        const studentPaymentsRef = ref(realtimeDb, `users/${selectedStudent.studentUid}/payments`);
        const studPaySnap = await get(studentPaymentsRef);
        if (studPaySnap.exists()) {
          const studPays = studPaySnap.val();
          for (const [pKey, pData] of Object.entries(studPays)) {
            if ((pData as any).applicationId === pendingPayment.applicationId && (pData as any).utrId === pendingPayment.utrId) {
              await set(ref(realtimeDb, `users/${selectedStudent.studentUid}/payments/${pKey}/status`), 'Rejected');
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
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = currentPaid + amount;

      const path = selectedStudent.source === 'Registered' 
        ? `colleges/${selectedStudent.collegeId}/students/${selectedStudent.id}`
        : `colleges/${selectedStudent.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const studentRef = ref(realtimeDb, path);
      await set(studentRef, {
        ...selectedStudent,
        paidFees: newPaid.toString(),
        updatedAt: new Date().toISOString()
      });

      if (selectedStudent.studentUid && selectedStudent.applicationId) {
        const appsRef = ref(realtimeDb, `users/${selectedStudent.studentUid}/applications`);
        const appsSnap = await get(appsRef);
        if (appsSnap.exists()) {
          const apps = appsSnap.val();
          for (const [appKey, appData] of Object.entries(apps)) {
            if ((appData as any).applicationId === selectedStudent.applicationId) {
              await set(ref(realtimeDb, `users/${selectedStudent.studentUid}/applications/${appKey}/paidFees`), newPaid.toString());
              break;
            }
          }
        }
      }

      const transRef = push(ref(realtimeDb, `colleges/${selectedStudent.collegeId}/fees/transactions`));
      await set(transRef, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        amount: amount,
        date: new Date(collectDate).toISOString(),
        courseName: selectedStudent.courseName || selectedStudent.courseId,
        type: 'Manual',
        paymentMethod: collectPaymentMethod,
        studentUid: selectedStudent.studentUid || selectedStudent.uid || null
      });

      alert("Fees collected successfully!");
      setIsCollectModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to collect fees");
    }
  };

  const handleDelete = async (student: any) => {
    if (!window.confirm(`Are you sure you want to delete ${student.studentName}? This will remove the student across ALL panels.`)) return;
    
    try {
      if (!student.collegeId || !student.id) {
        alert("Missing record information. Cannot delete.");
        return;
      }

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
      
      await remove(ref(realtimeDb, path));
      
      const uid = student.studentUid || student.uid;
      const appId = student.applicationId;

      if (uid && appId) {
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

      if (appId) {
        const onlinePaymentsRef = ref(realtimeDb, `colleges/${student.collegeId}/payments/online`);
        const paymentsSnap = await get(onlinePaymentsRef);
        if (paymentsSnap.exists()) {
          const payments = paymentsSnap.val();
          for (const [pKey, pVal] of Object.entries(payments)) {
            if ((pVal as any).applicationId === appId) {
              await remove(ref(realtimeDb, `colleges/${student.collegeId}/payments/online/${pKey}`));
            }
          }
        }
      }

      const transRef = ref(realtimeDb, `colleges/${student.collegeId}/fees/transactions`);
      const transSnap = await get(transRef);
      if (transSnap.exists()) {
        const transactions = transSnap.val();
        for (const [tKey, tVal] of Object.entries(transactions)) {
          if ((tVal as any).studentId === student.id) {
            await remove(ref(realtimeDb, `colleges/${student.collegeId}/fees/transactions/${tKey}`));
          }
        }
      }
      
      alert('Record and all associated fees deleted successfully across all panels.');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete record.');
    }
  };

  const filteredStudents = students.filter(s => {
    const name = (s.studentName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const matchesName = name.includes(filterName.toLowerCase());
    const matchesCollege = !selectedCollegeId || s.collegeId === selectedCollegeId;
    return matchesName && matchesCollege;
  });

  const studentTransactions = useMemo(() => {
    if (!selectedStudent) return [];
    return allTransactions
      .filter(t => 
        t.studentId === selectedStudent.id && 
        t.collegeId === selectedStudent.collegeId &&
        (t.type === 'Manual' || t.type === 'Online') &&
        parseFloat(t.amount) > 0
      )
      .sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateB - dateA;
      });
  }, [allTransactions, selectedStudent]);

  const handleHistoryOpen = (student: any) => {
    setSelectedStudent(student);
    setIsHistoryModalOpen(true);
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
    
    const html = `
      <html>
        <head>
          <title>Fee Receipt - ${selectedStudent.studentName}</title>
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
               margin-top: 15px;
               font-weight: bold;
               font-size: 14px;
               line-height: 1.4;
            }
            td { border: 1px solid #e11d48; padding: 1px 4px; color: #000; font-weight: 700; }
            th { border: 1px solid #e11d48; padding: 1px 4px; text-align: center; font-weight: 900; }
            .info-line { display: flex; align-items: baseline; margin-bottom: 5px; font-size: 14px; font-weight: 700; }
            @media print {
              body { background: none; padding: 0; }
              .receipt-container { box-shadow: none; border: 2px solid #e11d48; }
            }
            
            .top-sub-header { text-align: center; font-size: 12px; font-weight: 600; margin-bottom: 2px; color: #e11d48; }
            .main-header { display: flex; align-items: center; gap: 15px; border-bottom: 2px solid #e11d48; padding-bottom: 8px; margin-bottom: 8px; }
            .logo-box { width: 70px; height: 70px; border: 1px solid #e11d48; display: flex; align-items: center; justify-content: center; padding: 5px; }
            .institute-info { flex: 1; text-align: center; }
            .institute-name { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; white-space: nowrap; }
            .address { font-size: 14px; margin: 2px 0; font-weight: 700; }
            
            .receipt-tag-container { text-align: center; margin-bottom: 10px; }
            .receipt-tag { display: inline-block; border: 2px solid #e11d48; padding: 2px 25px; font-weight: 900; font-size: 18px; color: #e11d48; }
            
            .info-line { display: flex; align-items: baseline; margin-bottom: 5px; font-size: 13px; font-weight: 700; }
            .info-label { white-space: nowrap; margin-right: 5px; color: #e11d48; }
            .info-value { border-bottom: 2px dotted #e11d48; flex-grow: 1; padding-left: 5px; color: #000; font-weight: 900; min-height: 20px; text-transform: capitalize; }
            
            .flex-row { display: flex; gap: 15px; }
            .flex-1 { flex: 1; }
            
            table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 12px; border: 1px solid #e11d48; }
            th { border: 1px solid #e11d48; padding: 4px; text-align: center; font-weight: 900; }
            td { border: 1px solid #e11d48; padding: 4px; color: #000; font-weight: 700; }
            .col-sr { width: 30px; text-align: center; }
            .col-amt { width: 100px; text-align: right; }
            
            .footer-section { font-size: 12px; font-weight: 700; margin-top: 10px; }
            .signature-area { text-align: right; margin-top: 20px; font-size: 12px; font-weight: 900; }
            
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(225, 29, 72, 0.03); font-weight: 900; pointer-events: none; z-index: -1; white-space: nowrap; }
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
                  <p class="top-sub-header">Mahavishnu Gramin Vikas & Shaikshnik B. sanstha Dhamangaon ( Dhad)</p>
                  <h1 class="institute-name">Mahalaxmi Technical Institued Paradh.Bk.</h1>
                  <p class="address">Tq.Bhokardan Dist. jalna , Paradh - 431114</p>
                </div>
              </div>
              
              <div class="receipt-tag-container">
                <div class="receipt-tag">RECEIPT</div>
              </div>
              
              <div class="flex-row">
                <div class="info-line flex-1">
                  <span class="info-label">Receipt No. :</span>
                  <span class="info-value">${trans.receiptNo || trans.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div class="info-line" style="width: 150px;">
                  <span class="info-label">Date :</span>
                  <span class="info-value">${receiptDate}</span>
                </div>
              </div>
              
              <div class="info-line">
                <span class="info-label">Name of Student :</span>
                <span class="info-value">${selectedStudent.studentName}</span>
              </div>
              
              <div class="flex-row">
                <div class="info-line flex-1">
                  <span class="info-label">Registration Number :</span>
                  <span class="info-value">${selectedStudent.regNo || selectedStudent.studentId || ''}</span>
                </div>
                <div class="info-line flex-1">
                  <span class="info-label">Academic Year :</span>
                  <span class="info-value">${selectedStudent.admissionYear || selectedStudent.academicYear || ''}</span>
                </div>
              </div>
              
              <div class="info-line">
                <span class="info-label">College :</span>
                <span class="info-value" style="flex-grow: 2;">${selectedStudent.collegeName || 'MAHALAXMI TECHNICAL INSTITUTE'}</span>
                <span class="info-label" style="margin-left: 10px;">Course :</span>
                <span class="info-value">${selectedStudent.courseName || ''}</span>
              </div>
 
              <div class="info-line">
                <span class="info-label">Course Type :</span>
                <span class="info-value">${selectedStudent.courseType || ''}</span>
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
                    "Transpertation Fee", "Medical Exam Fee"
                  ].map((item, i) => `
                    <tr>
                      <td class="col-sr">${i + 1}</td>
                      <td>${item}</td>
                      <td class="col-amt">${i === 0 ? '₹' + parseFloat(trans.amount).toLocaleString() : ''}</td>
                    </tr>
                  `).join('')}
                  <tr style="border-top: 2px solid #e11d48;">
                    <td colspan="2" style="text-align: right; font-weight: 900; color: #e11d48; font-size: 14px;">Total Fees</td>
                    <td class="col-amt" style="font-weight: 900; font-size: 14px;">₹${parseFloat(trans.amount).toLocaleString()}</td>
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
                  filename: 'Fee_Receipt_${selectedStudent.studentName.replace(/\s+/g, '_')}.pdf',
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

  const handleEditTransaction = async (trans: any) => {
    const newAmount = prompt("Enter new amount for this transaction:", trans.amount);
    if (newAmount === null || newAmount === trans.amount) return;
    
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await set(ref(realtimeDb, `colleges/${trans.collegeId}/fees/transactions/${trans.id}/amount`), newAmount);
      
      const diff = amount - parseFloat(trans.amount);
      const studentPath = selectedStudent.source === 'Registered' 
        ? `colleges/${trans.collegeId}/students/${selectedStudent.id}`
        : `colleges/${trans.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = Math.max(0, currentPaid + diff);
      
      await set(ref(realtimeDb, `${studentPath}/paidFees`), newPaid.toString());
      
      alert("Transaction updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async (trans: any) => {
    if (!window.confirm(`Are you sure you want to delete this payment of ₹${parseFloat(trans.amount).toLocaleString()}?`)) return;
    
    setIsDeletingTransaction(true);
    try {
      await remove(ref(realtimeDb, `colleges/${trans.collegeId}/fees/transactions/${trans.id}`));

      const amountToSubtract = parseFloat(trans.amount || '0');
      const studentPath = selectedStudent.source === 'Registered' 
        ? `colleges/${trans.collegeId}/students/${selectedStudent.id}`
        : `colleges/${trans.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = Math.max(0, currentPaid - amountToSubtract);
      
      await set(ref(realtimeDb, `${studentPath}/paidFees`), newPaid.toString());
      
      alert('Transaction deleted and balance updated successfully.');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction.');
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-300 font-bold capitalize tracking-tight animate-pulse">Synchronizing Ledger...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 space-y-8 font-sans">
      <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            <CreditCard size={14} className="text-[#00a5a5]" /> Fees Collection
          </div>
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Collect Fees</h2>
          <h2 className="text-sm font-normal text-white/60">Manage student tuition payments and outstanding balances.</h2>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-black shadow-sm p-10 space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black pb-8">
            <div className="flex items-center gap-4 flex-1 max-w-md">
               <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Search Student Name..." 
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="w-full bg-slate-50 border border-black rounded-2xl py-4 pl-12 pr-6 text-[14px] font-medium text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  />
               </div>
               {!collegeId && (
                 <select 
                   value={selectedCollegeId}
                   onChange={(e) => setSelectedCollegeId(e.target.value)}
                   className="bg-slate-50 border border-black rounded-2xl px-6 py-4 text-[14px] font-medium text-black capitalize tracking-tight outline-none focus:border-[#00a5a5] transition-all"
                 >
                    <option value="">All Institutions</option>
                    {availableColleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               )}
            </div>
            <div className="flex items-center gap-3">
               <div className="text-[13px] font-normal text-black capitalize tracking-tight bg-[#00a5a5]/10 px-4 py-2 rounded-full whitespace-nowrap">
                 {filteredStudents.length} Records Found
               </div>
            </div>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-r border-black">
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Sr. No</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Date & Time</th>
                     {!collegeId && <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">College</th>}
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Student Name</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Registration No.</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course Type</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Outstanding Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Paid Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Total Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-black">
                  {filteredStudents.map((student, idx) => {
                     const total = parseFloat(student.fees || '0');
                     const paid = parseFloat(student.paidFees || '0');
                     const outstanding = total - paid;
                     const onlinePending = onlinePayments.filter(p => p.applicationId === student.applicationId && p.status === 'Pending');
                     
                     return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors border-r border-black">
                           <td className="px-6 py-5 text-sm font-bold text-slate-500 border-r border-black">{idx + 1}.</td>
                           <td className="px-6 py-5 border-r border-black">
                              <div className="flex flex-col">
                                 <span className="text-[13px] font-bold text-slate-800">
                                    {new Date(student.updatedAt || student.admissionDate || student.date || student.createdAt).toLocaleDateString()}
                                 </span>
                                 <span className="text-[10px] font-medium text-slate-400">
                                    {new Date(student.updatedAt || student.admissionDate || student.date || student.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                           </td>
                           {!collegeId && <td className="px-6 py-5 text-[13px] font-bold text-black border-r border-black">{student.collegeName}</td>}
                           <td className="px-6 py-5 border-r border-black">
                              <span className="text-[14px] font-black text-slate-800 capitalize leading-tight">{student.studentName}</span>
                           </td>
                           <td className="px-6 py-5 border-r border-black font-bold text-[#5D5fb1] text-[13px] uppercase tracking-tight">
                              {student.regNo || student.studentId || 'N/A'}
                           </td>
                           <td className="px-6 py-5 text-[13px] font-bold text-black border-r border-black uppercase">{student.courseType || ''}</td>
                           <td className="px-6 py-5 border-r border-black">
                              <div className="flex items-center gap-2">
                                 <BookOpen size={14} className="text-[#00a5a5]" />
                                 <span className="text-[13px] font-bold text-slate-700 capitalize">{student.courseName || student.courseId}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 border-r border-black">
                              <span className={cn("text-[15px] font-black", outstanding > 0 ? "text-rose-500" : "text-emerald-500")}>
                                 ₹{outstanding.toLocaleString()}
                              </span>
                           </td>
                           <td className="px-6 py-5 border-r border-black font-black text-slate-800">₹{paid.toLocaleString()}</td>
                           <td className="px-6 py-5 border-r border-black font-black text-slate-400">₹{total.toLocaleString()}</td>
                           <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-3">
                                 {onlinePending.length > 0 && (
                                    <button 
                                      onClick={() => handleProcessOpen(student, onlinePending[0])}
                                      className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[11px] font-black uppercase tracking-widest border border-amber-200 animate-pulse"
                                    >
                                       <Clock size={14} /> Process Online ({onlinePending.length})
                                    </button>
                                 )}
                                 <button 
                                   onClick={() => handleCollectOpen(student)}
                                   className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00a5a5] text-white hover:bg-black transition-all shadow-md border border-[#00a5a5]/20 text-[13px] font-black uppercase tracking-widest"
                                   title="Collect Fees"
                                 >
                                    COLLECT
                                 </button>
                                 <button 
                                   onClick={() => handleHistoryOpen(student)}
                                   className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-800 hover:text-white transition-all shadow-sm border border-slate-200"
                                   title="Payment History"
                                 >
                                    <History size={18} />
                                 </button>

                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Manual Collect Fees Modal */}
      {isCollectModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147] opacity-60 backdrop-blur-sm" onClick={() => setIsCollectModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#00a5a5] p-10 text-white relative shrink-0">
                 <button onClick={() => setIsCollectModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                       <IndianRupee size={32} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black tracking-tighter capitalize">Collect Fees</h3>
                       <p className="text-[15px] font-bold text-white/90 capitalize tracking-tight leading-none mt-1">{selectedStudent.studentName}</p>
                    </div>
                 </div>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto no-scrollbar">
                   {/* Outstanding Fees Display */}
                   <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                         <p className="text-2xl font-black text-rose-600">₹{(parseFloat(selectedStudent.fees || '0') - parseFloat(selectedStudent.paidFees || '0')).toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                         <Tag size={24} />
                      </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight flex items-center gap-2 pl-1">
                           <IndianRupee size={16} className="text-[#00a5a5]" /> Amount (₹)
                        </label>
                        <input 
                          type="number" 
                          value={collectAmount}
                          onChange={(e) => setCollectAmount(e.target.value)}
                          placeholder="Enter amount..."
                          className="w-full bg-white border border-black rounded-2xl p-4 text-xl font-black text-slate-800 outline-none focus:border-[#00a5a5] transition-all shadow-sm"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight flex items-center gap-2 pl-1">
                           <Calendar size={16} className="text-[#5D5fb1]" /> Collection Date
                        </label>
                        <input 
                          type="date" 
                          value={collectDate}
                          onChange={(e) => setCollectDate(e.target.value)}
                          className="w-full bg-white border border-black rounded-2xl p-4 text-[14px] font-bold text-slate-800 outline-none focus:border-[#5D5fb1] transition-all shadow-sm"
                        />
                     </div>
                  </div>

                   {/* Payment Method Selection */}
                   <div className="space-y-3">
                      <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight flex items-center gap-2 pl-1">
                         <CreditCard size={16} className="text-indigo-500" /> Payment Method
                      </label>
                    <select
                       value={collectPaymentMethod}
                       onChange={(e) => setCollectPaymentMethod(e.target.value)}
                       className="w-full bg-white border border-black rounded-2xl p-4 text-[14px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                    >
                       {['Cash', 'Online/UPI', 'Cheque/DD'].map((method) => (
                          <option key={method} value={method}>{method}</option>
                       ))}
                    </select>
                   </div>

                 <button 
                   onClick={handleCollectFees}
                   className="w-full bg-[#5D5fb1] text-white py-6 rounded-[2rem] text-[15px] font-black uppercase tracking-tight shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-black/20"
                 >
                     COLLECT
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Process Online Modal - Refactored to match Student Portal Style */}
      {isProcessModalOpen && selectedStudent && pendingPayment && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147] opacity-60 backdrop-blur-sm" onClick={() => setIsProcessModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#5D5fb1] p-10 text-white relative shrink-0">
                 <button onClick={() => setIsProcessModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter capitalize">Process Online Payment</h3>
                    <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Verifying institutional transaction record</p>
                 </div>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <User size={18} className="text-[#5D5fb1]" />
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Student Particulars</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                          <p className="text-sm font-bold text-slate-800 capitalize">{selectedStudent.studentName}</p>
                       </div>
                       <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Registration No.</p>
                          <p className="text-sm font-bold text-indigo-700 uppercase tracking-tighter">{selectedStudent.regNo || selectedStudent.studentId || 'N/A'}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
                          <p className="text-sm font-bold text-slate-800">
                             {pendingPayment.date ? `${new Date(pendingPayment.date).toLocaleDateString()} | ${new Date(pendingPayment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
                          </p>
                       </div>
                       <div className="bg-[#5D5fb1]/5 p-4 rounded-2xl border border-[#5D5fb1]/20">
                          <p className="text-[10px] font-bold text-[#5D5fb1] uppercase tracking-widest mb-1">College</p>
                          <p className="text-sm font-bold text-[#002147] capitalize">{selectedStudent.collegeName || 'N/A'}</p>
                       </div>
                       <div className="bg-[#00a5a5]/5 p-4 rounded-2xl border border-[#00a5a5]/20 md:col-span-2">
                          <p className="text-[10px] font-bold text-[#00a5a5] uppercase tracking-widest mb-1">Course</p>
                          <p className="text-sm font-bold text-[#002147] capitalize">{selectedStudent.courseName || 'N/A'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <CreditCard size={18} className="text-emerald-500" />
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Transaction Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                           <label className="text-[13px] font-bold text-indigo-600 capitalize tracking-tight pl-1 flex items-center gap-2">
                              <Receipt size={14} /> Auto-Generated Receipt Number
                           </label>
                           <div className="w-full bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm font-black text-indigo-700 tracking-wider">
                              {generatedReceiptNo}
                           </div>
                        </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UPI ID</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600">
                             {pendingPayment.upiId || 'N/A'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UTR / Transaction ID</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600">
                             {pendingPayment.utrId || 'N/A'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Payer Relationship</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600 capitalize">
                             {pendingPayment.relationship || 'Self'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Amount Paid (₹)</label>
                          <div className="w-full bg-emerald-50 border border-emerald-500 rounded-2xl p-4 text-lg font-black text-emerald-700">
                             ₹{parseFloat(pendingPayment.amount || '0').toLocaleString()}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Email ID</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600">
                             {selectedStudent.studentEmail || selectedStudent.email || 'N/A'}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mobile Number</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-600">
                             {selectedStudent.studentPhone || selectedStudent.phone || 'N/A'}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[13px] font-black text-slate-800 capitalize tracking-tight pl-1">Payment Receipt / Screenshot</label>
                    {pendingPayment.screenshot ? (
                       <div className="w-full rounded-[2rem] border-2 border-dashed border-[#5D5fb1]/20 p-4 bg-indigo-50/30">
                          <img 
                             src={pendingPayment.screenshot} 
                             className="w-full h-auto max-h-[400px] object-contain rounded-2xl shadow-xl border-4 border-white mx-auto" 
                             alt="Receipt" 
                          />
                       </div>
                    ) : (
                       <div className="w-full h-40 bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Eye size={32} className="opacity-20" />
                          <p className="text-sm font-medium italic">No screenshot provided by student</p>
                       </div>
                    )}
                 </div>

                 <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <button 
                       onClick={handleRejectOnlinePayment}
                       className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-[2rem] text-sm font-bold capitalize hover:bg-rose-100 transition-all active:scale-95 border border-rose-200"
                    >
                       Reject Payment
                    </button>
                    <button 
                       onClick={handleApproveOnlinePayment}
                       className="flex-[2] bg-[#5D5fb1] text-white py-5 rounded-[2rem] text-sm font-black capitalize shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-black/20"
                    >
                       <Check size={20} /> Approve Payment
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147] opacity-80 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)} />
           <div className="bg-white w-full max-w-7xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
              <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black tracking-tighter">Payment History</h3>
                    <p className="text-[12px] font-medium text-white/60 capitalize tracking-tight">{selectedStudent.studentName}</p>
                 </div>
                 <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white">
                    <X size={20} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                 {studentTransactions.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Sr. No</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Date & Time</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Receipt No</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">Fee (₹)</th>
                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentTransactions.map((t, idx) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-slate-600 border-r border-slate-100">{idx + 1}.</td>
                              <td className="px-6 py-4 border-r border-slate-100">
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-bold text-slate-800">
                                    {(() => {
                                        const d = new Date(t.date || t.timestamp);
                                        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
                                     })()}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {(() => {
                                        const d = new Date(t.date || t.timestamp);
                                        return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                     })()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 border-r border-slate-100">
                                <span className="text-[12px] font-black text-indigo-600 uppercase tracking-tight">
                                  {t.receiptNo || t.id.substring(0, 8).toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 border-r border-slate-100">
                                <span className="text-[14px] font-black text-slate-800">₹{parseFloat(t.amount).toLocaleString()}</span>
                                {t.type && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold uppercase">
                                    {t.type}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleDownloadReceipt(t, true)}
                                    className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                    title="Preview Receipt"
                                  >
                                     <Eye size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDownloadReceipt(t)}
                                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                    title="Print Receipt"
                                  >
                                     <Download size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleEditTransaction(t)}
                                    className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                    title="Edit Transaction"
                                  >
                                     <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTransaction(t)}
                                    disabled={isDeletingTransaction}
                                    className="p-2.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100 disabled:opacity-30"
                                    title="Delete Transaction"
                                  >
                                     <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 ) : (
                    <div className="py-20 text-center text-slate-300">
                       <History size={48} className="mx-auto opacity-10 mb-4" />
                       <p className="text-sm font-medium">No transaction history found</p>
                    </div>
                 )}
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fees Collected</p>
                    <p className="text-xl font-black text-indigo-600">₹{studentTransactions.reduce((acc, t) => acc + parseFloat(t.amount || '0'), 0).toLocaleString()}</p>
                 </div>
                 <button onClick={() => setIsHistoryOpen(false)} className="px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[12px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                    Close History
                 </button>
              </div>
           </div>
        </div>
      )}

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
                     onClick={() => { setIsReceiptPreviewOpen(false); handleDownloadReceipt(receiptPreviewData); }}
                     className="px-6 py-2.5 bg-[#e11d48] text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2"
                   >
                      <Download size={16} /> Print Receipt
                   </button>
                   <button onClick={() => setIsReceiptPreviewOpen(false)} className="p-3 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all">
                      <X size={20} />
                   </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-100 no-scrollbar flex justify-center">
                <div className="origin-top transition-transform duration-300 shadow-2xl" style={{ 
                  width: '210mm', 
                  minHeight: '297mm',
                  transform: 'scale(var(--receipt-scale, 1))' 
                }}>
                  <div className="bg-white border-[0.5px] border-[#e11d48] p-4 flex flex-col relative min-h-[230mm]" style={{ color: '#e11d48' }}>
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
                    <div className="text-center mb-6">
                        <div className="inline-block border-2 border-[#e11d48] px-10 py-1 font-black text-xl text-[#e11d48]">RECEIPT</div>
                     </div>
                     <div className="space-y-4 font-bold text-[14px]">
                        <div className="flex gap-10">
                           <div className="flex-1 flex items-baseline gap-2">
                              <span className="text-[#e11d48] whitespace-nowrap">Receipt No. :</span>
                              <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{receiptPreviewData.receiptNo || receiptPreviewData.id.substring(0, 8).toUpperCase()}</span>
                           </div>
                           <div className="w-48 flex items-baseline gap-2">
                              <span className="text-[#e11d48] whitespace-nowrap">Date :</span>
                              <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">{new Date(receiptPreviewData.date || receiptPreviewData.timestamp).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-[#e11d48] whitespace-nowrap">Name of Student :</span>
                           <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{selectedStudent.studentName}</span>
                        </div>
                        <div className="flex gap-10">
                           <div className="flex-1 flex items-baseline gap-2">
                              <span className="text-[#e11d48] whitespace-nowrap">Registration Number :</span>
                              <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{selectedStudent.regNo || selectedStudent.studentId || ''}</span>
                           </div>
                           <div className="flex-1 flex items-baseline gap-2">
                              <span className="text-[#e11d48] whitespace-nowrap">Academic Year :</span>
                              <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">2026-2027</span>
                           </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-[#e11d48] whitespace-nowrap">College :</span>
                           <span className="flex-[2] border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{selectedStudent.collegeName || 'MAHALAXMI TECHNICAL INSTITUTE'}</span>
                           <span className="ml-6 text-[#e11d48] whitespace-nowrap">Course :</span>
                           <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{selectedStudent.courseName}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-[#e11d48] whitespace-nowrap">Course Type :</span>
                           <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{selectedStudent.courseType || ''}</span>
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
                                  <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">{numberToWords(parseFloat(receiptPreviewData.amount))}</span>
                              </div>
                              <div className="flex-1 flex items-baseline gap-2">
                                  <span className="text-[#e11d48] whitespace-nowrap">Cash/D.D. No :</span>
                                  <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black uppercase">{receiptPreviewData.utrId || receiptPreviewData.id || 'N/A'}</span>
                              </div>
                          </div>
                         <div className="flex gap-10 mt-6">
                            <div className="flex-[1.5] flex items-baseline gap-2">
                               <span className="text-[#e11d48] whitespace-nowrap">Bank :</span>
                               <span className="flex-1 border-b-2 border-dotted border-[#e11d48] text-black font-black">{receiptPreviewData.paymentMethod || (receiptPreviewData.type === 'Online' ? 'Online Transfer/UPI' : (receiptPreviewData.type || 'N/A'))}</span>
                            </div>
                            <div className="flex-1 flex items-baseline gap-2">
                               <span className="text-[#e11d48] whitespace-nowrap">Accountant/Authorized Sign :</span>
                               <span className="flex-1 border-b-2 border-dotted border-[#e11d48]">&nbsp;</span>
                            </div>
                         </div>
                      </div>
                     <div className="border-t-2 border-[#e11d48] mt-8"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center -rotate-[35deg] text-8xl font-black pointer-events-none whitespace-nowrap opacity-[0.05]" style={{ color: '#e11d48' }}>
                       MAHALAXMI INSTITUTE
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      )}
    </div>
  );
}
