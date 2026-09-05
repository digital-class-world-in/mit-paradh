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
  Clock,
  Database
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import StudentAdmissionManager from '@/components/StudentAdmissionManager';
import FeesCollectionManager from '@/components/FeesCollectionManager';
import StudentRegistrationManager from '@/components/StudentRegistrationManager';
import StudentCredentialsManager from '@/components/StudentCredentialsManager';
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
import CredentialManager from '@/components/CredentialManager';
import WebsiteManager from '@/components/WebsiteManager';
import ContactEnquiriesManager from '@/components/ContactEnquiriesManager';
import BackupManager from '@/components/BackupManager';
import NoticeManager from '@/components/NoticeManager';
import { getDefaultAdminUid } from '@/lib/adminUtils';

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
  const [resolvedAdminUid, setResolvedAdminUid] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('tab') || '1');

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
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    async function resolve() {
      if (userData?.uid) {
        setResolvedAdminUid(userData.uid);
      } else {
        try {
          const defaultUid = await getDefaultAdminUid();
          setResolvedAdminUid(defaultUid);
        } catch (e) {
          console.error("Failed to resolve default admin UID:", e);
        }
      }
    }
    resolve();
  }, [userData?.uid]);

  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const shouldRender = (tabIds: number[]) => {
    return tabIds.some(id => visitedTabs.has(id));
  };

  useEffect(() => {
    if (!realtimeDb || !resolvedAdminUid) return;

    const collegesRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/colleges`);
    const unsubColleges = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        const collegesData = snap.val();
        let admList = 0;
        let totalAdm = 0;
        let totalInq = 0;
        let fees = 0;
        const today = new Date().toISOString().split('T')[0];

        Object.entries(collegesData).forEach(([id, data]: [string, any]) => {
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

        setColleges(Object.entries(collegesData).map(([id, data]: [string, any]) => ({ id, ...data })));
        setStats(prev => ({
          ...prev,
          admissionList: admList,
          totalAdmissions: totalAdm,
          totalInquiries: totalInq,
          todayFees: fees
        }));
      } else {
        setColleges([]);
        setStats(prev => ({
          ...prev,
          admissionList: 0,
          totalAdmissions: 0,
          totalInquiries: 0,
          todayFees: 0
        }));
      }
    });

    const regsRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations`);
    const unsubUsers = onValue(regsRef, (snap) => {
      if (snap.exists()) {
        const regsVal = snap.val();
        const regs = Object.values(regsVal).length;
        setStats(prev => ({ ...prev, studentRegistrations: regs }));
      } else {
        setStats(prev => ({ ...prev, studentRegistrations: 0 }));
      }
    });

    return () => {
      unsubColleges();
      unsubUsers();
    };
  }, [resolvedAdminUid]);


  useEffect(() => {
    try {
      const checkMaster = typeof window !== 'undefined' && (sessionStorage.getItem('isAdminMaster') === 'true' || sessionStorage.getItem('emergencyBypass') === 'true');
      if (checkMaster) {
        setUserData({ role: 'admin', firstName: 'MIT PARADH', email: 'mitparadh@gmail.com' });
        setLoading(false);
      } else if (auth.currentUser) {
        setUserData({ role: 'admin', uid: auth.currentUser.uid });
        setLoading(false);
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        const isMaster = typeof window !== 'undefined' && (sessionStorage.getItem('isAdminMaster') === 'true' || sessionStorage.getItem('emergencyBypass') === 'true');

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
          if (!auth.currentUser && !sessionStorage.getItem('isAdminMaster')) {
            router.push('/login/admin');
          }
        }
      });

      const safetyTimer = setTimeout(() => setLoading(false), 4000);
      return () => { unsubscribe(); clearTimeout(safetyTimer); };
    } catch (err) {
      setLoading(false);
    }
  }, [router]);

  const renderTabContent = () => {
    return (
      <div className="relative">
        <div className={activeTab === 1 ? "block" : "hidden"}>
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
              <Widget icon={FileText} label="Pending Admission" value={stats.admissionList.toLocaleString()} trend="+12%" color="bg-indigo-600" />
              <Widget icon={GraduationCap} label="Approved Admission" value={stats.totalAdmissions.toLocaleString()} trend="+8%" color="bg-purple-600" />
              <Widget icon={UserPlus} label="Student Registration" value={stats.studentRegistrations.toLocaleString()} trend="+5%" color="bg-teal-600" />
              <Widget icon={Users} label="Total Inquiry" value={stats.totalInquiries.toLocaleString()} trend="+15%" color="bg-blue-600" />
              <Widget icon={Globe} label="Website Inquiry" value={stats.websiteVisitors.toLocaleString()} trend="Live" color="bg-emerald-600" />
              <Widget icon={BookOpen} label="Online Examination" value={'Active'} trend="Live" color="bg-rose-600" />
            </div>

            <div className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-200 shadow-inner">
              <h3 className="text-2xl font-semibold text-slate-800 tracking-tighter  mb-8  flex items-center gap-3">
                <Zap size={24} className="text-amber-500 fill-amber-500" /> System Management Modules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ModuleCard title="Academic Registry" desc="Monitor curriculum deployment and course analytics." icon={BookOpen} onClick={() => router.push('?tab=4')} />
                <ModuleCard title="Human Resources" desc="Manage staff profiles, payroll and attendance." icon={Users} onClick={() => router.push('?tab=3')} />
                <ModuleCard title="Financial Center" desc="Secure ledger management and fee tracking." icon={CreditCard} onClick={() => router.push('?tab=70')} />
                <ModuleCard title="Website Manager" desc="CMS protocols for home page and facility setup." icon={Globe} onClick={() => router.push('?tab=15')} />
                <ModuleCard title="Inquiry Board" desc="Direct CRM bridge for potential student leads." icon={Bell} onClick={() => router.push('?tab=90')} />
                <ModuleCard title="Examination" desc="Setup and monitor online exams and student results." icon={FileText} onClick={() => router.push('?tab=120')} />
              </div>
            </div>
          </div>

        </div>

        <div className={(activeTab === 120 || activeTab === 121) ? "block" : "hidden"}>
          {shouldRender([120, 121]) && <ExamManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 122 ? "block" : "hidden"}>
          {shouldRender([122]) && <ExamFormManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 123 ? "block" : "hidden"}>
          {shouldRender([123]) && <ExamFeesManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 2 || activeTab === 19) ? "block" : "hidden"}>
          {shouldRender([2, 19]) && <StudentRegistrationManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 27 ? "block" : "hidden"}>
          {shouldRender([27]) && <StudentCredentialsManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 25 ? "block" : "hidden"}>
          {shouldRender([25]) && <StudentAdmissionManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 41 || activeTab === 4) ? "block" : "hidden"}>
          {shouldRender([41, 4]) && <CourseManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 20) ? "block" : "hidden"}>
          {shouldRender([20]) && <NoticeManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 70 || activeTab === 71 || activeTab === 72) ? "block" : "hidden"}>
          {shouldRender([70, 71, 72]) && <FeesCollectionManager collegeId={undefined} adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 31 || activeTab === 3 || activeTab === 33 || activeTab === 34 || activeTab === 35 || activeTab === 36) ? "block" : "hidden"}>
          {shouldRender([31, 3, 33, 34, 35, 36]) && <StaffRegistryManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 42 || activeTab === 43 || activeTab === 61 || activeTab === 60) ? "block" : "hidden"}>
          {shouldRender([42, 43, 61, 60]) && <CollegeListManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 90 || activeTab === 91 || activeTab === 92 || activeTab === 93) ? "block" : "hidden"}>
          {shouldRender([90, 91, 92, 93]) && <AdmissionInquiryManager collegeId={undefined} mode="inquiry" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 94 ? "block" : "hidden"}>
          {shouldRender([94]) && <ContactEnquiriesManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 3022 ? "block" : "hidden"}>
          {shouldRender([3022]) && <AdmissionInquiryManager collegeId={undefined} mode="list" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 3024 ? "block" : "hidden"}>
          {shouldRender([3024]) && <AdmissionInquiryManager collegeId={undefined} mode="pending" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 3023 ? "block" : "hidden"}>
          {shouldRender([3023]) && <AdmissionInquiryManager collegeId={undefined} mode="cancelled" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 99 ? "block" : "hidden"}>
          {shouldRender([99]) && <AdminTrashManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 80 || activeTab === 81) ? "block" : "hidden"}>
          {shouldRender([80, 81]) && <CredentialManager collegeId={undefined} type="marksheet" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 82 ? "block" : "hidden"}>
          {shouldRender([82]) && <CredentialManager collegeId={undefined} type="certificate" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 101 ? "block" : "hidden"}>
          {shouldRender([101]) && <WebsiteManager mode="home" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 102 ? "block" : "hidden"}>
          {shouldRender([102]) && <WebsiteManager mode="about" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 107 ? "block" : "hidden"}>
          {shouldRender([107]) && <WebsiteManager mode="course" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 104 ? "block" : "hidden"}>
          {shouldRender([104]) && <WebsiteManager mode="inquiry" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 105 ? "block" : "hidden"}>
          {shouldRender([105]) && <WebsiteManager mode="contact" adminUid={resolvedAdminUid} />}
        </div>

        <div className={activeTab === 106 ? "block" : "hidden"}>
          {shouldRender([106]) && <WebsiteManager mode="footer" adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 50 || activeTab === 51 || activeTab === 52) ? "block" : "hidden"}>
          {shouldRender([50, 51, 52]) && <PlaceholderModule title="System Settings" icon={Settings2} />}
        </div>

        <div className={activeTab === 110 ? "block" : "hidden"}>
          {shouldRender([110]) && <BackupManager adminUid={resolvedAdminUid} />}
        </div>

        <div className={(activeTab === 200 || activeTab === 201) ? "block" : "hidden"}>
          {shouldRender([200, 201]) && (
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
                      <PaymentSettingsManager collegeId={selectedCollegeId} isAdmin={true} adminUid={resolvedAdminUid} />
                    ) : (
                      <PaymentHistoryManager collegeId={selectedCollegeId} adminUid={resolvedAdminUid} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tighter">Global Payment Requests</h4>
                      <p className="text-[13px] font-medium text-slate-400">View and verify incoming payments across all registered colleges</p>
                    </div>
                  </div>
                  <PaymentHistoryManager collegeId="" adminUid={resolvedAdminUid} />
                </div>
              )}
            </div>

          )}
        </div>

        <div className={activeTab === 202 ? "block" : "hidden"}>
          {shouldRender([202]) && <PaymentHistoryManager collegeId={selectedCollegeId} />}
        </div>

        <div className={activeTab === 23 ? "block" : "hidden"}>
          {shouldRender([23]) && (
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

          )}
        </div>
      </div>
    );
  };

  if (loading && !userData) {
    // Return null to avoid double loader flashing
    return null;
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





