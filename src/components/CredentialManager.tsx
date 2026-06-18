'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { OfficialMarksheet } from './OfficialMarksheet';
import { OfficialCertificate } from './OfficialCertificate';
import { 
  Award, 
  FileText, 
  User, 
  Search, 
  Printer, 
  Download,
  Building2,
  Calendar,
  Eye,
  Filter,
  Plus,
  X,
  Trash2,
  Save,
  Loader2,
  Edit2,
  Layers,
  ChevronDown
} from 'lucide-react';

interface CredentialManagerProps {
  collegeId: string | undefined;
  type: 'marksheet' | 'certificate';
  adminUid?: string;
}

export default function CredentialManager({ collegeId, type, adminUid }: CredentialManagerProps) {
  const [activeTab, setActiveTab] = useState<'eligible' | 'issued'>('issued');
  const [students, setStudents] = useState<any[]>([]);
  const [generatedRecords, setGeneratedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');

  useEffect(() => {
    if (!realtimeDb) return;
    const safetyTimer = setTimeout(() => setLoading(false), 500);

    // Fetch colleges for naming
    const collegesRef = ref(realtimeDb, 'colleges');
    onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      }
    });

    // Fetch generated records
    if (collegeId) {
      const recordsRef = ref(realtimeDb, `colleges/${collegeId}/generatedCredentials`);
      onValue(recordsRef, (snap) => {
        if (snap.exists()) {
          const recs = Object.entries(snap.val())
            .map(([id, val]: any) => ({ ...val, id, collegeId }))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          
          const uniqueMap = new Map();
          recs.forEach(r => {
            const key = r.regNo || r.rollNumber || r.id;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, r);
            }
          });
          setGeneratedRecords(Array.from(uniqueMap.values()));
        } else {
          setGeneratedRecords([]);
        }
      });
    } else {
      // Admin Global records
      const allCollegesRef = ref(realtimeDb, 'colleges');
      onValue(allCollegesRef, (snap) => {
        if (snap.exists()) {
          let allRecs: any[] = [];
          Object.entries(snap.val()).forEach(([cId, cData]: [string, any]) => {
            if (cData.generatedCredentials) {
              const recs = Object.entries(cData.generatedCredentials).map(([id, val]: any) => ({ ...val, id, collegeId: cId }));
              allRecs = [...allRecs, ...recs];
            }
          });
          
          allRecs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          
          const uniqueMap = new Map();
          allRecs.forEach(r => {
            const key = r.regNo || r.rollNumber || r.id;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, r);
            }
          });
          setGeneratedRecords(Array.from(uniqueMap.values()));
        }
      });
    }

    if (collegeId) {
      // College/Staff View
      const admsRef = ref(realtimeDb, `colleges/${collegeId}/studentAdmissions`);
      onValue(admsRef, (snap) => {
        if (snap.exists()) {
          const data = Object.entries(snap.val())
            .map(([id, val]: any) => ({ ...val, id, collegeId }))
            .filter((s: any) => ['Accepted', 'Confirmed', 'Approved', 'Verified'].includes(s.admissionStatus));
          
          setStudents(data);
        } else {
          setStudents([]);
        }
        setLoading(false);
      });

      // Fetch official course types for this college
      const typeRef = ref(realtimeDb, `colleges/${collegeId}/settings/courseTypes`);
      onValue(typeRef, (snap) => {
        if (snap.exists()) {
          const types = Object.values(snap.val()).map((t: any) => t.name).filter(Boolean);
          setCourseTypes(prev => Array.from(new Set([...prev, ...types as string[]])));
        }
      });
    } else {
      // Admin Global View
      const allCollegesRef = ref(realtimeDb, 'colleges');
      onValue(allCollegesRef, (snap) => {
        if (snap.exists()) {
          const colleges = snap.val();
          let allStudents: any[] = [];
          let allTypes: string[] = [];
          Object.entries(colleges).forEach(([cId, cData]: [string, any]) => {
            if (cData.studentAdmissions) {
              const adms = Object.entries(cData.studentAdmissions)
                .map(([id, val]: any) => ({ 
                  ...(val || {}),
                  id, 
                  collegeId: cId, 
                  collegeName: cData?.name 
                }))
                .filter((s: any) => ['Accepted', 'Confirmed', 'Approved', 'Verified'].includes(s.admissionStatus));
              allStudents = [...allStudents, ...adms];
            }
            if (cData.settings?.courseTypes) {
              const types = Object.values(cData.settings.courseTypes).map((t: any) => t.name);
              allTypes = [...allTypes, ...types as string[]];
            }
          });
          setStudents(allStudents);
          setCourseTypes(prev => Array.from(new Set([...prev, ...allTypes.filter(Boolean)])));
        } else {
          setStudents([]);
        }
        setLoading(false);
      });
    }

    return () => clearTimeout(safetyTimer);
  }, [collegeId]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                         (s.regNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (s.rollNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCollege = !selectedCollegeId || s.collegeId === selectedCollegeId;
    const matchesType = !selectedCourseType || s.courseType === selectedCourseType;
    return matchesSearch && matchesCollege && matchesType;
  });

  const filteredRecords = generatedRecords.filter(r => {
    const matchesType = r.type === type;
    const matchesSearch = (r.studentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                         (r.regNo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (r.rollNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCollege = !selectedCollegeId || r.collegeId === selectedCollegeId;
    const matchesCourseType = !selectedCourseType || r.courseType === selectedCourseType;
    return matchesType && matchesSearch && matchesCollege && matchesCourseType;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState([{ name: '', maxMarks: '100', passingMarks: '35', obtainedMarks: '', result: 'Fail' }]);
  const [globalPassingMarks, setGlobalPassingMarks] = useState('35');
  
  const [marksheetForm, setMarksheetForm] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    college: '',
    courseType: '',
    course: '',
    duration: '',
    regNo: '',
    rollNumber: '',
    grade: '',
    issueDate: new Date().toISOString().split('T')[0],
    resultDate: new Date().toISOString().split('T')[0],
    marksheetNo: '',
    profilePhoto: '',
    signature: '',
    studentUid: '',
    collegeId: ''
  });

  const [courseTypes, setCourseTypes] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [filteredStudentList, setFilteredStudentList] = useState<any[]>([]);
  const [masterCourses, setMasterCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!realtimeDb) return;
    
    // Fetch global courses
    const globalRef = ref(realtimeDb, 'courses');
    const unsubGlobal = onValue(globalRef, (snap) => {
      const gCourses = snap.exists() ? Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })) : [];
      
      if (collegeId) {
        // Fetch college courses
        const collegeCoursesRef = ref(realtimeDb, `colleges/${collegeId}/courses`);
        onValue(collegeCoursesRef, (cSnap) => {
          const cCourses = cSnap.exists() ? Object.entries(cSnap.val()).map(([id, val]: any) => ({ id, ...val })) : [];
          setMasterCourses([...cCourses, ...gCourses]);
        });
      } else {
        // Fetch all college courses for Admin
        const collegesRef = ref(realtimeDb, 'colleges');
        onValue(collegesRef, (colSnap) => {
          if (colSnap.exists()) {
            const collegesData = colSnap.val();
            let allCollegeCourses: any[] = [];
            Object.entries(collegesData).forEach(([cid, college]: any) => {
              if (college.courses) {
                const cCourses = Object.entries(college.courses).map(([id, val]: any) => ({ id, ...val, collegeId: cid }));
                allCollegeCourses = [...allCollegeCourses, ...cCourses];
              }
            });
            setMasterCourses([...allCollegeCourses, ...gCourses]);
          } else {
            setMasterCourses(gCourses);
          }
        });
      }
    });

    return () => unsubGlobal();
  }, [collegeId]);

  const getStudentCourseSlug = (student: any) => {
    const course = masterCourses.find(c => 
      (student.courseId && c.id === student.courseId) || 
      (student.courseName && (c.course_name === student.courseName || c.name === student.courseName))
    );
    return course?.course_slug || student.courseId || student.courseName || '';
  };

  const uniqueCourseNames = useMemo(() => {
    const names = new Set<string>();
    
    // Add from masterCourses
    masterCourses.forEach(c => {
      const name = c.course_name || c.name || c.courseName;
      if (name) names.add(name);
    });

    // Add from students
    students.forEach(s => {
      if (s.courseName) names.add(s.courseName);
    });

    return Array.from(names);
  }, [masterCourses, students]);

  const filteredCourseSlugs = useMemo(() => {
    if (!marksheetForm.courseType) return [];
    const slugs = new Set<string>();

    // Add matching slugs from masterCourses
    masterCourses.forEach(c => {
      const name = c.course_name || c.name || c.courseName;
      if (name === marksheetForm.courseType) {
        const slug = c.course_slug || c.id;
        if (slug && slug !== 'NULL') {
          slugs.add(slug);
        }
      }
    });

    // Add matching slugs from students
    students.forEach(s => {
      if (s.courseName === marksheetForm.courseType) {
        const slug = getStudentCourseSlug(s);
        if (slug) slugs.add(slug);
      }
    });

    return Array.from(slugs);
  }, [masterCourses, students, marksheetForm.courseType]);

  useEffect(() => {
    if (students.length > 0) {
      const types = Array.from(new Set(students.map(s => s.courseType))).filter(Boolean);
      setCourseTypes(prev => Array.from(new Set([...prev, ...types as string[]])));
      
      const courses = Array.from(new Set(students.map(s => s.courseName))).filter(Boolean);
      setAvailableCourses(courses);
    }
  }, [students]);

  const handleOpenCreate = (student?: any) => {
    setEditingRecordId(null);
    if (student) {
      setSelectedStudent(student);
      setMarksheetForm({
        studentName: student.studentName || '',
        fatherName: student.profileData?.fatherFirstName ? `${student.profileData.fatherFirstName} ${student.profileData.fatherLastName || ''}` : '',
        motherName: student.profileData?.motherFirstName ? `${student.profileData.motherFirstName} ${student.profileData.motherLastName || ''}` : '',
        dob: student.profileData?.dateOfBirth || '',
        college: student.collegeName || 'MIT PARADH',
        courseType: student.courseName || student.courseType || '',
        course: student.courseName ? getStudentCourseSlug(student) : '',
        duration: student.duration || '1 Year',
        regNo: student.regNo || '',
        rollNumber: student.rollNumber || '',
        grade: student.grade || '',
        issueDate: student.issueDate || new Date().toISOString().split('T')[0],
        resultDate: student.resultDate || new Date().toISOString().split('T')[0],
        marksheetNo: student.marksheetNo || `${type === 'marksheet' ? 'MIT' : 'CERT'}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        profilePhoto: student.photo || student.photoUrl || student.profileData?.photoUrl || student.profile?.photoUrl || student.profileData?.profilePhoto || student.profilePhoto || '',
        signature: student.signature || student.signatureUrl || student.profileData?.signatureUrl || student.profileData?.signUrl || student.profile?.signUrl || student.signUrl || student.profileData?.sign || student.profile?.sign || student.sign || '',
        studentUid: student.studentUid || student.id || '',
        collegeId: student.collegeId || ''
      });
    } else {
      setSelectedStudent(null);
      setMarksheetForm({
        studentName: '',
        fatherName: '',
        motherName: '',
        dob: '',
        college: '',
        courseType: '',
        course: '',
        duration: '',
        regNo: '',
        rollNumber: '',
        grade: '',
        issueDate: new Date().toISOString().split('T')[0],
        resultDate: new Date().toISOString().split('T')[0],
        marksheetNo: '',
        profilePhoto: '',
        signature: '',
        studentUid: '',
        collegeId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setMarksheetForm({
        studentName: student.studentName || '',
        fatherName: student.profileData?.fatherFirstName ? `${student.profileData.fatherFirstName} ${student.profileData.fatherLastName || ''}` : '',
        motherName: student.profileData?.motherFirstName ? `${student.profileData.motherFirstName} ${student.profileData.motherLastName || ''}` : '',
        dob: student.profileData?.dateOfBirth || '',
        college: student.collegeName || 'MIT PARADH',
        courseType: student.courseName || student.courseType || '',
        course: getStudentCourseSlug(student),
        duration: student.duration || '1 Year',
        regNo: student.regNo || '',
        rollNumber: student.rollNumber || '',
        grade: student.grade || '',
        issueDate: student.issueDate || new Date().toISOString().split('T')[0],
        resultDate: student.resultDate || new Date().toISOString().split('T')[0],
        marksheetNo: student.marksheetNo || `${type === 'marksheet' ? 'MIT' : 'CERT'}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        profilePhoto: student.photo || student.profileData?.photoUrl || student.profilePhoto || '',
        signature: student.profileData?.signatureUrl || student.profileData?.signUrl || student.signature || student.signUrl || '',
        studentUid: student.studentUid || student.id || '',
        collegeId: student.collegeId || ''
      });    }
  };

  const addSubject = () => {
    setSubjects([...subjects, { name: '', maxMarks: '100', passingMarks: '35', obtainedMarks: '', result: 'Fail' }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: string) => {
    const newSubjects = [...subjects];
    (newSubjects[index] as any)[field] = value;
    
    // Capping validation: Obtained Marks cannot exceed Max Marks
    if (field === 'obtainedMarks' && value !== '') {
      const obVal = parseFloat(value);
      const maxVal = parseFloat(newSubjects[index].maxMarks);
      if (!isNaN(obVal) && !isNaN(maxVal) && obVal > maxVal) {
        newSubjects[index].obtainedMarks = newSubjects[index].maxMarks;
      }
    }

    // Also cap if Max Marks is changed to be lower than Obtained Marks
    if (field === 'maxMarks' && newSubjects[index].obtainedMarks !== '') {
      const maxVal = parseFloat(value);
      const obVal = parseFloat(newSubjects[index].obtainedMarks);
      if (!isNaN(maxVal) && !isNaN(obVal) && obVal > maxVal) {
        newSubjects[index].obtainedMarks = value;
      }
    }

    // Auto-calculate result
    const ob = parseFloat(newSubjects[index].obtainedMarks);
    const pm = parseFloat(newSubjects[index].passingMarks);
    
    if (!isNaN(ob) && !isNaN(pm)) {
      newSubjects[index].result = ob >= pm ? 'Pass' : 'Fail';
    } else {
      newSubjects[index].result = 'Fail';
    }
    
    setSubjects(newSubjects);
  };

  const credentialRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async (record?: any) => {
    try {
      if (record) setDownloadingId(record.id);
      setIsGenerating(true);
      
      // If a record is passed, load it into the form for the template
      if (record) {
        setMarksheetForm(record);
        setSubjects(record.subjects);
        // Small delay to ensure template renders
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      if (credentialRef.current) {
        const canvas = await html2canvas(credentialRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const orientation = type === 'certificate' ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'mm', 'a4');
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${type === 'marksheet' ? 'Marksheet' : 'Certificate'}_${marksheetForm.studentName.replace(/\s+/g, '_')}_${marksheetForm.regNo}.pdf`);
      }
    } catch (error: any) {
      console.error('Download Error:', error);
      alert(`Failed to download ${type}: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setDownloadingId(null);
    }
  };

  const handleToggleVisibility = async (record: any) => {
    try {
      const recordRef = ref(realtimeDb, `colleges/${record.collegeId}/generatedCredentials/${record.id}`);
      await set(recordRef, { ...record, isVisible: !record.isVisible });
    } catch (error) {
      console.error('Toggle Error:', error);
    }
  };

  const handleSaveCredential = async () => {
    if (!selectedStudent && !marksheetForm.studentName) {
      alert('Please select a student first');
      return;
    }
    try {
      setIsGenerating(true);

      // Save to Firebase
      const recordData = {
        ...marksheetForm,
        subjects,
        generatedAt: new Date().toISOString(),
        type: type, // 'marksheet' or 'certificate'
        isVisible: false // Default to hidden until published
      };

      const targetCollegeId = collegeId || marksheetForm.collegeId || selectedStudent?.collegeId;
      
      if (editingRecordId && targetCollegeId) {
        // Update existing record
        const recordRef = ref(realtimeDb, `colleges/${targetCollegeId}/generatedCredentials/${editingRecordId}`);
        await set(recordRef, recordData);
      } else if (targetCollegeId) {
        // Create new record
        const recordsRef = ref(realtimeDb, `colleges/${targetCollegeId}/generatedCredentials`);
        await push(recordsRef, recordData);
      }

      setIsModalOpen(false);
      setIsPreviewMode(false);
      setActiveTab('issued'); 
    } catch (error: any) {
      console.error('Generation Error:', error);
      alert(`Failed to generate ${type}: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-[#5D5fb1] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Loading Academic Records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-12 m-12">
      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${type === 'marksheet' ? 'from-[#002147] to-[#003366]' : 'from-[#5D5fb1] to-[#4e50a1]'} rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border-b-8 border-[#00a5a5]`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-black uppercase tracking-[0.2em]">
              {type === 'marksheet' ? <FileText size={14} className="text-[#00a5a5]" /> : <Award size={14} className="text-[#00a5a5]" />}
              {type === 'marksheet' ? 'Marksheet Management' : 'Course Certification'}
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-none">
              {type === 'marksheet' ? 'Academic Transcripts' : 'Official Certificates'}
            </h2>
            <p className="text-lg font-medium text-white/70 max-w-xl leading-relaxed">
              Generate and manage verified institutional {type === 'marksheet' ? 'marksheets' : 'course certificates'} for confirmed students.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 text-center min-w-[160px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Total Eligible</p>
                <p className="text-4xl font-black">{students.length}</p>
             </div>
             <button 
               className="bg-white text-slate-800 px-10 py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-widest shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-3 border-b-4 border-[#00a5a5]"
               onClick={() => handleOpenCreate()}
             >
                <Plus size={20} strokeWidth={3} className="text-[#00a5a5]" />
                Create {type === 'marksheet' ? 'Marksheet' : 'Certificate'}
             </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center p-2 bg-slate-100 rounded-[2rem] w-fit mx-auto shadow-inner">
         <button 
           onClick={() => setActiveTab('eligible')}
           className={`px-12 py-4 rounded-[1.8rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'eligible' ? 'bg-white text-slate-800 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
         >
            Eligible Students
         </button>
         <button 
           onClick={() => setActiveTab('issued')}
           className={`px-12 py-4 rounded-[1.8rem] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'issued' ? 'bg-white text-slate-800 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
         >
            Issued {type === 'marksheet' ? 'Marksheets' : 'Certificates'}
         </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
         <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
            <div className="relative flex-1 w-full max-w-md">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text"
                 placeholder="Search by name, registration, or roll number..."
                 className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

             <div className="relative w-full md:w-64">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-11 pr-10 text-[13px] font-bold text-slate-600 outline-none focus:bg-white focus:border-[#5D5fb1] transition-all cursor-pointer appearance-none shadow-sm"
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                >
                  <option value="">Course Type...</option>
                  {courseTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
             </div>

            {!collegeId && (
               <div className="relative w-full md:w-72">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-11 pr-10 text-[13px] font-bold text-slate-600 outline-none focus:bg-white focus:border-[#5D5fb1] transition-all cursor-pointer appearance-none shadow-sm"
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                  >
                    <option value="">All Institutions</option>
                    {availableColleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
               </div>
            )}
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            {(selectedCollegeId || selectedCourseType) && (
               <button 
                 onClick={() => { setSelectedCollegeId(''); setSelectedCourseType(''); }}
                 className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all text-[10px] font-black uppercase tracking-widest border border-rose-100"
               >
                  Clear Filter
               </button>
            )}
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[3rem] border border-black shadow-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50 border-b border-black whitespace-nowrap">
                <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Sr No.</th>
                <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Date & Time</th>
                <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">{type === 'marksheet' ? 'Marksheet Number' : 'Certificate Number'}</th>
                <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Student Name</th>
                <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">College</th>
                 <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Course Type</th>
                 <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black">Course</th>
                 <th className="px-6 py-5 text-[14px] font-medium text-black capitalize tracking-tight border-r border-black text-center">Student Panel</th>
                 <th className="px-4 py-5 text-[14px] font-medium text-black capitalize tracking-tight text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {activeTab === 'eligible' ? (
                filteredStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap border-b border-black">
                  <td className="px-4 py-6 border-r border-black text-center text-[16px] font-medium text-black">
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-4 py-6 border-r border-black">
                    <p className="text-[14px] font-medium text-black">
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-6 border-r border-black text-center text-[14px] font-bold text-slate-300 italic">
                    ---
                  </td>
                  <td className="px-6 py-6 border-r border-black">
                    <p className="text-[15px] font-black text-slate-800 capitalize leading-tight">{student.studentName}</p>
                    <p className="text-[11px] font-medium text-slate-400 tracking-tight">{student.studentEmail}</p>
                  </td>
                  <td className="px-6 py-6 border-r border-black">
                    <p className="text-[13px] font-bold text-indigo-600 capitalize leading-tight">
                      {student.collegeName || 'MIT PARADH'}
                    </p>
                  </td>
                  <td className="px-6 py-6 border-r border-black text-center">
                    <span className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest bg-[#5D5fb1]/5 px-2 py-0.5 rounded">
                      {student.courseType}
                    </span>
                  </td>
                  <td className="px-6 py-6 border-r border-black">
                    <p className="text-[14px] font-bold text-slate-800 capitalize">{student.courseName}</p>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                         onClick={() => {
                           handleOpenCreate(student);
                           setIsPreviewMode(true);
                         }}
                         className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 group/btn"
                         title="Preview Student Details"
                       >
                          <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                       </button>
                       <button 
                         onClick={() => {
                           handleOpenCreate(student);
                           setIsPreviewMode(false);
                         }}
                         className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${type === 'marksheet' ? 'bg-[#002147] text-white hover:bg-[#003366]' : 'bg-[#5D5fb1] text-white hover:bg-[#4e50a1]'}`}
                       >
                          {type === 'marksheet' ? <FileText size={14} /> : <Award size={14} />}
                          Generate
                       </button>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap border-b border-black">
                    <td className="px-4 py-6 border-r border-black text-center text-[16px] font-medium text-black">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-4 py-6 border-r border-black">
                      <p className="text-[14px] font-bold text-slate-800">
                        {new Date(record.generatedAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                       <p className="text-[14px] font-black text-[#002147] tracking-tight">
                         {record.marksheetNo}
                       </p>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <p className="text-[15px] font-black text-slate-800 capitalize leading-tight">{record.studentName}</p>
                      <p className="text-[11px] font-medium text-slate-400 tracking-tight">{record.rollNumber}</p>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <p className="text-[13px] font-bold text-indigo-600 capitalize leading-tight">
                        {availableColleges.find(c => c.id === record.collegeId)?.name || 'Institutional'}
                      </p>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest bg-[#5D5fb1]/5 px-2 py-0.5 rounded">
                        {record.courseType}
                      </span>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <p className="text-[14px] font-bold text-slate-800 capitalize">{record.course}</p>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                       <button 
                         onClick={() => handleToggleVisibility(record)}
                         className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all focus:outline-none shadow-inner ${record.isVisible ? 'bg-[#00a5a5]' : 'bg-slate-200'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-md ${record.isVisible ? 'translate-x-7' : 'translate-x-1'}`} />
                       </button>
                       <p className={`text-[9px] font-black mt-1 uppercase tracking-widest ${record.isVisible ? 'text-[#00a5a5]' : 'text-slate-400'}`}>
                         {record.isVisible ? 'Published' : 'Hidden'}
                       </p>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <button 
                           onClick={() => {
                             const student = students.find(s => s.regNo === record.regNo || s.rollNumber === record.rollNumber);
                             setEditingRecordId(record.id);
                             if (student) {
                               setSelectedStudent(student);
                               // Merge fresh photo/sign if they are missing in the record
                               const freshPhoto = student.photo || student.photoUrl || student.profileData?.photoUrl || student.profile?.photoUrl || '';
                               const freshSign = student.signature || student.signatureUrl || student.profileData?.signUrl || student.profile?.signUrl || student.signUrl || student.profileData?.signatureUrl || student.profileData?.sign || '';
                                
                               setMarksheetForm({
                                 ...record,
                                 profilePhoto: record.profilePhoto || freshPhoto,
                                 signature: record.signature || freshSign
                               });
                             } else {
                               setMarksheetForm(record);
                             }
                             setSubjects(record.subjects);
                             setIsPreviewMode(true);
                             setIsModalOpen(true);
                           }}
                           className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 group/btn"
                           title="Preview Record"
                         >
                            <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                         </button>
                         <button 
                           onClick={() => {
                             setMarksheetForm(record);
                             setEditingRecordId(record.id);
                             setSubjects(record.subjects);
                             setIsPreviewMode(false);
                             setIsModalOpen(true);
                           }}
                           className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all border border-amber-100 group/btn"
                           title="Edit Marksheet"
                         >
                            <Edit2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                         </button>
                         <button 
                            onClick={() => {
                              if (isGenerating || downloadingId) return;
                              handleDownloadPDF(record);
                            }}
                            disabled={isGenerating || downloadingId === record.id}
                            className={`p-2.5 rounded-xl transition-all border group/btn ${
                              (isGenerating || downloadingId === record.id)
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-100'
                            }`}
                            title="Download PDF"
                          >
                             {downloadingId === record.id ? (
                               <Loader2 size={16} className="animate-spin" />
                             ) : (
                               <Download size={16} className="group-hover/btn:scale-110 transition-transform" />
                             )}
                          </button>
                         <button 
                           onClick={async () => {
                             if (confirm(`Are you sure you want to delete this issued ${type}?`)) {
                               const recordRef = ref(realtimeDb, `colleges/${record.collegeId}/generatedCredentials/${record.id}`);
                               await set(recordRef, null);
                               alert(`${type === 'marksheet' ? 'Marksheet' : 'Certificate'} deleted successfully.`);
                             }
                           }}
                           className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 group/btn"
                           title="Delete Record"
                         >
                            <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {((activeTab === 'eligible' && filteredStudents.length === 0) || (activeTab === 'issued' && filteredRecords.length === 0)) && (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                        <Search size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[16px] font-black text-slate-800">No Records Found</p>
                        <p className="text-slate-400 font-medium text-[13px]">We couldn't find any data matching your current filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50 p-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <p className="text-[12px] font-bold">Academic Session: 2026-2027</p>
           </div>
        </div>
      </div>

      {/* Marksheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => { setIsModalOpen(false); setIsPreviewMode(false); }} />
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
             {/* Modal Header */}
             <div className={`${type === 'marksheet' ? 'bg-[#002147]' : 'bg-[#5D5fb1]'} p-10 text-white shrink-0 relative border-b-8 border-[#00a5a5]`}>
                <button 
                  onClick={() => { setIsModalOpen(false); setIsPreviewMode(false); }}
                  className="absolute right-8 top-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                        {type === 'marksheet' ? <FileText size={28} /> : <Award size={28} />}
                     </div>
                     <div>
                        <h3 className="text-4xl font-black tracking-tighter capitalize leading-none">
                          {isPreviewMode ? 'Document Preview' : `Generate ${type === 'marksheet' ? 'Statement of Marks' : 'Course Certificate'}`}
                        </h3>
                     </div>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center p-1.5 bg-white/10 rounded-2xl border border-white/20 mr-20">
                     <button 
                       onClick={() => setIsPreviewMode(false)}
                       className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${!isPreviewMode ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                     >
                        Edit Form
                     </button>
                     <button 
                       onClick={() => setIsPreviewMode(true)}
                       className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                     >
                        View Preview
                     </button>
                  </div>
                </div>
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
                {isPreviewMode ? (
                  <div className="p-12 flex justify-center bg-slate-200/50 min-h-full">
                    <div className="shadow-2xl origin-top scale-[0.85] transform-gpu">
                      {type === 'marksheet' ? (
                        <OfficialMarksheet 
                          id="marksheet-preview"
                          data={{
                            ...marksheetForm,
                            subjects,
                            profilePhoto: marksheetForm.profilePhoto || selectedStudent?.photo || selectedStudent?.profileData?.photoUrl,
                            signature: marksheetForm.signature || selectedStudent?.profileData?.signatureUrl
                          }}
                        />
                      ) : (
                        <OfficialCertificate 
                          id="certificate-preview"
                          data={{
                            ...marksheetForm,
                            profilePhoto: marksheetForm.profilePhoto || selectedStudent?.photo || selectedStudent?.profileData?.photoUrl,
                            signature: marksheetForm.signature || selectedStudent?.profileData?.signatureUrl
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 space-y-12">
                    {/* Section 1: Student Particulars */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
                          <div className="w-2 h-6 bg-[#00a5a5] rounded-full" />
                          <h4 className="text-xl font-black text-slate-800 tracking-tight capitalize">Student Particulars</h4>
                       </div>

                       {/* Selection Row */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200 shadow-xl border-dashed">
                          <div className="space-y-2">
                             <label className="text-[13px] font-black text-indigo-600 uppercase tracking-widest ml-1">Select Course Type</label>
                             <select 
                               value={marksheetForm.courseType}
                               onChange={(e) => setMarksheetForm({...marksheetForm, courseType: e.target.value, course: '', studentName: ''})}
                               className="w-full bg-white border-2 border-slate-200 rounded-2xl p-5 text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm hover:border-indigo-200"
                             >
                                <option value="">Choose Course Name...</option>
                                {uniqueCourseNames.map(name => <option key={name} value={name}>{name}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[13px] font-black text-indigo-600 uppercase tracking-widest ml-1">Select Course</label>
                              <select 
                                value={marksheetForm.course}
                                onChange={(e) => setMarksheetForm({...marksheetForm, course: e.target.value, studentName: ''})}
                                disabled={!marksheetForm.courseType}
                                className={`w-full bg-white border-2 border-slate-200 rounded-2xl p-5 text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm hover:border-indigo-200 ${!marksheetForm.courseType ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                 <option value="">{marksheetForm.courseType ? 'Choose Course Slug...' : 'Choose Course Type First'}</option>
                                 {filteredCourseSlugs.map(slug => <option key={slug} value={slug}>{slug}</option>)}
                              </select>
                           </div>
                          <div className="space-y-2">
                              <label className="text-[13px] font-black text-[#00a5a5] uppercase tracking-widest ml-1">Select Student</label>
                              <select 
                                value={selectedStudent?.id || ''}
                                onChange={(e) => handleStudentSelect(e.target.value)}
                                disabled={!marksheetForm.courseType || !marksheetForm.course}
                                className={`w-full bg-white border-2 border-[#00a5a5] rounded-2xl p-5 text-[14px] font-bold text-[#00a5a5] outline-none shadow-md cursor-pointer hover:bg-teal-50/50 transition-all ${(!marksheetForm.courseType || !marksheetForm.course) ? 'opacity-50 cursor-not-allowed border-slate-300 text-slate-400' : ''}`}
                              >
                                 <option value="">
                                    {!marksheetForm.courseType || !marksheetForm.course 
                                      ? 'PLEASE CHOOSE COURSE TYPE AND COURSE' 
                                      : 'Choose Student Name...'}
                                 </option>
                                 {students
                                   .filter(s => {
                                      const nameMatches = s.courseName === marksheetForm.courseType || s.courseType === marksheetForm.courseType;
                                      const slugMatches = getStudentCourseSlug(s) === marksheetForm.course;
                                      return nameMatches && slugMatches;
                                   })
                                   .map(s => <option key={s.id} value={s.id}>{s.studentName} ({s.regNo || 'NO REG'})</option>)
                                 }
                              </select>
                           </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                             { label: 'Student Name', value: marksheetForm.studentName, field: 'studentName', readOnly: true },
                             { label: 'Father Name', value: marksheetForm.fatherName, field: 'fatherName' },
                             { label: 'Mother Name', value: marksheetForm.motherName, field: 'motherName' },
                             { label: 'Date of Birth', value: marksheetForm.dob, field: 'dob', type: 'date' },
                             { label: 'College', value: marksheetForm.college, field: 'college' },
                             { label: 'Course Type', value: marksheetForm.courseType, field: 'courseType', readOnly: true },
                             { label: 'Course', value: marksheetForm.course, field: 'course', readOnly: true },
                             { label: 'Duration', value: marksheetForm.duration, field: 'duration' },
                             { label: 'Registration No.', value: marksheetForm.regNo, field: 'regNo' },
                             { label: 'Roll Number', value: marksheetForm.rollNumber, field: 'rollNumber' },
                             { label: type === 'marksheet' ? 'Marksheet No.' : 'Certificate Number', value: marksheetForm.marksheetNo, field: 'marksheetNo' },
                             ...(type === 'marksheet' ? [{ label: 'Grade', value: marksheetForm.grade, field: 'grade' }] : []),
                             { label: 'Issue Date', value: marksheetForm.issueDate, field: 'issueDate', type: 'date' },
                             ...(type === 'marksheet' ? [{ label: 'Result Date', value: marksheetForm.resultDate, field: 'resultDate', type: 'date' }] : []),
                           ].map((input: any, i) => (
                            <div key={i} className="space-y-2">
                               <label className="text-[13px] font-black text-black uppercase tracking-widest ml-1">{input.label}</label>
                               <input 
                                 type={input.type || 'text'}
                                 value={input.value}
                                 readOnly={input.readOnly}
                                 onChange={(e) => setMarksheetForm({...marksheetForm, [input.field]: e.target.value})}
                                 className={`w-full ${input.readOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'} border border-slate-200 rounded-2xl p-5 text-[14px] font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all shadow-sm`}
                               />
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Section 2: Subject-wise Performance */}
                    {type === 'marksheet' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-6 bg-[#5D5fb1] rounded-full" />
                              <h4 className="text-xl font-black text-slate-800 tracking-tight capitalize">Subject-wise Performance</h4>
                           </div>
                           <div className="flex items-center gap-4">
                              <button 
                                onClick={addSubject}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#5D5fb1] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                              >
                                 <Plus size={16} /> Add Subject
                              </button>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {subjects.map((subject, idx) => (
                             <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-left-4 duration-300">
                                <div className="md:col-span-3 space-y-2">
                                   <label className="text-[12px] font-black text-black uppercase tracking-widest">Subject Name</label>
                                   <input 
                                     type="text"
                                     placeholder="Subject Name"
                                     value={subject.name}
                                     onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-bold outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                                   />
                                </div>
                                 <div className="md:col-span-2 space-y-2">
                                   <label className="text-[12px] font-black text-black uppercase tracking-widest">Max Marks</label>
                                   <input 
                                     type="number"
                                     value={subject.maxMarks}
                                     onChange={(e) => updateSubject(idx, 'maxMarks', e.target.value)}
                                     onWheel={(e) => e.currentTarget.blur()}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-bold outline-none focus:bg-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                   />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                   <label className="text-[12px] font-black text-black uppercase tracking-widest">Passing Marks</label>
                                   <input 
                                     type="number"
                                     value={subject.passingMarks}
                                     onChange={(e) => updateSubject(idx, 'passingMarks', e.target.value)}
                                     onWheel={(e) => e.currentTarget.blur()}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-bold outline-none focus:bg-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                   />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                   <label className="text-[12px] font-black text-black uppercase tracking-widest">Obtain Marks</label>
                                   <input 
                                     type="number"
                                     placeholder="0"
                                     value={subject.obtainedMarks}
                                     onChange={(e) => updateSubject(idx, 'obtainedMarks', e.target.value)}
                                     onWheel={(e) => e.currentTarget.blur()}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-bold outline-none focus:bg-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                   />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                   <label className="text-[10px] font-black text-black uppercase tracking-widest">Result</label>
                                   <div className={`p-4 rounded-xl text-center text-[11px] font-black uppercase tracking-widest border ${subject.result === 'Pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                      {subject.result}
                                   </div>
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                   <button 
                                     onClick={() => removeSubject(idx)}
                                     className="p-4 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                   >
                                      <Trash2 size={20} />
                                   </button>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>

             {/* Modal Footer */}
             <div className="p-10 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                   <div className="text-left">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Total Subjects</p>
                      <p className="text-xl font-black text-slate-800">{subjects.length}</p>
                   </div>
                   <div className="w-px h-10 bg-slate-200" />
                   <div className="text-left">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Aggregate Status</p>
                      <p className={`text-xl font-black ${subjects.every(s => s.result === 'Pass') ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {subjects.every(s => s.result === 'Pass') ? 'PASS' : 'FAIL'}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setIsModalOpen(false)}
                     className="px-8 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-black hover:text-black hover:bg-slate-600 transition-all"
                   >
                      Cancel
                   </button>
                    <button 
                      onClick={handleSaveCredential}
                      disabled={isGenerating}
                      className={`px-12 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${type === 'marksheet' ? 'bg-[#002147] hover:bg-[#003366]' : 'bg-[#5D5fb1] hover:bg-[#4e50a1]'} ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                       {isGenerating ? (
                         <>
                           <Loader2 size={18} className="animate-spin" />
                           {editingRecordId ? 'UPDATING...' : 'GENERATING...'}
                         </>
                       ) : (
                         <>
                           <FileText size={18} /> {editingRecordId ? 'UPDATE' : 'GENERATE'} {type === 'marksheet' ? 'STATEMENT OF MARKS' : 'CERTIFICATE'}
                         </>
                       )}
                    </button>
                 </div>
              </div>
           </div>
         </div>
       )}
 
       {/* Hidden Template for PDF Generation */}
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          {type === 'marksheet' ? (
            <OfficialMarksheet 
              ref={credentialRef}
              id="marksheet-download-template"
              data={{
                ...marksheetForm,
                subjects,
                profilePhoto: marksheetForm.profilePhoto || selectedStudent?.photo || selectedStudent?.photoUrl || selectedStudent?.profileData?.photoUrl || selectedStudent?.profile?.photoUrl || selectedStudent?.profileData?.profilePhoto,
                signature: marksheetForm.signature || selectedStudent?.signature || selectedStudent?.signatureUrl || selectedStudent?.profileData?.signatureUrl || selectedStudent?.profileData?.signUrl || selectedStudent?.profile?.signUrl || selectedStudent?.signUrl || selectedStudent?.profileData?.sign
              }}
            />
          ) : (
            <OfficialCertificate 
              ref={credentialRef}
              id="certificate-download-template"
              data={{
                ...marksheetForm,
                profilePhoto: marksheetForm.profilePhoto || selectedStudent?.photo || selectedStudent?.photoUrl || selectedStudent?.profileData?.photoUrl || selectedStudent?.profile?.photoUrl || selectedStudent?.profileData?.profilePhoto,
                signature: marksheetForm.signature || selectedStudent?.signature || selectedStudent?.signatureUrl || selectedStudent?.profileData?.signatureUrl || selectedStudent?.profileData?.signUrl || selectedStudent?.profile?.signUrl || selectedStudent?.signUrl || selectedStudent?.profileData?.sign
              }}
            />
          )}
       </div>
    </div>
  );
}
