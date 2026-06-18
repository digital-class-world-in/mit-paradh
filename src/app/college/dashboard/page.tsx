'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collegeAuth, staffAuth, studentAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, get, onValue, push, set } from 'firebase/database';
import {
  Users,
  User,
  GraduationCap,
  BookOpen,
  Building2,
  Award,
  Zap,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock,
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  Book,
  Timer,
  Settings2,
  IdCard,
  FileText,
  Wallet,
  LogIn,
  Search,
  Eye,
  EyeOff,
  PhoneCall,
  Shield,
  ShieldCheck,
  Lock,
  ChevronDown
} from 'lucide-react';
import StudentAdmissionManager from '@/components/StudentAdmissionManager';
import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import TrashManager from '@/components/TrashManager';
import StudentIdCardManager from '@/components/StudentIdCardManager';
import CollegeSidebar from '@/components/CollegeSidebar';
import CollegeHeader from '@/components/CollegeHeader';
import StudentRegistrationManager from '@/components/StudentRegistrationManager';
import ExamManager from '@/components/ExamManager';
import CertificateManager from '@/components/CertificateManager';
import CredentialManager from '@/components/CredentialManager';
import FeesCollectionManager from '@/components/FeesCollectionManager';
import PaymentSettingsManager from '@/components/PaymentSettingsManager';
import PaymentHistoryManager from '@/components/PaymentHistoryManager';
import StaffRegistryManager from '@/components/StaffRegistryManager';
import CourseManager from '@/components/CourseManager';
import ExamFormManager from '@/components/ExamFormManager';
import ExamFeesManager from '@/components/ExamFeesManager';
import ContactEnquiriesManager from '@/components/ContactEnquiriesManager';

const hrLabels: Record<number, string> = {
  31: 'Staff Directory',
  33: 'Leave Card',
  34: 'Staff ID Card',
  35: 'Payroll',
  36: 'Staff Login'
};

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


const StatCard = ({ icon: Icon, label, value, color, onClick }: any) => (
  <div
    onClick={onClick}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
  >
    <div className="flex items-center gap-5">
      <div className={`p-4 rounded-2xl bg-slate-50 ${color} transition-colors group-hover:bg-opacity-80`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[13px] font-normal text-black capitalize tracking-normal mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
      <TrendingUp size={16} className={color} />
    </div>
  </div>
);

function DashboardContent() {
  const [collegeData, setCollegeData] = useState<any>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});



  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('sub') || searchParams.get('tab') || '1');



  // Staff Management State


  // Filter State


  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDesigName, setNewDesigName] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [isAddingDesig, setIsAddingDesig] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Student Management State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    courseId: '',
    courseType: '',
    address: '',
    aadharNumber: '',
    fees: '',
    paidFees: '',
    photo: null as string | null,
    password: ''
  });




  // Course Management State
  const [courses, setCourses] = useState<any[]>([]);
  const [customCourseTypes, setCustomCourseTypes] = useState<any[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ name: '', type: '', duration: '', fees: '' });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 500); // 500ms max loading time
    const unsubscribe = onAuthStateChanged(collegeAuth, async (user) => {
      if (!isMounted) return;
      if (user) {
        try {
          const collegeRef = ref(realtimeDb, 'colleges/' + user.uid);
          const snapshot = await get(collegeRef);
          if (snapshot.exists()) {
            setCollegeData(snapshot.val());
          }

          // Fetch Staff List
          const staffListRef = ref(realtimeDb, 'staff');
          const unsubStaff = onValue(staffListRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              const allStaff = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
              setStaffList(allStaff.filter((s: any) => s.collegeId === user.uid));
            } else {
              setStaffList([]);
            }
          });

          // Fetch Courses
          const courseRef = ref(realtimeDb, `colleges/${user.uid}/settings/courses`);
          const unsubCourses = onValue(courseRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              setCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            } else {
              setCourses([]);
            }
          });

          // Fetch Course Types
          const typeRef = ref(realtimeDb, `colleges/${user.uid}/settings/courseTypes`);
          const unsubTypes = onValue(typeRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              setCustomCourseTypes(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            } else {
              setCustomCourseTypes([]);
            }
          });

          // Fetch Permissions
          const permRef = ref(realtimeDb, `colleges/${user.uid}/permissions`);
          const unsubPerms = onValue(permRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              setPermissions(snap.val());
            } else {
              setPermissions({});
            }
          });

          // Fetch Departments
          const deptRef = ref(realtimeDb, `colleges/${user.uid}/settings/departments`);
          const unsubDept = onValue(deptRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              setDepartments(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            } else {
              setDepartments([]);
            }
          });

          // Fetch Designations
          const desigRef = ref(realtimeDb, `colleges/${user.uid}/settings/designations`);
          const unsubDesig = onValue(desigRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              setDesignations(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
            } else {
              setDesignations([]);
            }
          });

          // Fetch Student List (Both Manual Students and Online Admissions)
          const studentsRef = ref(realtimeDb, `colleges/${user.uid}/students`);
          const admissionsRef = ref(realtimeDb, `colleges/${user.uid}/studentAdmissions`);

          let lastStusSnap: any = null;
          let lastAdmsSnap: any = null;

          const updateStudentList = () => {
            if (!isMounted) return;
            let combined: any[] = [];

            if (lastStusSnap && lastStusSnap.exists()) {
              combined = [...combined, ...Object.entries(lastStusSnap.val()).map(([id, val]: any) => ({ id, ...val }))];
            }
            if (lastAdmsSnap && lastAdmsSnap.exists()) {
              combined = [...combined, ...Object.entries(lastAdmsSnap.val()).map(([id, val]: any) => ({ id, ...val }))];
            }

            const sortedStudents = combined.sort((a, b) =>
              new Date(b.createdAt || b.admissionDate || b.date || 0).getTime() -
              new Date(a.createdAt || a.admissionDate || a.date || 0).getTime()
            );

            setStudentList(sortedStudents);
          };

          const unsubStudents = onValue(studentsRef, (snap) => {
            lastStusSnap = snap;
            updateStudentList();
          });

          const unsubAdmissions = onValue(admissionsRef, (snap) => {
            lastAdmsSnap = snap;
            updateStudentList();
          });


          // Fetch Inquiries for Stats
          const inqRef = ref(realtimeDb, `colleges/${user.uid}/frontOffice/admissionInquiries`);
          const unsubInq = onValue(inqRef, (snap) => {
            if (!isMounted) return;
            if (snap.exists()) {
              setInquiries(Object.values(snap.val()));
            } else {
              setInquiries([]);
            }
          });

          if (isMounted) setLoading(false);

          return () => {
            unsubStaff();
            unsubCourses();
            unsubTypes();
            unsubPerms();
            unsubDept();
            unsubDesig();
            unsubStudents();
            unsubAdmissions();
          };
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          if (isMounted) setLoading(false);
        }
      } else {
        if (!collegeAuth.currentUser) {
          router.push('/login/college');
        }
      }
    });
    return () => {
      clearTimeout(safetyTimer);
      isMounted = false;
      unsubscribe();
    };
  }, [router]);



  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeAuth.currentUser) return;

    setIsSubmittingStudent(true);
    try {
      let uid = editingStudentId;

      if (!editingStudentId) {
        // 1. Create Student in Firebase Auth using studentAuth instance
        const userCredential = await createUserWithEmailAndPassword(studentAuth, studentForm.email, studentForm.password);
        uid = userCredential.user.uid;
      }

      // 2. Save detailed student data to college directory
      const studentRef = ref(realtimeDb, `colleges/${collegeAuth.currentUser.uid}/students/${uid}`);
      const studentData = {
        ...studentForm,
        collegeId: collegeAuth.currentUser.uid,
        uid: uid,
        role: 'student',
        paidFees: studentForm.paidFees || '0',
        updatedAt: new Date().toISOString()
      };

      if (!editingStudentId) {
        (studentData as any).createdAt = new Date().toISOString();
      }

      // Don't save password in the database
      delete (studentData as any).password;

      await set(studentRef, studentData);

      // 3. Save to global users table for portal verification
      const userRoleRef = ref(realtimeDb, `users/${uid}`);
      await set(userRoleRef, {
        email: studentForm.email,
        role: 'student',
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        collegeId: collegeAuth.currentUser.uid,
        studentId: studentForm.studentId
      });

      alert(editingStudentId ? 'Student record updated!' : 'Student registered successfully!');
      setIsAddStudentModalOpen(false);
      setEditingStudentId(null);
      setStudentForm({
        studentId: '', firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '',
        courseId: '', courseType: '', address: '', aadharNumber: '', fees: '', paidFees: '', photo: null, password: ''
      });
      setShowStudentPassword(false);
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert('Failed to save student: ' + error.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const renderTabContent = () => {
    const hrLabels: { [key: number]: string } = {
      33: 'Leave Card',
      34: 'Staff ID Card',
      35: 'Payroll',
      36: 'Staff Login'
    };
    const hrIcons: { [key: number]: any } = {
      33: FileText,
      34: IdCard,
      35: Wallet,
      36: LogIn
    };
    const HrIcon = hrIcons[activeTab] || Users;

    switch (activeTab) {
      case 31:
        return <StaffRegistryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />;
      case 4:
      case 41:
        return <CourseManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />;
      case 33: // Leave Card
      case 34: // Staff ID Card
      case 35: // Payroll
      case 36: // Staff Login
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                  <HrIcon size={14} className="text-[#00a5a5]" /> Human Resource
                </div>
                <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">{hrLabels[activeTab]}</h2>
                <p className="text-sm font-normal text-white/60">Configure and manage institutional {hrLabels[activeTab].toLowerCase()} records.</p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-xl p-20 text-center">
              <div className="flex flex-col items-center gap-6 text-slate-300">
                <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
                  <HrIcon size={48} className="opacity-20" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-normal tracking-normal capitalize text-black">{hrLabels[activeTab]} Module</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">This module is currently being synchronized with the institutional database for real-time monitoring.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 21: // New admission
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                    <Plus size={14} className="text-[#00a5a5]" /> Admissions Module
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Student Registration</h2>
                  <p className="text-sm font-normal text-white/60">Initialize new institutional enrollment credentials.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingStudentId(null);
                    setStudentForm({
                      studentId: `STU${Date.now().toString().slice(-6)}`,
                      firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '',
                      courseId: '', courseType: '', address: '', aadharNumber: '', fees: '', paidFees: '', photo: null, password: ''
                    });
                    setIsAddStudentModalOpen(true);
                  }}
                  className="bg-[#00a5a5] text-white px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight hover:bg-white hover:text-[#5D5fb1] transition-all shadow-xl active:scale-95"
                >
                  Open Registration Form
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Form Completion', value: '0%', icon: FileText, color: 'text-blue-500' },
                { label: 'Document Verification', value: 'Pending', icon: ShieldCheck, color: 'text-amber-500' },
                { label: 'Final Submission', value: 'Awaiting', icon: Zap, color: 'text-slate-400' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-5">
                  <div className={`p-4 rounded-2xl bg-slate-50 ${item.color}`}><item.icon size={24} /></div>
                  <div>
                    <p className="text-[13px] font-normal text-black capitalize tracking-tight mb-1">{item.label}</p>
                    <p className="text-xl font-black text-slate-800 capitalize tracking-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 24: // Admission reports
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                  <FileText size={14} className="text-[#00a5a5]" /> Data Analytics
                </div>
                <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Admission Reports</h2>
                <p className="text-sm font-normal text-white/60">Analytical breakdown of institutional enrollment trends.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-800 capitalize tracking-tight">Enrollment by Course</h3>
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[13px] font-normal capitalize tracking-tight">
                        <span className="text-slate-500">{course.name}</span>
                        <span className="text-[#00a5a5]">0 Students</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00a5a5] w-0 transition-all duration-1000" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#5D5fb1] rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-white/10">
                  <TrendingUp size={40} className="text-[#00a5a5]" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter capitalize">Generate Report</h3>
                <p className="text-sm font-normal text-white/40 max-w-xs mx-auto capitalize tracking-tight">Compile comprehensive PDF audit for current academic session.</p>
                <button className="bg-[#00a5a5] text-white py-4 rounded-2xl font-black text-[11px] capitalize tracking-tight shadow-lg hover:bg-white hover:text-[#5D5fb1] transition-all active:scale-95">
                  Download Analytics
                </button>
              </div>
            </div>
          </div>
        );
      case 19:
        return <StudentRegistrationManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />;
      case 94:
        return <ContactEnquiriesManager />;
      case 91:
        return <AdmissionInquiryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} collegeName={collegeData?.name} mode="inquiry" />;
      case 22:
      case 1022:
      case 2022:
        return <AdmissionInquiryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} collegeName={collegeData?.name} mode="list" />;
      case 1024:
        return <AdmissionInquiryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} collegeName={collegeData?.name} mode="pending" />;
      case 1023:
        return <AdmissionInquiryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} collegeName={collegeData?.name} mode="cancelled" />;
      case 25:
        return <StudentAdmissionManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />;
      case 26:
        return <StudentIdCardManager studentList={studentList} />;
      case 61:
        return <ExamManager collegeId={collegeAuth.currentUser?.uid} />;
      case 62:
        return <ExamFormManager collegeId={collegeAuth.currentUser?.uid} />;
      case 63:
        return <ExamFeesManager collegeId={collegeAuth.currentUser?.uid} />;
      case 80: // Certificate Parent
      case 81: // Transfer certificate
        return <CertificateManager collegeId={collegeAuth.currentUser?.uid} />;
      case 83: // Marksheet
        return <CredentialManager collegeId={collegeAuth.currentUser?.uid} type="marksheet" />;
      case 84: // Course Certificate
        return <CredentialManager collegeId={collegeAuth.currentUser?.uid} type="certificate" />;
      case 202: // Payment History
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                  <Clock size={14} className="text-[#00a5a5]" /> Financial Audit
                </div>
                <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Payment History</h2>
                <p className="text-sm font-normal text-white/60">Comprehensive audit of all online institutional transactions.</p>
              </div>
            </div>
            <PaymentHistoryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />
          </div>
        );
      case 71:
        return <FeesCollectionManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />;
      case 23: // Leave request
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 space-y-4">
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
              </div>
            </div>
          </div>
        );
      case 201: // Online Payments
        return <PaymentSettingsManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid || ''} />;
      case 99:
        return <TrashManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />;

      default:
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Welcome Banner / Head Info */}
            <div className="relative bg-[#5D5fb1] rounded-[3.5rem] p-12 overflow-hidden shadow-2xl border-b-8 border-[#00a5a5]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00a5a5]/10 rounded-full -ml-32 -mb-32 blur-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">


                <div className="text-center md:text-left space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-black text-[13px] font-normal capitalize tracking-tight">
                    <Award size={14} className="text-[#00a5a5]" /> Academic Session 2026-27
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter leading-none capitalize">
                    Welcome, {String(collegeData?.name || 'MIT College').toUpperCase()}
                  </h2>
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-white/60">
                      <Zap size={16} className="text-[#00a5a5]" />
                      <span className="text-sm font-normal tracking-tight">Institutional ID: {collegeData?.collegeId || 'PENDING'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar size={16} className="text-[#00a5a5]" />
                      <span className="text-sm font-normal tracking-tight">System Status: <span className="text-[#00a5a5]">VERIFIED</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={Users} label="Total Staff" value={staffList.length.toString()} color="text-blue-500" onClick={() => router.push('?tab=3&sub=31')} />
              <StatCard icon={GraduationCap} label="Total Students" value={studentList.length.toLocaleString()} color="text-purple-500" onClick={() => router.push('?tab=2&sub=25')} />
              <StatCard icon={BookOpen} label="Active Courses" value={courses.length.toString()} color="text-emerald-500" onClick={() => router.push('?tab=4&sub=41')} />
              <StatCard icon={Clock} label="Pending Admission" value={inquiries.filter((i: any) => i.status === 'Pending').length.toString().padStart(2, '0')} color="text-amber-500" onClick={() => router.push('?tab=2&sub=1024')} />
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800 capitalize tracking-tight">Recent Activity</h3>
                  <button className="text-[13px] font-normal text-black capitalize tracking-tight hover:underline">View All Logs</button>
                </div>
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-200 group cursor-pointer hover:bg-white hover:shadow-lg transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#5D5fb1] transition-colors">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-normal text-black">New Staff Registration Request</p>
                          <p className="text-[13px] text-black font-medium">Applied for Electrical Department Ã¢â‚¬Â¢ 2 hours ago</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-[#00a5a5] transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#00a5a5] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter leading-tight capitalize">Technical<br />Assistance</h3>
                  <p className="text-sm font-normal text-white/70 leading-relaxed">
                    Need help managing your institutional portal? Our support board is available 24/7 for technical synchronization.
                  </p>
                </div>
                <button className="relative z-10 w-full bg-white text-[#00a5a5] font-black py-4 rounded-2xl text-[11px] capitalize tracking-tight shadow-xl hover:bg-[#5D5fb1] hover:text-white transition-all active:scale-95">
                  Contact Support Board
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <div className="w-20 h-20 border-4 border-t-[#5D5fb1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-black font-normal capitalize tracking-normal text-[13px]">
          Initializing College Session
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {renderTabContent()}


    </div>
  );
}


const SettingManageModal = ({
  isOpen, onClose, title, value, setValue, onAdd, items, isAdding, path,
  handleDeleteSetting, editingItemId, setEditingItemId, editValue, setEditValue, handleEditSetting
}: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#002147]/40 backdrop-blur-sm" onClick={() => !isAdding && onClose()} />
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="p-8 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-black text-slate-800 capitalize tracking-tight">MANAGE {title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex gap-3">
            <input
              required
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter new...`}
              className="flex-1 bg-slate-50 border border-indigo-50 rounded-2xl px-6 py-4 text-sm font-normal text-black outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            <button
              onClick={onAdd}
              disabled={isAdding}
              className="bg-indigo-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-lg hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
            >{isAdding ? '...' : 'SUBMIT'}</button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-200 group hover:bg-white hover:shadow-md transition-all">
                {editingItemId === item.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-2 text-sm font-normal"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <button onClick={() => handleEditSetting(path, item.id, editValue)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Save size={16} /></button>
                    <button onClick={() => setEditingItemId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-normal text-black capitalize tracking-tight">{item.name}</span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingItemId(item.id); setEditValue(item.name); }}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                      ><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteSetting(path, item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && <div className="text-center py-10"><p className="text-[13px] font-normal text-black capitalize tracking-tight">No entries found</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) => (
  <div className="space-y-1.5">
    <label className="text-[13px] font-normal text-black capitalize tracking-tight ml-1">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#895AF6] focus:bg-white transition-all shadow-sm disabled:bg-slate-50 disabled:text-black"
    />
  </div>
);

export default function CollegeDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading College Portal...</div>}>
      <DashboardContent />
    </Suspense>
  );
}





