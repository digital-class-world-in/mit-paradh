'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
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
  Award
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export default function ExamManager({ collegeId, defaultCreate }: { collegeId: string | undefined, defaultCreate?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(defaultCreate || false);
  const [examForm, setExamForm] = useState({
    examTitle: '',
    courseType: '',
    course: '',
    student: '',
    startDate: '',
    startTime: '',
    durationHours: '1',
    durationMinutes: '0',
    passingPercentage: '33',
    collegeId: collegeId || ''
  });

  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [availableCourseTypes, setAvailableCourseTypes] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all colleges if no collegeId (Admin Mode)
    if (!collegeId) {
      const collegesRef = ref(realtimeDb, 'colleges');
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
      const coursesRef = ref(realtimeDb, `colleges/${targetId}/courses`);
      onValue(coursesRef, (snap) => {
        if (snap.exists()) {
          setAvailableCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setAvailableCourses([]);
        }
      });

      const studentsRef = ref(realtimeDb, `colleges/${targetId}/students`);
      onValue(studentsRef, (snap) => {
        if (snap.exists()) {
          setAvailableStudents(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setAvailableStudents([]);
        }
      });

      const typesRef = ref(realtimeDb, `colleges/${targetId}/settings/courseTypes`);
      onValue(typesRef, (snap) => {
        if (snap.exists()) {
          setAvailableCourseTypes(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setAvailableCourseTypes([]);
        }
      });
    }
  }, [collegeId, examForm.collegeId]);

  // Dependent Reset Logic
  useEffect(() => {
    setExamForm(prev => ({ ...prev, course: '', student: '' }));
  }, [examForm.courseType, examForm.collegeId]);

  useEffect(() => {
    setExamForm(prev => ({ ...prev, student: '' }));
  }, [examForm.course]);

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

  const handleQuestionChange = (id: string, field: keyof Question, value: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handlePublish = () => {
    console.log('Publishing Exam:', { ...examForm, questions });
    alert('Exam published successfully!');
    setIsModalOpen(false);
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
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-white text-[#5D5fb1] px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-3"
        >
          <Plus size={20} strokeWidth={3} /> Create New Exam
        </button>
      </div>

      {/* Empty State / List Placeholder */}
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

      {/* Create Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-black flex items-center justify-between bg-white shrink-0">
              <h3 className="text-xl font-black text-slate-800 capitalize tracking-tight">Setup Online Examination</h3>
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
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Select Institution</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                        value={examForm.collegeId}
                        onChange={(e) => setExamForm({...examForm, collegeId: e.target.value})}
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
                <div className={cn("space-y-2", !collegeId ? "md:col-span-2" : "md:col-span-4")}>
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Exam Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter Exam Title"
                    className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                    value={examForm.examTitle}
                    onChange={(e) => setExamForm({...examForm, examTitle: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Type</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                      value={examForm.courseType}
                      onChange={(e) => setExamForm({...examForm, courseType: e.target.value})}
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
                      onChange={(e) => setExamForm({...examForm, course: e.target.value})}
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Target Assessment</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all cursor-pointer"
                      value={examForm.student}
                      onChange={(e) => setExamForm({...examForm, student: e.target.value})}
                    >
                      <option value="">All Students</option>
                      {availableStudents
                        .filter(s => {
                          const matchesType = !examForm.courseType || s.courseType === examForm.courseType;
                          const matchesCourse = !examForm.course || s.courseId === examForm.course;
                          return matchesType && matchesCourse;
                        })
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Exam Duration</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                       <input 
                        type="number" 
                        placeholder="HH"
                        className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                        value={examForm.durationHours}
                        onChange={(e) => setExamForm({...examForm, durationHours: e.target.value})}
                      />
                    </div>
                    <div className="flex-1 relative">
                       <input 
                        type="number" 
                        placeholder="MM"
                        className="w-full bg-slate-50 border border-black rounded-2xl p-5 text-sm font-normal text-black outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all"
                        value={examForm.durationMinutes}
                        onChange={(e) => setExamForm({...examForm, durationMinutes: e.target.value})}
                      />
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
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 text-black text-[13px] font-normal capitalize tracking-tight hover:bg-[#5D5fb1] hover:text-black transition-all shadow-sm">
                      <Download size={14} /> Sample CSV
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 text-black text-[13px] font-normal capitalize tracking-tight hover:bg-[#00a5a5] hover:text-black transition-all shadow-sm">
                      <Upload size={14} /> Upload CSV
                    </button>
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
                <Upload size={20} /> Publish Online Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




