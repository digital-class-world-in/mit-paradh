'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';
import { 
  Search, 
  GraduationCap, 
  Globe, 
  CreditCard, 
  Users, 
  Award,
  Zap,
  Bell,
  FileText,
  Building2,
  BookOpen,
  UserPlus,
  Eye,
  X,
  ChevronDown,
  Settings2,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import StudentAdmissionManager from '@/components/StudentAdmissionManager';
import FeesCollectionManager from '@/components/FeesCollectionManager';
import StudentRegistrationManager from '@/components/StudentRegistrationManager';
import ExamManager from '@/components/ExamManager';
import PaymentSettingsManager from '@/components/PaymentSettingsManager';
import PaymentHistoryManager from '@/components/PaymentHistoryManager';
import CourseManager from '@/components/CourseManager';
import StaffRegistryManager from '@/components/StaffRegistryManager';
import CollegeListManager from '@/components/CollegeListManager';
import AdminTrashManager from '@/components/AdminTrashManager';
import ExamFormManager from '@/components/ExamFormManager';
import ExamFeesManager from '@/components/ExamFeesManager';
import CertificateManager from '@/components/CertificateManager';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Reusable ERP Components ---

const Widget = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border-2 border-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-between group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform`} />
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-white shadow-sm border border-slate-200 ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[15px] font-medium tracking-tight text-black mb-0.5">{label}</p>
        <p className="text-xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
    <div className="text-[13px] font-normal text-black bg-emerald-50 px-2 py-1 rounded-md">{trend}</div>
  </div>
);

const ModuleCard = ({ title, desc, icon: Icon, onClick }: any) => (
  <div 
    onClick={onClick}
    className="glass-effect p-8 rounded-[2rem] border-2 border-white/50 interactive-card cursor-pointer group flex flex-col justify-between h-full"
  >
    <div className="flex justify-between items-start mb-6">
      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-slate-400">→</span>
      </div>
    </div>
    <div>
      <h4 className="text-lg font-semibold text-slate-800 tracking-tighter  mb-1 ">{title}</h4>
      <p className="text-xs font-medium text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);



const PlaceholderModule = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="animate-in slide-in-from-bottom-10 duration-700 h-[600px] flex items-center justify-center">
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-[#5D5fb1]/10 rounded-[2rem] flex items-center justify-center text-[#5D5fb1] animate-pulse mx-auto border border-[#5D5fb1]/20">
        <Icon size={48} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter capitalize">{title} Deployment</h3>
        <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
          Our technical board is currently configuring the content synchronization protocols for this module.
        </p>
      </div>
      <div className="flex justify-center gap-2">
         <div className="w-1.5 h-1.5 bg-[#5D5fb1] rounded-full animate-bounce [animation-delay:-0.3s]" />
         <div className="w-1.5 h-1.5 bg-[#5D5fb1] rounded-full animate-bounce [animation-delay:-0.15s]" />
         <div className="w-1.5 h-1.5 bg-[#5D5fb1] rounded-full animate-bounce" />
      </div>
    </div>
  </div>
);



function DashboardContent() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('tab') || '1');
  
  const setActiveTab = (id: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id.toString());
    router.push(`?${params.toString()}`);
  };

  const [stats, setStats] = useState({
    admissionList: 0,
    totalAdmissions: 0,
    studentRegistrations: 0,
    totalInquiries: 0,
    websiteVisitors: 1248,
    todayFees: 0
  });

  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [paymentSubTab, setPaymentSubTab] = useState<'settings' | 'history'>('settings');

  useEffect(() => {
    if (!realtimeDb) return;

    const collegesRef = ref(realtimeDb, 'colleges');
    const unsubColleges = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        const colleges = snap.val();
        let admList = 0;
        let totalAdm = 0;
        let totalInq = 0;
        let fees = 0;
        const today = new Date().toISOString().split('T')[0];

        Object.entries(colleges).forEach(([id, data]: [string, any]) => {
          if (data?.frontOffice?.admissionInquiries) {
            admList += Object.keys(data.frontOffice.admissionInquiries).length;
            totalInq += Object.keys(data.frontOffice.admissionInquiries).length;
          }
          if (data?.studentAdmissions) {
            totalAdm += Object.keys(data.studentAdmissions).length;
          }
          if (data?.fees?.transactions) {
            Object.values(data.fees.transactions).forEach((t: any) => {
              if (t?.date && t.date.startsWith(today)) {
                fees += parseFloat(t.amount || 0);
              }
            });
          }
        });

        setColleges(Object.entries(snap.val()).map(([id, data]: [string, any]) => ({ id, ...data })));
        setStats(prev => ({
          ...prev,
          admissionList: admList,
          totalAdmissions: totalAdm,
          totalInquiries: totalInq,
          todayFees: fees
        }));
      }
    });

    const usersRef = ref(realtimeDb, 'users');
    const unsubUsers = onValue(usersRef, (snap) => {
       if (snap.exists()) {
         const users = snap.val();
         const regs = Object.values(users).filter((u: any) => u?.profile?.profileLocked === true).length;
         setStats(prev => ({ ...prev, studentRegistrations: regs }));
       }
    });

    return () => {
      unsubColleges();
      unsubUsers();
    };
  }, []);


  useEffect(() => {
    try {
      // Immediate session check
      const checkMaster = typeof window !== 'undefined' && sessionStorage.getItem('isAdminMaster') === 'true';
      if (checkMaster) {
        setUserData({ role: 'admin', firstName: 'MIT PARADH', email: 'mitparadh@gmail.com' });
        setLoading(false);
      } else if (auth.currentUser) {
        setUserData({ role: 'admin', uid: auth.currentUser.uid });
        setLoading(false);
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        const isMaster = typeof window !== 'undefined' && sessionStorage.getItem('isAdminMaster') === 'true';

        if (isMaster) {
          setUserData({ role: 'admin', firstName: 'MIT PARADH', email: 'mitparadh@gmail.com' });
          setLoading(false);
          return;
        }

        if (user) {
          try {
            if (realtimeDb && typeof realtimeDb === 'object') {
              const userRef = ref(realtimeDb, 'users/' + user?.uid);
              const snapshot = await get(userRef);
              if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.role === 'admin') {
                  setUserData({ ...data, uid: user?.uid });
                } else {
                  router.push('/login/admin');
                }
              } else {
                setUserData({ role: 'admin', firstName: 'Admin', uid: user?.uid });
              }
            } else {
              setUserData({ role: 'admin', firstName: 'Admin', uid: user?.uid });
            }
          } catch (error) {
            setUserData({ role: 'admin', firstName: 'Admin', uid: user?.uid });
          }
          setLoading(false);
        } else {
          // Grace period for Firebase redirect
          const redirectTimer = setTimeout(() => {
            if (!auth.currentUser && !sessionStorage.getItem('isAdminMaster')) {
              router.push('/login/admin');
            }
          }, 2000);
          return () => clearTimeout(redirectTimer);
        }
      });
      
      const safetyTimer = setTimeout(() => setLoading(false), 4000);
      return () => { unsubscribe(); clearTimeout(safetyTimer); };
    } catch (err) {
      setLoading(false);
    }
  }, [router]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl p-10 shadow-xl border-t-8 border-[#5d5fb1] relative overflow-hidden group">
               <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3 text-[#5d5fb1] font-semibold text-[20px] tracking-tight">
                     <Award size={16} />  Welcome, Mit Paradh 
                  </div>
                  <p className="text-slate-400 font-medium text-xs max-w-md  border-l-4 border-slate-200 pl-4 py-1">
                    "Change is the end result of all true learning."
                  </p>
               </div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#5d5fb1]/5 rounded-full blur-3xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Widget icon={FileText} label="Admission List" value={stats.admissionList.toLocaleString()} trend="+12%" color="bg-indigo-600" />
               <Widget icon={GraduationCap} label="Total Admission" value={stats.totalAdmissions.toLocaleString()} trend="+8%" color="bg-purple-600" />
               <Widget icon={UserPlus} label="Student Registration" value={stats.studentRegistrations.toLocaleString()} trend="+5%" color="bg-teal-600" />
               <Widget icon={Users} label="Total Inquiry" value={stats.totalInquiries.toLocaleString()} trend="+15%" color="bg-blue-600" />
               <Widget icon={Globe} label="Website Inquiry" value={stats.websiteVisitors.toLocaleString()} trend="Live" color="bg-emerald-600" />
               <Widget icon={CreditCard} label="Fees Collection" value={`₹${stats.todayFees.toLocaleString()}`} trend="Today" color="bg-rose-600" />
            </div>

            <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-200 shadow-inner">
               <h3 className="text-2xl font-semibold text-slate-800 tracking-tighter  mb-8  flex items-center gap-3">
                  <Zap size={24} className="text-amber-500 fill-amber-500" /> System Management Modules
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <ModuleCard title="Academic Registry" desc="Monitor curriculum deployment and course analytics." icon={BookOpen} onClick={() => {}} />
                  <ModuleCard title="Human Resources" desc="Manage staff profiles, payroll and attendance." icon={Users} onClick={() => {}} />
                  <ModuleCard title="Financial Center" desc="Secure ledger management and fee tracking." icon={CreditCard} onClick={() => {}} />
                  <ModuleCard title="Website Manager" desc="CMS protocols for home page and facility setup." icon={Globe} onClick={() => {}} />
                  <ModuleCard title="Inquiry Board" desc="Direct CRM bridge for potential student leads." icon={Bell} onClick={() => setActiveTab(90)} />
                  <ModuleCard title="Certification" desc="Issue and manage institutional certificates." icon={Award} onClick={() => setActiveTab(80)} />
                  <ModuleCard title="System Reports" desc="Export detailed analytics and audit logs." icon={FileText} onClick={() => setActiveTab(1)} />
               </div>
            </div>
          </div>
        );
      case 120: // Exam
      case 121: // Create Exam
        return <ExamManager collegeId={undefined} />;
      case 2: // Student info Parent
      case 19: // Student Registration
        return <StudentRegistrationManager collegeId={undefined} />;
      case 25: // Student Admission
        return <StudentAdmissionManager collegeId={undefined} />;
      case 41: // Manage Course
      case 4: // Course Parent
        return <CourseManager />;
      case 70: // Fees Parent
      case 71: // Student Fees
      case 72: // Fees Management
        return <FeesCollectionManager collegeId={undefined} />;
      case 31: // Staff Directory
      case 3: // HR Parent
      case 33: // Leave Card
      case 34: // Staff ID Card
      case 35: // Payroll
      case 36: // Staff Login
        return <StaffRegistryManager />;
      case 42: // Syllabus Management
      case 43: // Department Setup
      case 61: // College List
      case 60: // College Parent
        return <CollegeListManager />;
      case 90: // Front Office Parent
      case 91: // Admission Inquiry
      case 92: // Concerns/Complaint
      case 93: // Postal Services
        return <AdmissionInquiryManager collegeId={undefined} mode="inquiry" />;
      case 3022: // Admission confirm
        return <AdmissionInquiryManager collegeId={undefined} mode="list" />;
      case 3024: // Pending admission
        return <AdmissionInquiryManager collegeId={undefined} mode="pending" />;
      case 3023: // Cancel Admission
        return <AdmissionInquiryManager collegeId={undefined} mode="cancelled" />;
      case 80:
      case 81:
        return <CertificateManager collegeId={undefined} defaultTab="tc" />;
      case 82:
        return <CertificateManager collegeId={undefined} defaultTab="marksheet" />;
      case 83:
        return <CertificateManager collegeId={undefined} defaultTab="course" />;
      case 99: // Trash
        return <AdminTrashManager />;
      case 15: 
      case 101: 
        return <PlaceholderModule title="Home Page Setup" icon={Globe} />;
      case 102:
        return <PlaceholderModule title="About Page Editor" icon={Globe} />;
      case 103:
        return <PlaceholderModule title="Inquiry Board" icon={Globe} />;
      case 104:
        return <PlaceholderModule title="Contact Information" icon={Globe} />;
      case 50: // Settings Parent
      case 51:
      case 52:
        return <PlaceholderModule title="System Settings" icon={Settings2} />;
      case 200: // Payment Main
      case 201: // Online Payments
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Contextual Header with Filter */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#5D5fb1] rounded-2xl flex items-center justify-center text-white shadow-xl">
                     <CreditCard size={28} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black tracking-tighter text-slate-800">Online Payments</h3>
                     <p className="text-[13px] font-medium text-slate-400 capitalize">Institutional Gateway Configuration</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                     <select 
                       className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-8 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#5D5fb1] transition-all cursor-pointer appearance-none shadow-sm"
                       value={selectedCollegeId}
                       onChange={(e) => setSelectedCollegeId(e.target.value)}
                     >
                       <option value="">Search & Select College...</option>
                       {colleges.map((c: any) => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                     <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {selectedCollegeId && (
                    <button 
                      onClick={() => setSelectedCollegeId('')}
                      className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200"
                      title="Clear Selection"
                    >
                      <X size={18} />
                    </button>
                  )}
               </div>
            </div>

            {selectedCollegeId ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                {/* Internal Tabs & Back Action */}
                <div className="flex items-center justify-between border-b border-slate-200">
                   <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setSelectedCollegeId('')}
                        className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-400 hover:text-[#5D5fb1] transition-all pb-4 group"
                      >
                         <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                         Back to Institutions
                      </button>
                      <div className="w-px h-4 bg-slate-200 mb-4" />
                      <button 
                        onClick={() => setPaymentSubTab('settings')}
                        className={cn(
                           "pb-4 px-2 text-[13px] font-black uppercase tracking-widest transition-all relative",
                           paymentSubTab === 'settings' ? "text-[#5D5fb1]" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                         Gateway Settings
                         {paymentSubTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#5D5fb1] rounded-t-full" />}
                      </button>
                      <button 
                        onClick={() => setPaymentSubTab('history')}
                        className={cn(
                           "pb-4 px-2 text-[13px] font-black uppercase tracking-widest transition-all relative",
                           paymentSubTab === 'history' ? "text-[#5D5fb1]" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                         Transaction History
                         {paymentSubTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#5D5fb1] rounded-t-full" />}
                      </button>
                   </div>
                   
                   <div className="pb-4">
                      <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Active Selection</span>
                   </div>
                </div>

                <div className="animate-in fade-in duration-500">
                   {paymentSubTab === 'settings' ? (
                      <PaymentSettingsManager collegeId={selectedCollegeId} isAdmin={true} />
                   ) : (
                      <PaymentHistoryManager collegeId={selectedCollegeId} />
                   )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                       <h4 className="text-lg font-black text-slate-800 tracking-tighter">All Institutional Gateways</h4>
                       <p className="text-[13px] font-medium text-slate-400">Overview of payment status across all registered colleges</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#5D5fb1]/10 text-[#5D5fb1] rounded-xl text-[11px] font-black uppercase tracking-widest">
                       <Zap size={14} /> Total Colleges: {colleges.length}
                    </div>
                 </div>
                 <div className="overflow-x-auto p-4">
                     <table className="w-full text-left border-collapse border border-black shadow-2xl">
                        <thead>
                           <tr className="bg-[#002147] text-[14px] font-black text-white uppercase tracking-widest border-b border-black">
                              <th className="px-8 py-5 border-r border-black text-center">Sr. No</th>
                              <th className="px-8 py-5 border-r border-black">Institution Name</th>
                              <th className="px-8 py-5 border-r border-black">UPI Configuration</th>
                              <th className="px-8 py-5 border-r border-black text-center">Gateway Status</th>
                              <th className="px-8 py-5 text-center">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-black text-slate-800">
                           {colleges.map((c: any, idx: number) => (
                              <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="px-8 py-6 text-[14px] font-medium text-black text-center border-r border-black">{idx + 1}.</td>
                                 <td className="px-8 py-6 border-r border-black">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#5D5fb1] group-hover:text-white transition-all shadow-inner border border-slate-200">
                                          <Building2 size={18} />
                                       </div>
                                       <div>
                                          <p className="text-[14px] font-medium text-black tracking-tight leading-none mb-1">{c.name}</p>
                                          <p className="text-[12px] font-normal text-slate-400 uppercase tracking-tight">ID: {c.collegeId || 'N/A'}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 border-r border-black">
                                    {c.paymentSettings?.upiId ? (
                                       <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span className="text-[14px] font-medium text-black tracking-tight">{c.paymentSettings.upiId}</span>
                                       </div>
                                    ) : (
                                      <span className="text-[13px] font-normal text-slate-300 italic">Not Configured</span>
                                   )}
                                </td>
                                <td className="px-8 py-6 text-center border-r border-black">
                                   <div className={cn(
                                      "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest border",
                                      c.paymentSettings?.isActive 
                                         ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                         : "bg-rose-50 text-rose-600 border-rose-100"
                                   )}>
                                      {c.paymentSettings?.isActive ? 'Active' : 'Disabled'}
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                   <button 
                                     onClick={() => setSelectedCollegeId(c.id)}
                                     className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-black text-[#5D5fb1] uppercase tracking-widest hover:bg-[#5D5fb1] hover:text-white hover:border-[#5D5fb1] transition-all shadow-sm active:scale-95"
                                   >
                                      <Eye size={18} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {colleges.length === 0 && (
                             <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">No institutions found.</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}
          </div>
        );
      case 202: // Payment History
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
             {/* Contextual Header with Filter */}
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                      <Clock size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tighter text-slate-800">Institutional Payment History</h3>
                      <p className="text-[13px] font-medium text-slate-400 capitalize">Comprehensive audit of all online transactions</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-8 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#5D5fb1] transition-all cursor-pointer appearance-none shadow-sm min-w-[240px]"
                        value={selectedCollegeId}
                        onChange={(e) => setSelectedCollegeId(e.target.value)}
                      >
                        <option value="">All Institutions (Global)...</option>
                        {colleges.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   </div>
                </div>
             </div>

             <div className="animate-in slide-in-from-bottom-8 duration-500">
                <PaymentHistoryManager collegeId={selectedCollegeId} />
             </div>
          </div>
        );
      case 70: // Fees Collection Parent
      case 71: // Student Fees
      case 72: // Fees Management
        return <FeesCollectionManager collegeId={undefined} />;
      case 600: // Examination Parent
      case 601: // Exam List
        return <ExamManager collegeId={undefined} />;
      case 602: // Create Online Exam
        return <ExamManager collegeId={undefined} defaultCreate={true} />;
      case 603: // Exam Form
        return <ExamFormManager />;
      case 604: // Exam Fees
        return <ExamFeesManager />;
      case 99:
        return <AdminTrashManager />;
      case 23: // Leave Request
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#003366] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
               <div className="relative z-10 space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                     <FileText size={14} className="text-[#00a5a5]" /> Student Services
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Leave Request</h2>
                  <p className="text-sm font-normal text-white/60">Manage and track student leave applications.</p>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-xl p-20 text-center">
               <div className="flex flex-col items-center gap-6 text-slate-300">
                  <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
                     <FileText size={48} className="opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-normal tracking-normal capitalize text-black">Leave Request Module</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">The leave management system is being configured for automated processing.</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="w-1.5 h-1.5 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <div className="w-1.5 h-1.5 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <div className="w-1.5 h-1.5 bg-[#00a5a5] rounded-full animate-bounce" />
                  </div>
               </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl flex flex-col items-center justify-center space-y-6">
             <h3 className="text-2xl font-semibold text-slate-800 tracking-tighter ">Module Update</h3>
             <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">This module is being updated. Please check back shortly.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#002147] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="flex flex-col items-center gap-2">
           <div className="text-black font-normal capitalize tracking-normal text-[13px]">
             Initializing Admin Session
           </div>
           <div className="flex gap-1">
              <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {renderTabContent()}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#003366] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-normal capitalize tracking-normal text-black animate-pulse">Loading Admin Portal</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}





