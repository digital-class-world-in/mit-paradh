'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { getDefaultAdminUid } from '@/lib/adminUtils';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  Download, 
  X, 
  Calendar, 
  Clock, 
  Percent,
  CheckCircle2,
  ChevronDown,
  Award,
  Edit2,
  Eye,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import GlobalDataFilter, { FilterState, applyGlobalFilters } from './GlobalDataFilter';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Question {
  id: string;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: string;
  marks: string;
}

export default function ExamManager({ collegeId, defaultCreate, adminUid }: { collegeId: string | undefined, defaultCreate?: boolean, adminUid?: string }) {
  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || "");
  useEffect(() => { if (adminUid) { setResolvedAdminUid(adminUid); } else { getDefaultAdminUid().then(setResolvedAdminUid); } }, [adminUid]);
  const getDbRef = (path: string) => { const clean = path.startsWith("/") ? path.slice(1) : path; const adminId = resolvedAdminUid || "default-admin-uid"; if (clean.startsWith("users/")) return ref(realtimeDb, clean); return ref(realtimeDb, `users/${adminId}/modules/${clean}`); };
  const [isModalOpen, setIsModalOpen] = useState(defaultCreate || false);
  const [examForm, setExamForm] = useState<any>({
    examName: '',
    courseType: '',
    course: '',
    student: '',
    startDate: '',
    startTime: '',
    durationHours: '1',
    durationMinutes: '0',
    passingPercentage: '33',
    totalQuestions: '10',
    collegeId: collegeId || ''
  });

  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [availableCourseTypes, setAvailableCourseTypes] = useState<any[]>([]);
  const [publishedExams, setPublishedExams] = useState<any[]>([]);
  const [viewingSubmissions, setViewingSubmissions] = useState<any[] | null>(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState<any | null>(null);
  
  const [globalFilters, setGlobalFilters] = useState<FilterState>({
    collegeName: '', courseType: '', courseName: '', duration: '', semester: '', stream: ''
  });
  
  const filteredExams = applyGlobalFilters(publishedExams, globalFilters);

  useEffect(() => {
    // Fetch all colleges if no collegeId (Admin Mode)
    if (!collegeId) {
      const collegesRef = getDbRef('colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      });
    }
  }, [collegeId]);
  
  useEffect(() => {
    if (defaultCreate) setIsModalOpen(true);
  }, [defaultCreate]);

  useEffect(() => {
    const targetId = collegeId || examForm.collegeId;
    if (targetId) {
      const coursesRef = getDbRef(`colleges/${targetId}/courses`);
      onValue(coursesRef, (snap) => {
        if (snap.exists()) {
          setAvailableCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setAvailableCourses([]);
        }
      });

      const studentsRef = getDbRef(`colleges/${targetId}/students`);
      onValue(studentsRef, (snap) => {
        if (snap.exists()) {
          setAvailableStudents(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setAvailableStudents([]);
        }
      });

      const typesRef = getDbRef(`colleges/${targetId}/settings/courseTypes`);
      onValue(typesRef, (snap) => {
        if (snap.exists()) {
          setAvailableCourseTypes(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setAvailableCourseTypes([]);
        }
      });

      const examsRef = getDbRef(`colleges/${targetId}/onlineExams`);
      onValue(examsRef, (snap) => {
        if (snap.exists()) {
          setPublishedExams(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setPublishedExams([]);
        }
      });
    }
  }, [collegeId, examForm.collegeId]);


  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      questionText: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correctAnswer: 'Option 1',
      marks: '1'
    }
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        questionText: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctAnswer: 'Option 1',
        marks: '1'
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const fetchSubmissions = (examId: string) => {
    const targetId = collegeId || examForm.collegeId;
    if (!targetId) return;
    const submissionsRef = getDbRef(`colleges/${targetId}/onlineExams/${examId}/submissions`);
    onValue(submissionsRef, (snap) => {
      if (snap.exists()) {
        setViewingSubmissions(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setViewingSubmissions([]);
      }
    });
  };

  const handleQuestionChange = (id: string, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleDownloadSampleExcel = () => {
    const headers = ['Question Text', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer', 'Marks'];
    const sampleRow = ['What is the capital of France?', 'Paris', 'London', 'Berlin', 'Madrid', 'Option 1', '1'];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), sampleRow.map(v => `"${v}"`).join(',')].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Exam_Questions_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublish = async () => {
    if (!examForm.examName || !examForm.course) {
      alert('Please fill exam name and select course.');
      return;
    }

    const targetId = collegeId || examForm.collegeId;
    if (!targetId) {
      alert('College ID is missing.');
      return;
    }

    try {
      const examsRef = getDbRef(`colleges/${targetId}/onlineExams`);
      const isEditing = !!examForm.id;
      const targetExamRef = isEditing 
        ? getDbRef(`colleges/${targetId}/onlineExams/${examForm.id}`)
        : push(examsRef);
      
      const examData = {
        ...examForm,
        id: isEditing ? examForm.id : targetExamRef.key,
        questions,
        publishedAt: isEditing ? (examForm.publishedAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: isEditing ? new Date().toISOString() : null,
        status: 'Active'
      };

      await set(targetExamRef, examData);
      alert(isEditing ? 'Online Assessment updated successfully!' : 'Online Assessment published successfully! It will now be visible to students.');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to publish exam.');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header Banner */}
      <div className="bg-[#5D5fb1] rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            <FileText size={14} className="text-[#00a5a5]" /> Examination Module
          </div>
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Exam Management</h2>
          <p className="text-sm font-normal text-white/60">Configure and schedule online assessments for students.</p>
        </div>
         <button 
          onClick={() => {
            setExamForm({
              examName: '',
              courseType: '',
              course: '',
              student: '',
              startDate: '',
              startTime: '',
              durationHours: '1',
              durationMinutes: '0',
              passingPercentage: '33',
              totalQuestions: '10',
              collegeId: collegeId || ''
            });
            setQuestions([{
              id: '1',
              questionText: '',
              option1: '',
              option2: '',
              option3: '',
              option4: '',
              correctAnswer: 'Option 1',
              marks: '1'
            }]);
            setIsModalOpen(true);
          }}
          className="relative z-10 bg-white text-[#5D5fb1] px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-3"
        >
          <Plus size={20} strokeWidth={3} /> Create New Exam
        </button>
      </div>

      {/* Exams List Table */}
      {publishedExams.length > 0 && (
        <div className="mb-4">
          <GlobalDataFilter 
            data={publishedExams} 
            filters={globalFilters} 
            setFilters={setGlobalFilters} 
          />
        </div>
      )}
      
      {filteredExams.length > 0 ? (
        <div className="bg-white rounded-[3rem] border border-black shadow-sm overflow-hidden p-8">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse border border-black">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-black whitespace-nowrap">
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center w-16">Sr.No</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Exam Name</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Course Type</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Course</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Date & Time</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Questions Added</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Target Questions</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Created Date</th>
                      <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-black">
                   {filteredExams.map((exam, idx) => (
                      <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                         <td className="px-6 py-6 border-r border-black text-center font-medium">{idx + 1}</td>
                         <td className="px-6 py-6 border-r border-black font-bold text-slate-800">{exam.examName || exam.examTitle || 'N/A'}</td>
                         <td className="px-6 py-6 border-r border-black text-center">
                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-200">{exam.courseType}</span>
                         </td>
                         <td className="px-6 py-6 border-r border-black font-bold text-slate-800">{exam.course}</td>
                         <td className="px-6 py-6 border-r border-black text-center">
                            <div className="flex flex-col items-center">
                               <span className="text-sm font-bold text-black">{exam.startDate}</span>
                               <span className="text-xs text-slate-400 font-medium">{exam.startTime}</span>
                            </div>
                         </td>
                         <td className="px-6 py-6 border-r border-black text-center font-bold">{exam.questions?.length || 0}</td>
                         <td className="px-6 py-6 border-r border-black text-center font-bold text-[#00a5a5]">{exam.totalQuestions || '0'}</td>
                         <td className="px-6 py-6 border-r border-black text-center font-medium text-sm text-slate-500">
                            {exam.publishedAt ? new Date(exam.publishedAt).toLocaleDateString('en-GB') : 'N/A'}
                         </td>
                         <td className="px-6 py-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                 onClick={() => {
                                   setExamForm(exam);
                                   setQuestions(exam.questions || []);
                                   setIsModalOpen(true);
                                 }}
                                 className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                 title="Edit Exam"
                               >
                                  <Edit2 size={16} />
                               </button>
                               <button 
                                 onClick={() => {
                                   setSelectedExamForResults(exam);
                                   fetchSubmissions(exam.id);
                                 }}
                                 className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                 title="Preview Results"
                               >
                                  <Eye size={16} />
                               </button>
                               <button 
                                 onClick={() => {
                                   if (window.confirm('Are you sure you want to delete this exam?')) {
                                     const examRef = getDbRef(`colleges/${collegeId || examForm.collegeId}/onlineExams/${exam.id}`);
                                     set(examRef, null);
                                   }
                                 }}
                                 className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                 title="Delete Exam"
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
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-black shadow-sm p-20 text-center">
          <div className="flex flex-col items-center gap-6 text-slate-300">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-black shadow-inner">
              <FileText size={48} className="opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-normal tracking-normal capitalize text-black">No Exams Scheduled</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Create your first online examination to start assessing student performance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-black flex items-center justify-between bg-white shrink-0">
               <h3 className="text-xl font-black text-slate-800 capitalize tracking-tight">
                {examForm.id ? 'Edit Online Examination' : 'Setup Online Examination'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
              {/* Form Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {!collegeId && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Select Institution</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                        value={examForm.collegeId}
                        onChange={(e) => setExamForm({...examForm, collegeId: e.target.value, courseType: '', course: '', student: ''})}
                      >
                        <option value="">Select College</option>
                        {availableColleges.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                <div className="space-y-2 md:col-span-4 lg:col-span-4">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Exam Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter Exam Name"
                    className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                    value={examForm.examName}
                    onChange={(e) => setExamForm({...examForm, examName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Type</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                      value={examForm.courseType}
                      onChange={(e) => setExamForm({...examForm, courseType: e.target.value, course: '', student: ''})}
                    >
                      <option value="">Select Course Type</option>
                      {availableCourseTypes.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                      {availableCourseTypes.length === 0 && (
                        <>
                          <option value="Regular">Regular</option>
                          <option value="Distance">Distance</option>
                          <option value="Online">Online</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                      value={examForm.course}
                      onChange={(e) => setExamForm({...examForm, course: e.target.value, student: ''})}
                    >
                      <option value="">Select Course</option>
                      {availableCourses
                        .filter(c => !examForm.courseType || c.type === examForm.courseType)
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>


                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Calendar size={12} /> Start Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({...examForm, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Clock size={12} /> Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({...examForm, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Exam Duration (in Minutes)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="e.g. 90"
                      className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all pr-24"
                      value={(parseInt(examForm.durationHours || '0') * 60) + parseInt(examForm.durationMinutes || '0')}
                      onChange={(e) => {
                        const totalMins = Math.max(0, parseInt(e.target.value) || 0);
                        setExamForm({
                          ...examForm, 
                          durationHours: Math.floor(totalMins / 60).toString(),
                          durationMinutes: (totalMins % 60).toString()
                        });
                      }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black tracking-widest text-[#00a5a5] pointer-events-none bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                      {examForm.durationHours}H {examForm.durationMinutes}M
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Percent size={12} /> Passing Percentage (%)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                    value={examForm.passingPercentage}
                    onChange={(e) => setExamForm({...examForm, passingPercentage: e.target.value})}
                  />
                </div>
              </div>

              {/* Assessment Registry */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h4 className="text-lg font-black text-slate-800 capitalize tracking-tight">Assessment Registry</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 mr-4">
                       <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Total Question</label>
                       <input 
                        type="number" 
                        className="w-24 bg-slate-50 border border-black rounded-xl p-3 text-sm font-bold text-center"
                        value={examForm.totalQuestions}
                        onChange={(e) => {
                          const val = e.target.value;
                          const count = parseInt(val) || 0;
                          setExamForm({...examForm, totalQuestions: val});
                          
                          // Automatic question generation/removal
                          setQuestions(prev => {
                            if (count > prev.length) {
                              const additional = Array.from({ length: count - prev.length }, (_, i) => ({
                                id: Date.now().toString() + i,
                                questionText: '',
                                option1: '',
                                option2: '',
                                option3: '',
                                option4: '',
                                correctAnswer: 'Option 1',
                                marks: '1'
                              }));
                              return [...prev, ...additional];
                            } else if (count < prev.length) {
                              return prev.slice(0, count);
                            }
                            return prev;
                          });
                        }}
                      />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={handleDownloadSampleExcel} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 text-black text-[13px] font-normal capitalize tracking-tight hover:bg-[#5D5fb1] hover:text-white transition-all shadow-sm">
                        <Download size={14} /> Sample Excel
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 text-black text-[13px] font-normal capitalize tracking-tight hover:bg-[#00a5a5] hover:text-black transition-all shadow-sm">
                        <Upload size={14} /> Upload Excel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-black relative group transition-all hover:bg-white hover:shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-[13px] font-normal text-black capitalize tracking-normal">Question {idx + 1}</span>
                        <button 
                          onClick={() => removeQuestion(q.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-2">
                          <textarea 
                            placeholder="Type question here..."
                            rows={3}
                            className="w-full bg-white border border-black rounded-2xl p-6 text-sm font-normal text-black outline-none focus:ring-4 focus:ring-teal-50 transition-all"
                            value={q.questionText}
                            onChange={(e) => handleQuestionChange(q.id, 'questionText', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((optLabel, i) => (
                            <div key={i} className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 capitalize tracking-tight pl-1">{optLabel}</label>
                              <input 
                                type="text" 
                                placeholder={optLabel}
                                className="w-full bg-white border border-black rounded-xl p-4 text-sm font-normal text-black outline-none focus:ring-4 focus:ring-teal-50 transition-all"
                                value={(q as any)[`option${i+1}`]}
                                onChange={(e) => handleQuestionChange(q.id, `option${i+1}` as keyof Question, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><CheckCircle2 size={12} /> Correct Answer</label>
                            <div className="relative">
                              <select 
                                className="w-full bg-white border border-black rounded-xl p-4 text-sm font-normal text-black outline-none appearance-none focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                                value={q.correctAnswer}
                                onChange={(e) => handleQuestionChange(q.id, 'correctAnswer', e.target.value)}
                              >
                                <option value="Option 1">Option 1</option>
                                <option value="Option 2">Option 2</option>
                                <option value="Option 3">Option 3</option>
                                <option value="Option 4">Option 4</option>
                              </select>
                              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Marks</label>
                            <input 
                              type="number" 
                              className="w-full bg-white border border-black rounded-xl p-4 text-sm font-normal text-black outline-none focus:ring-4 focus:ring-teal-50 transition-all"
                              value={q.marks}
                              onChange={(e) => handleQuestionChange(q.id, 'marks', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={addQuestion}
                  className="w-full py-6 rounded-3xl border-2 border-dashed border-black text-black font-normal text-[13px] capitalize tracking-normal hover:bg-slate-50 hover:border-teal-200 hover:text-black transition-all flex items-center justify-center gap-3"
                >
                  <Plus size={18} /> Add Manual Question
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-start shrink-0">
               <button 
                onClick={handlePublish}
                className="bg-[#895AF6] text-white px-12 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-2xl hover:opacity-90 transition-all flex items-center gap-3 active:scale-95"
              >
                <Upload size={20} /> {examForm.id ? 'Update Online Assessment' : 'Publish Online Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Submissions Modal */}
      {selectedExamForResults && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setSelectedExamForResults(null)} />
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
             <div className="bg-[#5D5fb1] p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black tracking-tight">{selectedExamForResults.examName} Result List</h3>
                      <p className="text-xs text-white/60 mt-1 uppercase tracking-widest font-bold">Academic Performance Report</p>
                   </div>
                </div>
                <button onClick={() => setSelectedExamForResults(null)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                   <X size={20} />
                </button>
             </div>
             <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left border-collapse border border-black shadow-sm">
                   <thead className="bg-slate-50 border-b border-black">
                      <tr className="text-[11px] font-black uppercase text-black tracking-widest">
                         <th className="px-6 py-5 border-r border-black text-center w-16">Sr.No</th>
                         <th className="px-6 py-4 border-r border-black">Student Name</th>
                         <th className="px-6 py-4 border-r border-black text-center">Total Marks</th>
                         <th className="px-6 py-4 border-r border-black text-center">Obtained Marks</th>
                         <th className="px-6 py-4 border-r border-black text-center">Time Consumed</th>
                         <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-black">
                      {(viewingSubmissions || []).map((sub: any, i: number) => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors border-b border-black text-sm">
                           <td className="px-6 py-5 border-r border-black text-center font-bold text-slate-500">{i + 1}</td>
                           <td className="px-6 py-4 border-r border-black font-black text-slate-800 uppercase">{sub.studentName || 'Student Name'}</td>
                           <td className="px-6 py-4 border-r border-black text-center font-bold text-slate-400">{sub.totalMarks || selectedExamForResults.totalMarks || '100'}</td>
                           <td className="px-6 py-4 border-r border-black text-center font-black text-emerald-600">{sub.obtainedMarks || '0'}</td>
                           <td className="px-6 py-4 border-r border-black text-center font-bold text-amber-600">
                              <div className="flex items-center justify-center gap-1">
                                 <Clock size={12} /> {sub.timeConsumed || '0'} Min
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full font-black text-[10px] uppercase border",
                                parseFloat(sub.obtainedMarks) >= parseFloat(selectedExamForResults.passingPercentage) * (parseFloat(sub.totalMarks)/100) 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                : "bg-rose-50 text-rose-600 border-rose-200"
                              )}>
                                {parseFloat(sub.obtainedMarks) >= parseFloat(selectedExamForResults.passingPercentage) * (parseFloat(sub.totalMarks)/100) ? 'Passed' : 'Failed'}
                              </span>
                           </td>
                        </tr>
                      ))}
                      {viewingSubmissions?.length === 0 && (
                        <tr>
                           <td colSpan={6} className="p-24 text-center">
                              <div className="flex flex-col items-center gap-4 text-slate-300">
                                 <Users size={48} className="opacity-20" />
                                 <p className="text-sm font-bold text-slate-400">No submissions found for this examination.</p>
                              </div>
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}




