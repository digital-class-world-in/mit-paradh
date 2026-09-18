'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { staffAuth, realtimeDb, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue, set, push } from 'firebase/database';
import StaffHeader from '@/components/StaffHeader';
import {
  Settings,
  Plus,
  Save,
  Edit2,
  Trash2,
  Search,
  User,
  Users,
  GraduationCap,
  ShieldCheck,
  Zap,
  FileText,
  TrendingUp,
  Building2,
  ChevronDown,
  ChevronRight,
  Settings2,
  Book,
  BookOpen,
  Timer,
  Clock,
  Award as AwardIcon,
  Briefcase,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

import StudentAdmissionManager from '@/components/StudentAdmissionManager';
import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import TrashManager from '@/components/TrashManager';
import StudentIdCardManager from '@/components/StudentIdCardManager';
import ExamManager from '@/components/ExamManager';
import CertificateManager from '@/components/CertificateManager';
import CredentialManager from '@/components/CredentialManager';
import ContactEnquiriesManager from '@/components/ContactEnquiriesManager';
import FeesCollectionManager from '@/components/FeesCollectionManager';
import PaymentHistoryManager from '@/components/PaymentHistoryManager';
import StudentRegistrationManager from '@/components/StudentRegistrationManager';
import PaymentSettingsManager from '@/components/PaymentSettingsManager';
import ExamFormManager from '@/components/ExamFormManager';
import ExamFeesManager from '@/components/ExamFeesManager';

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


function StaffDashboardContent() {
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('sub') || searchParams.get('tab') || '1');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "MIT PARADH | Staff Pannel";
      const currentTab = searchParams.get('sub') || searchParams.get('tab');
      if (currentTab) {
        localStorage.setItem('staff_active_tab', currentTab);
      } else {
        const savedTab = localStorage.getItem('staff_active_tab');
        if (savedTab && savedTab !== '1') {
          router.replace(`${pathname}?tab=${savedTab}`);
        }
      }
    }
  }, [pathname, searchParams, router]);

  // Student & Course States
  const [studentList, setStudentList] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState<any>({
    studentId: '', firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '',
    courseId: '', courseType: '', address: '', aadharNumber: '', photo: null, password: ''
  });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [customCourseTypes, setCustomCourseTypes] = useState<any[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterAffiliate, setFilterAffiliate] = useState('');

  // Course Management State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseType, setCourseType] = useState('');
  const [duration, setDuration] = useState('');
  const [fees, setFees] = useState('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');

  // Custom Course Types State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);


  useEffect(() => {
    let isMounted = true;
    // Listen for college-specific data if staff is linked to a college
    let staffUnsubscribe: any;
    let studentUnsubscribe: any;
    let courseUnsubscribe: any;
    let typeUnsubscribe: any;

    let inqUnsubscribe: any;

    const setupListeners = (collegeId: string) => {
      const studentRef = ref(realtimeDb, `colleges/${collegeId}/students`);
      const admissionsRef = ref(realtimeDb, `colleges/${collegeId}/studentAdmissions`);

      let lastStusSnap: any = null;
      let lastAdmsSnap: any = null;

      const updateStudentList = () => {
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

      const unsubStus = onValue(studentRef, (snapshot) => {
        lastStusSnap = snapshot;
        updateStudentList();
      });
      const unsubAdms = onValue(admissionsRef, (snapshot) => {
        lastAdmsSnap = snapshot;
        updateStudentList();
      });
      studentUnsubscribe = () => { unsubStus(); unsubAdms(); };

      const courseRef = ref(realtimeDb, `colleges/${collegeId}/courses`);
      courseUnsubscribe = onValue(courseRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : {};
        const list = Object.entries(data).map(([id, val]: any) => {
          const course_name = val.course_name || val.name || '';
          const course_type = val.course_type || val.type || val['course type'] || '';
          const duration = val.duration || '';
          const fees = val.fees || val.price || '';
          const affiliate_id = val.affiliate_id || val.affiliateId || '';
          return {
            id,
            ...val,
            name: course_name,
            course_name,
            type: course_type,
            course_type,
            'course type': course_type,
            duration,
            fees,
            price: fees,
            affiliate_id,
            affiliateId: affiliate_id,
            collegeId: collegeId,
            source: 'College',
            collegeName: staffData?.collegeName || 'My College'
          };
        }).sort((a, b) =>
          new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime() - new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime()
        );
        setCourses(list);
      });

      const typeRef = ref(realtimeDb, `colleges/${collegeId}/settings/courseTypes`);
      typeUnsubscribe = onValue(typeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCustomCourseTypes(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setCustomCourseTypes([]);
        }
      });

      const inqRef = ref(realtimeDb, `colleges/${collegeId}/frontOffice/admissionInquiries`);
      const unsubInq = onValue(inqRef, (snap) => {
        if (snap.exists()) {
          setInquiries(Object.values(snap.val()));
        } else {
          setInquiries([]);
        }
      });
      return unsubInq;
    };

    const unsubscribe = onAuthStateChanged(staffAuth, async (user) => {
      if (!isMounted) return;

      if (user) {
        const staffRef = ref(realtimeDb, 'staff/' + user.uid);
        staffUnsubscribe = onValue(staffRef, async (snapshot) => {
          if (!isMounted) return;
          if (snapshot.exists()) {
            const data = snapshot.val();
            setStaffData({ ...data, id: user.uid });
            if (data.collegeId) {
              inqUnsubscribe = setupListeners(data.collegeId);
              setSelectedCollegeId(data.collegeId);
            }
            setLoading(false);
          } else {
            // Fallback to users collection
            const userRef = ref(realtimeDb, 'users/' + user.uid);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
              const data = userSnap.val();
              setStaffData({ ...data, id: user.uid });
              if (data.collegeId) {
                setupListeners(data.collegeId);
                setSelectedCollegeId(data.collegeId);
              }
            } else {
              setStaffData({ firstName: 'Staff Member', email: user.email, id: user.uid });
            }
            setLoading(false);
          }
        });

        // Fetch all colleges for the dropdown
        const collegesRef = ref(realtimeDb, 'colleges');
        const unsubColleges = onValue(collegesRef, (snap) => {
          if (snap.exists()) {
            setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
          }
        });
        return () => {
          if (staffUnsubscribe) staffUnsubscribe();
          unsubColleges();
        };
      } else {
        // Check for Master Bypass
        const isMaster = typeof window !== 'undefined' && sessionStorage.getItem('isStaffMaster') === 'true';
        if (isMaster) {
          setStaffData({
            firstName: 'Master',
            lastName: 'Staff',
            email: 'staff@mitparadh.com',
            role: 'staff',
            permissions: { '1': true, '2': true, '21': true, '25': true, '3': true, '4': true, '5': true, '90': true, '91': true, '99': true } // Give full access
          });
          setLoading(false);
          return;
        }
        if (!staffAuth.currentUser && !sessionStorage.getItem('isStaffMaster')) {
          router.push('/login/staff');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (staffUnsubscribe) staffUnsubscribe();
      if (studentUnsubscribe) studentUnsubscribe();
      if (courseUnsubscribe) courseUnsubscribe();
      if (typeUnsubscribe) typeUnsubscribe();
      if (inqUnsubscribe) inqUnsubscribe();
    };

  }, [router]);

  const handleAddCustomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !staffData?.collegeId) return;

    setIsAddingType(true);
    try {
      const typesRef = ref(realtimeDb, `colleges/${staffData.collegeId}/settings/courseTypes`);
      const newTypeRef = push(typesRef);
      await set(newTypeRef, { name: newTypeName.trim() });
      setNewTypeName('');
    } catch (error) {
      console.error("Error adding type:", error);
    } finally {
      setIsAddingType(false);
    }
  };

  const handleDeleteCustomType = async (typeId: string) => {
    if (!confirm("Are you sure you want to delete this course type?") || !staffData?.collegeId) return;
    try {
      const typeRef = ref(realtimeDb, `colleges/${staffData.collegeId}/settings/courseTypes/${typeId}`);
      await set(typeRef, null);
    } catch (error) {
      console.error("Error deleting type:", error);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    // Default to staff's own college if not selected (though we're removing the selector)
    const collegeIdToUse = selectedCollegeId || staffData?.collegeId;

    if (!collegeIdToUse) {
      alert("Institutional context missing.");
      return;
    }
    setIsSubmittingCourse(true);
    try {
      const existingCourse = courses.find(c => c.id === editingCourseId);
      const courseData = {
        ...(existingCourse || {}),
        name: courseName.trim(),
        course_name: courseName.trim(),
        type: courseType,
        course_type: courseType,
        'course type': courseType,
        duration: duration,
        fees: fees,
        price: fees,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(editingCourseId ? {} : {
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
      };

      if (editingCourseId) {
        const path = selectedCollegeId === 'global' ? `courses/${editingCourseId}` : `colleges/${collegeIdToUse}/courses/${editingCourseId}`;
        await set(ref(realtimeDb, path), courseData);
      } else {
        const path = selectedCollegeId === 'global' ? `courses` : `colleges/${collegeIdToUse}/courses`;
        const newCourseRef = push(ref(realtimeDb, path));
        await set(newCourseRef, courseData);
      }

      setCourseName('');
      setCourseType('');
      setDuration('');
      setFees('');
      setEditingCourseId(null);
      setIsCourseModalOpen(false);
      alert(editingCourseId ? 'Course updated successfully!' : 'Course added successfully!');
    } catch (err: any) {
      console.error(err);
      alert("Failed to save course: " + err.message);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setSelectedCollegeId(course.collegeId || '');
    setCourseName(course.name || course.course_name || '');
    setCourseType(course.type || course.course_type || course['course type'] || '');
    setDuration(course.duration || '');
    setFees(course.fees || course.price || '');
    setIsCourseModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Delete this course?")) return;
    const course = courses.find(c => c.id === courseId);
    try {
      const path = course?.source === 'College'
        ? `colleges/${course.collegeId}/courses/${courseId}`
        : `courses/${courseId}`;
      await set(ref(realtimeDb, path), null);
      alert("Course removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete course.");
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('isStaffMaster');
    await signOut(staffAuth);
    router.push('/login/staff');
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `STU-${year}-${random}`;
  };

  const handleEditStudentClick = (student: any) => {
    setEditingStudentId(student.id);
    setStudentForm({
      ...student,
      password: '' // Keep password blank when editing
    });
    setIsAddStudentModalOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!staffData?.collegeId) return;
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        const studentRef = ref(realtimeDb, `colleges/${staffData.collegeId}/students/${id}`);
        await set(studentRef, null);
        alert('Student deleted successfully');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student');
      }
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffData?.collegeId) return;
    setIsSubmittingStudent(true);

    try {
      const studentIdToUse = editingStudentId || push(ref(realtimeDb, `colleges/${staffData.collegeId}/students`)).key;
      if (!studentIdToUse) throw new Error("Failed to generate student ID");

      const finalData = {
        ...studentForm,
        id: studentIdToUse,
        updatedAt: new Date().toISOString(),
        collegeId: staffData.collegeId
      };

      if (!editingStudentId) {
        finalData.createdAt = new Date().toISOString();
        if (!finalData.studentId) finalData.studentId = generateStudentId();
      }

      await set(ref(realtimeDb, `colleges/${staffData.collegeId}/students/${studentIdToUse}`), finalData);

      setIsAddStudentModalOpen(false);
      setEditingStudentId(null);
      setStudentForm({
        studentId: '', firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '',
        courseId: '', courseType: '', address: '', aadharNumber: '', photo: null, password: ''
      });
      alert(editingStudentId ? 'Student updated successfully' : 'Student registered successfully');
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert('Failed to save student: ' + error.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };


  const setActiveTab = (tab: number, sub?: number, tabName?: string, subName?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab.toString());
    if (tabName) params.set('name', tabName.toLowerCase().replace(/\s+/g, '-'));

    if (sub) {
      params.set('sub', sub.toString());
      if (subName) params.set('subName', subName.toLowerCase().replace(/\s+/g, '-'));
    } else {
      params.delete('sub');
      params.delete('subName');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (loading || !staffData) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <div className="w-20 h-20 border-4 border-t-[#5D5fb1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-black font-normal capitalize tracking-normal text-[13px]">
          Initializing Staff Session
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StaffHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        staffName={staffData?.firstName || 'Staff'}
        collegeLogo={availableColleges.find(c => c.id === staffData?.collegeId)?.logo || availableColleges.find(c => c.id === staffData?.collegeId)?.headPhoto}
        collegeName={availableColleges.find(c => c.id === staffData?.collegeId)?.name}
        permissions={staffData?.permissions}
      />

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <main className="p-3 sm:p-6 md:p-8 lg:p-10 pt-20 sm:pt-24 md:pt-28 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Module Content Switcher */}
          {activeTab === 201 ? (
            <PaymentSettingsManager collegeId={staffData?.collegeId || ''} />
          ) : activeTab === 41 ? (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="relative bg-[#002147] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 overflow-hidden shadow-2xl border-b-8 border-[#00a5a5]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs sm:text-[13px] font-normal capitalize tracking-tight">
                      <BookOpen size={14} /> Institutional Catalog
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter capitalize leading-tight">Course Registry</h2>
                    <p className="text-white/70 font-normal text-xs sm:text-sm md:text-base max-w-xl">View and search through available academic programs and their details.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCourseId(null);
                      setCourseName('');
                      setCourseType('');
                      setDuration('');
                      setFees('');
                      setIsCourseModalOpen(true);
                    }}
                    className="relative z-10 bg-[#00a5a5] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold capitalize tracking-tight shadow-xl hover:bg-white hover:text-[#002147] transition-all flex items-center gap-2.5 active:scale-95 shrink-0"
                  >
                    <Plus size={18} strokeWidth={2.5} /> Add New Course
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Course Name</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Course Type</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-xs sm:text-sm font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {Array.from(new Set(courses.map(c => c.type || c.course_type).filter(Boolean))).sort().map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Duration</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-xs sm:text-sm font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
                    value={filterDuration}
                    onChange={(e) => setFilterDuration(e.target.value)}
                  >
                    <option value="">All Durations</option>
                    {Array.from(new Set(courses.map(c => c.duration).filter(Boolean))).sort().map(dur => (
                      <option key={dur} value={dur}>{dur}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Affiliate ID</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3.5 text-xs sm:text-sm font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
                    value={filterAffiliate}
                    onChange={(e) => setFilterAffiliate(e.target.value)}
                  >
                    <option value="">All Affiliate IDs</option>
                    {Array.from(new Set(courses.map(c => c.affiliate_id || c.affiliateId).filter(Boolean))).sort().map(aff => (
                      <option key={aff} value={aff}>{aff}</option>
                    ))}
                  </select>
                </div>
                <div className="pb-1">
                  <button
                    onClick={() => { setFilterName(''); setFilterType(''); setFilterDuration(''); setFilterAffiliate(''); }}
                    className="text-xs sm:text-[13px] font-semibold text-rose-500 capitalize tracking-tight hover:underline"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {courses.length > 0 ? (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-3 sm:p-6 md:p-8">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse border border-slate-200 min-w-[650px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 whitespace-nowrap">
                          <th className="px-4 sm:px-6 py-4 text-xs sm:text-[14px] font-semibold text-black capitalize tracking-tight border-r border-slate-200 text-center">Sr.No</th>
                          <th className="px-4 sm:px-6 py-4 text-xs sm:text-[14px] font-semibold text-black capitalize tracking-tight border-r border-slate-200">Course Name</th>
                          <th className="px-4 sm:px-6 py-4 text-xs sm:text-[14px] font-semibold text-black capitalize tracking-tight text-center border-r border-slate-200">Type</th>
                          <th className="px-4 sm:px-6 py-4 text-xs sm:text-[14px] font-semibold text-black capitalize tracking-tight text-center border-r border-slate-200">Duration</th>
                          <th className="px-4 sm:px-6 py-4 text-xs sm:text-[14px] font-semibold text-black capitalize tracking-tight text-center border-r border-slate-200">Fees</th>
                          <th className="px-4 sm:px-6 py-4 text-xs sm:text-[14px] font-semibold text-black capitalize tracking-tight text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="border-b border-slate-200">
                        {courses.filter(c => {
                          const matchesName = c.name.toLowerCase().includes(filterName.toLowerCase());
                          const matchesType = !filterType || (c.type && c.type === filterType) || (c.course_type && c.course_type === filterType);
                          const matchesDuration = !filterDuration || (c.duration && c.duration === filterDuration);
                          const matchesAffiliate = !filterAffiliate || (c.affiliate_id && c.affiliate_id === filterAffiliate) || (c.affiliateId && c.affiliateId === filterAffiliate);
                          return matchesName && matchesType && matchesDuration && matchesAffiliate;
                        }).map((course, idx) => (
                          <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-200">
                            <td className="px-4 sm:px-6 py-4 sm:py-5 border-r border-slate-200 text-center">
                              <span className="text-sm sm:text-[16px] font-medium text-black">{idx + 1}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 border-r border-slate-200">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00a5a5] shrink-0 border border-slate-200">
                                  <Book size={16} />
                                </div>
                                <span className="text-sm sm:text-[16px] font-medium text-black capitalize tracking-tight">{course.name}</span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-center border-r border-slate-200">
                              <span className="px-2.5 sm:px-4 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs sm:text-[14px] font-bold capitalize tracking-tight border border-indigo-100 whitespace-nowrap">
                                {course.type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-center border-r border-slate-200">
                              <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold text-xs sm:text-[14px] whitespace-nowrap">
                                <Timer size={14} className="text-[#00a5a5]" /> {course.duration || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 text-center font-medium text-black text-sm sm:text-[16px] border-r border-slate-200 whitespace-nowrap">
                              {course.fees ? `₹${course.fees}` : '—'}
                            </td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-[#5D5fb1] hover:text-white transition-all shadow-sm border border-slate-200"
                                  title="Edit Course"
                                ><Edit2 size={14} /></button>
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200"
                                  title="Delete Course"
                                ><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-14 md:p-20 text-center">
                  <div className="flex flex-col items-center gap-4 sm:gap-6 text-slate-300">
                    <BookOpen size={60} className="opacity-10 sm:size-[80px]" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold tracking-normal capitalize text-black">No Courses Registry Found</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">Courses will appear here once they are registered by the administration.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 1 ? (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
              {/* Welcome Banner */}
              <div className="relative bg-[#002147] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 overflow-hidden shadow-2xl border-b-8 border-[#00a5a5]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-4 sm:space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs sm:text-[13px] font-normal capitalize tracking-tight">
                    <AwardIcon size={14} className="text-[#00a5a5]" /> Institutional Staff Dashboard
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter capitalize leading-tight">
                      WELCOME, {String(staffData?.firstName || '').toUpperCase()} {String(staffData?.lastName || '').toUpperCase()}
                    </h2>
                    <p className="text-white/70 font-normal text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
                      Your professional portal for managing academic workflows, tracking student progress, and coordinating with the institution.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 sm:pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-[13px] font-normal text-white/60 capitalize tracking-tight">Department</span>
                      <span className="text-sm sm:text-base md:text-lg font-bold text-white capitalize tracking-tight">{staffData?.department || 'General'}</span>
                    </div>
                    <div className="w-px h-8 bg-white/15" />
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-[13px] font-normal text-white/60 capitalize tracking-tight">Designation</span>
                      <span className="text-sm sm:text-base md:text-lg font-bold text-white capitalize tracking-tight">{staffData?.designation || 'Faculty'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: 'Total Students', value: studentList.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', onClick: () => router.push('?tab=21') },
                  { label: 'Active Courses', value: courses.length.toString(), icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50', onClick: () => router.push('?tab=41') },
                  { label: 'Pending Admissions', value: inquiries.filter(i => i.status === 'Accepted').length.toString(), icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50', onClick: () => router.push('?tab=22') },
                  { label: 'Admission Inquiry', value: inquiries.filter(i => !i.status || i.status === 'Pending').length.toString(), icon: FileText, color: 'text-red-500', bg: 'bg-red-50', onClick: () => router.push('?tab=91') },
                ].map((stat, i) => (
                  <div
                    key={i}
                    onClick={stat.onClick}
                    className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${stat.bg} transition-transform group-hover:scale-110 shrink-0`}>
                        <stat.icon size={22} className={stat.color} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-[13px] font-medium text-slate-500 capitalize tracking-tight mb-0.5">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions / Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 md:p-10">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-black text-slate-800 capitalize tracking-tight">Recent Academic Activity</h3>
                    <button className="text-xs sm:text-[13px] font-semibold text-[#00a5a5] capitalize tracking-tight hover:underline">View All</button>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 sm:gap-6 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50/50 border border-slate-200 hover:bg-white hover:shadow-md transition-all group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#002147] font-bold text-xs sm:text-sm group-hover:bg-[#002147] group-hover:text-white transition-all shrink-0">0{i}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">Course material synchronization completed for Batch-A</p>
                          <p className="text-[11px] sm:text-[13px] text-slate-500 font-normal capitalize tracking-tight mt-0.5">2 hours ago • Academic Records</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center text-[#00a5a5] shadow-inner">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-800 capitalize tracking-tight">Profile Completeness</h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Ensure your institutional profile is up to date.</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#00a5a5] h-full w-[85%]" />
                  </div>
                  <p className="text-xs sm:text-[13px] font-semibold text-slate-600 capitalize tracking-tight">85% Completed</p>
                  <button className="w-full bg-[#002147] text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold capitalize tracking-tight shadow-md hover:bg-black transition-all active:scale-95">Update Profile</button>
                </div>
              </div>
            </div>
          ) : activeTab === 25 ? (
            <StudentAdmissionManager collegeId={staffData?.collegeId} />
          ) : activeTab === 19 ? (
            <StudentRegistrationManager collegeId={staffData?.collegeId} />
          ) : activeTab === 94 ? (
            <ContactEnquiriesManager />
          ) : activeTab === 91 ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="inquiry" />
          ) : (activeTab === 22 || activeTab === 2022) ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="list" />
          ) : activeTab === 23 ? (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="bg-[#5D5fb1] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
                    <Clock size={14} className="text-[#00a5a5]" /> Student Services
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize leading-tight">Leave Request</h2>
                  <p className="text-xs sm:text-sm font-normal text-white/70">Manage and track student leave applications.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-14 md:p-20 text-center">
                <div className="flex flex-col items-center gap-4 sm:gap-6 text-slate-300">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
                    <Clock size={36} className="opacity-30 text-slate-400" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold tracking-normal capitalize text-black">Leave Request Module</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">The leave management system is being configured for automated processing.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 202 ? (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
              <div className="bg-[#5D5fb1] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
                    <Clock size={14} className="text-[#00a5a5]" /> Financial Records
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize leading-tight">Payment History</h2>
                  <p className="text-xs sm:text-sm font-normal text-white/70">View and audit all online fee transactions.</p>
                </div>
              </div>
              <PaymentHistoryManager collegeId={staffData?.collegeId} />
            </div>
          ) : activeTab === 21 ? (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="bg-[#5D5fb1] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
                      <Users size={14} className="text-[#00a5a5]" /> Registered Students
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize leading-tight">Student Directory</h2>
                    <p className="text-xs sm:text-sm font-normal text-white/70">Manage existing student credentials and profiles.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStudentId(null);
                      setStudentForm({
                        studentId: `STU${Date.now().toString().slice(-6)}`,
                        firstName: '', lastName: '', email: '', phone: '', gender: '', dob: '',
                        courseId: '', courseType: '', address: '', aadharNumber: '', photo: null, password: ''
                      });
                      setIsAddStudentModalOpen(true);
                    }}
                    className="bg-[#00a5a5] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold capitalize tracking-tight hover:bg-white hover:text-[#5D5fb1] transition-all shadow-xl active:scale-95 shrink-0"
                  >
                    Register New Student
                  </button>
                </div>
              </div>
              {/* Search & Filter */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-4 sm:px-6 py-3.5 text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight">Student Info</th>
                        <th className="px-4 sm:px-6 py-3.5 text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight">Course</th>
                        <th className="px-4 sm:px-6 py-3.5 text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight text-center">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentList.filter(s => (s.firstName + ' ' + s.lastName).toLowerCase().includes(filterName.toLowerCase())).map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User size={18} />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-black capitalize truncate">{student.firstName} {student.lastName}</p>
                                <p className="text-[11px] sm:text-[13px] font-normal text-slate-500 truncate">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <p className="text-xs font-normal text-slate-700 capitalize">{student.courseId || 'N/A'}</p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => { setEditingStudentId(student.id); setStudentForm(student); setIsAddStudentModalOpen(true); }} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#5D5fb1] hover:text-white transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => { }} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 19 ? (
            <StudentRegistrationManager collegeId={staffData?.collegeId} />
          ) : activeTab === 94 ? (
            <ContactEnquiriesManager />
          ) : activeTab === 91 ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="inquiry" />
          ) : activeTab === 1022 || activeTab === 2022 ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="list" />
          ) : activeTab === 1024 ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="pending" />
          ) : activeTab === 1023 ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="cancelled" />
          ) : activeTab === 25 ? (
            <StudentAdmissionManager collegeId={staffData?.collegeId} />
          ) : activeTab === 26 ? (
            <StudentIdCardManager studentList={studentList} />
          ) : activeTab === 99 ? (
            <TrashManager collegeId={staffData?.collegeId} />
          ) : activeTab === 71 ? (
            <FeesCollectionManager collegeId={staffData?.collegeId} />
          ) : activeTab === 61 ? (
            <ExamManager collegeId={staffData?.collegeId} />
          ) : activeTab === 62 ? (
            <ExamFormManager collegeId={staffData?.collegeId} />
          ) : activeTab === 63 ? (
            <ExamFeesManager collegeId={staffData?.collegeId} />
          ) : (activeTab === 80 || activeTab === 81) ? (
            <CertificateManager collegeId={staffData?.collegeId} />
          ) : activeTab === 83 ? (
            <CredentialManager collegeId={staffData?.collegeId} type="marksheet" />
          ) : activeTab === 84 ? (
            <CredentialManager collegeId={staffData?.collegeId} type="certificate" />
          ) : activeTab === 24 ? (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter capitalize leading-tight">Admission Reports</h2>
                  <p className="text-xs sm:text-[13px] font-normal text-slate-600 capitalize tracking-normal flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#00a5a5]" /> Data Analytics & Insights
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {[
                  { label: 'Total Enrollment', value: studentList.length.toString(), trend: '+12%', color: 'text-indigo-500' },
                  { label: 'New Admissions', value: '24', trend: '+5%', color: 'text-teal-500' },
                  { label: 'Pending Inquiry', value: '08', trend: '-2%', color: 'text-amber-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden group">
                    <div className="relative z-10 space-y-2 sm:space-y-4">
                      <p className="text-xs sm:text-[13px] font-medium text-slate-500 capitalize tracking-normal">{stat.label}</p>
                      <div className="flex items-end gap-3">
                        <h4 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{stat.value}</h4>
                        <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} mb-1`}>{stat.trend}</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 shadow-lg border border-slate-200 text-center space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-slate-400 mx-auto">
                  <TrendingUp size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-800 capitalize tracking-tight">Advanced Analytics Processing</h3>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">We are currently synthesizing institutional data to generate comprehensive enrollment heatmaps and course popularity indexes.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500 py-16">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center text-slate-400">
                <Settings size={48} className="animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="text-center px-4">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 capitalize tracking-tight">Module Under Synchronization</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-2">We are currently linking this module with the master college database. Please check back shortly.</p>
              </div>
            </div>
          )}

        </main>

        {/* Add Student Modal */}
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingStudent && setIsAddStudentModalOpen(false)} />
            <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-[#5D5fb1] p-5 sm:p-8 text-white shrink-0 relative">
                <button
                  onClick={() => {
                    setIsAddStudentModalOpen(false);
                    setEditingStudentId(null);
                  }}
                  className="absolute right-4 sm:right-6 top-5 sm:top-6 w-9 h-9 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter capitalize leading-tight">{editingStudentId ? 'Edit Student Data' : 'Register Student'}</h3>
                <p className="text-xs sm:text-[13px] font-normal text-white/80 capitalize tracking-normal mt-1">{editingStudentId ? 'Modify institutional enrollment records' : 'Initialize a new student profile'}</p>
              </div>

              {/* Modal Content - Scrollable */}
              <form id="student-form" onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 no-scrollbar">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  <div className="relative group">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-[2rem] bg-slate-50 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                      {studentForm.photo ? (
                        <img src={studentForm.photo} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <User size={36} className="text-slate-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-[#00a5a5] text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all">
                      <Plus size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileRef = storageRef(storage, `staff_students/${Date.now()}_${file.name}`);
                          const uploadTask = uploadBytesResumable(fileRef, file);
                          uploadTask.on('state_changed', null, 
                            (error) => { console.error('Upload failed', error); alert('Failed to upload image'); },
                            async () => {
                              const url = await getDownloadURL(uploadTask.snapshot.ref);
                              setStudentForm({ ...studentForm, photo: url });
                            }
                          );
                        }
                      }} />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-semibold text-black tracking-tight">Student Photo</p>
                    <p className="text-[11px] sm:text-xs font-normal text-slate-500 capitalize tracking-tight">Institutional Profile Picture</p>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Student ID <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none"
                      value={studentForm.studentId}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">First Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Last Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Gender</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Aadhar Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.aadharNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, aadharNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Course Enrollment</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.courseId}
                      onChange={(e) => setStudentForm({ ...studentForm, courseId: e.target.value })}
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Course Type</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.courseType}
                      onChange={(e) => setStudentForm({ ...studentForm, courseType: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      {customCourseTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Mobile Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Full Address</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  ></textarea>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-5 bg-[#00a5a5] rounded-full" />
                    <h3 className="text-base sm:text-lg font-bold text-[#00a5a5] capitalize tracking-tight">Login Credentials</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Email (Login ID) <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Login Password {!editingStudentId ? <span className="text-red-500">*</span> : <span className="text-slate-400 normal-case ml-1 text-xs">(Leave blank to keep unchanged)</span>}</label>
                      <div className="relative">
                        <input
                          type={showStudentPassword ? 'text' : 'password'}
                          placeholder={editingStudentId ? "••••••••" : ""}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm pr-12"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00a5a5] transition-colors"
                        >
                          {showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  type="submit"
                  form="student-form"
                  disabled={isSubmittingStudent}
                  className="w-full sm:w-auto bg-[#5D5fb1] text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold capitalize tracking-normal shadow-xl hover:bg-[#00a5a5] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingStudent ? 'Processing...' : <>{editingStudentId ? <Edit2 size={16} /> : <Save size={16} />} {editingStudentId ? 'Update Student' : 'Submit Registration'}</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Course Modal */}
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingCourse && setIsCourseModalOpen(false)} />

            <div className="bg-white w-full max-w-xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-[#5D5fb1] p-5 sm:p-8 text-white relative shrink-0">
                <button
                  onClick={() => setIsCourseModalOpen(false)}
                  className="absolute right-4 sm:right-6 top-4 sm:top-6 text-white/60 hover:text-white transition-colors"
                  disabled={isSubmittingCourse}
                >
                  <X size={24} />
                </button>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#00a5a5] rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                  {editingCourseId ? <Edit2 size={24} /> : <BookOpen size={24} />}
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tighter capitalize leading-tight">{editingCourseId ? 'Update Course' : 'Register Course'}</h3>
                <p className="text-xs sm:text-[13px] font-normal text-white/80 capitalize tracking-normal mt-1">{editingCourseId ? 'Modify existing program credentials' : 'Add a new program to your institutional catalog'}</p>
              </div>

              <form onSubmit={handleSaveCourse} id="course-form" className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 no-scrollbar">
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Course Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      placeholder="e.g., Diploma in Computer Engineering"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between pl-1">
                        <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight">Course Type <span className="text-red-500">*</span></label>
                        <button
                          type="button"
                          onClick={() => setIsTypeModalOpen(true)}
                          className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#00a5a5] capitalize tracking-tight hover:opacity-80 transition-all"
                        >
                          Manage <Settings2 size={12} />
                        </button>
                      </div>
                      <select
                        required
                        value={courseType}
                        onChange={(e) => setCourseType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm cursor-pointer"
                      >
                        <option value="">Select Type</option>
                        {customCourseTypes.map((type) => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Duration <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        placeholder="e.g., 2 Years / 6 Months"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-[13px] font-semibold text-black capitalize tracking-tight pl-1">Course Fees <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      placeholder="e.g., 45000"
                    />
                  </div>
                </div>

                <div className="pt-3 sm:pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingCourse}
                    className="w-full bg-[#002147] text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm capitalize tracking-tight shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingCourse ? 'Processing...' : <><Save size={16} /> {editingCourseId ? 'Update Course' : 'Add New Course'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Course Type Management Modal */}
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTypeModalOpen(false)} />
            <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-indigo-500 p-5 sm:p-6 text-white relative">
                <button onClick={() => setIsTypeModalOpen(false)} className="absolute right-4 sm:right-5 top-4 sm:top-5 text-white/60 hover:text-white transition-colors">
                  <X size={18} />
                </button>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">Course Type Registry</h3>
                <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 uppercase tracking-widest mt-0.5">Institutional Standards</p>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <form onSubmit={handleAddCustomType} className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter new type..."
                    className="flex-1 bg-slate-50 border border-indigo-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal text-black outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isAddingType}
                    className="bg-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold capitalize tracking-tight shadow-md hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isAddingType ? '...' : 'Add'}
                  </button>
                </form>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                  {customCourseTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 group">
                      <span className="text-xs sm:text-sm font-medium text-black">{type.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDeleteCustomType(type.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {customCourseTypes.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 font-medium">No course types found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function StaffDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Initializing Staff Portal...</div>}>
      <StaffDashboardContent />
    </Suspense>
  );
}