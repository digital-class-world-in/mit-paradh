'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { staffAuth, realtimeDb } from '@/lib/firebase';
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
import FeesCollectionManager from '@/components/FeesCollectionManager';
import PaymentHistoryManager from '@/components/PaymentHistoryManager';
import StudentRegistrationManager from '@/components/StudentRegistrationManager';
import PaymentSettingsManager from '@/components/PaymentSettingsManager';
import ExamFormManager from '@/components/ExamFormManager';
import ExamFeesManager from '@/components/ExamFeesManager';


function StaffDashboardContent() {
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('sub') || searchParams.get('tab') || '1');

  const pathname = usePathname();

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
      studentUnsubscribe = onValue(studentRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sortedStudents = Object.entries(data)
            .map(([id, val]: any) => ({ id, ...val }))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setStudentList(sortedStudents);
        } else {
          setStudentList([]);
        }
      });

      const courseRef = ref(realtimeDb, `colleges/${collegeId}/courses`);
      courseUnsubscribe = onValue(courseRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : {};
        const list = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
          collegeId: collegeId,
          source: 'College',
          collegeName: staffData?.collegeName || 'My College'
        })).sort((a, b) => 
          new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime()
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
        router.push('/login/staff');
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
      const courseData = {
        name: courseName.trim(),
        type: courseType,
        duration: duration,
        fees: fees,
        updatedAt: new Date().toISOString(),
        ...(editingCourseId ? {} : { createdAt: new Date().toISOString() })
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
    setCourseName(course.name);
    setCourseType(course.type || '');
    setDuration(course.duration || '');
    setFees(course.fees || '');
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
        collegeLogo={availableColleges.find(c => c.id === staffData?.collegeId)?.logo}
        collegeName={availableColleges.find(c => c.id === staffData?.collegeId)?.name}
        permissions={staffData?.permissions} 
      />
      
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <main className="p-10 pt-32 flex-1">
          {/* Module Content Switcher */}
          {activeTab === 201 ? (
             <PaymentSettingsManager collegeId={staffData?.collegeId || ''} />
          ) : activeTab === 41 ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
               <div className="relative bg-[#002147] rounded-[3.5rem] p-12 overflow-hidden shadow-2xl border-b-8 border-[#00a5a5]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10 space-y-4">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-black text-[13px] font-normal capitalize tracking-tight">
                        <BookOpen size={14} /> Institutional Catalog
                     </div>
                     <h2 className="text-4xl font-black text-white tracking-tighter capitalize leading-none">Course Registry</h2>
                     <p className="text-white/60 font-medium text-lg">View and search through available academic programs and their details.</p>
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
                     className="relative z-10 bg-[#00a5a5] text-white px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-white hover:text-[#002147] transition-all flex items-center gap-3 active:scale-95"
                   >
                      <Plus size={20} strokeWidth={3} /> Add New Course
                   </button>
               </div>

               {/* Filter Bar */}
               <div className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm flex flex-wrap items-center gap-8">
                  <div className="flex-1 min-w-[200px] space-y-2">
                     <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name</label>
                     <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="text" 
                          placeholder="Search by name..." 
                          className="w-full bg-slate-50 border border-black rounded-xl py-3 pl-11 pr-4 text-xs font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                        />
                     </div>
                  </div>
                  <div className="flex-1 min-w-[200px] space-y-2">
                     <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Type</label>
                     <select 
                       className="w-full bg-slate-50 border border-black rounded-xl py-3 px-4 text-xs font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
                       value={filterType}
                       onChange={(e) => setFilterType(e.target.value)}
                     >
                        <option value="">All Types</option>
                        {customCourseTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                     </select>
                  </div>
                  <div className="flex-1 min-w-[200px] space-y-2">
                     <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Duration</label>
                     <input 
                       type="text" 
                       placeholder="e.g. 3 Years" 
                       className="w-full bg-slate-50 border border-black rounded-xl py-3 px-4 text-xs font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                       value={filterDuration}
                       onChange={(e) => setFilterDuration(e.target.value)}
                     />
                  </div>
                  <div className="flex items-end pb-1">
                     <button 
                       onClick={() => { setFilterName(''); setFilterType(''); setFilterDuration(''); }}
                       className="text-[13px] font-normal text-black capitalize tracking-tight hover:underline"
                     >
                        Reset Filters
                     </button>
                  </div>
               </div>

               {courses.length > 0 ? (
                  <div className="bg-white rounded-[3rem] border border-black shadow-sm overflow-hidden p-8">
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left border-collapse border border-black">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-black whitespace-nowrap">
                            <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Sr.No</th>
                            <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Course Name</th>
                            <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Type</th>
                            <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Duration</th>
                            <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Fees</th>
                            <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="border-b border-black">
                         {courses.filter(c => {
                           const matchesName = c.name.toLowerCase().includes(filterName.toLowerCase());
                           const matchesType = !filterType || (c.type && c.type === filterType);
                           const matchesDuration = !filterDuration || (c.duration && c.duration.toLowerCase().includes(filterDuration.toLowerCase()));
                           return matchesName && matchesType && matchesDuration;
                         }).map((course, idx) => (
                           <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                            <td className="px-6 py-6 border-r border-black text-center">
                              <span className="text-[16px] font-medium text-black">{idx + 1}</span>
                            </td>
                            <td className="px-6 py-6 border-r border-black">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00a5a5] shrink-0 border border-black">
                                  <Book size={18} />
                                </div>
                                <span className="text-[16px] font-medium text-black capitalize tracking-tight">{course.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center border-r border-black">
                              <span className="px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[14px] font-bold capitalize tracking-tight border border-indigo-100">
                                {course.type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-center border-r border-black">
                              <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-[14px]">
                                <Timer size={14} className="text-[#00a5a5]" /> {course.duration || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center font-medium text-black text-[16px] border-r border-black">
                               {course.fees ? `₹${course.fees}` : '—'}
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex items-center justify-center gap-2">
                                 <button 
                                   onClick={() => handleEditCourse(course)}
                                   className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#5D5fb1] hover:text-white transition-all shadow-sm border border-slate-200"
                                 ><Edit2 size={14} /></button>
                                 <button 
                                   onClick={() => handleDeleteCourse(course.id)}
                                   className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200"
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
                  <div className="bg-white rounded-[3rem] border border-black shadow-xl p-20 text-center">
                    <div className="flex flex-col items-center gap-6 text-slate-300">
                       <BookOpen size={80} className="opacity-10" />
                       <div className="space-y-2">
                         <p className="text-sm font-normal tracking-normal capitalize text-black">No Courses Registry Found</p>
                         <p className="text-xs text-slate-400 max-w-xs mx-auto">Courses will appear here once they are registered by the administration.</p>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          ) : activeTab === 1 ? (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* Welcome Banner */}
              <div className="relative bg-[#002147] rounded-[3.5rem] p-12 overflow-hidden shadow-2xl border-b-8 border-[#00a5a5]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-black text-[13px] font-normal capitalize tracking-tight">
                    <AwardIcon size={14} /> Institutional Staff Dashboard
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-white tracking-tighter capitalize leading-none">
                      WELCOME, {String(staffData?.firstName || '').toUpperCase()} {String(staffData?.lastName || '').toUpperCase()}
                    </h2>
                    <p className="text-white/60 font-medium text-xl max-w-2xl leading-relaxed">
                      Your professional portal for managing academic workflows, tracking student progress, and coordinating with the institution.
                    </p>
                  </div>
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex flex-col">
                       <span className="text-[13px] font-normal text-black capitalize tracking-tight">Department</span>
                       <span className="text-lg font-bold text-white capitalize tracking-tight">{staffData?.department || 'General'}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col">
                       <span className="text-[13px] font-normal text-black capitalize tracking-tight">Designation</span>
                       <span className="text-lg font-bold text-white capitalize tracking-tight">{staffData?.designation || 'Faculty'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: studentList.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Active Courses', value: courses.length.toString(), icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Pending Admissions', value: inquiries.filter(i => i.status === 'Accepted').length.toString(), icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Admission Inquiry', value: inquiries.filter(i => !i.status || i.status === 'Pending').length.toString(), icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl ${stat.bg} transition-transform group-hover:scale-110`}>
                        <stat.icon size={24} className={stat.color} />
                      </div>
                      <div>
                        <p className="text-[13px] font-normal text-black capitalize tracking-tight mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions / Recent Activity Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black text-slate-800 capitalize tracking-tight">Recent Academic Activity</h3>
                       <button className="text-[13px] font-normal text-black capitalize tracking-tight hover:underline">View All</button>
                    </div>
                    <div className="space-y-6">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-200 hover:bg-white hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#002147] font-bold group-hover:bg-[#002147] group-hover:text-white transition-all">0{i}</div>
                            <div className="flex-1">
                               <p className="text-sm font-normal text-black">Course material synchronization completed for Batch-A</p>
                               <p className="text-[13px] text-black font-medium capitalize tracking-tight mt-1">2 hours ago â€¢ Academic Records</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-[#00a5a5] shadow-inner">
                       <Briefcase size={40} />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-slate-800 capitalize tracking-tight">Profile Completeness</h4>
                       <p className="text-sm text-black font-medium mt-1">Ensure your institutional profile is up to date.</p>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-[#00a5a5] h-full w-[85%]" />
                    </div>
                    <p className="text-[13px] font-normal text-black capitalize tracking-tight">85% Completed</p>
                    <button className="w-full bg-[#002147] text-black py-4 rounded-2xl text-[13px] font-normal capitalize tracking-tight shadow-lg hover:bg-black transition-all">Update Profile</button>
                 </div>
              </div>
            </div>
          ) : activeTab === 25 ? (
            <StudentAdmissionManager collegeId={staffData?.collegeId} />
          ) : activeTab === 19 ? (
            <StudentRegistrationManager collegeId={staffData?.collegeId} />
          ) : activeTab === 91 ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="inquiry" />
          ) : (activeTab === 22 || activeTab === 2022) ? (
            <AdmissionInquiryManager collegeId={staffData?.collegeId} mode="list" />
          ) : activeTab === 23 ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                 <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                       <Clock size={14} className="text-[#00a5a5]" /> Student Services
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Leave Request</h2>
                    <p className="text-sm font-normal text-white/60">Manage and track student leave applications.</p>
                 </div>
              </div>

              <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-xl p-20 text-center">
                 <div className="flex flex-col items-center gap-6 text-slate-300">
                    <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
                       <Clock size={48} className="opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-normal tracking-normal capitalize text-black">Leave Request Module</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">The leave management system is being configured for automated processing.</p>
                    </div>
                 </div>
              </div>
            </div>
          ) : activeTab === 202 ? (
             <div className="space-y-8 animate-in fade-in duration-700">
               <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10 space-y-4">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                        <Clock size={14} className="text-[#00a5a5]" /> Financial Records
                     </div>
                     <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Payment History</h2>
                     <p className="text-sm font-normal text-white/60">View and audit all online fee transactions.</p>
                  </div>
               </div>
               <PaymentHistoryManager collegeId={staffData?.collegeId} />
             </div>
          ) : activeTab === 21 ? (
             <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
               <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
                           <Users size={14} className="text-[#00a5a5]" /> Registered Students
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Student Directory</h2>
                        <p className="text-sm font-normal text-white/60">Manage existing student credentials and profiles.</p>
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
                       className="bg-[#00a5a5] text-white px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight hover:bg-white hover:text-[#5D5fb1] transition-all shadow-xl active:scale-95"
                     >
                       Register New Student
                     </button>
                  </div>
               </div>
               {/* Search & Filter */}
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                     <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="text" 
                          placeholder="Search students..." 
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-6 text-sm font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                        />
                     </div>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-200">
                              <th className="px-6 py-5 text-[13px] font-normal text-black capitalize tracking-tight">Student Info</th>
                              <th className="px-6 py-5 text-[13px] font-normal text-black capitalize tracking-tight">Course</th>
                              <th className="px-6 py-5 text-[13px] font-normal text-black capitalize tracking-tight text-center">Controls</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {studentList.filter(s => (s.firstName + ' ' + s.lastName).toLowerCase().includes(filterName.toLowerCase())).map((student) => (
                              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-6 py-6">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                          {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User size={18} />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-normal text-black capitalize">{student.firstName} {student.lastName}</p>
                                          <p className="text-[13px] font-normal text-black">{student.email}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-6">
                                    <p className="text-xs font-normal text-slate-700 capitalize">{student.courseId || 'N/A'}</p>
                                 </td>
                                 <td className="px-6 py-6">
                                    <div className="flex items-center justify-center gap-2">
                                       <button onClick={() => { setEditingStudentId(student.id); setStudentForm(student); setIsAddStudentModalOpen(true); }} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#5D5fb1] hover:text-white transition-all"><Edit2 size={14} /></button>
                                       <button onClick={() => {}} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
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
            <CertificateManager collegeId={staffData?.collegeId} defaultTab="tc" />
          ) : activeTab === 82 ? (
            <CertificateManager collegeId={staffData?.collegeId} defaultTab="marksheet" />
          ) : activeTab === 83 ? (
            <CertificateManager collegeId={staffData?.collegeId} defaultTab="course" />
          ) : activeTab === 24 ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
               <div className="flex items-center justify-between">
                 <div className="space-y-2">
                   <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize leading-none">Admission Reports</h2>
                   <p className="text-[13px] font-normal text-black capitalize tracking-normal flex items-center gap-2">
                     <TrendingUp size={14} className="text-[#00a5a5]" /> Data Analytics & Insights
                   </p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Total Enrollment', value: studentList.length.toString(), trend: '+12%', color: 'text-indigo-500' },
                    { label: 'New Admissions', value: '24', trend: '+5%', color: 'text-teal-500' },
                    { label: 'Pending Inquiry', value: '08', trend: '-2%', color: 'text-amber-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                       <div className="relative z-10 space-y-4">
                          <p className="text-[13px] font-normal text-black capitalize tracking-normal">{stat.label}</p>
                          <div className="flex items-end gap-3">
                             <h4 className="text-5xl font-black text-slate-800 tracking-tighter">{stat.value}</h4>
                             <span className={`text-xs font-black ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} mb-2`}>{stat.trend}</span>
                          </div>
                       </div>
                       <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
                    </div>
                  ))}
               </div>

               <div className="bg-white rounded-[3.5rem] p-16 shadow-2xl border border-slate-200 text-center space-y-8">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mx-auto">
                     <TrendingUp size={48} />
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-2xl font-black text-slate-800 capitalize tracking-tight">Advanced Analytics Processing</h3>
                     <p className="text-slate-400 font-medium max-w-md mx-auto">We are currently synthesizing institutional data to generate comprehensive enrollment heatmaps and course popularity indexes.</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                  <Settings size={64} className="animate-[spin_10s_linear_infinite]" />
               </div>
               <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-800 capitalize tracking-tighter">Module Under Synchronization</h3>
                  <p className="text-slate-400 font-medium max-w-md mx-auto mt-2">We are currently linking this module with the master college database. Please check back shortly.</p>
               </div>
            </div>
          )}

        </main>

        {/* Add Student Modal */}
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingStudent && setIsAddStudentModalOpen(false)} />
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-[#5D5fb1] p-10 text-white shrink-0 relative">
                <button 
                  onClick={() => {
                    setIsAddStudentModalOpen(false);
                    setEditingStudentId(null);
                  }}
                  className="absolute right-8 top-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
                <h3 className="text-4xl font-black tracking-tighter capitalize leading-none">{editingStudentId ? 'Edit Student Data' : 'Register Student'}</h3>
                <p className="text-[13px] font-normal text-black capitalize tracking-normal mt-3">{editingStudentId ? 'Modify institutional enrollment records' : 'Initialize a new student profile'}</p>
              </div>

              {/* Modal Content - Scrollable */}
              <form id="student-form" onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-4 border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                      {studentForm.photo ? (
                        <img src={studentForm.photo} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-slate-200" />
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 bg-[#00a5a5] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all">
                      <Plus size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setStudentForm({...studentForm, photo: reader.result as string});
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-normal text-black tracking-tight">Student Photo</p>
                    <p className="text-[13px] font-normal text-black capitalize tracking-tight mt-1">Institutional Profile Picture</p>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Student ID <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none"
                      value={studentForm.studentId}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">First Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm({...studentForm, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Last Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm({...studentForm, lastName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Gender</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Date of Birth</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({...studentForm, dob: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Aadhar Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.aadharNumber}
                      onChange={(e) => setStudentForm({...studentForm, aadharNumber: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Enrollment</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.courseId}
                      onChange={(e) => setStudentForm({...studentForm, courseId: e.target.value})}
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Type</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.courseType}
                      onChange={(e) => setStudentForm({...studentForm, courseType: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      {customCourseTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mobile Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Full Address</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({...studentForm, address: e.target.value})}
                  ></textarea>
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#00a5a5] rounded-full" />
                    <h3 className="text-xl font-black text-[#00a5a5] capitalize tracking-tight">Login Credentials</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Email (Login ID) <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="email" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Login Password {!editingStudentId ? <span className="text-red-500">*</span> : <span className="text-slate-400 normal-case ml-1">(Leave blank to keep unchanged)</span>}</label>
                      <div className="relative">
                        <input 
                          type={showStudentPassword ? 'text' : 'password'}
                          placeholder={editingStudentId ? "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" : ""}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm pr-12"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({...studentForm, password: e.target.value})}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#00a5a5] transition-colors"
                        >
                          {showStudentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="p-10 border-t border-slate-200 bg-slate-50/50 flex justify-end shrink-0">
                 <button 
                   type="submit"
                   form="student-form"
                   disabled={isSubmittingStudent}
                   className="bg-[#5D5fb1] text-white px-12 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-2xl hover:bg-[#00a5a5] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                 >
                   {isSubmittingStudent ? 'Processing...' : <>{editingStudentId ? <Edit2 size={20} /> : <Save size={20} />} {editingStudentId ? 'Update' : 'Submit'}</>}
                 </button>
              </div>
            </div>
          </div>
        )}

        {isCourseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingCourse && setIsCourseModalOpen(false)} />
            
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-[#5D5fb1] p-10 text-white relative">
                 <button 
                   onClick={() => setIsCourseModalOpen(false)}
                   className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
                   disabled={isSubmittingCourse}
                 >
                   <X size={32} />
                 </button>
                 <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                    {editingCourseId ? <Edit2 size={32} /> : <BookOpen size={32} />}
                 </div>
                 <h3 className="text-3xl font-black tracking-tighter capitalize">{editingCourseId ? 'Update Course' : 'Register Course'}</h3>
                 <p className="text-[13px] font-normal text-black capitalize tracking-normal mt-2">{editingCourseId ? 'Modify existing program credentials' : 'Add a new program to your institutional catalog'}</p>
              </div>

              <form onSubmit={handleSaveCourse} id="course-form" className="p-12 space-y-8">
                <div className="space-y-6">

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                      placeholder="e.g., Diploma in Computer Engineering"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <div className="flex items-center justify-between pl-1">
                          <label className="text-[13px] font-normal text-black capitalize tracking-tight">Course Type <span className="text-red-500">*</span></label>
                          <button 
                            type="button"
                            onClick={() => setIsTypeModalOpen(true)}
                            className="flex items-center gap-1 text-[13px] font-normal text-black capitalize tracking-tight hover:opacity-80 transition-all"
                          >
                             Manage <Settings2 size={12} />
                          </button>
                        </div>
                        <select 
                          required
                          value={courseType}
                          onChange={(e) => setCourseType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm cursor-pointer"
                        >
                           <option value="">Select Type</option>
                           {customCourseTypes.map((type) => (
                             <option key={type.id} value={type.name}>{type.name}</option>
                           ))}
                        </select>
                     </div>
                                  <div className="space-y-1.5">
                         <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Duration <span className="text-red-500">*</span></label>
                         <input 
                           required
                           type="text"
                           value={duration}
                           onChange={(e) => setDuration(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                           placeholder="e.g., 2 Years / 6 Months"
                         />
                      </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Fees <span className="text-red-500">*</span></label>
                     <input 
                       required
                       type="text"
                       value={fees}
                       onChange={(e) => setFees(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                       placeholder="e.g., 45000"
                     />
                  </div>
                </div>

                <div className="pt-4">
                   <button 
                     type="submit"
                     disabled={isSubmittingCourse}
                     className="w-full bg-[#002147] text-white py-5 rounded-2xl font-black text-[11px] capitalize tracking-tight shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                      {isSubmittingCourse ? 'Processing...' : <><Save size={18} /> {editingCourseId ? 'Update Course' : 'Add New Course'}</>}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

         {/* Course Type Management Modal */}
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTypeModalOpen(false)} />
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="bg-indigo-500 p-8 text-white relative">
                  <button onClick={() => setIsTypeModalOpen(false)} className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors">
                     <X size={20} />
                  </button>
                  <h3 className="text-xl font-black tracking-tight">Course Type Registry</h3>
                  <p className="text-[11px] font-bold text-black/60 uppercase tracking-widest mt-1">Institutional Standards</p>
               </div>

               <div className="p-8 space-y-6">
                  <form onSubmit={handleAddCustomType} className="flex gap-3">
                     <input 
                       required
                       type="text"
                       value={newTypeName}
                       onChange={(e) => setNewTypeName(e.target.value)}
                       placeholder="Enter new..."
                       className="flex-1 bg-slate-50 border border-indigo-100 rounded-xl px-5 py-3.5 text-sm font-normal text-black outline-none focus:border-indigo-500 focus:bg-white transition-all"
                     />
                     <button 
                       type="submit"
                       disabled={isAddingType}
                       className="bg-indigo-500 text-black px-6 py-3.5 rounded-xl text-[13px] font-normal capitalize tracking-tight shadow-lg hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50"
                     >
                       {isAddingType ? '...' : 'Add'}
                     </button>
                  </form>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                     {customCourseTypes.map((type) => (
                       <div key={type.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 group">
                          <span className="text-sm font-normal text-black">{type.name}</span>
                          <div className="flex gap-1">
                             <button className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"><Edit2 size={14} /></button>
                             <button 
                               onClick={() => handleDeleteCustomType(type.id)}
                               className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                             ><Trash2 size={14} /></button>
                          </div>
                       </div>
                     ))}
                     {customCourseTypes.length === 0 && (
                       <div className="text-center py-10">
                         <p className="text-[13px] font-normal text-black capitalize tracking-tight">No entries found</p>
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





