'use client';

import { useState, useEffect, useMemo } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, update, push, set } from 'firebase/database';
import { 
  FileText, 
  ChevronDown, 
  Plus,
  Save,
  Building2,
  Settings,
  Edit2,
  ShieldCheck,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExamFormManagerProps {
  collegeId?: string;
  adminUid?: string;
}

export default function ExamFormManager({ collegeId, adminUid }: ExamFormManagerProps) {
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(collegeId || '');
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [allExamSettings, setAllExamSettings] = useState<any>({});
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseExamConfigs, setCourseExamConfigs] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [examSettings, setExamSettings] = useState<any>({
    examName: '',
    registrationOpen: false,
    examDate: '',
    lastDate: '',
    fees: '500',
    academicYear: '2026-2027'
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (collegeId) setSelectedCollegeId(collegeId);
  }, [collegeId]);

  useEffect(() => {
    if (!collegeId) {
      const collegesRef = ref(realtimeDb, 'colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          setColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      });
    }
  }, [collegeId]);

  useEffect(() => {
    const targetId = selectedCollegeId;
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const safetyTimer = setTimeout(() => setLoading(false), 500);
    setInquiries([]);
    setAvailableCourses([]);
    setAllExamSettings({});
    setCourseExamConfigs([]);
    // Fetch all inquiries to build Course Types, Courses, and Students
    const inqRef = ref(realtimeDb, `colleges/${targetId}/frontOffice/admissionInquiries`);
    onValue(inqRef, (snap) => {
      if (snap.exists()) {
        const inqs = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(i => i.studentUid); // Ensure they have a user ID attached
        setInquiries(inqs);
      } else {
        setInquiries([]);
      }
      setLoading(false);
    });

    // Fetch Exam Settings (Global fallback or merged)
    const settingsRef = ref(realtimeDb, `colleges/${targetId}/examSettings`);
    onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setExamSettings(snap.val());
      }
    });

    // Fetch master list of courses (both Global and College-specific)
    const collegeCoursesRef = ref(realtimeDb, `colleges/${targetId}/courses`);
    onValue(collegeCoursesRef, (cSnap) => {
      const cCourses = cSnap.exists() ? Object.values(cSnap.val()) : [];
      
      const globalCoursesRef = ref(realtimeDb, `courses`);
      onValue(globalCoursesRef, (gSnap) => {
        const gCourses = gSnap.exists() ? Object.values(gSnap.val()) : [];
        setAvailableCourses([...cCourses, ...gCourses]);
      });
    });

    // Fetch all student data to get configurations
    const studentsRef = ref(realtimeDb, `colleges/${targetId}/students`);
    onValue(studentsRef, (snap) => {
      if (snap.exists()) {
        setAllExamSettings(snap.val());
      } else {
        setAllExamSettings({});
      }
      setLoading(false);
    });

    // Fetch Course-wise Exam Configurations
    const configRef = ref(realtimeDb, `colleges/${targetId}/examConfigurations`);
    onValue(configRef, (snap) => {
      if (snap.exists()) {
        setCourseExamConfigs(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setCourseExamConfigs([]);
      }
    });

    return () => clearTimeout(safetyTimer);
  }, [selectedCollegeId]);

  useEffect(() => {
    if (!selectedCollegeId || selectedStudentIds.length === 0) {
      setExamSettings({ registrationOpen: false, examDate: '', lastDate: '', fees: '500' });
      return;
    }
    if (selectedStudentIds.includes('ALL')) return;
    if (selectedStudentIds.length > 1) return;

    const settingsRef = ref(realtimeDb, `colleges/${selectedCollegeId}/students/${selectedStudentIds[0]}/examSettings`);
    onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setExamSettings(snap.val());
      } else {
        setExamSettings({ registrationOpen: false, examDate: '', lastDate: '', fees: '500' });
      }
    });
  }, [selectedCollegeId, selectedStudentIds]);

  const toggleRegistration = async () => {
    if (!selectedCollegeId || !selectedCourseType || !selectedCourse) return alert("Please select Course Type and Course");
    
    const targetIds = inquiries
      .filter(i => {
        if (i.status !== 'Accepted') return false;
        const course = availableCourses.find(c => c.id === i.courseId);
        const slug = course?.course_slug || i.courseId;
        const nameMatches = (i.courseName === selectedCourseType || i.courseType === selectedCourseType);
        const slugMatches = (slug === selectedCourse);
        return nameMatches && slugMatches;
      })
      .map(s => s.studentUid);

    const updates: any = {};
    const newStatus = !examSettings.registrationOpen;
    const academicYear = examSettings.academicYear || '2026-2027';
    const configId = `${selectedCourseType}_${selectedCourse}_${academicYear}`.replace(/\s+/g, '_');

    // Update Course Config
    updates[`colleges/${selectedCollegeId}/examConfigurations/${configId}/registrationOpen`] = newStatus;

    // Update individual students
    targetIds.forEach(id => {
      updates[`colleges/${selectedCollegeId}/students/${id}/examSettings/registrationOpen`] = newStatus;
    });

    await update(ref(realtimeDb), updates);
    setExamSettings({ ...examSettings, registrationOpen: newStatus });
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) return alert("Please select a college");
    if (!selectedCourseType || !selectedCourse) return alert("Please select Course Type and Course");
    
    // Find all students in this course to update their individual settings too
    const targetIds = inquiries
      .filter(i => {
        if (i.status !== 'Accepted') return false;
        const course = availableCourses.find(c => c.id === i.courseId);
        const slug = course?.course_slug || i.courseId;
        const nameMatches = (i.courseName === selectedCourseType || i.courseType === selectedCourseType);
        const slugMatches = (slug === selectedCourse);
        return nameMatches && slugMatches;
      })
      .map(s => s.studentUid);

    const updates: any = {};
    const timestamp = new Date().toISOString();
    const academicYear = examSettings.academicYear || '2026-2027';
    const configId = `${selectedCourseType}_${selectedCourse}_${academicYear}`.replace(/\s+/g, '_');
    
    const configData = {
      ...examSettings,
      courseType: selectedCourseType,
      courseName: selectedCourse,
      academicYear: academicYear,
      updatedAt: timestamp
    };

    // Save to global course config
    updates[`colleges/${selectedCollegeId}/examConfigurations/${configId}`] = configData;

    // Save to individual students for existing logic compatibility
    targetIds.forEach(id => {
      updates[`colleges/${selectedCollegeId}/students/${id}/examSettings`] = configData;
    });

    await update(ref(realtimeDb), updates);
    alert(`Exam configuration saved for ${selectedCourse} (${academicYear}) (${targetIds.length} students affected)!`);
  };
  const groupedConfigs = useMemo(() => {
    if (!allExamSettings || Object.keys(allExamSettings).length === 0) return [];
    
    const groups: Record<string, any> = {};
    
    // Process all students to find their exam settings
    Object.entries(allExamSettings).forEach(([uid, data]: any) => {
      const settings = data.examSettings;
      if (!settings || !settings.examDate) return;

      // Find the student's admission info to get the course name and type
      const inquiry = inquiries.find(i => i.studentUid === uid);
      if (!inquiry) return;

      // Unique key for grouping: Course Type + Course Name + Exam Date + Fees
      const groupKey = `${inquiry.courseType}-${inquiry.courseName}-${settings.examDate}-${settings.fees}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          courseType: inquiry.courseType,
          courseName: inquiry.courseName,
          settings: settings,
          students: [],
          studentNames: []
        };
      }
      groups[groupKey].students.push(uid);
      groups[groupKey].studentNames.push(inquiry.studentName || 'Student');
    });
    
    return Object.values(groups);
  }, [allExamSettings, inquiries]);

  const availableCourseTypes = useMemo(() => {
    const types = new Set<string>();
    
    // Add from available courses
    availableCourses.forEach(c => {
      const name = c.course_name || c.name || c.courseName;
      if (name) types.add(name);
    });

    // Add from inquiries (Accepted/Confirmed students)
    inquiries.filter(i => i.status === 'Accepted' || i.status === 'Confirmed').forEach(i => {
      const name = i.courseName || i.course_name || i.name;
      if (name) types.add(name);
    });

    // Default if empty
    if (types.size === 0) types.add('Regular');
    
    return Array.from(types);
  }, [availableCourses, inquiries]);

  const filteredAvailableCoursesForSelection = useMemo(() => {
    const courses = new Set<string>();

    // Add from available courses matching type
    availableCourses.forEach(c => {
      const name = c.course_name || c.name || c.courseName;
      if (!selectedCourseType || name === selectedCourseType) {
        const slug = c.course_slug || c.id;
        if (slug && slug !== 'NULL') {
          courses.add(slug);
        }
      }
    });

    // Add from inquiries matching type
    inquiries.filter(i => (i.status === 'Accepted' || i.status === 'Confirmed')).forEach(i => {
      const name = i.courseName || i.course_name || i.name;
      if (!selectedCourseType || name === selectedCourseType) {
        const slug = i.course_slug || i.courseId || i.id;
        if (slug && slug !== 'NULL') {
          courses.add(slug);
        }
      }
    });

    return Array.from(courses);
  }, [availableCourses, inquiries, selectedCourseType]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-[#002147] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
              <FileText size={14} className="text-[#00a5a5]" /> Academic Control
            </div>
            <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Exam Form Management</h2>
            <p className="text-sm font-normal text-white/60">Configure exam registration and monitor student form submissions.</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedCourseType('');
                setSelectedCourse('');
                setIsCreateModalOpen(true);
              }}
              className="bg-[#00a5a5] text-white px-8 py-4 rounded-2xl text-[12px] font-black capitalize tracking-tight shadow-xl hover:bg-white hover:text-[#002147] transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} strokeWidth={3} /> Configure Exam
            </button>

            {!collegeId && (
              <div className="relative">
                <select 
                  className="bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-sm font-bold text-white outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer min-w-[280px]"
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                >
                  <option value="" className="text-black">Select Institution...</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#00a5a5] pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCollegeId ? (
        <div className="space-y-6">
          {/* Configured Exams Table */}
          <div className="bg-white rounded-[2.5rem] border border-black shadow-sm overflow-hidden p-8 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter capitalize">Configured Exam Form</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-50 text-[14px] font-black text-black uppercase tracking-widest border-b border-black">
                    <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center w-16">Sr No.</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Course Type</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Course</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Academic Year</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Registration Status</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Exam Date </th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Last Date of Submit</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-right">Fee</th>
                    <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {courseExamConfigs.map((config, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap border-b border-black">
                        <td className="px-4 py-6 border-r border-black text-center text-[16px] font-medium text-black">{idx + 1}</td>
                        <td className="px-6 py-6 border-r border-black text-center">
                          <span className="text-[12px] font-black text-indigo-500 capitalize tracking-tight bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            {config.courseType || 'Reg'}
                          </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black font-medium text-slate-800 text-[15px]">
                          {config.courseName}
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center font-medium text-slate-800 text-[15px]">
                          {config.academicYear || '2026-2027'}
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                             config.registrationOpen ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                           )}>
                             {config.registrationOpen ? 'OPEN' : 'CLOSED'}
                           </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center text-[14px] font-medium text-slate-600">
                          {config.examDate ? new Date(config.examDate).toLocaleDateString() : 'TBA'}
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center text-[14px] font-medium text-slate-600">
                          {config.lastDate ? new Date(config.lastDate).toLocaleDateString() : 'TBA'}
                        </td>
                        <td className="px-6 py-6 border-r border-black text-right font-black text-slate-800 text-[15px]">
                          ₹{config.fees || '0'}
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex justify-center gap-3">
                            <button 
                              onClick={() => {
                                setSelectedCourseType(config.courseType || '');
                                setSelectedCourse(config.courseName || '');
                                setExamSettings(config);
                                setIsCreateModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
                              title="Edit Configuration"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this configuration?')) {
                                  const configRef = ref(realtimeDb, `colleges/${selectedCollegeId}/examConfigurations/${config.id}`);
                                  set(configRef, null).then(() => {
                                    alert('Configuration deleted successfully.');
                                  });
                                }
                              }}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                              title="Delete Configuration"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {courseExamConfigs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Settings size={64} strokeWidth={1} />
                          <p className="text-lg font-bold tracking-tight">No exam configurations assigned yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border-4 border-slate-200 shadow-xl p-32 text-center">
          <div className="flex flex-col items-center gap-6 text-slate-300">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
              <ShieldCheck size={48} className="opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black tracking-tighter text-slate-400 uppercase">Selection Required</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Please select an institutional ledger to begin examination form audit.</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Form Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#002147] p-10 text-white relative">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                 <Settings size={32} />
              </div>
              <h3 className="text-3xl font-black tracking-tighter capitalize">Configure Exam Form</h3>
              <p className="text-[13px] font-normal text-white/60 capitalize tracking-normal mt-2">Set up registration parameters for the current session.</p>
            </div>
            <form onSubmit={(e) => { handleUpdateSettings(e); setIsCreateModalOpen(false); }} className="p-10 space-y-8">
              <div className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Course Type</label>
                    <select 
                      value={selectedCourseType}
                      onChange={(e) => setSelectedCourseType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm cursor-pointer"
                    >
                      <option value="">{loading ? 'Loading types...' : 'Select Type...'}</option>
                      {availableCourseTypes.map((type: string) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Course</label>
                    <select 
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm cursor-pointer"
                    >
                      <option value="">{loading ? 'Loading courses...' : 'Select Course...'}</option>
                      {filteredAvailableCoursesForSelection.map((course: string) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Academic Year</label>
                    <select 
                      value={examSettings.academicYear || '2026-2027'}
                      onChange={(e) => setExamSettings({...examSettings, academicYear: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm cursor-pointer"
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2027-2028">2027-2028</option>
                      <option value="2028-2029">2028-2029</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Exam Name</label>
                  <input 
                    type="text" 
                    value={examSettings.examName || ''}
                    onChange={(e) => setExamSettings({...examSettings, examName: e.target.value})}
                    placeholder="e.g. Annual Examination 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Registration Status</label>
                  <button 
                    type="button"
                    onClick={toggleRegistration}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      examSettings.registrationOpen 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                        : "bg-rose-50 border-rose-500 text-rose-700"
                    )}
                  >
                    <span className="font-bold text-sm">{examSettings.registrationOpen ? 'Registration OPEN' : 'Registration CLOSED'}</span>
                    <div className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      examSettings.registrationOpen ? "bg-emerald-500" : "bg-rose-500"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        examSettings.registrationOpen ? "left-7" : "left-1"
                      )} />
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Regular Exam Fee (₹)</label>
                    <input 
                      type="number" 
                      value={examSettings.fees}
                      onChange={(e) => setExamSettings({...examSettings, fees: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Last Date (Without Late Fee)</label>
                    <input 
                      type="date" 
                      value={examSettings.lastDate}
                      onChange={(e) => setExamSettings({...examSettings, lastDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1">Exam Date</label>
                    <input 
                      type="date" 
                      value={examSettings.examDate}
                      onChange={(e) => setExamSettings({...examSettings, examDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all shadow-sm"
                    />
                  </div>
                </div>

              </div>

              <button 
                type="submit"
                className="w-full bg-[#002147] text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-[#00a5a5] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                <Save size={20} /> Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setPreviewImage(null)} />
          <div className="relative max-w-5xl w-full max-h-full flex flex-col gap-6 animate-in zoom-in-95">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-rose-500 transition-colors flex items-center gap-2 font-bold"
            >
              <X size={24} /> Close Preview
            </button>
            <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden">
              <img src={previewImage} className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" alt="Payment Receipt" />

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

