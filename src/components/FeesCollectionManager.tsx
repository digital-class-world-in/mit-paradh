'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get, set, push, remove } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { CreditCard, Search, DollarSign, User, BookOpen, Clock, X, Save, Eye, Check, Receipt, Trash2, Building2, Calendar, History, Copy, Download, ShieldCheck, Tag, Mail, Phone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FeesCollectionManager({ collegeId }: { collegeId?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(collegeId || '');
  const [onlinePayments, setOnlinePayments] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [studentTransactions, setStudentTransactions] = useState<any[]>([]);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [collegePaymentSettings, setCollegePaymentSettings] = useState<any>(null);

  useEffect(() => {
    if (!realtimeDb) {
      setLoading(false);
      return;
    }

    // Fetch colleges for filtering if admin
    if (!collegeId) {
      const collegesRef = ref(realtimeDb, 'colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      });
    }

    const fetchAllData = () => {
      setLoading(true);
      const collegesRef = ref(realtimeDb, 'colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          const colleges = snap.val();
          let allStudents: any[] = [];
          let allOnlinePayments: any[] = [];
          
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
                allTransactions.push({ id: tId, collegeId: cId, ...tData });
              });
            }

            // From registered students
            if (cData?.students) {
              Object.entries(cData.students).forEach(([sId, sData]: [string, any]) => {
                allStudents.push({
                  id: sId,
                  ...sData,
                  studentName: sData?.studentName || `${sData?.firstName || ''} ${sData?.lastName || ''}`,
                  collegeId: cId,
                  collegeName: cData.name,
                  source: 'Registered'
                });
              });
            }

            // From admitted students (admissions)
            if (cData?.studentAdmissions) {
              Object.entries(cData.studentAdmissions).forEach(([aId, aData]: [string, any]) => {
                // Avoid duplicates if student is in both
                if (!allStudents.find(s => s.id === aId || s.uid === aData?.studentUid)) {
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
           setAllTransactions(allTransactions);
          
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
    };

    fetchAllData();
  }, [collegeId]);

  const handleCollectOpen = (student: any) => {
    setSelectedStudent(student);
    setCollectAmount('');
    setIsCollectModalOpen(true);
    
    // Fetch payment settings for QR
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
    setIsProcessModalOpen(true);
  };

  const handleApproveOnlinePayment = async () => {
    if (!selectedStudent || !pendingPayment) return;
    const amount = parseFloat(pendingPayment.amount);
    
    try {
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = currentPaid + amount;

      // 1. Update in the correct path
      const path = selectedStudent.source === 'Registered' 
        ? `colleges/${selectedStudent.collegeId}/students/${selectedStudent.id}`
        : `colleges/${selectedStudent.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const studentRef = ref(realtimeDb, path);
      await set(studentRef, {
        ...selectedStudent,
        paidFees: newPaid.toString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Update student's application record
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

        // 3. Update the online payment status in College node
        await set(ref(realtimeDb, `colleges/${pendingPayment.collegeId}/payments/online/${pendingPayment.id}/status`), 'Accepted');

        // 4. Update the online payment status in Student node
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

      // 5. Record transaction
      const transRef = push(ref(realtimeDb, `colleges/${selectedStudent.collegeId}/fees/transactions`));
      await set(transRef, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        amount: amount,
        date: new Date().toISOString(),
        courseName: selectedStudent.courseName || selectedStudent.courseId,
        type: 'Online',
        utrId: pendingPayment.utrId || 'N/A'
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
      // 1. Update in College node
      await set(ref(realtimeDb, `colleges/${pendingPayment.collegeId}/payments/online/${pendingPayment.id}/status`), 'Rejected');

      // 2. Update in Student node
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
      const totalFees = parseFloat(selectedStudent.fees || '0');
      const newPaid = currentPaid + amount;

      // Update in the correct path
      const path = selectedStudent.source === 'Registered' 
        ? `colleges/${selectedStudent.collegeId}/students/${selectedStudent.id}`
        : `colleges/${selectedStudent.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const studentRef = ref(realtimeDb, path);
      await set(studentRef, {
        ...selectedStudent,
        paidFees: newPaid.toString(),
        updatedAt: new Date().toISOString()
      });

      // Update student's application record
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

      // Record transaction
      const transRef = push(ref(realtimeDb, `colleges/${selectedStudent.collegeId}/fees/transactions`));
      await set(transRef, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.studentName,
        amount: amount,
        date: new Date().toISOString(),
        courseName: selectedStudent.courseName || selectedStudent.courseId,
        type: 'Manual'
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
      await remove(ref(realtimeDb, path));
      
      // 2. Remove from student's personal application panel
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
              console.log(`Removed application ${appId} from user ${uid}`);
              break;
            }
          }
        }
      }

      // 3. Remove from College Online Payments
      if (appId) {
        const onlinePaymentsRef = ref(realtimeDb, `colleges/${student.collegeId}/payments/online`);
        const paymentsSnap = await get(onlinePaymentsRef);
        if (paymentsSnap.exists()) {
          const payments = paymentsSnap.val();
          for (const [pKey, pVal] of Object.entries(payments)) {
            if ((pVal as any).applicationId === appId) {
              await remove(ref(realtimeDb, `colleges/${student.collegeId}/payments/online/${pKey}`));
              console.log(`Removed online payment ${pKey}`);
            }
          }
        }
      }

      // 4. Remove from College Transactions
      const transRef = ref(realtimeDb, `colleges/${student.collegeId}/fees/transactions`);
      const transSnap = await get(transRef);
      if (transSnap.exists()) {
        const transactions = transSnap.val();
        for (const [tKey, tVal] of Object.entries(transactions)) {
          if ((tVal as any).studentId === student.id) {
            await remove(ref(realtimeDb, `colleges/${student.collegeId}/fees/transactions/${tKey}`));
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

  const filteredStudents = students.filter(s => {
    const name = (s.studentName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const matchesName = name.includes(filterName.toLowerCase());
    const matchesCollege = !selectedCollegeId || s.collegeId === selectedCollegeId;
    return matchesName && matchesCollege;
  });

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
      await remove(ref(realtimeDb, `colleges/${trans.collegeId}/fees/transactions/${trans.id}`));

      // 2. Update student's paidFees
      const amountToSubtract = parseFloat(trans.amount || '0');
      const studentPath = selectedStudent.source === 'Registered' 
        ? `colleges/${trans.collegeId}/students/${selectedStudent.id}`
        : `colleges/${trans.collegeId}/studentAdmissions/${selectedStudent.id}`;
      
      const currentPaid = parseFloat(selectedStudent.paidFees || '0');
      const newPaid = Math.max(0, currentPaid - amountToSubtract);
      
      await set(ref(realtimeDb, `${studentPath}/paidFees`), newPaid.toString());
      
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

  if (loading) return <div className="p-10 text-center text-slate-300 font-bold capitalize tracking-tight animate-pulse">Synchronizing Ledger...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            <CreditCard size={14} className="text-[#00a5a5]" /> Fees Collection
          </div>
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Collect Fees</h2>
          <p className="text-sm font-normal text-white/60">Manage student tuition payments and outstanding balances.</p>
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
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course Type</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Course</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Outstanding Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Paid Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Total Fees</th>
                     <th className="px-6 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="border-b border-black">
                  {filteredStudents.map((s, i) => {
                    const total = parseFloat(s.fees || '0');
                    const paid = parseFloat(s.paidFees || '0');
                    const outstanding = total - paid;
                    const name = s.studentName || `${s.firstName || ''} ${s.lastName || ''}`;

                    // Find pending online payment for this student
                    const pendingPay = onlinePayments.find(p => 
                      p.status === 'Pending' && 
                      (p.applicationId === s.applicationId || p.studentUid === s.studentUid)
                    );

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                        <td className="px-6 py-6 text-[14px] font-medium text-black border-r border-black">{i + 1}.</td>
                        <td className="px-6 py-6 border-r border-black whitespace-nowrap">
                           <div className="flex flex-col gap-1">
                              <p className="text-[13px] font-medium text-black">
                                {(() => {
                                  const dateVal = s.appliedAt || s.date || s.updatedAt;
                                  if (!dateVal) return 'N/A';
                                  const d = new Date(dateVal);
                                  return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                                })()}
                              </p>
                           </div>
                        </td>
                        {!collegeId && (
                           <td className="px-6 py-6 border-r border-black">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
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
                           <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase border border-indigo-100 shadow-sm">
                              {s.courseType || 'Reg'}
                           </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <p className="text-[13px] font-bold text-black capitalize tracking-tight">{s.courseName}</p>
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
                                 className="bg-amber-500 text-black px-4 py-3 rounded-xl text-[12px] font-bold capitalize tracking-tight shadow-lg hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2"
                               >
                                  <Eye size={14} /> Process Online
                               </button>
                             ) : (
                               <button 
                                  onClick={() => handleCollectOpen(s)}
                                  className="bg-[#00a5a5] text-white px-8 py-3 rounded-xl text-[13px] font-black capitalize tracking-tight border border-black shadow-lg hover:bg-black transition-all active:scale-95 min-w-[120px]"
                                >
                                   Collect Fee
                                </button>
                             )}
                             <button 
                               onClick={() => handleHistoryOpen(s)}
                               className="p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-md"
                               title="Payment History"
                             >
                                <History size={16} />
                             </button>
                             <button 
                               onClick={() => handleDelete(s)}
                               className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-md"
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
      </div>

      {/* Collect Modal */}
      {isCollectModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsCollectModalOpen(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#5D5fb1] p-10 text-white relative shrink-0">
                 <button onClick={() => setIsCollectModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter capitalize">Manual Fee Collection</h3>
                    <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Register a payment for {selectedStudent.studentName}</p>
                 </div>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-8 no-scrollbar">
                 {/* Online Pay Style QR Section */}
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
                          <p className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest">Student Scan & Pay</p>
                          <h4 className="text-xl font-black text-slate-800 tracking-tighter capitalize leading-tight">
                             {collegePaymentSettings.merchantName || selectedStudent?.collegeName || 'Official College Account'}
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
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fees</p>
                       <p className="text-lg font-black text-[#002147]">₹{parseFloat(selectedStudent.fees || '0').toLocaleString()}</p>
                    </div>
                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                       <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Due Amount</p>
                       <p className="text-lg font-black text-rose-600">₹{(parseFloat(selectedStudent.fees || '0') - parseFloat(selectedStudent.paidFees || '0')).toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight flex items-center gap-2">
                       <DollarSign size={16} className="text-[#00a5a5]" /> Collect Amount (₹)
                    </label>
                    <input 
                      type="number" 
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      placeholder="Enter amount collected..."
                      className="w-full bg-white border-2 border-black rounded-[2rem] p-6 text-2xl font-black text-slate-800 outline-none focus:border-[#00a5a5] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                    />
                 </div>

                 <button 
                   onClick={handleCollectFees}
                   className="w-full bg-[#5D5fb1] text-white py-6 rounded-[2rem] text-[15px] font-black capitalize tracking-tight shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-black/20"
                 >
                    <Save size={22} /> Finalize Manual Payment
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Process Online Modal */}
      {isProcessModalOpen && selectedStudent && pendingPayment && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => setIsProcessModalOpen(false)} />
           <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                 {/* Receipt Side */}
                 <div className="md:w-1/2 bg-slate-50 p-10 flex flex-col items-center justify-center border-r border-slate-100 relative group">
                    <p className="absolute top-8 left-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">Payment Receipt Preview</p>
                    {pendingPayment.screenshot ? (
                      <div className="w-full h-full max-h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <img src={pendingPayment.screenshot} className="w-full h-full object-contain" alt="Receipt" />
                      </div>
                    ) : (
                      <div className="w-48 h-64 bg-slate-200 rounded-3xl flex items-center justify-center text-slate-400 italic">No Image</div>
                    )}
                 </div>

                 {/* Details Side */}
                 <div className="md:w-1/2 p-12 flex flex-col justify-between">
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-bold uppercase tracking-widest">
                             <Clock size={12} /> Pending Verification
                          </div>
                          <button onClick={() => setIsProcessModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-black transition-all"><X size={20} /></button>
                       </div>

                       <div className="space-y-2">
                          <h3 className="text-3xl font-black tracking-tighter text-black capitalize">Process Online Payment</h3>
                          <p className="text-sm font-medium text-slate-400">Verifying institutional transaction record</p>
                       </div>

                       {/* Detailed Information List */}
                       <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-0 overflow-x-auto">
                             <table className="w-full text-left border-collapse">
                                <tbody>
                                   {[
                                      { label: 'Student Name', value: selectedStudent.studentName, icon: User, color: 'text-indigo-500' },
                                      { label: 'Date & Time', value: pendingPayment.date ? `${new Date(pendingPayment.date).toLocaleDateString()} | ${new Date(pendingPayment.date).toLocaleTimeString()}` : 'N/A', icon: Calendar, color: 'text-indigo-500' },
                                      { label: 'College', value: selectedStudent.collegeName || 'N/A', icon: Building2, color: 'text-indigo-500' },
                                      { label: 'Course Type', value: selectedStudent.courseType || 'Regular', icon: Tag, color: 'text-indigo-500' },
                                      { label: 'Course', value: selectedStudent.courseName || 'N/A', icon: BookOpen, color: 'text-indigo-500' },
                                      { label: 'UPI ID', value: pendingPayment.upiId || 'N/A', icon: CreditCard, color: 'text-emerald-500' },
                                      { label: 'UTR / Ref ID', value: pendingPayment.utrId || 'N/A', icon: ShieldCheck, color: 'text-emerald-500' },
                                      { label: 'Payer Relation', value: pendingPayment.relationship || 'Self', icon: Receipt, color: 'text-indigo-500' },
                                      { label: 'Amount Paid', value: `₹${parseFloat(pendingPayment.amount).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', isBold: true },
                                      { label: 'Email ID', value: selectedStudent.studentEmail || selectedStudent.email || 'N/A', icon: Mail, color: 'text-indigo-500' },
                                      { label: 'Mobile Number', value: selectedStudent.studentPhone || selectedStudent.phone || 'N/A', icon: Phone, color: 'text-indigo-500' },
                                   ].map((item, idx) => (
                                      <tr key={idx} className={cn("border-b border-slate-100 last:border-0 hover:bg-white transition-colors")}>
                                         <td className="px-6 py-3.5 bg-slate-100/50 w-1/3">
                                            <div className="flex items-center gap-2">
                                               <item.icon size={14} className={item.color} />
                                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                            </div>
                                         </td>
                                         <td className={cn("px-6 py-3.5 text-[13px] font-bold text-slate-800 break-all", item.isBold && "text-lg text-emerald-600 font-black")}>
                                            {item.value}
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4 pt-8">
                       <button 
                         onClick={handleRejectOnlinePayment}
                         className="flex-1 bg-rose-100 text-rose-600 py-5 rounded-[2rem] text-[13px] font-bold capitalize hover:bg-rose-200 transition-all active:scale-95 border border-rose-200"
                       >
                          Reject Payment
                       </button>
                       <button 
                         onClick={handleApproveOnlinePayment}
                         className="flex-[2] bg-[#5D5fb1] text-white py-5 rounded-[2rem] text-[13px] font-black capitalize shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-black/20"
                       >
                          <Check size={20} /> Accept Payment
                       </button>
                    </div>
                 </div>
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
              <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                 {studentTransactions.length > 0 ? (
                    studentTransactions.map((t, idx) => (
                       <div key={t.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <Receipt size={18} />
                             </div>
                             <div>
                                <p className="text-[14px] font-black text-slate-800">₹{parseFloat(t.amount).toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 capitalize">
                                   {new Date(t.timestamp).toLocaleDateString()} | {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.type === 'Online' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                {t.type || 'Cash'}
                             </span>
                             <button 
                               onClick={() => handleDeleteTransaction(t)}
                               disabled={isDeletingTransaction}
                               className="p-2 rounded-lg bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                             >
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                    ))
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
    </div>
  );
}
