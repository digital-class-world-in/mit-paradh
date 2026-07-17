'use client';

import { useEffect, useState, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentAuth, realtimeDb, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, onValue, set, push, update } from 'firebase/database';
import ApplicationPreviewModal from '@/components/ApplicationPreviewModal';
import StudentNoticeBoard from '@/components/StudentNoticeBoard';
import StudentIDCard from '@/components/StudentIDCard';
import ProfileWizard from '@/components/ProfileWizard';
import StudentNavbar from '@/components/StudentNavbar';
import { QRCodeCanvas } from 'qrcode.react';
import { safeHtml2Canvas as html2canvas } from '@/lib/safeHtml2Canvas';
import jsPDF from 'jspdf';
import { OfficialMarksheet } from '@/components/OfficialMarksheet';
import { OfficialCertificate } from '@/components/OfficialCertificate';
import {
  LayoutDashboard,
  User,
  MapPin,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  FileBadge,
  X,
  ChevronDown,
  ShieldCheck,
  PenTool,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  Camera,
  Copy,
  Download,
  XCircle,
  Clock,
  Building2,
  FileText,
  Save,
  Plus,
  GraduationCap,
  Users,
  Tag,
  Landmark,
  Briefcase,
  Award,
  Image as ImageIcon,
  Phone,
  Mail,
  ChevronRight,
  Trash2,
  History,
  Printer,
  Loader2,
  Upload,
  Filter,
  RotateCcw,
  Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

// --- Reusable ERP Components ---

const Widget = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="glass-effect p-6 rounded-3xl border-2 border-white/40 flex items-center justify-between group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform`} />
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-white shadow-sm border border-slate-200 ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[13px] font-medium capitalize tracking-tight text-black mb-0.5">{label}</p>
        <p className="text-xl font-medium text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
    <div className="text-[13px] font-medium text-black bg-emerald-50 px-2 py-1 rounded-md">{trend}</div>
  </div>
);

const PreviewItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col gap-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-[14px] font-bold text-slate-800 capitalize tracking-tight">{value || 'Not Provided'}</p>
  </div>
);

const CredentialDownloader = ({ credential }: { credential: any }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!hiddenRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(hiddenRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const orientation = credential.type === 'certificate' ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${credential.type === 'marksheet' ? 'Marksheet' : 'Certificate'}_${credential.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Failed to download document. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={cn(
          "p-3 text-[#002147] hover:bg-slate-100 rounded-xl transition-all active:scale-90",
          isDownloading && "opacity-50 cursor-not-allowed"
        )}
        title="Download PDF"
      >
        {isDownloading ? (
          <div className="relative flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[#00a5a5]" />
          </div>
        ) : <Download size={20} />}
      </button>

      {/* Hidden Template for Capture */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none overflow-hidden opacity-0">
        <div style={{ padding: '0', margin: '0' }}>
          {credential.type === 'marksheet' ? (
            <OfficialMarksheet ref={hiddenRef} data={credential} id={`print-${credential.id}`} />
          ) : (
            <OfficialCertificate ref={hiddenRef} data={credential} id={`print-${credential.id}`} />
          )}
        </div>
      </div>
    </>
  );
};

// --- Modular Tab Components ---

const MarksheetModule = ({ credentials }: { credentials: any[] }) => {
  const marksheetRecords = credentials.filter(c => c.type === 'marksheet');

  if (marksheetRecords.length > 0) {
    return (
      <div className="bg-white rounded-[2rem] border-2 border-black overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-black p-6 text-white">
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <Award size={24} className="text-amber-400" />
            Issued Marksheets
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-black">
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Sr. No.</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Marksheet No.</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Student Name</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">College</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Course Type</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Course</th>
                <th className="px-6 py-4 text-center text-[12px] font-black uppercase tracking-widest text-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {marksheetRecords.map((record, index) => (
                <tr key={record.id} className="border-b-2 border-black hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-800">{index + 1}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-black text-indigo-700">{record.marksheetNo}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-800 uppercase">{record.studentName}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-600">{record.college || 'MIT PARADH'}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-indigo-600">{record.courseType}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-800">{record.course}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center">
                      <CredentialDownloader credential={record} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-32 glass-effect rounded-[3rem] border-2 border-white shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-32 h-32 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-amber-100 shadow-2xl shadow-amber-500/10 relative">
        <div className="absolute inset-0 bg-amber-500/5 rounded-[2.5rem] animate-pulse" />
        <Award size={56} className="text-amber-500 relative z-10" />
      </div>
      <div className="space-y-4">
        <h3 className="text-4xl font-black text-[#002147] tracking-tighter uppercase italic">Statement of Marks</h3>
        <p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">Your official academic marksheet and performance record will be available for download here once the examination results are formally declared by the institutional board.</p>
      </div>
      <div className="pt-6">
        <div className="inline-flex items-center gap-3 px-8 py-3 bg-slate-100 text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] border border-slate-200">
          <Clock size={16} className="animate-spin [animation-duration:3s]" /> Result Status: Awaited
        </div>
      </div>
    </div>
  );
};

const QuestionPaperModule = ({ exams, activeApp, userData }: any) => {
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewExam, setReviewExam] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (activeExam) {
      const totalSeconds = (parseInt(activeExam.durationHours || '1') * 3600) + (parseInt(activeExam.durationMinutes || '0') * 60);
      setTimeLeft(totalSeconds);

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-submit logic could go here if needed
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeExam]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = (exam: any) => {
    // Check Date and Time
    const now = new Date();
    const [year, month, day] = exam.startDate.split('-').map(Number);
    const [h, m] = exam.startTime.split(':').map(Number);
    const examDate = new Date(year, month - 1, day, h, m);

    if (now < examDate) {
      const diff = examDate.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      alert(`Access Denied: This exam is scheduled for ${exam.startDate} at ${exam.startTime}. Starts in ${hours}h ${mins}m.`);
      return;
    }

    setActiveExam(exam);
    setStartTime(Date.now());
    setAnswers({});
  };

  const handleSubmit = async () => {
    if (!activeExam || !userData || !activeApp) return;

    const answeredCount = Object.keys(answers).length;
    const totalCount = activeExam.questions?.length || 0;

    if (!confirm(`You have answered ${answeredCount} out of ${totalCount} questions. Are you sure you want to submit?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      let obtainedMarks = 0;
      activeExam.questions.forEach((q: any) => {
        const correctKey = q.correctAnswer ? q.correctAnswer.toLowerCase().replace(' ', '') : 'option1';
        const correctText = q[correctKey];
        if (answers[q.id] === correctText) {
          obtainedMarks += parseFloat(q.marks || '1');
        }
      });

      const timeConsumed = Math.round((Date.now() - startTime) / 60000); // in minutes
      const totalMarks = activeExam.questions.reduce((acc: number, q: any) => acc + parseFloat(q.marks || '1'), 0);

      const submission = {
        studentUid: userData.uid,
        studentName: `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim() || userData.studentName || 'Student',
        totalMarks,
        obtainedMarks,
        timeConsumed,
        submittedAt: new Date().toISOString(),
        status: obtainedMarks >= (parseFloat(activeExam.passingPercentage || '33') * totalMarks / 100) ? 'Passed' : 'Failed',
        answers: answers
      };

      const subRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/onlineExams/${activeExam.id}/submissions/${userData.uid}`);
      await set(subRef, submission);

      alert(`Assessment Submitted Successfully!\nYour Score: ${obtainedMarks} / ${totalMarks}\nStatus: ${submission.status}`);
      setActiveExam(null);
    } catch (err) {
      console.error(err);
      alert('Failed to submit exam. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reviewExam) {
    const submission = reviewExam.submissions?.[userData.uid];
    const studentAnswers = submission?.answers || {};

    return (
      <div className="fixed inset-0 z-[300] bg-[#f8f9fc] flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-white border-b-8 border-[#1a73e8] p-6 shadow-sm shrink-0 relative z-10">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl p-2 border border-blue-100 flex items-center justify-center">
                <FileText size={32} className="text-[#1a73e8]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#1a73e8] tracking-tight leading-none uppercase italic">EXAM REVIEW</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{reviewExam.examName || reviewExam.examTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div className="flex flex-col items-end border-r border-slate-200 pr-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Result Status</span>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-2xl font-black tracking-tighter",
                    submission?.status === 'Passed' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {submission?.status || 'N/A'}
                  </span>
                  <span className="text-sm font-bold text-slate-400">({submission?.obtainedMarks || 0}/{submission?.totalMarks || 0})</span>
                </div>
              </div>
              <button
                onClick={() => setReviewExam(null)}
                className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar scroll-smooth">
          <div className="max-w-3xl mx-auto p-8 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Review Summary</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Below are the questions from your assessment along with your selected answers.
            </p>
          </div>

          {(reviewExam.questions || []).map((q: any, i: number) => {
            const studentAns = studentAnswers[q.id];
            const correctKey = q.correctAnswer ? q.correctAnswer.toLowerCase().replace(' ', '') : 'option1';
            const correctText = q[correctKey];
            const isCorrect = studentAns === correctText;
            return (
              <div key={q.id} className="max-w-3xl mx-auto p-8 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6 relative overflow-hidden">
                {studentAns && (
                  <div className={cn(
                    "absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl",
                    isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                )}
                <div className="space-y-4">
                  <p className="text-lg font-medium text-slate-900">
                    <span className="mr-2 text-slate-400 font-bold">{i + 1}.</span> {q.questionText || 'Question text not available.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {['option1', 'option2', 'option3', 'option4'].map((optKey) => {
                    const optValue = q[optKey];
                    if (!optValue) return null;
                    const isStudentSelected = studentAns === optValue;
                    const isCorrectAns = correctText === optValue;

                    return (
                      <div key={optKey} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                        isStudentSelected && isCorrect ? "bg-emerald-50 border-emerald-500" :
                          isStudentSelected && !isCorrect ? "bg-rose-50 border-rose-500" :
                            isCorrectAns ? "bg-emerald-50/50 border-emerald-200 border-dashed" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isStudentSelected ? (isCorrect ? "border-emerald-600 bg-emerald-600" : "border-rose-600 bg-rose-600") : "border-slate-300 bg-white"
                          )}>
                            {isStudentSelected && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner" />}
                          </div>
                          <span className={cn(
                            "text-[15px]",
                            isStudentSelected ? "text-slate-900 font-bold" : "text-slate-600 font-normal"
                          )}>
                            {optValue}
                          </span>
                        </div>
                        {isCorrectAns && !isStudentSelected && (
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-emerald-100">Correct Answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="max-w-3xl mx-auto pt-4 pb-24 text-center">
            <button
              onClick={() => setReviewExam(null)}
              className="bg-slate-800 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
            >
              Close Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeExam) {
    return (
      <div className="fixed inset-0 z-[300] bg-[#f0ebf8] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-white border-b-8 border-[#673ab7] p-6 shadow-sm shrink-0 relative z-10">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl p-2 border border-slate-100 flex items-center justify-center">
                <img src={activeApp.collegeLogo || "/logo.png"} alt="College Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#673ab7] tracking-tight leading-none uppercase italic">MIT PARADH</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{activeExam.examName || activeExam.examTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Time Remaining</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                    <Clock size={20} className={timeLeft < 300 ? "animate-pulse" : ""} />
                  </div>
                  <span className={cn(
                    "text-3xl font-mono font-black tracking-tighter",
                    timeLeft < 300 ? "text-rose-600 animate-pulse" : "text-slate-800"
                  )}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar scroll-smooth">
          {/* Description Card */}
          <div className="max-w-3xl mx-auto p-8 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Assessment Guidelines</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Welcome to the online assessment module. Please ensure you have a stable internet connection. Do not refresh or close the page during the exam. Your remaining time is displayed at the top right.
            </p>
          </div>

          {(activeExam.questions || []).map((q: any, i: number) => (
            <div key={q.id} className="max-w-3xl mx-auto p-8 bg-white border border-slate-200 rounded-xl shadow-sm space-y-6">
              <div className="space-y-4">
                <p className="text-lg font-medium text-slate-900">
                  <span className="mr-2 text-slate-400 font-bold">{i + 1}.</span> {q.questionText || 'Question text not available.'}
                </p>
              </div>

              <div className="space-y-3">
                {['option1', 'option2', 'option3', 'option4'].map((optKey) => {
                  const optValue = q[optKey];
                  if (!optValue) return null;
                  const isSelected = answers[q.id] === optValue;
                  return (
                    <label key={optKey} className="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          className="peer hidden"
                          onChange={() => setAnswers({ ...answers, [q.id]: optValue })}
                        />
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected ? "border-[#673ab7] bg-[#673ab7]" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner" />}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[15px] transition-colors",
                        isSelected ? "text-slate-900 font-bold" : "text-slate-600 font-normal"
                      )}>
                        {optValue}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="max-w-3xl mx-auto pt-4 pb-24">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#673ab7] text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-[#512da8] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Finish & Submit</>}
              </button>
              <button
                onClick={() => setAnswers({})}
                className="text-slate-400 text-sm font-bold uppercase tracking-widest hover:text-rose-500 transition-colors px-4 py-2"
              >
                Clear Selection
              </button>
            </div>
            <div className="mt-12 border-t border-slate-200 pt-8 text-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-loose">
                * Official Examination Portal - MIT PARADH *<br />
                Academic Session 2026-2027
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border-2 border-black overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[#002147] p-6 text-white flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <FileText size={24} className="text-teal-400" />
          Online Question Papers
        </h3>
        <div className="px-4 py-1.5 bg-white/10 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest">
          Academic Registry 2026
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-black">
              <th className="px-8 py-6 border-r-2 border-black text-center text-[11px] font-black uppercase tracking-widest text-black w-20">Sr. No.</th>
              <th className="px-8 py-6 border-r-2 border-black text-left text-[11px] font-black uppercase tracking-widest text-black">Exam Title</th>
              <th className="px-8 py-6 border-r-2 border-black text-center text-[11px] font-black uppercase tracking-widest text-black">Exam Date</th>
              <th className="px-8 py-6 border-r-2 border-black text-center text-[11px] font-black uppercase tracking-widest text-black">Start Time</th>
              <th className="px-8 py-6 border-r-2 border-black text-center text-[11px] font-black uppercase tracking-widest text-black">Duration</th>
              <th className="px-8 py-6 border-r-2 border-black text-center text-[11px] font-black uppercase tracking-widest text-black">Questions</th>
              <th className="px-8 py-6 text-center text-[11px] font-black uppercase tracking-widest text-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam: any, index: number) => {
              const hasSubmitted = exam.submissions && exam.submissions[userData.uid];
              return (
                <tr key={exam.id} className="border-b-2 border-black hover:bg-indigo-50/30 transition-colors">
                  <td className="px-8 py-6 border-r-2 border-black text-[14px] font-bold text-slate-500 text-center">{index + 1}</td>
                  <td className="px-8 py-6 border-r-2 border-black">
                    <p className="text-[15px] font-black text-[#002147] uppercase tracking-tight">{exam.examName || exam.examTitle}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Official Assessment</p>
                  </td>
                  <td className="px-8 py-6 border-r-2 border-black text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[13px] font-bold text-slate-700">
                      <Clock size={12} className="text-[#00a5a5]" /> {exam.startDate}
                    </div>
                  </td>
                  <td className="px-8 py-6 border-r-2 border-black text-center">
                    <span className="text-[14px] font-black text-indigo-600">{exam.startTime}</span>
                  </td>
                  <td className="px-8 py-6 border-r-2 border-black text-center text-[14px] font-bold text-slate-800">
                    {exam.durationHours}H {exam.durationMinutes}M
                  </td>
                  <td className="px-8 py-6 border-r-2 border-black text-[14px] font-black text-slate-800 text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                      {exam.questions?.length || 0}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {hasSubmitted ? (
                      <div className="flex items-center gap-3 justify-center">
                        <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                          <CheckCircle2 size={14} /> Submitted
                        </div>
                        <button
                          onClick={() => setReviewExam(exam)}
                          className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
                          title="View Responses"
                        >
                          <Eye size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam)}
                        className="px-8 py-3 bg-[#00a5a5] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-lg hover:bg-[#002147] hover:scale-105 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                      >
                        <PenTool size={16} /> Start Exam
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {exams.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-300">
                    <FileText size={48} className="opacity-20" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No online question papers assigned to your course.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CertificateModule = ({ credentials }: { credentials: any[] }) => {
  const certificateRecords = credentials.filter(c => c.type === 'certificate');

  if (certificateRecords.length > 0) {
    return (
      <div className="bg-white rounded-[2rem] border-2 border-black overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-black p-6 text-white">
          <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <ShieldCheck size={24} className="text-amber-400" />
            Issued Certificates
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-black">
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Sr. No.</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Certificate No.</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Student Name</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">College</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Course Type</th>
                <th className="px-6 py-4 border-r-2 border-black text-left text-[12px] font-black uppercase tracking-widest text-black">Course</th>
                <th className="px-6 py-4 text-center text-[12px] font-black uppercase tracking-widest text-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {certificateRecords.map((record, index) => (
                <tr key={record.id} className="border-b-2 border-black hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-800">{index + 1}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-black text-indigo-700">{record.marksheetNo}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-800 uppercase">{record.studentName}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-600">{record.college || 'MIT PARADH'}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-indigo-600">{record.courseType}</td>
                  <td className="px-6 py-5 border-r-2 border-black text-[14px] font-bold text-slate-800">{record.course}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center">
                      <CredentialDownloader credential={record} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-32 glass-effect rounded-[3rem] border-2 border-white shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-indigo-100 shadow-2xl shadow-indigo-500/10 relative">
        <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] animate-pulse" />
        <ShieldCheck size={56} className="text-[#002147] relative z-10" />
      </div>
      <div className="space-y-4">
        <h3 className="text-4xl font-black text-[#002147] tracking-tighter uppercase italic">Course Certificate</h3>
        <p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">Official course completion certificates and vocational diplomas are issued upon successful completion of all academic requirements and final verification.</p>
      </div>
      <div className="pt-6">
        <div className="inline-flex items-center gap-3 px-8 py-3 bg-slate-100 text-slate-400 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] border border-slate-200">
          <History size={16} /> Status: Processing / Not Issued
        </div>
      </div>
    </div>
  );
};

const FeeTablePortal = ({ availableCourses = [], availableColleges = [] }: any) => {
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Course types derived from selected college or all available courses
  const availableCourseTypes = useMemo(() => {
    const relevant = selectedCollege
      ? availableCourses.filter((c: any) => c.collegeId === selectedCollege)
      : availableCourses;
    const types = Array.from<string>(new Set(relevant.map((c: any) => c.course_type || c.type || 'Regular'))).filter(Boolean);
    return types;
  }, [availableCourses, selectedCollege]);

  // Filtered courses matching selected college and course type
  const selectableCourses = useMemo(() => {
    return availableCourses.filter((c: any) => {
      if (selectedCollege && c.collegeId !== selectedCollege) return false;
      if (selectedCourseType && (c.course_type || c.type || 'Regular') !== selectedCourseType) return false;
      return true;
    });
  }, [availableCourses, selectedCollege, selectedCourseType]);

  // Final filtered list of courses for the table
  const displayedCourses = useMemo(() => {
    return availableCourses.filter((c: any) => {
      if (selectedCollege && c.collegeId !== selectedCollege) return false;
      if (selectedCourseType && (c.course_type || c.type || 'Regular') !== selectedCourseType) return false;
      if (selectedCourseId && c.id !== selectedCourseId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const collegeObj = availableColleges.find((col: any) => col.id === c.collegeId);
        const colName = (collegeObj?.name || '').toLowerCase();
        const courseName = (c.course_name || c.name || '').toLowerCase();
        const slug = (c.course_slug || '').toLowerCase();
        const cType = (c.course_type || c.type || '').toLowerCase();
        if (!colName.includes(q) && !courseName.includes(q) && !slug.includes(q) && !cType.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [availableCourses, availableColleges, selectedCollege, selectedCourseType, selectedCourseId, searchQuery]);

  const hasActiveFilters = Boolean(selectedCollege || selectedCourseType || selectedCourseId || searchQuery);

  const resetFilters = () => {
    setSelectedCollege('');
    setSelectedCourseType('');
    setSelectedCourseId('');
    setSearchQuery('');
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
      <div className="glass-effect p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-4 border-white shadow-2xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-[#002147] tracking-tighter capitalize">Course Fee Structure</h3>
            <p className="text-[13px] font-medium text-slate-400 capitalize tracking-tight mt-1">Official registry of course fees across all colleges</p>
          </div>
          <div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-200 text-indigo-700 text-xs font-bold uppercase flex items-center gap-2 w-fit">
            <BookOpen size={14} /> Showing {displayedCourses.length} of {availableCourses.length} Courses
          </div>
        </header>

        {/* Compulsory Filters Bar */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl mb-8 space-y-4 shadow-inner">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#002147] tracking-wider">
              <Filter size={16} className="text-[#00a5a5]" /> Compulsory Course Filters
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} /> Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* College Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                College <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCollege}
                onChange={(e) => {
                  setSelectedCollege(e.target.value);
                  setSelectedCourseType('');
                  setSelectedCourseId('');
                }}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white shadow-sm"
              >
                <option value="">— Select Official College —</option>
                {availableColleges.map((col: any) => (
                  <option key={col.id} value={col.id}>{col.name} (ID: {col.collegeId || col.id})</option>
                ))}
              </select>
            </div>

            {/* Course Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                Course Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCourseType}
                onChange={(e) => {
                  setSelectedCourseType(e.target.value);
                  setSelectedCourseId('');
                }}
                disabled={!selectedCollege}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white disabled:bg-slate-100 disabled:text-slate-400 shadow-sm"
              >
                <option value="">— Select Type —</option>
                {availableCourseTypes.map((type: any) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={!selectedCourseType}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white disabled:bg-slate-100 disabled:text-slate-400 shadow-sm"
              >
                <option value="">Select Course Slug</option>
                {selectableCourses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.course_slug && c.course_slug !== 'NULL' ? c.course_slug : c.course_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                Search Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type course or college..."
                  className="w-full border border-slate-300 rounded-xl p-3 pl-9 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white shadow-sm"
                />
                <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse border-[0.5px] border-black">
            <thead>
              <tr className="bg-slate-50/50 border-b-[0.5px] border-black">
                <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black w-16 text-center">Sr.</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">College Name</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">Course Name</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black text-center">Duration</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black text-center">Type</th>
                <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest text-right">Fee (₹)</th>
              </tr>
            </thead>
            <tbody className="border-b-[0.5px] border-black">
              {displayedCourses.map((course: any, i: number) => {
                const college = availableColleges.find((c: any) => c.id === course.collegeId);
                const collegeName = college ? college.name : (course.source === 'Global' ? 'Global Course' : 'N/A');
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b-[0.5px] border-black">
                    <td className="px-6 py-5 border-r-[0.5px] border-black text-center font-bold text-black">{i + 1}.</td>
                    <td className="px-6 py-5 border-r-[0.5px] border-black">
                      <span className="text-[12px] font-bold text-slate-800 capitalize tracking-tight">{collegeName}</span>
                    </td>
                    <td className="px-6 py-5 border-r-[0.5px] border-black">
                      <p className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1 capitalize">{course.course_name}</p>
                      <p className="text-[10px] font-medium text-slate-400 capitalize">{course.subcategory || course.category}</p>
                    </td>
                    <td className="px-6 py-5 border-r-[0.5px] border-black text-center text-sm font-bold text-slate-600">{course.duration}</td>
                    <td className="px-6 py-5 border-r-[0.5px] border-black text-center">
                      <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100">{course.course_type || course.type || 'Reg'}</span>
                    </td>
                    <td className="px-6 py-5 text-right text-[15px] font-black text-emerald-600">
                      ₹{parseFloat(course.price || course.online_price || course.offline_price || '0').toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {displayedCourses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">No courses match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ userData, userApplications, stepPercentages, feeDue, hasActiveAdmission, setIsOtherCourseMode, setIsCourseModalOpen, handleTabChange, activeApp }: any) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#003366] text-white py-4 px-8 rounded-2xl shadow-lg font-medium tracking-tight text-[16px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={20} className="text-[#00a5a5]" /> Welcome to MIT PARADH
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (userApplications.length > 0) {
                setIsOtherCourseMode(true);
                handleTabChange(3, 1, 'new');
              } else {
                setIsOtherCourseMode(false);
                handleTabChange(3, 1);
              }
            }}
            className={cn(
              "px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-tight transition-all shadow-md active:scale-95 flex items-center gap-2",
              userApplications.length > 0
                ? "bg-[#ff9f1c] hover:bg-white hover:text-black text-black"
                : "bg-[#00a5a5] hover:bg-white hover:text-[#003366] text-white border border-white/20"
            )}
          >
            <Plus size={16} />
            {userApplications.length > 0 ? 'Apply for Other Course' : 'Apply for Admission'}
          </button>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Widget
          icon={CheckCircle2}
          label="Profile Status"
          value={`${Object.values(stepPercentages).filter(p => p === 100).length}/12 Steps`}
          trend="Verified"
          color="bg-emerald-600"
        />
        <Widget
          icon={FileBadge}
          label="Applications"
          value={userApplications.length.toString()}
          trend="Live"
          color="bg-blue-600"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4 bg-white border-4 border-slate-200 rounded-md p-4 flex flex-col items-center gap-6 shadow-sm">
          <div className="flex flex-col items-center w-full">
            <div className="w-40 h-48 bg-slate-100 rounded-md border-2 border-slate-200 overflow-hidden flex items-center justify-center mb-2 group cursor-pointer shadow-inner" onClick={() => handleTabChange(3)}>
              {(userData?.profile?.photoUrl || userData?.photo) ? (
                <img src={userData.profile?.photoUrl || userData?.photo} alt="Student" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <User size={48} className="text-slate-300" />
                  <span className="text-[13px] text-black capitalize font-medium">No Photo</span>
                </div>
              )}
            </div>
            <p className="text-[13px] font-bold text-black capitalize tracking-tight">Official Photo</p>
          </div>
        </div>

        <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-min">
          {[
            { l: 'Admission year', v: '2026-2027' },
            {
              l: 'Name',
              v: toTitleCase(userData?.fullName || userData?.studentName || `${userData?.profile?.firstName || userData?.firstName || ''} ${userData?.profile?.middleName || userData?.middleName || ''} ${userData?.profile?.lastName || userData?.lastName || ''}`.trim() || 'Student')
            },
            { l: 'Form number', v: 'F-2026/00452' },
            { l: 'Mobile number', v: userData?.studentPhone || userData?.phone || userData?.profile?.phone || 'N/A' },
            { l: 'Gender', v: toTitleCase(userData?.gender || 'N/A') },
            { l: 'DOB', v: userData?.dateOfBirth || userData?.profile?.dateOfBirth || 'N/A' },
            (activeApp?.processManualRegNo || userData?.manualRegNo || userData?.profile?.manualRegNo) 
              ? { l: 'Manual Reg No.', v: activeApp?.processManualRegNo || userData?.manualRegNo || userData?.profile?.manualRegNo }
              : { l: 'Auto Reg No.', v: activeApp?.processAutoRegNo || activeApp?.regNo || userData?.regNo || userData?.profile?.regNo || 'N/A' },
            { l: 'Email ID', v: userData?.email || userData?.studentEmail || 'N/A' },
          ].map((item, i) => (
            <div key={i} className="flex border-2 border-slate-200 rounded-md overflow-hidden bg-white h-12">
              <div className="w-1/3 bg-[#e6f7f7] px-4 py-2 text-[#00a5a5] font-normal text-[15px] flex items-center tracking-tight">{item.l}</div>
              <div className="w-2/3 px-4 py-2 text-slate-700 text-[15px] font-medium flex items-center">{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#003366] text-white py-3 px-6 rounded-md text-center font-normal text-[15px] tracking-wide shadow-md">
        Candidate dashboard
      </div>

      <div className="bg-white border-4 border-slate-200 rounded-md p-10 shadow-sm overflow-x-auto no-scrollbar">
        <div className="min-w-[1000px] relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-[#21ba45] -translate-y-1/2 z-0 opacity-20" />
          <div className="relative z-10 flex justify-between gap-4">
            {[
              { id: 1, l: 'Primary' },
              { id: 2, l: 'Address' },
              { id: 3, l: 'Parent' },
              { id: 4, l: 'Category' },
              { id: 5, l: 'Qualification' },
              { id: 6, h: 'Training', l: 'Training' },
              { id: 7, l: 'Additional' },
              { id: 8, l: 'Bank' },
              { id: 9, l: 'Work Experience' },
              { id: 10, l: 'Select Course' },
              { id: 11, l: 'Lock' },
              { id: 222, l: 'Letter' },
            ].map((step, idx) => {
              const perc = stepPercentages[step.id as keyof typeof stepPercentages] || 0;
              const color = perc === 100 ? '#21ba45' : perc > 0 ? '#fbbd08' : '#d1d1d1';
              return (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      handleTabChange(3, step.id <= 11 ? step.id : 1, activeApp?.id || 'new');
                    }}
                    className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center text-[13px] font-medium shadow-sm transition-all hover:scale-110 active:scale-95 group"
                    style={{ border: `4px solid ${color}`, color: color === '#d1d1d1' ? '#a1a1a1' : color }}
                  >
                    {perc === 100 ? <Check size={28} /> : `${perc}%`}
                  </button>
                  <span className="text-[13px] font-bold text-black capitalize tracking-tighter text-center max-w-[80px]">
                    {perc === 100 && step.id === 222 ? 'Admission Confirm' : step.l}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          {hasActiveAdmission && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Check size={18} /> Admission Processed - You have an active enrollment
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ApplicationManager = ({
  selectedCollege, setSelectedCollege, availableColleges,
  selectedCourseType, setSelectedCourseType, availableCourseTypes,
  selectedCourseId, setSelectedCourseId, filteredCourses,
  selectedDuration, selectedFees, handleAddNewApplication, isSubmittingApp,
  userApplications, userData, handleTabChange, activeApp,
  handleDownloadPDF, downloadingAppId
}: any) => {
  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">

      <div className="bg-white border border-black rounded-xl shadow-sm overflow-hidden text-[#343a40]">
        <div className="bg-[#343a40] text-white py-3 px-6 font-normal text-sm tracking-wide uppercase">Your Applications</div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse border-[0.5px] border-black">
            <thead>
              <tr className="text-[12px] font-black text-black border-b-[0.5px] border-black bg-slate-100 whitespace-nowrap">
                <th className="px-4 py-5 border-r-[0.5px] border-black text-center w-16 uppercase">Sr. No.</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Date and Time</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Register Number</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Student Name</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">College</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Course Type</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black uppercase">Course</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Fee</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Status</th>
                <th className="px-4 py-5 border-r-[0.5px] border-black text-center uppercase">Remarks</th>
                <th className="px-4 py-5 text-center uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-[13px] font-medium text-black">
              {[...userApplications].sort((a, b) => new Date(b.appliedAt || b.date || 0).getTime() - new Date(a.appliedAt || a.date || 0).getTime()).map((app: any, i: number) => (
                <tr key={`${app.id}-${i}`} className="hover:bg-slate-50 transition-colors border-b-[0.5px] border-black whitespace-nowrap">
                  <td className="px-4 py-6 text-center border-r-[0.5px] border-black font-bold">{i + 1}.</td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#00a5a5]" />
                      {(() => {
                        const d = new Date(app.appliedAt || app.date || Date.now());
                        return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black font-bold uppercase">{app.regNo || userData?.regNo || 'N/A'}</td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{app.studentName || userData?.fullName || userData?.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.middleName || ''} ${userData.profile?.lastName || ''}`.trim() || 'Student'}</td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black capitalize">{app.collegeName || 'N/A'}</td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-200">{app.courseType || 'Regular'}</span>
                  </td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black font-bold capitalize">{app.courseName}</td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black text-center font-bold text-emerald-600">₹{parseFloat(app.fees || '0').toLocaleString()}</td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                      app.status === 'Accepted' || app.status === 'Confirmed' || app.status === 'Updated' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        app.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-200" :
                          app.status === 'Unlocked' ? "bg-blue-50 text-blue-600 border-blue-200" :
                            "bg-amber-50 text-amber-600 border-amber-200"
                    )}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-6 border-r-[0.5px] border-black text-center whitespace-normal max-w-[200px]">
                    {app.status === 'Rejected' && app.rejectReason && (
                      <div className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded text-left leading-tight">
                        <span className="block uppercase text-[9px] text-rose-400 mb-0.5">Reason:</span>
                        {app.rejectReason}
                        {app.rejectRemark && <div className="mt-1 border-t border-rose-100 pt-1 font-normal text-slate-600">{app.rejectRemark}</div>}
                      </div>
                    )}
                    {app.status !== 'Rejected' && <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {app.status === 'Unlocked' ? (
                        <button
                          onClick={() => handleTabChange(3, 1, app.id)}
                          title="Change Details"
                          className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 font-bold text-[10px]"
                        >
                          <PenTool size={14} /> CHANGE
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleTabChange(3, 1, app.id)}
                            title="View Profile"
                            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(app)}
                            disabled={downloadingAppId !== null}
                            className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download Application PDF"
                          >
                            {downloadingAppId === app.id ? (
                              <Loader2 size={18} className="animate-spin text-white" />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ExaminationCenter = ({ activeApp, examSettings, examSubmissions, setIsExamModalOpen, setSelectedExamConfig, userData }: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
    <div className="bg-white border-[0.5px] border-black rounded-md shadow-sm overflow-hidden text-[#343a40]">
      <div className="bg-[#002147] text-white py-4 px-8 font-black text-sm tracking-widest flex items-center justify-between">
        <span>Exam Form</span>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[10px]">
          <Clock size={12} className="text-[#00a5a5]" /> Academic Session
        </div>
      </div>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse border-b-[0.5px] border-black">
          <thead className="bg-slate-50 border-b-[0.5px] border-black">
            <tr className="text-[12px] font-black text-[#00a5a5] uppercase tracking-tighter whitespace-nowrap">
              <th className="px-8 py-5 border-r-[0.5px] border-black text-center w-16">Sr No.</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Exam Name</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black text-center">Last Date</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Reg No.</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Student Name</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">College</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Course Type</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black">Course (Academic Year)</th>
              <th className="px-8 py-5 border-r-[0.5px] border-black text-center">Fees</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {activeApp ? (
              Array.isArray(examSettings) && examSettings.length > 0 ? (
                examSettings.map((config: any, index: number) => {
                  const academicYear = config.academicYear || '2026-2027';
                  const submissionForConfig = examSubmissions.find((s: any) => 
                    (s.academicYear || '2026-2027') === academicYear && s.status !== 'Rejected'
                  );
                  const isBtnDisabled = !config.registrationOpen || !!submissionForConfig;

                  return (
                    <tr key={config.id || index} className="hover:bg-slate-50/50 transition-colors border-b-[0.5px] border-black whitespace-nowrap">
                      <td className="px-8 py-6 border-r-[0.5px] border-black text-center text-sm font-bold text-slate-700">{index + 1}.</td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black font-bold text-slate-800 text-sm capitalize">{config.examName || 'Annual Exam'}</td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black text-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-rose-500">{config.lastDate ? new Date(config.lastDate).toLocaleDateString() : 'TBA'}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deadline</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{userData?.profile?.regNo || userData?.regNo || 'PENDING'}</span>
                      </td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black">
                        <span className="text-sm font-black text-slate-800 capitalize tracking-tight">
                          {userData?.fullName || userData?.studentName || (userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.middleName || ''} ${userData.profile.lastName || ''}`.trim() : (userData?.firstName || 'N/A'))}
                        </span>
                      </td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black">
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="text-sm font-black text-slate-800 capitalize">{activeApp.collegeName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black text-center">
                        <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border-[0.5px] border-indigo-100">{activeApp.courseType || 'REGULAR'}</span>
                      </td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black font-bold text-slate-700 text-sm capitalize">{activeApp.courseName} ({academicYear})</td>
                      <td className="px-8 py-6 border-r-[0.5px] border-black text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-emerald-600">₹{parseFloat(config.fees || '0').toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Exam Fees</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          disabled={isBtnDisabled}
                          onClick={() => {
                            setSelectedExamConfig(config);
                            setIsExamModalOpen(true);
                          }}
                          className={cn(
                            "px-8 py-3 rounded-xl text-[12px] font-black capitalize tracking-tight shadow-xl transition-all active:scale-95",
                            isBtnDisabled
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border-[0.5px] border-black"
                              : "bg-[#00a5a5] text-white hover:bg-[#002147] hover:scale-105"
                          )}
                        >
                          {submissionForConfig?.status === 'Verified' ? 'VERIFIED' : submissionForConfig ? 'PENDING' : 'SUBMIT EXAM FORM'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-400 font-medium border-b-[0.5px] border-black">
                    Exam form is not configured yet for your course ({activeApp.courseType || 'Regular'} - {activeApp.courseName}).
                  </td>
                </tr>
              )
            ) : (
              <tr><td colSpan={10} className="py-20 text-center text-slate-400 font-medium border-b-[0.5px] border-black">No active enrollment found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const FeePaymentPortal = ({ acceptedApps, totalFees, totalPaid, balanceDue, userPayments, setSelectedAppForPayment, setPaymentForm, setIsPaymentModalOpen, setLastReceipt, setShowReceipt }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Widget icon={CreditCard} label="Total Fee" value={`₹${totalFees.toLocaleString()}`} trend="Current Session" color="bg-blue-600" />
      <Widget icon={CheckCircle2} label="Amount Paid" value={`₹${totalPaid.toLocaleString()}`} trend="Verified" color="bg-emerald-600" />
      <Widget icon={AlertCircle} label="Balance Due" value={`₹${balanceDue.toLocaleString()}`} trend={balanceDue > 0 ? "Outstanding" : "Cleared"} color={balanceDue > 0 ? "bg-red-600" : "bg-emerald-600"} />
    </div>

    <div className="glass-effect p-10 rounded-[3rem] border-4 border-white shadow-2xl">
      <h3 className="text-2xl font-medium text-slate-800 capitalize tracking-tighter mb-8">Financial Records & Payments</h3>
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse border-[0.5px] border-black">
          <thead>
            <tr className="text-[14px] font-normal text-[#00a5a5] border-b-[0.5px] border-black bg-slate-50">
              <th className="px-6 py-4 border-r-[0.5px] border-black text-center">Sr. No.</th>
              <th className="px-6 py-4 border-r-[0.5px] border-black">College</th>
              <th className="px-6 py-4 border-r-[0.5px] border-black">Course Name</th>
              <th className="px-6 py-4 border-r-[0.5px] border-black text-center">Type</th>
              <th className="px-6 py-4 border-r-[0.5px] border-black text-center">Date</th>
              <th className="px-6 py-4 border-r-[0.5px] border-black text-right">Total Fees</th>
              <th className="px-6 py-4 border-r-[0.5px] border-black text-right">Paid Fees</th>
              <th className="px-6 py-4 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="border-b-[0.5px] border-black text-[14px] font-normal text-slate-600">
            {acceptedApps.map((app: any, idx: number) => {
              const t = parseFloat(app.fees || '0');
              const p = parseFloat(app.paidFees || '0');
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors border-b-[0.5px] border-black">
                  <td className="px-6 py-4 text-center border-r-[0.5px] border-black font-medium text-slate-600">{idx + 1}.</td>
                  <td className="px-6 py-4 font-medium text-slate-800 border-r-[0.5px] border-black">{app.collegeName || 'MIT College'}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 capitalize border-r-[0.5px] border-black">{app.courseName || 'Course Not Assigned'}</td>
                  <td className="px-6 py-4 text-center border-r-[0.5px] border-black"><span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase">{app.courseType || 'Reg'}</span></td>
                  <td className="px-6 py-4 text-center border-r-[0.5px] border-black font-medium text-slate-600">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700 border-r-[0.5px] border-black">₹{t.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 border-r-[0.5px] border-black">₹{p.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500">₹{(t - p).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Ledger Transaction History */}
    <TransactionHistory userPayments={userPayments} setLastReceipt={setLastReceipt} setShowReceipt={setShowReceipt} />
  </div>
);

const TransactionHistory = ({ userPayments, setLastReceipt, setShowReceipt }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8 mt-12">
    <div className="glass-effect p-10 rounded-[3rem] border-4 border-white shadow-2xl">
      <header className="mb-10">
        <h3 className="text-2xl font-black text-[#002147] tracking-tighter capitalize">Financial Transaction History</h3>
        <p className="text-[13px] font-medium text-slate-400 capitalize tracking-tight mt-1">Audit trail of all fees submitted to institutions</p>
      </header>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse border-[0.5px] border-black">
          <thead>
            <tr className="bg-slate-50/50 border-b-[0.5px] border-black">
              <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black w-16">Sr.</th>
              <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">Reference ID</th>
              <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black">Course & College</th>
              <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black text-center">Date</th>
              <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r-[0.5px] border-black text-right">Amount</th>
              <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest text-center">Status</th>
            </tr>
          </thead>
          <tbody className="border-b-[0.5px] border-black">
            {(userPayments || []).sort((a: any, b: any) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()).map((p: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b-[0.5px] border-black">
                <td className="px-6 py-5 border-r-[0.5px] border-black text-center font-bold text-black">{i + 1}.</td>
                <td className="px-6 py-5 border-r-[0.5px] border-black"><span className="text-[11px] font-black text-[#00a5a5] uppercase tracking-widest bg-[#e6f7f7] px-3 py-1 rounded-md">REF-{p.id?.slice(-8).toUpperCase()}</span></td>
                <td className="px-6 py-5 border-r-[0.5px] border-black"><p className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1">{p.courseName}</p><p className="text-[10px] font-medium text-slate-400 capitalize">{p.collegeName}</p></td>
                <td className="px-6 py-5 border-r-[0.5px] border-black text-center text-sm font-medium text-slate-500">{new Date(p.submittedAt).toLocaleDateString()}</td>
                <td className="px-6 py-5 border-r-[0.5px] border-black text-right text-[15px] font-black text-emerald-600">₹{parseFloat(p.amount || '0').toLocaleString()}</td>
                <td className="px-6 py-5 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border shadow-sm inline-flex items-center gap-2",
                      p.status === 'Accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        p.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                          "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {p.status === 'Accepted' ? <CheckCircle2 size={12} /> : p.status === 'Rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                      {p.status || 'Pending'}
                    </div>
                    {p.status === 'Accepted' && (
                      <button
                        onClick={() => { setLastReceipt(p); setShowReceipt(true); }}
                        className="px-3 py-1 rounded bg-[#00a5a5] text-black hover:bg-[#5D5fb1] text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-1 justify-center active:scale-95 mt-1"
                      >
                        <Download size={10} /> View Receipt
                      </button>
                    )}
                    {p.status === 'Rejected' && (
                      <div className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded px-2 py-1 max-w-[150px] mx-auto break-words italic leading-tight mt-1">
                        Remark: {p.remarks || 'No reason specified'}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const PaymentSlipPortal = ({ userPayments, setLastReceipt, setShowReceipt }: any) => {
  const approvedPayments = (userPayments || []).filter((pay: any) => pay.status === 'Accepted');

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
      <div className="glass-effect p-4 md:p-10 rounded-[2rem] md:rounded-[3rem] border-4 border-white shadow-2xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-[#002147] tracking-tighter capitalize">Approved Payment Slips</h3>
            <p className="text-[13px] font-medium text-slate-400 capitalize tracking-tight mt-1">Official verified fee receipts and transaction records</p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-600 text-xs font-bold uppercase flex items-center gap-2 w-fit">
            <CheckCircle2 size={14} /> {approvedPayments.length} Verified Slip(s)
          </div>
        </header>

        {approvedPayments.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-200">
              <FileText size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-700 uppercase tracking-tight">No Payment Slips Available</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 font-medium">
              Payment slips will be generated and displayed here once your fee submissions are reviewed and verified by college administration.
            </p>
          </div>
        ) : (
          <div className="p-0 overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse md:border-[0.5px] border-black block md:table">
              <thead className="hidden md:table-header-group">
                <tr className="text-[14px] font-normal text-[#00a5a5] border-b-[0.5px] border-black bg-slate-50">
                  <th className="px-6 py-4 border-[0.5px] border-black text-center w-16">Sr.</th>
                  <th className="px-6 py-4 border-[0.5px] border-black">Receipt No.</th>
                  <th className="px-6 py-4 border-[0.5px] border-black">College / Course</th>
                  <th className="px-6 py-4 border-[0.5px] border-black text-center">Approved Date</th>
                  <th className="px-6 py-4 border-[0.5px] border-black text-right">Amount</th>
                  <th className="px-6 py-4 border-[0.5px] border-black text-center">Action</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group text-[14px] font-normal text-slate-600">
                {approvedPayments.map((pay: any, idx: number) => (
                  <tr key={idx} className="block md:table-row bg-white md:bg-transparent border border-slate-200 md:border-b-[0.5px] md:border-black rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow-sm md:shadow-none hover:bg-slate-50 transition-colors">
                    <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-center font-bold text-black">
                      <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Sr.</span>
                      <span>{idx + 1}.</span>
                    </td>
                    <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black">
                      <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Receipt No.</span>
                      <span className="text-[11px] font-black text-[#00a5a5] uppercase tracking-widest bg-[#e6f7f7] px-3 py-1 rounded-md">
                        {pay.receiptNo || ('REC-' + pay.id?.slice(-8).toUpperCase())}
                      </span>
                    </td>
                    <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black">
                      <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">College / Course</span>
                      <div className="text-right md:text-left">
                        <p className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1">{pay.courseName}</p>
                        <p className="text-[10px] font-medium text-slate-400 capitalize">{pay.collegeName}</p>
                      </div>
                    </td>
                    <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-center text-sm font-medium text-slate-500">
                      <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Approved Date</span>
                      <span>{pay.approvedAt ? new Date(pay.approvedAt).toLocaleDateString() : pay.date ? new Date(pay.date).toLocaleDateString() : 'N/A'}</span>
                    </td>
                    <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-right text-[15px] font-black text-emerald-600">
                      <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Amount</span>
                      <span>₹{parseFloat(pay.amount || '0').toLocaleString()}</span>
                    </td>
                    <td className="flex items-center justify-between md:justify-center md:table-cell px-2 md:px-6 py-4 md:py-5 text-center">
                      <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Action</span>
                      <button
                        onClick={() => { setLastReceipt(pay); setShowReceipt(true); }}
                        className="px-5 py-2 bg-[#00a5a5] text-black hover:bg-[#5D5fb1] text-[11px] font-black uppercase transition-all shadow-md flex items-center gap-1.5 justify-center rounded-xl active:scale-95"
                      >
                        <Download size={12} /> View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentVault = ({ profileDocs, userData, customDocuments, setIsAddDocModalOpen, setModalPreview, handleDocumentUpload, handleDeleteCustomDoc }: any) => (
  <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8 p-6">
    <header className="bg-[#003366] text-white py-6 px-10 rounded-2xl shadow-xl flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20"><FileText size={28} /></div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Digital Document Vault</h3>
          <p className="text-white/60 text-sm mt-1 font-medium">Manage all academic & identity documents</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setIsAddDocModalOpen(true)} className="bg-[#00a5a5] hover:bg-white hover:text-[#003366] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"><Plus size={18} /> ADD DOCUMENT</button>
      </div>
    </header>
    <div className="bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-slate-800 text-white py-4 px-8 font-bold text-sm tracking-wide">DOCUMENT REPOSITORY</div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse block md:table">
          <thead className="hidden md:table-header-group">
            <tr className="bg-slate-100">
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase text-center w-16">Sr.</th>
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase">Document Name</th>
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase text-center">Status</th>
              <th className="px-6 py-5 border-2 border-black text-[12px] font-black text-black uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {profileDocs.map((doc: any, idx: number) => {
              const fileUrl = doc.url || userData?.profile?.[doc.key];
              return (
                <tr key={`p-${idx}`} className="block md:table-row bg-white md:bg-transparent border border-slate-200 md:border-none rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow-sm md:shadow-none hover:bg-slate-50 transition-colors">
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-2 border-black text-center text-[14px] font-bold text-slate-700">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Sr.</span>
                    <span>{idx + 1}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-2 border-black font-bold text-slate-800 capitalize">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Document Name</span>
                    <span className="text-right md:text-left">{doc.label}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-2 border-black text-center">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Status</span>
                    <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 flex items-center justify-center gap-2 md:mx-auto w-fit", fileUrl ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100")}>
                      {fileUrl ? <Check size={12} /> : <X size={12} />} {fileUrl ? 'Verified' : 'Missing'}
                    </span>
                  </td>
                  <td className="flex items-center justify-between md:justify-center md:table-cell px-2 md:px-6 py-4 md:py-5 text-center">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Action</span>
                    {fileUrl ? <button onClick={() => setModalPreview({ url: fileUrl, label: doc.label })} className="px-5 py-2.5 bg-[#00a5a5] text-white rounded-lg text-[11px] font-black uppercase flex items-center gap-2 md:mx-auto"><Eye size={14} /> Preview</button> : <button onClick={() => handleDocumentUpload(doc)} className="px-5 py-2.5 bg-amber-500 text-white rounded-lg text-[11px] font-black uppercase flex items-center gap-2 md:mx-auto"><Plus size={14} /> Upload</button>}
                  </td>
                </tr>
              );
            })}
            {customDocuments.map((doc: any, idx: number) => (
              <tr key={doc.id} className="block md:table-row bg-white md:bg-transparent border border-slate-200 md:border-none rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow-sm md:shadow-none hover:bg-slate-50 transition-colors">
                <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-2 border-black text-center text-[14px] font-bold text-slate-700">
                  <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Sr.</span>
                  <span>{profileDocs.length + idx + 1}</span>
                </td>
                <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-2 border-black font-bold text-slate-800 capitalize">
                  <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Document Name</span>
                  <span className="text-right md:text-left">{doc.name}</span>
                </td>
                <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-5 border-b border-slate-100 md:border-2 border-black text-center">
                  <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Status</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border-2 border-emerald-100 flex items-center justify-center gap-2 md:mx-auto w-fit"><Check size={12} /> Available</span>
                </td>
                <td className="flex items-center justify-between md:justify-center md:table-cell px-2 md:px-6 py-4 md:py-5 text-center">
                  <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Action</span>
                  <div className="flex items-center justify-end md:justify-center gap-3">
                    <button onClick={() => setModalPreview({ url: doc.fileUrl, label: doc.name })} className="px-5 py-2.5 bg-[#00a5a5] text-white rounded-lg text-[11px] font-black uppercase flex items-center gap-2"><Eye size={14} /> View</button>
                    <button onClick={() => handleDeleteCustomDoc(doc.id)} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-black uppercase border-2 border-rose-100 flex items-center gap-2"><X size={14} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const PrintApplicationRegistry = ({ userApplications, userData, availableColleges }: any) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [downloadingAppId, setDownloadingAppId] = useState<string | null>(null);

  const handlePreview = (app: any) => {
    setSelectedApp(app);
    setShowPreview(true);
  };

  const waitImagesLoaded = (element: HTMLElement) => {
    const imgs = element.querySelectorAll('img');
    const promises = Array.from(imgs).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    return Promise.all(promises);
  };

  const handleDownloadPDF = async (app: any) => {
    setDownloadingAppId(app.id);

    // Wait a brief period for the React DOM updates to flush and nodes to mount
    setTimeout(async () => {
      try {
        const page1 = document.getElementById('application-pdf-page-1');
        const page2 = document.getElementById('application-pdf-page-2');

        if (!page1 || !page2) {
          throw new Error("PDF page templates not found in the DOM");
        }

        // Wait for all images (logo, photo, signature) to resolve
        await Promise.all([waitImagesLoaded(page1), waitImagesLoaded(page2)]);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Page 1 Capture
        const canvas1 = await html2canvas(page1, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true
        });
        const imgData1 = canvas1.toDataURL('image/png');
        pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // Page 2 Capture
        pdf.addPage();
        const canvas2 = await html2canvas(page2, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true
        });
        const imgData2 = canvas2.toDataURL('image/png');
        pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        const fileName = `Application_${app.applicationId || 'Admission'}_${(userData.profile?.firstName || 'Student').replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
      } catch (error: any) {
        console.error("PDF generation failed:", error);
        alert(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
      } finally {
        setDownloadingAppId(null);
      }
    }, 500);
  };

  const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-3 py-3 border-b-2 border-black mb-6 mt-8 print:mt-4 print:mb-2 bg-slate-50 print:bg-transparent px-4 rounded-lg">
      <div className="w-8 h-8 bg-[#002147] text-white rounded-lg flex items-center justify-center print:hidden">
        <Icon size={18} />
      </div>
      <h4 className="text-lg font-black text-[#002147] uppercase tracking-tighter">{title}</h4>
    </div>
  );

  const DataRow = ({ label, value }: { label: string, value: any }) => (
    <div className="grid grid-cols-2 py-2.5 border-b border-slate-100 print:border-slate-200">
      <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[14px] font-bold text-[#002147] capitalize">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8 p-8">
      {/* Off-screen PDF content container */}
      {downloadingAppId && (() => {
        const app = userApplications.find((a: any) => a.id === downloadingAppId);
        if (!app) return null;
        const college = availableColleges?.find((c: any) => c.id === app.collegeId);
        const collegeName = college?.name || app.collegeName || 'Official Institution Registry';
        const collegeAddress = college?.address || 'At. Post Paradh, Bk. Tq. Bhokardan, Dist. Jalna';
        const studentPhoto = userData.profile?.photoUrl || userData.profile?.photo || userData?.photo || '';
        const studentSignature = userData.profile?.signatureUrl || userData.profile?.signUrl || '';

        return (
          <div className="fixed -left-[9999px] top-0 pointer-events-none overflow-hidden opacity-0" style={{ zIndex: -100 }}>
            {/* Page 1 */}
            <div id="application-pdf-page-1" style={{
              width: '210mm',
              height: '297mm',
              padding: '20mm 15mm 15mm 15mm',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                {/* Page 1 Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #002147', paddingBottom: '12px', marginBottom: '15px' }}>
                  {/* Left Column (Logo) */}
                  <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {college?.logo && (
                      <img
                        src={college.logo}
                        alt="College Logo"
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>

                  {/* Center Column (Centered Institute Name & Address) */}
                  <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#002147', textTransform: 'uppercase', margin: 0, lineHeight: 1.2 }}>
                      {collegeName}
                    </h1>
                    <p style={{ fontSize: '10px', color: '#475569', margin: '4px 0 0 0', fontWeight: '600' }}>
                      {collegeAddress}
                    </p>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', margin: '6px 0 0 0', letterSpacing: '0.5px' }}>
                      ADMISSION APPLICATION FORM (A.Y. 2026-27)
                    </p>
                  </div>

                  {/* Right Column (Spacer matching logo width for perfect centering) */}
                  <div style={{ width: '80px' }} />
                </div>

                {/* Application Registry Info Bar */}
                <div style={{ border: '1px solid #000000', borderRadius: '6px', marginBottom: '15px', overflow: 'hidden', fontSize: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #000000' }}>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #000000' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '8px', textTransform: 'uppercase' }}>Application ID</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{app.applicationId}</span>
                    </div>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #000000' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '8px', textTransform: 'uppercase' }}>Registration No</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{userData.profile?.regNo || 'PENDING'}</span>
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '8px', textTransform: 'uppercase' }}>Course Type</span>
                      <span style={{ fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' }}>{app.courseType || 'Regular'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', backgroundColor: '#f8fafc' }}>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #000000' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '8px', textTransform: 'uppercase' }}>Course / Stream</span>
                      <span style={{ fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' }}>{app.courseName}</span>
                    </div>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #000000' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '8px', textTransform: 'uppercase' }}>Apply Date</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{(() => { const d = new Date(app.appliedAt || app.date || Date.now()); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`; })()}</span>
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '8px', textTransform: 'uppercase' }}>Last Modified On</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{app.updatedAt ? (() => { const d = new Date(app.updatedAt); return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`; })() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1 Grid: Personal Info & Student Photo */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                  {/* Details (Left Side) */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                      I. Primary & Personal Details
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Full Name:</td>
                          <td colSpan={3} style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', border: '1px solid #000000' }}>
                            {`${userData.profile?.firstName || ''} ${userData.profile?.middleName || ''} ${userData.profile?.lastName || ''}`.trim() || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Gender:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000', width: '150px' }}>{userData.profile?.gender || 'N/A'}</td>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Date of Birth:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.dateOfBirth || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Manual Reg No:</td>
                          <td colSpan={3} style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.manualRegNo || userData.profile?.manualRegNo || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Blood Group:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.bloodGroup || 'N/A'}</td>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Aadhaar Number:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.aadhaarNo || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Mobile Number:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.phone || userData.profile?.mobileNo || userData.profile?.mobileNumber || userData.phone || 'N/A'}</td>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Email Address:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Mother Tongue:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.motherTongue || 'N/A'}</td>
                          <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Nationality:</td>
                          <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.nationality || 'Indian'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Photo and Signature Block (Right Side) */}
                  <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    {/* Photo Box */}
                    <div style={{
                      width: '110px',
                      height: '135px',
                      border: '1.5px solid #000000',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#fafafa',
                      padding: '2px'
                    }}>
                      {studentPhoto ? (
                        <img
                          src={studentPhoto}
                          alt="Student Photo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: '700', textAlign: 'center', padding: '10px' }}>
                          PASSPORT PHOTO
                        </span>
                      )}
                    </div>

                    {/* Signature Box */}
                    <div style={{
                      width: '110px',
                      height: '45px',
                      border: '1px solid #000000',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#fafafa',
                      padding: '2px'
                    }}>
                      {studentSignature ? (
                        <img
                          src={studentSignature}
                          alt="Student Signature"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: '700', textAlign: 'center' }}>
                          SIGNATURE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Address Details */}
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    II. Address Details
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Current Address:</td>
                        <td colSpan={3} style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>
                          {userData.profile?.currentAddress || userData.profile?.address || 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Taluka:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000', width: '150px' }}>{userData.profile?.taluka || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>District:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.district || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>State:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.state || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Pincode:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.pincode || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Parent/Guardian Details */}
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    III. Parent / Guardian Details
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '140px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Father's Full Name:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000', width: '150px' }}>
                          {`${userData.profile?.fatherFirstName || ''} ${userData.profile?.fatherLastName || ''}`.trim() || 'N/A'}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '160px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Father's Occ. / Mobile:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>
                          {userData.profile?.fatherOccupation || 'N/A'} {userData.profile?.fatherPhone ? `| ${userData.profile.fatherPhone}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Mother's Full Name:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>
                          {`${userData.profile?.motherFirstName || ''} ${userData.profile?.motherLastName || ''}`.trim() || 'N/A'}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Annual Family Income:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.annualIncome || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Marital Status:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.maritalStatus || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Spouse Name:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>
                          {userData.profile?.maritalStatus === 'Married'
                            ? `${userData.profile?.spouseTitle || ''} ${userData.profile?.spouseFirstName || ''} ${userData.profile?.spouseMiddleName || ''} ${userData.profile?.spouseLastName || ''}`.trim() || 'N/A'
                            : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 4: Category & Reservation Details */}
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    IV. Category & Reservation details
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Religion:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000', width: '150px' }}>{userData.profile?.religion || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Caste:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.caste || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Caste Category:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.casteCategory || userData.profile?.category || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Handicapped Type:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.handicappedType || userData.profile?.isPhysicallyHandicapped || 'None'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div style={{ borderTop: '1px solid #000000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8', fontWeight: '600' }}>
                <span>Generated by MIT Paradh Portal</span>
                <span>Page 1 of 2</span>
              </div>
            </div>

            {/* Page 2 */}
            <div id="application-pdf-page-2" style={{
              width: '210mm',
              height: '297mm',
              padding: '20mm 15mm 15mm 15mm',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                {/* Page 2 Header (Mini Header) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #002147', paddingBottom: '6px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#002147', textTransform: 'uppercase' }}>{collegeName}</span>
                  <span style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>Application ID: {app.applicationId}</span>
                </div>

                {/* Section 5: Educational Qualifications */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    V. Educational Qualifications
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000000' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #000000' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '700', color: '#475569', borderRight: '1px solid #000000' }}>Examination</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '700', color: '#475569', borderRight: '1px solid #000000' }}>Board / University</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '700', color: '#475569', borderRight: '1px solid #000000' }}>Passing Year</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: '#475569', borderRight: '1px solid #000000' }}>Marks Obtained</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.profile?.qualifications && userData.profile.qualifications.length > 0 ? (
                        userData.profile.qualifications.map((q: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                            <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a', borderRight: '1px solid #000000' }}>{q.examination}</td>
                            <td style={{ padding: '6px 8px', color: '#334155', borderRight: '1px solid #000000' }}>{q.board}</td>
                            <td style={{ padding: '6px 8px', color: '#334155', borderRight: '1px solid #000000' }}>{q.passingDate}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: '#334155', fontWeight: '600', borderRight: '1px solid #000000' }}>
                              {q.marksObtained} / {q.outOfMarks} ({q.percentage}%)
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontSize: '8px',
                                fontWeight: '700',
                                backgroundColor: q.result === 'Pass' ? '#ecfdf5' : '#fef2f2',
                                color: q.result === 'Pass' ? '#059669' : '#dc2626'
                              }}>
                                {q.result || 'Pass'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>No qualifications registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Section 6: Work Experience & Training */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    VI. Work Experience & Training
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '150px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Has Work Experience?</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000', width: '150px' }}>{userData.profile?.hasWorkExperience || 'No'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '180px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Vocational/Technical Training?</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.profile?.hasTraining || 'No'}</td>
                      </tr>
                      {(userData.workExperiences && userData.workExperiences.length > 0 || userData.profile?.hasTraining === 'Yes') && (
                        <tr>
                          <td colSpan={2} style={{ padding: '5px 8px', border: '1px solid #000000', verticalAlign: 'top' }}>
                            {userData.workExperiences && userData.workExperiences.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Experience details:</span>
                                {userData.workExperiences.map((w: any, idx: number) => (
                                  <div key={idx} style={{ fontSize: '9px', color: '#0f172a' }}>
                                    • <strong>{w.organization}</strong> - {w.designation} ({w.fromDate} to {w.toDate})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '9px', color: '#64748b' }}>No work experience details.</span>
                            )}
                          </td>
                          <td colSpan={2} style={{ padding: '5px 8px', border: '1px solid #000000', verticalAlign: 'top' }}>
                            {userData.profile?.hasTraining === 'Yes' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Training details:</span>
                                <div style={{ fontSize: '9px', color: '#0f172a' }}>
                                  • <strong>Period:</strong> {userData.profile.trainingStartDate} to {userData.profile.trainingEndDate}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '9px', color: '#64748b' }}>No training details.</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Section 7: Bank Details */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    VII. Bank Account Details
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Bank Name:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000', width: '150px' }}>{userData.bankDetails?.bankName || userData.profile?.bankName || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', width: '110px', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Account Number:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.bankDetails?.accountNumber || userData.profile?.accountNumber || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>IFSC Code:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>{userData.bankDetails?.ifscCode || userData.profile?.ifscCode || 'N/A'}</td>
                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: '600', border: '1px solid #000000', backgroundColor: '#f8fafc' }}>Branch / PAN:</td>
                        <td style={{ padding: '5px 8px', fontWeight: '700', color: '#0f172a', border: '1px solid #000000' }}>
                          {userData.bankDetails?.branchName || userData.profile?.bankBranch || 'N/A'}
                          {userData.profile?.panCardNo ? ` (PAN: ${userData.profile.panCardNo})` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 8: Verified Documents Checklist */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#002147', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    VIII. Document Verification Status
                  </h3>
                  {(() => {
                    const docsList = [
                      { label: 'Aadhaar Card Front', url: userData.profile?.aadhaarFrontUrl },
                      { label: 'Aadhaar Card Back', url: userData.profile?.aadhaarBackUrl },
                      { label: 'Transfer Certificate', url: userData.profile?.transferCertificateUrl },
                      { label: 'Bonafide Certificate', url: userData.profile?.bonafideCertificateUrl },
                      { label: 'Caste Certificate', url: userData.profile?.casteCertificateUrl },
                      { label: 'Domicile Certificate', url: userData.profile?.domicileUrl },
                      { label: 'PWD Certificate', url: userData.profile?.pwdCertificateUrl },
                      { label: 'Bank Passbook / Cheque', url: userData.profile?.bankPassbookUrl },
                      { label: 'PAN Card', url: userData.profile?.panCardUrl },
                      ...(userData.profile?.qualifications || []).map((q: any) => ({
                        label: `${q.examination} Marksheet`,
                        url: q.marksheetUrl
                      }))
                    ];

                    const rows = [];
                    for (let i = 0; i < docsList.length; i += 2) {
                      rows.push([docsList[i], docsList[i + 1]]);
                    }

                    return (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid #000000' }}>
                        <tbody>
                          {rows.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                              <td style={{ padding: '5px 8px', fontWeight: '600', color: '#475569', borderRight: '1px solid #000000', backgroundColor: '#f8fafc', width: '35%' }}>
                                {row[0]?.label}
                              </td>
                              <td style={{ padding: '5px 8px', fontWeight: '700', color: row[0]?.url ? '#059669' : '#64748b', borderRight: '1px solid #000000', width: '15%', textAlign: 'center' }}>
                                {row[0] ? (row[0].url ? '✓ Attached' : 'Not Uploaded') : ''}
                              </td>
                              <td style={{ padding: '5px 8px', fontWeight: '600', color: '#475569', borderRight: '1px solid #000000', backgroundColor: '#f8fafc', width: '35%' }}>
                                {row[1] ? row[1].label : ''}
                              </td>
                              <td style={{ padding: '5px 8px', fontWeight: '700', color: row[1]?.url ? '#059669' : '#64748b', width: '15%', textAlign: 'center' }}>
                                {row[1] ? (row[1].url ? '✓ Attached' : 'Not Uploaded') : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>

                {/* Declaration */}
                <div style={{ padding: '10px', border: '1px solid #000000', borderRadius: '6px', backgroundColor: '#fafafa', fontSize: '8.5px', lineHeight: '1.4', color: '#334155', marginBottom: '30px' }}>
                  <strong>DECLARATION:</strong> I hereby declare that all the information furnished in this application is true, complete, and correct to the best of my knowledge and belief. I understand that in the event of any information being found false, incorrect, or incomplete at any stage, my candidature/admission is liable to be cancelled/terminated.
                </div>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', marginTop: '20px' }}>
                  <div style={{ textAlign: 'center', borderTop: '1px solid #000000', paddingTop: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: '#0f172a' }}>Signature of Student</span>
                    <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '2px' }}>Date: __________________</div>
                  </div>
                  <div style={{ textAlign: 'center', borderTop: '1px solid #000000', paddingTop: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: '#0f172a' }}>Principal / Registrar Signature & Seal</span>
                    <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '2px' }}>Date: __________________</div>
                  </div>
                </div>
              </div>

              {/* Page 2 Footer */}
              <div style={{ borderTop: '1px solid #000000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8', fontWeight: '600' }}>
                <span>Generated by MIT Paradh Portal</span>
                <span>Page 2 of 2</span>
              </div>
            </div>

          </div>
        );
      })()}

      <header className="bg-[#003366] text-white py-6 px-10 rounded-2xl shadow-xl flex items-center justify-between print:hidden">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-[#ff9f1c] rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20"><Printer size={28} /></div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Print Application Form</h3>
            <p className="text-white/60 text-sm mt-1 font-medium">Generate official enrollment records</p>
          </div>
        </div>
      </header>

      <div className="bg-white border border-black rounded-xl shadow-2xl overflow-hidden print:hidden">
        <div className="bg-slate-800 text-white py-4 px-8 font-bold text-sm tracking-wide">YOUR ADMISSION APPLICATIONS</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse md:border-[0.5px] border-black block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-slate-50 border-b-[0.5px] border-black">
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center w-16">Sr No.</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Admission Date & Time</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Student Name</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">College</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Course Type</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase">Course</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-right">Fees</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Status</th>
                <th className="px-4 py-5 border-[0.5px] border-black text-[14px] font-black text-black uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group text-[15px] font-medium text-black">
              {userApplications.filter((app: any) => app.profileLocked === true).map((app: any, i: number) => (
                <tr key={`${app.id}-${i}`} className="block md:table-row bg-white border md:border-none border-slate-200 rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow-sm md:shadow-none hover:bg-slate-50 transition-colors md:border-b-[0.5px] border-black">
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-center font-bold">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Sr No.</span>
                    <span>{i + 1}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Date & Time</span>
                    <div className="flex items-center justify-end md:justify-start gap-2">
                      <Clock size={14} className="text-[#00a5a5]" />
                      {(() => {
                        const d = new Date(app.appliedAt || app.date || Date.now());
                        return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                      })()}
                    </div>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black font-bold capitalize">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Student Name</span>
                    <span className="text-right md:text-left">{app.studentName || userData?.fullName || userData?.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.middleName || ''} ${userData.profile?.lastName || ''}`.trim() || 'Student'}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black capitalize">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">College</span>
                    <span className="text-right md:text-left">{app.collegeName || 'N/A'}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-center">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Course Type</span>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-200">{app.courseType || 'Regular'}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black font-bold capitalize">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Course</span>
                    <span>{app.courseName}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-right font-bold text-emerald-600">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Fees</span>
                    <span>₹{parseFloat(app.fees || '0').toLocaleString()}</span>
                  </td>
                  <td className="flex items-center justify-between md:table-cell px-2 md:px-4 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r-[0.5px] border-black text-center">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Status</span>
                    <span className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 shadow-sm", app.status === 'Accepted' || app.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100")}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  <td className="flex items-center justify-between md:justify-center md:table-cell px-2 md:px-4 py-4 md:py-6 text-center">
                    <span className="md:hidden font-black text-[10px] text-slate-500 uppercase tracking-widest">Action</span>
                    <div className="flex items-center justify-end md:justify-center gap-3">
                      <button onClick={() => handlePreview(app)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90" title="Preview Application"><Eye size={18} /></button>
                      <button
                        onClick={() => handleDownloadPDF(app)}
                        disabled={downloadingAppId !== null}
                        className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Application"
                      >
                        {downloadingAppId === app.id ? (
                          <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                          <Download size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPreview && selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 print:relative print:inset-0 print:p-0 print:z-0">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm print:hidden" onClick={() => setShowPreview(false)} />
          <div className="bg-white w-11/12 max-w-5xl max-h-[95vh] rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 print:rounded-none print:shadow-none print:max-h-none print:h-auto print:overflow-visible">
            {/* Modal Header */}
            <div className="px-10 py-6 bg-slate-50 border-b-2 border-black flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#002147] text-white rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#002147] uppercase tracking-tighter">Official Application Preview</h3>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{selectedApp.applicationId} | {selectedApp.courseName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="bg-[#00a5a5] text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-tight shadow-lg hover:bg-[#002147] transition-all flex items-center gap-2">
                  <Printer size={18} /> Print Form
                </button>
                <button onClick={() => setShowPreview(false)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Application Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar print:overflow-visible print:p-0 print:block">
              {/* Institutional Header (For Print) */}
              <div className="hidden print:flex items-center gap-6 mb-8 border-b-4 border-black pb-6">
                <div className="shrink-0">
                  <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-24 h-24 object-contain" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-black uppercase tracking-tight">MAHALAXMI NURSING AND TECHNICAL INSTITUTE PARADH</h1>
                  <p className="text-sm font-bold text-black uppercase mt-1">Paradh, Maharashtra</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                {/* Section 1: Primary */}
                <div className="md:col-span-2">
                  <SectionHeader title="Step 1: Primary Information" icon={User} />
                </div>
                
                <div className="md:col-span-2 flex justify-end mb-4 print:flex">
                  <div className="flex gap-4">
                    <div className="w-[120px] h-[150px] border-2 border-slate-800 p-1 bg-white flex items-center justify-center overflow-hidden">
                      {(userData.profile?.photoUrl || userData.profile?.photo || userData?.photo) && String(userData.profile?.photoUrl || userData.profile?.photo || userData?.photo).length > 10 ? (
                        <img src={userData.profile?.photoUrl || userData.profile?.photo || userData?.photo} alt="Photo" className="w-full h-full object-cover print:block" />
                      ) : null}
                      <span className="text-xs text-slate-400 font-bold text-center" style={{ display: (userData.profile?.photoUrl || userData.profile?.photo || userData?.photo) && String(userData.profile?.photoUrl || userData.profile?.photo || userData?.photo).length > 10 ? 'none' : 'block' }}>Passport Photo</span>
                    </div>
                    <div className="w-[150px] h-[60px] border border-slate-800 p-1 bg-white flex items-center justify-center overflow-hidden mt-auto">
                      {(userData.profile?.signatureUrl || userData.profile?.signUrl) && String(userData.profile?.signatureUrl || userData.profile?.signUrl).length > 10 ? (
                        <img src={userData.profile?.signatureUrl || userData.profile?.signUrl} alt="Signature" className="max-h-full object-contain print:block" />
                      ) : null}
                      <span className="text-xs text-slate-400 font-bold text-center" style={{ display: (userData.profile?.signatureUrl || userData.profile?.signUrl) && String(userData.profile?.signatureUrl || userData.profile?.signUrl).length > 10 ? 'none' : 'block' }}>Signature</span>
                    </div>
                  </div>
                </div>

                <DataRow label="Full Name" value={userData?.fullName || userData?.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.middleName || ''} ${userData.profile?.lastName || ''}`.trim()} />
                <DataRow label="Gender" value={toTitleCase(userData.profile?.gender || userData.gender || '')} />
                <DataRow label="Date of Birth" value={userData.profile?.dateOfBirth || userData.dateOfBirth} />
                <DataRow label="Manual Reg No." value={userData.manualRegNo || userData.profile?.manualRegNo || 'N/A'} />
                <DataRow label="Blood Group" value={userData.profile?.bloodGroup} />
                <DataRow label="Nationality" value={userData.profile?.nationality || 'Indian'} />
                <DataRow label="Mother Tongue" value={userData.profile?.motherTongue} />
                <DataRow label="Aadhaar Number" value={userData.profile?.aadhaarNo} />
                <DataRow label="Mobile Number" value={userData.profile?.phone || userData.profile?.mobileNo || userData.profile?.mobileNumber || userData.phone} />

                {/* Section 2: Address */}
                <div className="md:col-span-2">
                  <SectionHeader title="Step 2: Address Details" icon={MapPin} />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                  <DataRow label="Current Address" value={userData.profile?.currentAddress} />
                  <DataRow label="State" value={userData.profile?.state} />
                  <DataRow label="District" value={userData.profile?.district} />
                  <DataRow label="Taluka" value={userData.profile?.taluka} />
                  <DataRow label="Pincode" value={userData.profile?.pincode} />
                </div>

                {/* Section 3: Parent */}
                <div className="md:col-span-2">
                  <SectionHeader title="Step 3: Parent/Guardian Details" icon={Users} />
                </div>
                <DataRow label="Father Name" value={userData.profile?.fatherFirstName} />
                <DataRow label="Father Occupation" value={userData.profile?.fatherOccupation} />
                <DataRow label="Mother Name" value={userData.profile?.motherFirstName} />
                <DataRow label="Annual Income" value={userData.profile?.annualIncome} />
                <DataRow label="Marital Status" value={userData.profile?.maritalStatus || 'N/A'} />
                {userData.profile?.maritalStatus === 'Married' && (
                  <DataRow
                    label="Spouse Name"
                    value={`${userData.profile?.spouseTitle || ''} ${userData.profile?.spouseFirstName || ''} ${userData.profile?.spouseMiddleName || ''} ${userData.profile?.spouseLastName || ''}`.trim() || 'N/A'}
                  />
                )}

                {/* Section 4: Category */}
                <div className="md:col-span-2">
                  <SectionHeader title="Step 4: Category & Reservation" icon={Tag} />
                </div>
                <DataRow label="Religion" value={userData.profile?.religion} />
                <DataRow label="Caste" value={userData.profile?.caste} />
                <DataRow label="Caste Category" value={userData.profile?.casteCategory} />
                <DataRow label="Handicapped Type" value={userData.profile?.handicappedType || 'None'} />

                {/* Section 5: Qualification */}
                <div className="md:col-span-2">
                  <SectionHeader title="Step 5: Educational Qualifications" icon={GraduationCap} />
                </div>
                <div className="md:col-span-2 overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-black mb-6">
                    <thead className="bg-slate-50 print:bg-transparent">
                      <tr className="border-b border-black text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <th className="p-3 border-r border-black">Examination</th>
                        <th className="p-3 border-r border-black">Board/University</th>
                        <th className="p-3 border-r border-black">Year</th>
                        <th className="p-3 border-r border-black">Marks</th>
                        <th className="p-3">Marksheet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.profile?.qualifications?.map((q: any, idx: number) => (
                        <tr key={idx} className="border-b border-black text-sm">
                          <td className="p-3 border-r border-black font-bold">{q.examination}</td>
                          <td className="p-3 border-r border-black">{q.board}</td>
                          <td className="p-3 border-r border-black">{q.passingDate}</td>
                          <td className="p-3 border-r border-black">{q.marksObtained} / {q.outOfMarks} ({q.percentage}%)</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-bold text-[#00a5a5] italic text-xs truncate max-w-[120px]" title={q.marksheetName || 'Verified'}>
                                {q.marksheetName || 'Verified'}
                              </span>
                              {q.marksheetUrl && (
                                <button
                                  type="button"
                                  onClick={() => window.open(q.marksheetUrl, '_blank')}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-all active:scale-95 shadow-sm border border-emerald-200 print:hidden"
                                  title="Preview Marksheet"
                                >
                                  <Eye size={12} /> Preview
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 8: Bank Details */}
                <div className="md:col-span-2">
                  <SectionHeader title="Step 8: Bank Account Information" icon={Landmark} />
                </div>
                <DataRow label="Bank Name" value={userData.bankDetails?.bankName || userData.profile?.bankName} />
                <DataRow label="Account Number" value={userData.bankDetails?.accountNumber || userData.profile?.accountNumber} />
                <DataRow label="IFSC Code" value={userData.bankDetails?.ifscCode || userData.profile?.ifscCode} />
                <DataRow label="Branch" value={userData.bankDetails?.branchName || userData.profile?.bankBranch} />

                {/* Section: Documents */}
                <div className="md:col-span-2">
                  <SectionHeader title="Verified Documents Summary" icon={ShieldCheck} />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                  {[
                    { label: 'Aadhar Front', url: userData.profile?.aadhaarFrontUrl },
                    { label: 'Aadhar Back', url: userData.profile?.aadhaarBackUrl },
                    { label: 'Transfer Certificate', url: userData.profile?.transferCertificateUrl },
                    { label: 'Bonafide Certificate', url: userData.profile?.bonafideCertificateUrl },
                    { label: 'Caste Certificate', url: userData.profile?.casteCertificateUrl },
                    { label: 'Profile Photo', url: userData.profile?.photoUrl },
                    { label: 'Signature', url: userData.profile?.signatureUrl },
                    ...(userData.profile?.qualifications || []).map((q: any) => ({
                      label: `${q.examination} Marksheet`,
                      url: q.marksheetUrl
                    }))
                  ].filter(doc => doc.url).map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl print:bg-transparent print:border-black/10">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 print:hidden">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Document Type</p>
                        <p className="text-[13px] font-bold text-[#002147] capitalize">{doc.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer / Signature (For Print) */}
              <div className="hidden print:grid grid-cols-2 gap-20 mt-20 pt-10">
                <div className="text-center border-t border-black pt-4">
                  <p className="text-sm font-bold text-black">Student Signature</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Self Attested</p>
                </div>
                <div className="text-center border-t border-black pt-4">
                  <p className="text-sm font-bold text-black">Principal / Registrar</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Official Seal Required</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


function DashboardContent() {
  const [userData, setUserData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_user_data');
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const configUnsubRef = useRef<(() => void) | null>(null);
  const submissionsUnsubRef = useRef<(() => void) | null>(null);
  const onlineExamsUnsubRef = useRef<(() => void) | null>(null);
  const paymentSettingsUnsubRef = useRef<(() => void) | null>(null);



  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [pendingDocStep, setPendingDocStep] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');

  // Dynamic Admission States
  const [collegeCourses, setCollegeCourses] = useState<any[]>([]);
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedFees, setSelectedFees] = useState('');

  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [modalPreview, setModalPreview] = useState<{ url: string, label: string } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAppForPayment, setSelectedAppForPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    upiId: '',
    utrId: '',
    email: '',
    relationship: 'Father',
    phone: '',
    amount: '',
    screenshot: ''
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedExamConfig, setSelectedExamConfig] = useState<any>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examForm, setExamForm] = useState<any>({
    screenshot: '',
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    aadharNumber: '',
    studentPhone: '',
    regNo: ''
  });
  const [selectedAppForPreview, setSelectedAppForPreview] = useState<any>(null);
  const [studentProfileForPreview, setStudentProfileForPreview] = useState<any>(null);
  const [editingApplication, setEditingApplication] = useState<any>(null);

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [addDocForm, setAddDocForm] = useState({ name: '', file: '' });
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  // Custom Documents States
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<string | null>(null);
  const [newDocFileName, setNewDocFileName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isOtherCourseMode, setIsOtherCourseMode] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Move direct initializations up here:
  const [availableCourses, setAvailableCourses] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_available_courses');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });
  
  const [availableColleges, setAvailableColleges] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_available_colleges');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });

  const [userApplications, setUserApplications] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cachedApps = sessionStorage.getItem('student_applications');
      if (cachedApps) {
        try {
          const appsVal = JSON.parse(cachedApps);
          return Object.entries(appsVal)
            .map(([id, val]: any) => ({ id, ...val }))
            .filter((app: any) => app.courseName);
        } catch (e) {}
      }
    }
    return [];
  });

  const [userPayments, setUserPayments] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_user_payments');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });

  const [customDocuments, setCustomDocuments] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_custom_documents');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });

  const [collegePaymentSettings, setCollegePaymentSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_college_payment_settings');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return null;
  });

  const [examSubmissions, setExamSubmissions] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_exam_submissions');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });

  const [examSettings, setExamSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_exam_settings');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return null;
  });

  const [onlineExams, setOnlineExams] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_online_exams');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });

  const [issuedCredentials, setIssuedCredentials] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('student_issued_credentials');
      if (cached) { try { return JSON.parse(cached); } catch(e){} }
    }
    return [];
  });

  const cleanDataForCache = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    try {
      const cleaned = JSON.parse(JSON.stringify(data));
      const stripBase64 = (item: any) => {
        if (!item || typeof item !== 'object') return;
        for (const key in item) {
          if (typeof item[key] === 'string' && item[key].startsWith('data:')) {
            item[key] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          } else if (typeof item[key] === 'object') {
            stripBase64(item[key]);
          }
        }
      };
      stripBase64(cleaned);
      return cleaned;
    } catch (e) {
      return data;
    }
  };

  const safeSessionSet = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      try {
        const cleanedValue = cleanDataForCache(value);
        sessionStorage.setItem(key, typeof cleanedValue === 'string' ? cleanedValue : JSON.stringify(cleanedValue));
      } catch (e) {
        console.error('Error writing to sessionStorage:', e);
      }
    }
  };



  const numberToWords = (num: number) => {
    if (num === 0) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const g = (n: number) => {
      if (n < 20) return a[n];
      let s = b[Math.floor(n / 10)];
      if (n % 10 > 0) s += ' ' + a[n % 10];
      return s;
    };

    const h = (n: number) => {
      if (n === 0) return '';
      let s = '';
      if (n >= 100) {
        s += a[Math.floor(n / 100)] + 'Hundred ';
        n %= 100;
      }
      if (n > 0) s += g(n);
      return s;
    };

    let res = '';
    let n = Math.floor(num);

    if (n >= 10000000) {
      res += h(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      res += h(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      res += h(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n > 0) res += h(n);

    return res.trim() + ' Rupees Only';
  };

  const [downloadingAppId, setDownloadingAppId] = useState<string | null>(null);

  const handleDownloadPDF = async (app: any) => {
    setDownloadingAppId(app?.id || 'app');
    handleTabChange(22);
    setTimeout(() => {
      setDownloadingAppId(null);
    }, 1000);
  };

  const handleDownloadReceiptPNG = async () => {
    const printContent = document.getElementById('receipt-print');
    if (!printContent) return;
    setIsDownloadingReceipt(true);
    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      const fileName = `Receipt_${lastReceipt?.receiptNo || 'N/A'}_${(lastReceipt?.studentName || 'Student').replace(/\s+/g, '_')}.png`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('PNG Download Error:', error);
      alert(`Failed to download receipt: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  useEffect(() => {
    if (isExamModalOpen && userData?.profile) {
      setExamForm({
        ...examForm,
        studentName: `${userData.profile.firstName || ''} ${userData.profile.lastName || ''}`,
        fatherName: userData.profile.fatherFirstName || '',
        motherName: userData.profile.motherFirstName || '',
        dob: userData.profile.dateOfBirth || userData.dateOfBirth || '',
        aadharNumber: userData.profile.aadhaarNo || '',
        studentPhone: userData.profile.phone || userData.profile.mobileNo || userData.profile.mobileNumber || userData.phone || '',
        regNo: userData.profile.regNo || userData.regNo || ''
      });
    }
  }, [isExamModalOpen, userData]);

  const activeApp = useMemo(() => {
    return userApplications.find(a => a.status === 'Accepted' || a.status === 'Confirmed') || userApplications[0];
  }, [userApplications]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseInt(searchParams.get('tab') || '1') || 1;
  const activeStep = parseInt(searchParams.get('step') || '1') || 1;
  const isFullFormMode = searchParams.get('mode') === 'full';

  useEffect(() => {
    const msg = searchParams.get('msg');
    if (msg === 'submitted') {
      setToastMessage('Your application is sent to college');
      setShowToast(true);
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('msg');
      window.history.replaceState(null, '', `${window.location.pathname}?${newParams.toString()}`);

      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const feeDue = useMemo(() => {
    const acceptedApp = userApplications.find(app => app.status === 'Accepted' || app.status === 'Confirmed');

    return acceptedApp ? `₹${parseFloat(acceptedApp.fees || '0').toLocaleString()}` : '₹0';
  }, [userApplications]);

  useEffect(() => {
    const isEmergencyBypass = typeof window !== 'undefined' && sessionStorage.getItem('emergencyBypass') === 'true';
    const bypassedUid = typeof window !== 'undefined' ? sessionStorage.getItem('bypassedUid') : null;

    let unsubProfile: (() => void) | null = null;
    let unsubCourses: (() => void) | null = null;

    let unsubApps: (() => void) | null = null;
    let unsubPayments: (() => void) | null = null;
    let unsubCustomDocs: (() => void) | null = null;

    const cleanupInnerListeners = () => {
      if (unsubProfile) unsubProfile();
      if (unsubCourses) unsubCourses();

      if (unsubApps) unsubApps();
      if (unsubPayments) unsubPayments();
      if (unsubCustomDocs) unsubCustomDocs();
      
      if (configUnsubRef.current) { configUnsubRef.current(); configUnsubRef.current = null; }
      if (submissionsUnsubRef.current) { submissionsUnsubRef.current(); submissionsUnsubRef.current = null; }
      if (onlineExamsUnsubRef.current) { onlineExamsUnsubRef.current(); onlineExamsUnsubRef.current = null; }
      if (paymentSettingsUnsubRef.current) { paymentSettingsUnsubRef.current(); paymentSettingsUnsubRef.current = null; }
    };

    const loadStudentData = async (currentUid: string) => {
      cleanupInnerListeners();

      try {
        const coursesRef = ref(realtimeDb, 'courses');
        unsubCourses = onValue(coursesRef, (snap) => {
          if (snap.exists()) {
            const data = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
            setAvailableCourses(data);
            safeSessionSet('student_available_courses', data);
          }
        });

        const fetchCollegesShallow = async () => {
          try {
            const url = `https://mit-paradh-default-rtdb.firebaseio.com/colleges.json?shallow=true`;
            const res = await fetch(url);
            const data = await res.json();
            if (data) {
              const promises = Object.keys(data).map(async (id) => {
                const nameRes = await fetch(`https://mit-paradh-default-rtdb.firebaseio.com/colleges/${id}/name.json`);
                const name = await nameRes.json();
                return { id, name };
              });
              const fetchedColleges = await Promise.all(promises);
              setAvailableColleges(fetchedColleges);
              safeSessionSet('student_available_colleges', fetchedColleges);
            }
          } catch (err) {
            console.error("Error fetching colleges shallow list", err);
          }
        };
        fetchCollegesShallow();

        const userRef = ref(realtimeDb, 'users/' + currentUid);
        const userSnap = await get(userRef);

        if (userSnap.exists()) {
          const profileRef = ref(realtimeDb, 'users/' + currentUid + '/profile');
          unsubProfile = onValue(profileRef, (snap) => {
            if (snap.exists()) {
              setUserData((prev: any) => {
                const updated = { ...prev, profile: snap.val() };
                safeSessionSet('student_user_data', updated);
                return updated;
              });
            }
          });

          setUserData((prev: any) => {
            const updated = { ...prev, ...userSnap.val(), uid: currentUid };
            safeSessionSet('student_user_data', updated);
            return updated;
          });
          setLoading(false);

          const appsRef = ref(realtimeDb, `users/${currentUid}/applications`);
          unsubApps = onValue(appsRef, (snap) => {
            if (snap.exists()) {
              const rawApps = snap.val();
              safeSessionSet('student_applications', rawApps);
              const apps = Object.entries(rawApps)
                .map(([id, val]: any) => ({ id, ...val }));
              setUserApplications(apps);

              const activeApp = apps.find(a => a.status === 'Accepted' || a.status === 'Confirmed') || apps[0];
              if (activeApp?.collegeId && activeApp?.courseName) {
                setupExamAndPaymentListeners(activeApp, currentUid);
              }
            } else {
              setUserApplications([]);
              sessionStorage.removeItem('student_applications');
            }
          });

          const paymentsRef = ref(realtimeDb, `users/${currentUid}/payments`);
          unsubPayments = onValue(paymentsRef, (snap) => {
            if (snap.exists()) {
              const data = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
              setUserPayments(data);
              safeSessionSet('student_user_payments', data);
            } else {
              setUserPayments([]);
              safeSessionSet('student_user_payments', []);
            }
          });

          const customDocsRef = ref(realtimeDb, `users/${currentUid}/customDocuments`);
          unsubCustomDocs = onValue(customDocsRef, (snap) => {
            if (snap.exists()) {
              const data = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
              setCustomDocuments(data);
              safeSessionSet('student_custom_documents', data);
            } else {
              setCustomDocuments([]);
              safeSessionSet('student_custom_documents', []);
            }
          });
        } else {
          const collegesRef = ref(realtimeDb, 'colleges');
          const collegesSnap = await get(collegesRef);
          let foundStudent = null;
          let foundCollegeId = null;

          if (collegesSnap.exists()) {
            const colleges = collegesSnap.val();
            for (const cid in colleges) {
              if (colleges[cid].students && colleges[cid].students[currentUid]) {
                foundStudent = colleges[cid].students[currentUid];
                foundCollegeId = cid;
                break;
              }
            }
          }

          if (foundStudent && foundCollegeId) {
            const manualStudentRef = ref(realtimeDb, `colleges/${foundCollegeId}/students/${currentUid}`);
            unsubProfile = onValue(manualStudentRef, (snapshot) => {
              if (snapshot.exists()) {
                const sData = snapshot.val();
                const fullName = `${sData.firstName || ''} ${sData.middleName || ''} ${sData.lastName || ''}`.replace(/\s+/g, ' ').trim();
                const updatedUser = {
                  ...sData,
                  uid: currentUid,
                  role: 'student',
                  firstName: fullName,
                  collegeId: foundCollegeId,
                  profile: {
                    firstName: sData.firstName || '',
                    lastName: sData.lastName || '',
                    fatherFirstName: sData.fatherFirstName || '',
                    motherFirstName: sData.motherFirstName || '',
                    dateOfBirth: sData.dob || '',
                    gender: sData.gender || '',
                    phone: sData.phone || '',
                    address: sData.address || '',
                    aadhaarNo: sData.aadharNumber || '',
                    regNo: sData.studentId || '',
                    profileLocked: true,
                    status: 'Accepted'
                  }
                };
                setUserData(updatedUser);
                safeSessionSet('student_user_data', updatedUser);

                const simulatedApp = {
                    "id": "manual_app",
                    "applicationId": sData.studentId || currentUid,
                    "collegeId": foundCollegeId,
                    "courseId": sData.courseId || '',
                    "courseName": sData.courseType || 'General',
                    "courseType": sData.courseType || 'Regular',
                    "fees": sData.fees || '0',
                    "status": 'Accepted',
                    "appliedAt": sData.createdAt || new Date().toISOString()
                };
                setUserApplications([simulatedApp]);
                setupExamAndPaymentListeners(simulatedApp, currentUid);
              }
              setLoading(false);
            });
          } else {
            const updatedUser = { firstName: 'Student', uid: currentUid };
            setUserData(updatedUser);
            safeSessionSet('student_user_data', updatedUser);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error loading student data:", err);
        setLoading(false);
      }
    };

    const setupExamAndPaymentListeners = (activeApp: any, currentUid: string) => {
      const getCourseSlug = async () => {
        try {
          const cSnap = await get(ref(realtimeDb, `colleges/${activeApp.collegeId}/courses/${activeApp.courseId}`));
          if (cSnap.exists()) {
            const courseData = cSnap.val();
            if (courseData?.course_slug && courseData.course_slug !== 'NULL') return courseData.course_slug;
          }
        } catch (e) {}
        return activeApp.courseId || 'Regular';
      };

      const configRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/examConfigurations`);
      if (configUnsubRef.current) configUnsubRef.current();
      configUnsubRef.current = onValue(configRef, (configSnap) => {
        getCourseSlug().then((courseSlug) => {
          const configId = `${activeApp.courseType || 'Regular'}_${courseSlug}`.replace(/\s+/g, '_');
          if (configSnap.exists()) {
            const configs = configSnap.val();
            if (configs[configId]) {
              setExamSettings([ { ...configs[configId], id: configId } ]);
              safeSessionSet('student_exam_settings', [ { ...configs[configId], id: configId } ]);
            }
          }
        });
      });

      const subRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/examSubmissions`);
      if (submissionsUnsubRef.current) submissionsUnsubRef.current();
      submissionsUnsubRef.current = onValue(subRef, (subSnap) => {
        if (subSnap.exists()) {
          const data = Object.entries(subSnap.val())
            .map(([id, val]: any) => ({ id, ...val }))
            .filter((sub: any) => sub.studentUid === currentUid);
          setExamSubmissions(data);
          safeSessionSet('student_exam_submissions', data);
        }
      });

      const onlineExamsRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/onlineExams`);
      if (onlineExamsUnsubRef.current) onlineExamsUnsubRef.current();
      onlineExamsUnsubRef.current = onValue(onlineExamsRef, (examsSnap) => {
        if (examsSnap.exists()) {
          const data = Object.entries(examsSnap.val()).map(([id, val]: any) => ({ id, ...val }));
          setOnlineExams(data);
          safeSessionSet('student_online_exams', data);
        }
      });

      const paySetRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/paymentSettings`);
      if (paymentSettingsUnsubRef.current) paymentSettingsUnsubRef.current();
      paymentSettingsUnsubRef.current = onValue(paySetRef, (paySnap) => {
        if (paySnap.exists()) {
          setCollegePaymentSettings(paySnap.val());
          safeSessionSet('student_college_payment_settings', paySnap.val());
        }
      });
    };

    if (isEmergencyBypass && bypassedUid) {
      loadStudentData(bypassedUid);
    }

    const unsubscribe = onAuthStateChanged(studentAuth, (user) => {
      if (isEmergencyBypass) return;
      cleanupInnerListeners();
      if (user) {
        loadStudentData(user.uid);
      } else {
        if (!studentAuth.currentUser) {
          router.push('/login/student');
        }
      }
    });

    return () => {
      unsubscribe();
      cleanupInnerListeners();
    };
  }, [router]);

  // Fetch issued credentials from all relevant colleges
  useEffect(() => {
    if (!userData?.uid || userApplications.length === 0) {
      setIssuedCredentials([]);
      return;
    }

    const collegeIds = Array.from(new Set(userApplications.map(a => a.collegeId).filter(Boolean)));
    const unsubs: (() => void)[] = [];

    collegeIds.forEach(cId => {
      const credsRef = ref(realtimeDb, `colleges/${cId}/generatedCredentials`);
      const unsub = onValue(credsRef, (snap) => {
        if (snap.exists()) {
          const allCreds = Object.entries(snap.val()).map(([id, val]: any) => ({ ...val, id, collegeId: cId }));
          const studentCreds = allCreds.filter(c =>
            (c.studentUid === userData.uid ||
              c.regNo === userData.profile?.regNo ||
              c.regNo === userData.regNo ||
              c.rollNumber === userData.profile?.rollNumber) &&
            c.isVisible === true
          );

          setIssuedCredentials(prev => {
            const otherCollegesCreds = prev.filter(p => p.collegeId !== cId);
            const combined = [...otherCollegesCreds, ...studentCreds];
            safeSessionSet('student_issued_credentials', combined);
            return combined;
          });
        } else {
          setIssuedCredentials(prev => {
            const filtered = prev.filter(p => p.collegeId !== cId);
            safeSessionSet('student_issued_credentials', filtered);
            return filtered;
          });
        }
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [userData?.uid, userApplications]);

  // Fetch courses specific to selected college
  useEffect(() => {
    if (!selectedCollege) {
      setCollegeCourses([]);
      return;
    }
    const coursesRef = ref(realtimeDb, `colleges/${selectedCollege}/courses`);
    const unsub = onValue(coursesRef, (snap) => {
      if (snap.exists()) {
        setCollegeCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setCollegeCourses([]);
      }
    });
    return () => unsub();
  }, [selectedCollege]);

  // Unique course types for selected college (now displaying course names as per user request)
  const availableCourseTypes = useMemo(() => {
    const types = new Set(collegeCourses.map(c => c.course_name || c.name || 'Untitled'));
    return Array.from(types);
  }, [collegeCourses]);

  // Filtered courses based on selected type
  const filteredCourses = useMemo(() => {
    return collegeCourses.filter(c => {
      const isAccepted = userApplications.some(app => app.courseId === c.id && (app.status === 'Accepted' || app.status === 'Confirmed'));
      return (c.course_name || c.name || 'Untitled') === selectedCourseType && !isAccepted;
    });
  }, [collegeCourses, selectedCourseType, userApplications]);

  // Auto-populate duration when course is selected
  useEffect(() => {
    const course = collegeCourses.find(c => c.id === selectedCourseId);
    if (course) {
      setSelectedDuration(course.duration);
      setSelectedFees(course.fees || '0');
    } else {
      setSelectedDuration('');
      setSelectedFees('');
    }
  }, [selectedCourseId, collegeCourses]);

  // Pre-fill existing application details when opening modal
  useEffect(() => {
    if (isCourseModalOpen && userApplications.length > 0) {
      const app = userApplications[0];
      if (app.collegeId) setSelectedCollege(app.collegeId);
      if (app.courseType) setSelectedCourseType(app.courseType);
      if (app.courseId) setSelectedCourseId(app.courseId);

    }
  }, [isCourseModalOpen, userApplications]);

  const stepPercentages = useMemo(() => {
    const p = userData?.profile || {};
    const calculateStep1 = () => {
      const required = ['firstName', 'gender', 'dateOfBirth', 'aadhaarNo', 'phone'];
      const filledCount = required.filter(field => p[field]).length;
      return Math.round((filledCount / required.length) * 100);
    };

    return {
      1: calculateStep1(),
      2: p.address ? 100 : 0,
      3: p.fatherFirstName ? 100 : 0,
      4: p.casteCategory ? 100 : 0,
      5: (p.qualifications && p.qualifications.length > 0) ? 100 : 0,
      6: p.hasTraining ? 100 : 0,
      7: (p.languagesKnown && p.languagesKnown.length > 0) ? 100 : 0,
      8: (p.hasBankAccount === 'No' || p.bankPassbookUrl) ? 100 : 0,
      9: p.hasWorkExperience ? 100 : 0,
      10: (userApplications.length > 0 && !!userApplications[0].courseId) ? 100 : 0,
      11: p.profileLocked ? 100 : 0,
      222: (p.profileLocked && userApplications.some(app => app.status === 'Accepted' || app.status === 'Confirmed')) ? 100 : 0
    };
  }, [userData, userApplications]);

  const hasActiveAdmission = useMemo(() => {
    // If the admin has explicitly unlocked the profile, allow editing
    if (userData?.profile?.profileLocked === false || userData?.profile?.status === 'Unlocked') return false;

    // Otherwise, check if there is any application that is either explicitly locked or accepted
    return userApplications.some(app => app.isLocked || app.status === 'Accepted' || app.status === 'Confirmed' || app.profileLocked === true);

  }, [userApplications, userData]);

  const handleTabChange = (tabId: number, stepId?: number, appId?: string, mode?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId.toString());

    if (stepId) {
      params.set('step', stepId.toString());
    } else {
      params.delete('step');
    }

    if (appId) {
      params.set('appId', appId);
    } else if (tabId !== 3) {
      params.delete('appId');
    }

    if (mode) {
      params.set('mode', mode);
    } else if (tabId !== 3) {
      params.delete('mode');
    }

    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  // Sync editingApplication with appId in URL
  useEffect(() => {
    const appIdFromUrl = searchParams.get('appId');
    if (appIdFromUrl === 'new') {
      setEditingApplication(null);
    } else if (appIdFromUrl && userApplications.length > 0) {
      const app = userApplications.find(a => a.id === appIdFromUrl);
      if (app) {
        setEditingApplication(app);
      }
    }
  }, [searchParams, userApplications]);

  const handleDocumentUpload = (doc: any) => {
    if (!userData?.course || userData.course === 'Not Selected') {
      setPendingDocStep(doc.stepId);
      setIsCourseModalOpen(true);
      return;
    }
    setUploadingDoc(doc);
    setIsUploadModalOpen(true);
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDoc || !userData?.uid) return;

    const sizeInKB = file.size / 1024;
    if (sizeInKB < 1 || sizeInKB > 1024) {
      alert('File size must be between 1 KB and 1 MB');
      e.target.value = '';
      return;
    }

    setIsUploadingDoc(true);
    const fileRef = storageRef(storage, `users/${userData.uid}/documents/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    uploadTask.on('state_changed', null, 
      (error) => {
        console.error(error);
        alert('Upload failed. Please try again.');
        setIsUploadingDoc(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const profileRef = ref(realtimeDb, `users/${userData.uid}/profile`);

          if (uploadingDoc.isQualification) {
            const quals = [...(userData.profile?.qualifications || [])];
            if (quals[uploadingDoc.qualIndex]) {
              quals[uploadingDoc.qualIndex].marksheetUrl = downloadUrl;
              quals[uploadingDoc.qualIndex].marksheetName = file.name;
              await update(profileRef, { qualifications: quals });
            }
          } else {
            await update(profileRef, {
              [uploadingDoc.key]: downloadUrl,
              [`${uploadingDoc.key}FileName`]: file.name
            });
          }

          // Sync with inquiries
          const apps = userApplications;
          for (const app of apps) {
            if (app.collegeId) {
              const inqRef = ref(realtimeDb, `colleges/${app.collegeId}/frontOffice/admissionInquiries`);
              const inqSnap = await get(inqRef);
              if (inqSnap.exists()) {
                const inqs = inqSnap.val();
                const inqKey = Object.keys(inqs).find(k => inqs[k].applicationId === app.applicationId || inqs[k].studentUid === userData.uid);
                if (inqKey) {
                  const updates: any = {};
                  if (uploadingDoc.isQualification) {
                    const q = [...(inqs[inqKey].qualifications || [])];
                    if (q[uploadingDoc.qualIndex]) {
                      q[uploadingDoc.qualIndex].marksheetUrl = downloadUrl;
                      q[uploadingDoc.qualIndex].marksheetName = file.name;
                      updates.qualifications = q;
                    }
                  } else {
                    updates[uploadingDoc.key] = downloadUrl;
                    updates[`${uploadingDoc.key}FileName`] = file.name;
                  }
                  await update(ref(realtimeDb, `colleges/${app.collegeId}/frontOffice/admissionInquiries/${inqKey}`), updates);
                }
              }
            }
          }

          // Update local state for immediate feedback
          setUserData((prev: any) => {
            const newData = { ...prev };
            if (uploadingDoc.isQualification) {
              const quals = [...(newData.profile?.qualifications || [])];
              if (quals[uploadingDoc.qualIndex]) {
                quals[uploadingDoc.qualIndex].marksheetUrl = downloadUrl;
                quals[uploadingDoc.qualIndex].marksheetName = file.name;
                newData.profile.qualifications = quals;
              }
            } else {
              newData.profile = {
                ...newData.profile,
                [uploadingDoc.key]: downloadUrl,
                [`${uploadingDoc.key}FileName`]: file.name
              };
            }
            return newData;
          });

          setIsUploadModalOpen(false);
          setUploadingDoc(null);
          alert(`${uploadingDoc.label} uploaded successfully!`);
        } catch (err) {
          console.error(err);
          alert('Failed to update record. Please try again.');
        } finally {
          setIsUploadingDoc(false);
        }
      }
    );
  };

  const handleCourseSelect = async (courseName: string) => {
    try {
      const profileRef = ref(realtimeDb, 'users/' + userData.uid + '/profile');
      const updatedProfile = { ...(userData?.profile || {}), course: courseName };

      // Update Realtime DB
      await set(profileRef, updatedProfile);

      // Local state update for immediate feedback
      setUserData((prev: any) => ({
        ...prev,
        profile: updatedProfile,
        course: courseName
      }));

      setIsCourseModalOpen(false);
      handleTabChange(3, pendingDocStep || undefined, activeApp?.id); // Go to Admission Wizard
      setPendingDocStep(null);
    } catch (err) {
      console.error("Course selection error:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadData = (data: any, fileName: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNewApplication = async () => {
    // If an application already exists and is LOCKED, and NOT in other course mode, just proceed to the wizard
    if (!isOtherCourseMode && userApplications.length > 0 && hasActiveAdmission) {
      setIsCourseModalOpen(false);
      handleTabChange(3, 1); // Redirect to Step 1 of Profile Wizard
      return;
    }

    if (!selectedCollege || !selectedCourseType || !selectedCourseId || !userData?.uid) {
      alert("Please select all compulsory fields: College, Course Type, and Course.");
      return;
    }

    setIsSubmittingApp(true);

    try {
      const college = availableColleges.find(c => c.id === selectedCollege);
      const course = collegeCourses.find(c => c.id === selectedCourseId);

      // If other course mode, always push a new one. Otherwise update first one if exists.
      const existingApp = (!isOtherCourseMode && userApplications.length > 0) ? userApplications[0] : null;
      const appRef = existingApp
        ? ref(realtimeDb, `users/${userData.uid}/applications/${existingApp.id}`)
        : push(ref(realtimeDb, `users/${userData.uid}/applications`));

      const applicationId = existingApp?.applicationId || `APP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;


      const appData = {
        applicationId: applicationId,
        collegeId: selectedCollege,
        collegeName: college?.name || 'N/A',
        courseType: selectedCourseType,
        courseId: selectedCourseId,
        courseName: course?.name || 'N/A',
        duration: selectedDuration,
        fees: selectedFees,
        status: 'Pending',
        appliedAt: new Date().toISOString(),
        verificationStatus: 'Pending',
        paymentStatus: 'Pending',
        regFee: '5000',
        profileLocked: false // New application starts unlocked
      };

      await update(appRef, appData);

      // Always ensure the profile is UNLOCKED when a new course is selected or updated
      // This allows the student to fill/edit all details before re-locking
      const profileRef = ref(realtimeDb, `users/${userData.uid}/profile`);
      await update(profileRef, {
        profileLocked: false,
        status: 'Unlocked'
      });

      // Update main course field for dashboard display and profile
      const userRef = ref(realtimeDb, `users/${userData.uid}`);
      const profileCourseUpdate: any = { course: course?.name || 'N/A' };
      if (userData?.profile) {
        profileCourseUpdate['profile/course'] = course?.name || 'N/A';
      }
      await update(userRef, profileCourseUpdate);

      setIsCourseModalOpen(false);
      setIsOtherCourseMode(false);

      const appId = appRef.key || (existingApp?.id as string);

      // Navigate to correct section
      alert("Course selected successfully! Please complete all profile sections and click 'LOCK PROFILE' to submit your application for admission.");
      handleTabChange(3, 1, appId, 'full'); // Start at Step 1 of wizard for this specific app in FULL FORM mode

    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleCustomDocUpload = async () => {
    if (!newDocName.trim()) { alert('Please enter document name.'); return; }
    if (!newDocFile) { alert('Please select a file to upload.'); return; }
    if (!userData?.uid) return;
    setIsUploadingDoc(true);
    try {
      const docRef = push(ref(realtimeDb, `users/${userData.uid}/customDocuments`));
      await set(docRef, {
        name: newDocName.trim(),
        fileUrl: newDocFile,
        fileName: newDocFileName,
        uploadedAt: new Date().toISOString()
      });
      setNewDocName('');
      setNewDocFile(null);
      setNewDocFileName('');
      setIsUploadModalOpen(false);
      alert('Document uploaded successfully!');
    } catch (err) {
      alert('Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleCustomDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be under 5MB.'); return; }
    const fileRef = storageRef(storage, `users/${userData?.uid}/customDocuments/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    setIsUploadingDoc(true);
    uploadTask.on('state_changed', null, 
      (error) => { console.error(error); alert('Upload failed'); setIsUploadingDoc(false); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setNewDocFile(url);
        setNewDocFileName(file.name);
        setIsUploadingDoc(false);
      }
    );
  };

  const handleDeleteCustomDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?') || !userData?.uid) return;
    await set(ref(realtimeDb, `users/${userData.uid}/customDocuments/${docId}`), null);
  };


  useEffect(() => {
    if (isPaymentModalOpen && selectedAppForPayment?.collegeId) {
      const settingsRef = ref(realtimeDb, `colleges/${selectedAppForPayment.collegeId}/paymentSettings`);
      get(settingsRef).then((snapshot) => {
        if (snapshot.exists()) {
          setCollegePaymentSettings(snapshot.val());
        } else {
          setCollegePaymentSettings(null);
        }
      });
    }
  }, [isPaymentModalOpen, selectedAppForPayment]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForPayment || !userData?.uid) return;

    const errors: Record<string, string> = {};
    if (!paymentForm.upiId) errors.upiId = "UPI ID is required";
    if (!paymentForm.relationship) errors.relationship = "Please select a relationship";
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) errors.amount = "Valid payment amount is required";
    if (!paymentForm.email) errors.email = "Payer email is required";
    if (!paymentForm.phone) errors.phone = "Mobile number is required";
    if (!paymentForm.screenshot) errors.screenshot = "Please upload a payment screenshot";

    const outstanding = parseFloat(selectedAppForPayment.fees || '0') - parseFloat(selectedAppForPayment.paidFees || '0');
    const inputAmount = parseFloat(paymentForm.amount || '0');

    if (inputAmount > outstanding) {
      errors.amount = `Amount cannot exceed outstanding balance of ₹${outstanding.toLocaleString()}`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      alert("Please fill in all mandatory fields and upload a screenshot.");
      return;
    }

    setFormErrors({});
    setIsSubmittingPayment(true);
    try {
      const paymentData = {
        ...paymentForm,
        studentUid: userData.uid,
        studentName: (userData.profile?.firstName || userData.firstName || 'Unknown') + ' ' + (userData.profile?.lastName || userData.lastName || ''),
        applicationId: selectedAppForPayment.applicationId,
        collegeId: selectedAppForPayment.collegeId,
        courseName: selectedAppForPayment.courseName,
        courseType: selectedAppForPayment.courseType,
        submittedAt: new Date().toISOString(),
        status: 'Pending'
      };

      const paymentRef = push(ref(realtimeDb, `colleges/${selectedAppForPayment.collegeId}/payments/online`));
      await set(paymentRef, paymentData);

      // Also record in student's personal record
      const studentPaymentRef = push(ref(realtimeDb, `users/${userData.uid}/payments`));
      await set(studentPaymentRef, paymentData);

      alert("Payment details submitted successfully! The institution will verify your UTR and update your balance soon.");
      setIsPaymentModalOpen(false);
      setPaymentForm({ upiId: '', utrId: '', email: '', relationship: 'Father', phone: '', amount: '', screenshot: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment details.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp || !userData?.uid) return;

    if (!examForm.screenshot) {
      alert("Please upload payment screenshot to proceed.");
      return;
    }

    setIsSubmittingExam(true);
    try {
      const submissionData = {
        studentUid: userData.uid,
        studentId: userData.profile?.regNo || userData.regNo || 'N/A',
        studentName: examForm.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`,
        fatherName: examForm.fatherName || userData.profile?.fatherFirstName || 'N/A',
        motherName: examForm.motherName || userData.profile?.motherFirstName || 'N/A',
        collegeName: activeApp.collegeName,
        courseType: activeApp.courseType,
        courseName: activeApp.courseName,
        dob: examForm.dob || userData.profile?.dateOfBirth || userData.dateOfBirth || 'N/A',
        aadharNumber: examForm.aadharNumber || userData.profile?.aadhaarNo || 'N/A',
        gender: userData.profile?.gender || userData.gender || 'N/A',
        studentPhone: userData.profile?.phone || userData.profile?.mobileNo || userData.profile?.mobileNumber || userData.phone || 'N/A',
        session: userData.profile?.admissionYear || 'N/A',
        screenshot: examForm.screenshot,
        studentPhoto: userData.profile?.photoUrl || userData.photo || '',
        studentSignature: userData.profile?.signUrl || userData.profile?.signatureUrl || '',
        submittedAt: new Date().toISOString(),
        status: 'Pending',
        fees: selectedExamConfig?.fees || '0',
        academicYear: selectedExamConfig?.academicYear || '2026-2027'
      };

      const subRef = push(ref(realtimeDb, `colleges/${activeApp.collegeId}/examSubmissions`));
      await set(subRef, submissionData);

      alert("Exam form submitted successfully! Waiting for institutional verification.");
      setIsExamModalOpen(false);
      setExamForm({ screenshot: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to submit exam form.");
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleAddCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.uid || !addDocForm.name || !addDocForm.file) {
      alert("Please enter document name and upload a file.");
      return;
    }

    setIsSavingDoc(true);
    try {
      const docRef = push(ref(realtimeDb, `users/${userData.uid}/customDocuments`));
      await set(docRef, {
        name: addDocForm.name,
        file: addDocForm.file,
        uploadedAt: new Date().toISOString()
      });
      alert("Document added successfully!");
      setIsAddDocModalOpen(false);
      setAddDocForm({ name: '', file: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to add document.");
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleUnlockApplication = async (app: any) => {
    if (!userData?.uid) return;
    setLoading(true);
    try {
      const profileRef = ref(realtimeDb, `users/${userData.uid}/profile`);
      await update(profileRef, {
        profileLocked: false,
        status: 'Unlocked'
      });

      const appRef = ref(realtimeDb, `users/${userData.uid}/applications/${app.id}`);
      await update(appRef, {
        profileLocked: false,
        status: 'Unlocked'
      });

      if (app.collegeId) {
        const inqRef = ref(realtimeDb, `colleges/${app.collegeId}/frontOffice/admissionInquiries`);
        const inqSnap = await get(inqRef);
        if (inqSnap.exists()) {
          const inqs = inqSnap.val();
          const inqKey = Object.keys(inqs).find(k => inqs[k].applicationId === app.applicationId || inqs[k].studentUid === userData.uid);
          if (inqKey) {
            await update(ref(realtimeDb, `colleges/${app.collegeId}/frontOffice/admissionInquiries/${inqKey}`), {
              profileLocked: false,
              status: 'Unlocked'
            });
          }
        }
      }

      alert("Profile Unlocked Successfully! You can now edit your details in the Application Profile.");
    } catch (error) {
      console.error("Unlock error:", error);
      alert("Failed to unlock profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <DashboardHome
            userData={userData}
            userApplications={userApplications}
            stepPercentages={stepPercentages}
            feeDue={feeDue}
            hasActiveAdmission={hasActiveAdmission}
            setIsOtherCourseMode={setIsOtherCourseMode}
            setIsCourseModalOpen={setIsCourseModalOpen}
            handleTabChange={handleTabChange}
            activeApp={activeApp}
          />
        );
      case 2:
        return (
          <ApplicationManager
            selectedCollege={selectedCollege}
            setSelectedCollege={setSelectedCollege}
            availableColleges={availableColleges}
            selectedCourseType={selectedCourseType}
            setSelectedCourseType={setSelectedCourseType}
            availableCourseTypes={availableCourseTypes}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            filteredCourses={filteredCourses}
            selectedDuration={selectedDuration}
            selectedFees={selectedFees}
            handleAddNewApplication={handleAddNewApplication}
            isSubmittingApp={isSubmittingApp}
            userApplications={userApplications}
            userData={userData}
            handleTabChange={handleTabChange}
            activeApp={activeApp}
            handleDownloadPDF={handleDownloadPDF}
            downloadingAppId={downloadingAppId}
          />
        );
      case 33: {
        const lockedApps = userApplications; // Show all applications as requested by the user
        return (
          <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
            <div className="glass-effect p-10 rounded-[3rem] border-4 border-white shadow-2xl">
              <header className="mb-10">
                <h3 className="text-2xl font-black text-[#002147] tracking-tighter capitalize">Unlock Profile List</h3>
                <p className="text-[13px] font-medium text-slate-400 capitalize tracking-tight mt-1">View your locked applications and unlock them to make edits</p>
              </header>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-black">
                      <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black text-center w-16">Sr.</th>
                      <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black">Date & Time</th>
                      <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black">College</th>
                      <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black">Course Type</th>
                      <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black text-center">Course Status</th>
                      <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="border-b border-black">
                    {[...lockedApps].sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime()).map((app, i) => (
                      <tr key={`${app.id}-${i}`} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                        <td className="px-6 py-6 border-r border-black text-[13px] font-medium text-slate-400 text-center">{i + 1}.</td>
                        <td className="px-6 py-6 border-r border-black">
                          <p className="text-[13px] font-bold text-black">{new Date(app.appliedAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-medium text-slate-400">{new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </td>
                        <td className="px-6 py-6 border-r border-black font-bold text-slate-800 text-[13px]">{app.collegeName}</td>
                        <td className="px-6 py-6 border-r border-black">
                          <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100">
                            {app.courseType || 'Reg'}
                          </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border",
                            app.status === 'Accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              app.status === 'Rejected' ? "bg-red-50 text-red-600 border-red-100" :
                                "bg-amber-50 text-amber-600 border-amber-200"
                          )}>
                            {app.status || 'Pending'}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleTabChange(3, 1, app.id)}
                            className="px-6 py-2 bg-[#002147] text-white rounded-xl text-[11px] font-black uppercase tracking-tight shadow-md hover:bg-[#00a5a5] transition-all active:scale-95"
                          >
                            View Profile
                          </button>
                          {!(app.status === 'Accepted' || app.status === 'Confirmed') && (
                            <button
                              onClick={() => handleUnlockApplication(app)}
                              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[11px] font-black uppercase tracking-tight shadow-md hover:bg-rose-500 transition-all active:scale-95"
                            >
                              Unlock Profile
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {lockedApps.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-slate-400 italic">No locked applications found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }
      case 3: {
        const appId = searchParams.get('appId');
        const mode = searchParams.get('mode');
        const isFullFormMode = mode === 'full';
        const activeStep = searchParams.get('step') ? parseInt(searchParams.get('step') as string) : 1;

        let currentApp = editingApplication;
        if (!currentApp && (appId === 'new' || userApplications.length === 0)) {
          currentApp = {
            id: 'new',
            applicationId: 'NEW',
            collegeName: 'New College Selection',
            courseName: 'New Course Selection',
            courseType: 'Regular',
            status: 'Pending'
          };
        }

        if (!currentApp) {
          return (
            <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-8">
              <div className="glass-effect p-4 md:p-10 rounded-[2rem] md:rounded-[3rem] border-4 border-white shadow-2xl">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-[#002147] tracking-tighter capitalize">Admission Profile Forms</h3>
                    <p className="text-[13px] font-medium text-slate-400 capitalize tracking-tight mt-1">Select an application to complete or update your admission profile</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsOtherCourseMode(true);
                      handleTabChange(3, 1, 'new');
                    }}
                    className="bg-[#00a5a5] hover:bg-[#003366] text-white px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-tight shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Apply for New Admission
                  </button>
                </header>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse border border-black block md:table">
                    <thead className="hidden md:table-header-group">
                      <tr className="bg-slate-50/50 border-b border-black">
                        <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black text-center w-16">Sr.</th>
                        <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black">Date & Time</th>
                        <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black">College</th>
                        <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black">Course Type</th>
                        <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest border-r border-black text-center">Course Status</th>
                        <th className="px-6 py-5 text-[12px] font-black text-[#002147] uppercase tracking-widest text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                      {[...userApplications].sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime()).map((app, i) => (
                        <tr key={`${app.id}-${i}`} className="block md:table-row hover:bg-slate-50/50 transition-colors border-b border-black bg-white md:bg-transparent rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow-sm md:shadow-none md:border-t-0 border-t border-r border-l">
                          <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r border-black text-[13px] font-medium text-slate-400 text-center">
                            <span className="md:hidden font-black text-[10px] text-[#002147] uppercase tracking-widest">Sr.</span>
                            <span>{i + 1}.</span>
                          </td>
                          <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r border-black">
                            <span className="md:hidden font-black text-[10px] text-[#002147] uppercase tracking-widest">Date & Time</span>
                            <div className="text-right md:text-left">
                              <p className="text-[13px] font-bold text-black">{new Date(app.appliedAt).toLocaleDateString()}</p>
                              <p className="text-[10px] font-medium text-slate-400">{new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            </div>
                          </td>
                          <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r border-black font-bold text-slate-800 text-[13px]">
                            <span className="md:hidden font-black text-[10px] text-[#002147] uppercase tracking-widest">College</span>
                            <span className="text-right md:text-left">{app.collegeName}</span>
                          </td>
                          <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r border-black">
                            <span className="md:hidden font-black text-[10px] text-[#002147] uppercase tracking-widest">Course Type</span>
                            <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100">
                              {app.courseType || 'Reg'}
                            </span>
                          </td>
                          <td className="flex items-center justify-between md:table-cell px-2 md:px-6 py-3 md:py-6 border-b border-slate-100 md:border-b-0 md:border-r border-black text-center">
                            <span className="md:hidden font-black text-[10px] text-[#002147] uppercase tracking-widest">Status</span>
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border",
                              app.status === 'Accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                app.status === 'Rejected' ? "bg-red-50 text-red-600 border-red-100" :
                                  "bg-amber-50 text-amber-600 border-amber-200"
                            )}>
                              {app.status || 'Pending'}
                            </div>
                          </td>
                          <td className="flex items-center justify-between md:justify-center md:table-cell px-2 md:px-6 py-4 md:py-6 text-center">
                            <span className="md:hidden font-black text-[10px] text-[#002147] uppercase tracking-widest">Action</span>
                            <button
                              onClick={() => handleTabChange(3, 1, app.id)}
                              className="px-6 py-2 bg-[#002147] text-white rounded-xl text-[11px] font-black uppercase tracking-tight shadow-md hover:bg-[#00a5a5] transition-all active:scale-95"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                      {userApplications.length === 0 && (
                        <tr className="block md:table-row">
                          <td colSpan={6} className="py-20 text-center text-slate-400 italic block md:table-cell">No applications found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <header className="mb-8 flex justify-between items-center bg-white p-8 rounded-[2rem] border border-black shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingApplication(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                  <h2 className="text-2xl font-black text-[#002147] tracking-tighter uppercase">Identity & Profile Center</h2>
                </div>
                <div className="flex items-center gap-3 pl-10">
                  <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{currentApp.collegeName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[12px] font-black text-[#00a5a5] uppercase tracking-widest">{currentApp.courseName} ({currentApp.courseType})</span>
                </div>
              </div>
              <div className="px-6 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#002147] text-white flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#002147] uppercase tracking-widest leading-none">Application ID</p>
                  <p className="text-[13px] font-black text-black tracking-tight mt-1">{currentApp.applicationId}</p>
                </div>
              </div>
            </header>
            <ProfileWizard
              key={`wizard-${appId || currentApp?.id || 'default'}`}
              userId={userData?.uid}
              isFullFormMode={isFullFormMode}
              initialData={appId === 'new' ? { ...userData?.profile, ...userData, profileLocked: false } : { ...userData?.profile, ...userData }}
              initialStep={activeStep}
              isAdmitted={userApplications.some(app => app.status === 'Accepted' || app.status === 'Confirmed')}
              editingApplication={currentApp}
              isOtherCourseMode={appId === 'new' || userApplications.length === 0}
              onStepComplete={(step, perc) => {
                console.log(`Step ${step} completed: ${perc}%`);
              }}
            />
          </div>
        );
      }
      case 4:
        return (
          <ExaminationCenter
            activeApp={activeApp}
            examSettings={examSettings}
            examSubmissions={examSubmissions}
            setIsExamModalOpen={setIsExamModalOpen}
            setSelectedExamConfig={setSelectedExamConfig}
            userData={userData}
          />
        );
      case 5: {
        const subTabName = searchParams.get('name') || '';

        if (subTabName === 'b)-payment-slip' || subTabName === 'Payment Slip') {
          return (
            <PaymentSlipPortal
              userPayments={userPayments}
              setLastReceipt={setLastReceipt}
              setShowReceipt={setShowReceipt}
            />
          );
        }

        const acceptedApps = userApplications
          .filter(app => app.status === 'Accepted' || app.status === 'Confirmed')
          .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
        const totalFees = acceptedApps.reduce((acc, app) => acc + parseFloat(app.fees || '0'), 0);
        const totalPaid = acceptedApps.reduce((acc, app) => acc + parseFloat(app.paidFees || '0'), 0);
        const balanceDue = totalFees - totalPaid;

        return (
          <FeePaymentPortal
            acceptedApps={acceptedApps}
            totalFees={totalFees}
            totalPaid={totalPaid}
            balanceDue={balanceDue}
            userPayments={userPayments}
            setSelectedAppForPayment={setSelectedAppForPayment}
            setPaymentForm={setPaymentForm}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            setLastReceipt={setLastReceipt}
            setShowReceipt={setShowReceipt}
          />
        );
      }
      case 6:
        return <MarksheetModule credentials={issuedCredentials} />;
      case 13:
        return <CertificateModule credentials={issuedCredentials} />;
      case 7:
        return <QuestionPaperModule exams={onlineExams} activeApp={activeApp} userData={userData} />;
      case 11: {
        const profileDocs = [
          { label: 'Aadhar Card Front', key: 'aadhaarFrontUrl', stepId: 1 },
          { label: 'Aadhar Card Back', key: 'aadhaarBackUrl', stepId: 1 },
          { label: 'Transfer Certificate', key: 'transferCertificateUrl', stepId: 1 },
          { label: 'Bonafide Certificate', key: 'bonafideCertificateUrl', stepId: 1 },
          { label: 'Caste Certificate', key: 'casteCertificateUrl', stepId: 4 },
          { label: 'Training Certificate', key: 'trainingCertificateUrl', stepId: 6 },
          { label: 'PAN Card', key: 'panCardUrl', stepId: 8 },
          { label: 'Bank Passbook / Cheque', key: 'bankPassbookUrl', stepId: 8 },
          ...(userData?.profile?.qualifications || []).map((q: any, idx: number) => ({
            label: `${q.examination} Marksheet`,
            url: q.marksheetUrl,
            stepId: 5,
            isQualification: true,
            qualIndex: idx
          }))
        ];

        return (
          <DocumentVault
            profileDocs={profileDocs}
            userData={userData}
            customDocuments={customDocuments}
            setIsAddDocModalOpen={setIsAddDocModalOpen}
            setModalPreview={setModalPreview}
            handleDocumentUpload={handleDocumentUpload}
            handleDeleteCustomDoc={handleDeleteCustomDoc}
          />
        );
      }
      case 22:
        return (
          <PrintApplicationRegistry
            userApplications={userApplications}
            userData={userData}
            availableColleges={availableColleges}
          />
        );
      case 14:
        return (
          <FeeTablePortal
            availableCourses={availableCourses}
            availableColleges={availableColleges}
          />
        );
      case 10:
        return (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <StudentNoticeBoard collegeId={userData?.profile?.collegeId || userData?.collegeId} userId={userData?.uid || userData?.id} />
          </div>
        );
      case 12:
        return (
          <StudentIDCard userData={userData} activeApp={activeApp} />
        );
      default:
        return (
          <div className="text-center py-20 px-10 glass-effect rounded-[3rem] border border-white shadow-2xl">
            <h3 className="text-2xl font-medium text-slate-800 tracking-tighter">Student Module</h3>
            <p className="text-slate-400 font-normal mt-2">This feature is being updated. Please check back later.</p>
          </div>
        );
    }
  };

  if (loading || !userData) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <div className="w-20 h-20 border-4 border-t-[#ff9f1c] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-[#ff9f1c] font-black capitalize tracking-normal text-[13px]">
          Initializing Student Session
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <main className="max-w-[1600px] mx-auto min-h-screen">
        {renderTabContent()}
      </main>

      {/* Course Selection Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => { setIsCourseModalOpen(false); setIsOtherCourseMode(false); }} />


          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-[#003366] p-8 text-white text-center relative">
              <button
                onClick={() => { setIsCourseModalOpen(false); setIsOtherCourseMode(false); }}

                className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
              <div className="w-14 h-14 bg-[#00a5a5] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold tracking-tight capitalize">Apply For Admission</h3>
              <p className="text-[13px] font-bold text-black capitalize tracking-normal mt-1">Select your institution & course to continue</p>

              {/* Already Accepted Courses List */}
              {userApplications.filter(a => a.status === 'Accepted').length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {userApplications.filter(a => a.status === 'Accepted').map((app, idx) => (
                    <span key={idx} className="bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <Check size={12} className="text-emerald-400" /> you are already select previous: {app.courseName}
                    </span>
                  ))}
                </div>
              )}

            </div>

            {/* Form Body */}
            <div className="p-8 space-y-6">
              {/* Row 1: College, Course Type, Course */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Target Institution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    Target Institution / College <span className="text-red-500">*</span>
                  </label>
                  <select
                    required

                    value={selectedCollege}
                    onChange={(e) => {
                      setSelectedCollege(e.target.value);
                      setSelectedCourseType('');
                      setSelectedCourseId('');
                    }}
                    disabled={!isOtherCourseMode && (hasActiveAdmission || (userApplications.length > 0 && userData?.profile?.status !== 'Unlocked'))}

                    className="w-full border border-slate-300 rounded-md p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed shadow-inner"
                  >
                    <option value="">— Select Official College —</option>
                    {availableColleges.map((col) => (
                      <option key={col.id} value={col.id}>{col.name} (ID: {col.collegeId})</option>
                    ))}
                  </select>
                </div>

                {/* Course Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required

                    value={selectedCourseType}
                    onChange={(e) => {
                      setSelectedCourseType(e.target.value);
                      setSelectedCourseId('');
                    }}
                    disabled={!selectedCollege || (!isOtherCourseMode && (hasActiveAdmission || (userApplications.length > 0 && userData?.profile?.status !== 'Unlocked')))}

                    className="w-full border border-slate-300 rounded-md p-3 text-sm text-slate-700 outline-none focus:border-[#00a5a5] bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed shadow-inner"
                  >
                    <option value="">— Select Type —</option>
                    {availableCourseTypes.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    disabled={!selectedCourseType || (!isOtherCourseMode && (hasActiveAdmission || (userApplications.length > 0 && userData?.profile?.status !== 'Unlocked')))}

                    className="w-full border border-[#00a5a5] rounded-md p-3 text-sm text-slate-700 outline-none bg-white disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed shadow-inner"
                  >
                    <option value="">Select Course Slug</option>
                    {filteredCourses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.course_slug && c.course_slug !== 'NULL' ? c.course_slug : c.course_name || c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Duration */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Duration</label>
                  <input
                    readOnly
                    type="text"
                    value={selectedDuration}
                    placeholder="Automatic from course"
                    className="w-full border border-slate-300 rounded-md p-3 text-sm text-slate-500 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              {/* No courses notice */}
              {selectedCollege && collegeCourses.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[11px] font-bold text-amber-700 capitalize tracking-tight">No courses found for this college. Please contact administration.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00a5a5]">
                <ShieldCheck size={14} />
                <span className="text-[13px] font-black capitalize tracking-tight">Verified Portal</span>
              </div>
              <button
                onClick={handleAddNewApplication}
                disabled={isSubmittingApp || (!userApplications.length && (!selectedCollege || !selectedCourseId))}
                className="bg-[#00a5a5] text-white px-10 py-3.5 rounded-xl text-[11px] font-black capitalize tracking-tight shadow-lg hover:bg-[#003366] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              >
                {isSubmittingApp ? 'Submitting...' : userApplications.length > 0 ? <>CONFIRM & PROCEED <ArrowRight size={14} /></> : <>SUBMIT <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {modalPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalPreview(null)} />
          <div className="bg-white w-11/12 max-w-4xl h-full max-h-[85vh] rounded-[2rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00a5a5] flex items-center justify-center text-white">
                  <FileBadge size={16} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 capitalize tracking-tight">{modalPreview.label}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(modalPreview.url, '_blank')}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#00a5a5] transition-all"
                  title="Open in New Tab"
                >
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => setModalPreview(null)}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-100/50 flex items-center justify-center">
              <img
                src={modalPreview.url}
                alt={modalPreview.label}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-4 border-white"
              />
            </div>
          </div>
        </div>
      )}
      {/* Payment Submission Modal */}
      {isPaymentModalOpen && selectedAppForPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingPayment && setIsPaymentModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-[#5D5fb1] p-10 text-white relative shrink-0">
              <button onClick={() => setIsPaymentModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="space-y-1">
                <h3 className="text-3xl font-black tracking-tighter capitalize">Online Fee Payment</h3>
                <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Submit your transaction details for verification</p>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-10 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {/* Scan & Pay Section */}
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
                    <p className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest">Scan to pay directly</p>
                    <h4 className="text-xl font-black text-slate-800 tracking-tighter capitalize leading-tight">
                      {collegePaymentSettings.merchantName || selectedAppForPayment?.collegeName || 'Official College Account'}
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
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                  <p className="text-sm font-bold text-slate-800 capitalize">{userData?.fullName || userData?.studentName || `${userData.profile?.firstName || userData.firstName || 'Student'} ${userData.profile?.middleName || userData.middleName || ''} ${userData.profile?.lastName || userData.lastName || ''}`.trim()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
                  <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="bg-[#5D5fb1]/5 p-4 rounded-2xl border border-[#5D5fb1]/20">
                  <p className="text-[10px] font-bold text-[#5D5fb1] uppercase tracking-widest mb-1">College</p>
                  <p className="text-sm font-bold text-[#002147] capitalize">{selectedAppForPayment.collegeName}</p>
                </div>
                <div className="bg-[#00a5a5]/5 p-4 rounded-2xl border border-[#00a5a5]/20 md:col-span-1">
                  <p className="text-[10px] font-bold text-[#00a5a5] uppercase tracking-widest mb-1">Course</p>
                  <p className="text-sm font-bold text-[#002147] capitalize">{selectedAppForPayment.courseName}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UPI ID</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. name@upi"
                      className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                      value={paymentForm.upiId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                    />
                    {formErrors.upiId && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.upiId}</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">UTR / Transaction ID</label>
                    <input
                      type="text"
                      placeholder="12-digit transaction number (Optional)"
                      className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                      value={paymentForm.utrId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, utrId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Payer Relationship</label>
                    <select
                      required
                      className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all cursor-pointer"
                      value={paymentForm.relationship}
                      onChange={(e) => setPaymentForm({ ...paymentForm, relationship: e.target.value })}
                    >
                      <option value="Self">Self (Student)</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                    {formErrors.relationship && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.relationship}</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight">Amount Paid (₹)</label>
                      <span className="text-[10px] font-bold text-[#ff9f1c]">Max: ₹{(parseFloat(selectedAppForPayment.fees || '0') - parseFloat(selectedAppForPayment.paidFees || '0')).toLocaleString()}</span>
                    </div>
                    <input
                      required
                      type="number"
                      className="w-full bg-emerald-50 border border-emerald-500 rounded-2xl p-4 text-lg font-black text-emerald-700 outline-none"
                      value={paymentForm.amount}
                      onChange={(e) => {
                        const maxVal = parseFloat(selectedAppForPayment.fees || '0') - parseFloat(selectedAppForPayment.paidFees || '0');
                        const inputVal = parseFloat(e.target.value);
                        setPaymentForm({ ...paymentForm, amount: inputVal > maxVal ? maxVal.toString() : e.target.value });
                      }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                    {formErrors.amount && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.amount}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Email ID</label>
                    <input
                      required
                      type="email"
                      placeholder="Contact email for payment"
                      className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                      value={paymentForm.email}
                      onChange={(e) => setPaymentForm({ ...paymentForm, email: e.target.value })}
                    />
                    {formErrors.email && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.email}</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mobile Number</label>
                    <input
                      required
                      type="tel"
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#5D5fb1] transition-all"
                      value={paymentForm.phone}
                      onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                    />
                    {formErrors.phone && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize">{formErrors.phone}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Upload Payment Screenshot / Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="payment-screenshot"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                            const fileRef = storageRef(storage, `users/${userData.uid}/feePayments/${Date.now()}_${file.name}`);
                            const uploadTask = uploadBytesResumable(fileRef, file);
                            uploadTask.on('state_changed', null, 
                              (error) => { console.error('Upload failed', error); alert('Failed to upload image'); },
                              async () => {
                                const url = await getDownloadURL(uploadTask.snapshot.ref);
                                setPaymentForm({ ...paymentForm, screenshot: url });
                              }
                            );
                          }
                          }}
                        />
                        <label
                          htmlFor="payment-screenshot"
                          className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-black rounded-2xl p-6 cursor-pointer hover:bg-slate-100 transition-all group"
                        >
                          <Camera size={20} className="text-slate-400 group-hover:text-[#5D5fb1]" />
                          <span className="text-[13px] font-medium text-slate-500 group-hover:text-black">
                            {paymentForm.screenshot ? 'Change Photo' : 'Click to Upload Receipt Photo'}
                          </span>
                        </label>
                        {formErrors.screenshot && <span className="text-[11px] font-bold text-red-500 pl-1 capitalize block mt-2">{formErrors.screenshot}</span>}
                      </div>
                      {paymentForm.screenshot && (
                        <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500 overflow-hidden shrink-0 shadow-lg cursor-pointer" onClick={() => setModalPreview({ url: paymentForm.screenshot, label: 'Payment Receipt Preview' })}>
                          <img src={paymentForm.screenshot} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="w-full bg-[#002147] text-white py-5 rounded-[2rem] text-sm font-black capitalize tracking-widest shadow-2xl hover:bg-[#5D5fb1] transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmittingPayment ? 'Verifying Transaction...' : 'SUBMIT PAYMENT DETAILS'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Exam Submission Modal */}
      {isExamModalOpen && activeApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmittingExam && setIsExamModalOpen(false)} />
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-[#002147] p-10 text-white relative shrink-0">
              <button onClick={() => setIsExamModalOpen(false)} className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-xl">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter capitalize">Examination Form</h3>
                  <p className="text-[13px] font-normal text-white/60 capitalize tracking-tight">Academic Session {selectedExamConfig?.academicYear || '2026-2027'}</p>

                </div>
              </div>
            </div>

            <form onSubmit={handleExamSubmit} className="p-10 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
              {/* Student Particulars */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <User size={18} className="text-[#00a5a5]" />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Particulars</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Student Name</label>
                    <input
                      type="text"
                      defaultValue={userData?.fullName || userData?.studentName || `${userData.profile?.firstName || ''} ${userData.profile?.middleName || ''} ${userData.profile?.lastName || ''}`.trim()}
                      onChange={(e) => setExamForm({ ...examForm, studentName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Father's Name</label>
                    <input
                      type="text"
                      defaultValue={userData.profile?.fatherFirstName || ''}
                      onChange={(e) => setExamForm({ ...examForm, fatherName: e.target.value })}
                      placeholder="Father's Full Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mother's Name</label>
                    <input
                      type="text"
                      defaultValue={userData.profile?.motherFirstName || ''}
                      onChange={(e) => setExamForm({ ...examForm, motherName: e.target.value })}
                      placeholder="Mother's Full Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                    <input
                      type="date"
                      defaultValue={userData.profile?.dateOfBirth || ''}
                      onChange={(e) => setExamForm({ ...examForm, dob: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Aadhar Number</label>
                    <input
                      type="text"
                      defaultValue={userData.profile?.aadhaarNo || ''}
                      onChange={(e) => setExamForm({ ...examForm, aadharNumber: e.target.value })}
                      placeholder="12-Digit Aadhar No."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>

                  {/* Institutional Read-Only Info */}
                  {[
                    { label: 'College / Institution', value: activeApp.collegeName },
                    { label: 'Course Type', value: activeApp.courseType },
                    { label: 'Program / Course', value: activeApp.courseName },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 opacity-60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-black text-slate-800 capitalize tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & QR Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <CreditCard size={18} className="text-[#00a5a5]" />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fee Payment (₹{selectedExamConfig?.fees || '0'})</h4>
                </div>

                {collegePaymentSettings?.isActive && (
                  <div className="bg-indigo-50/50 rounded-[2.5rem] p-8 border-2 border-dashed border-[#5D5fb1]/20 flex flex-col md:flex-row items-center gap-10">
                    <div className="p-4 bg-white rounded-3xl shadow-2xl border border-indigo-100 shrink-0">
                      <QRCodeCanvas
                        value={`upi://pay?pa=${collegePaymentSettings.upiId}&pn=${encodeURIComponent(activeApp.collegeName)}&am=${selectedExamConfig?.fees || '0'}&cu=INR`}
                        size={150}
                        level="H"
                      />
                    </div>
                    <div className="space-y-4 text-center md:text-left flex-1">
                      <div>
                        <p className="text-[10px] font-black text-[#5D5fb1] uppercase tracking-widest mb-1">Official Payment Gateway</p>
                        <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-tight capitalize">{activeApp.collegeName}</h4>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-indigo-100 shadow-sm self-center md:self-start">
                          <ShieldCheck size={16} className="text-emerald-500" />
                          <span className="text-sm font-bold text-slate-600">{collegePaymentSettings.upiId}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 italic">Scan the QR code or pay to the UPI ID above to complete registration.</p>

                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[13px] font-black text-slate-800 capitalize tracking-tight pl-1">Upload Payment Receipt / Screenshot <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="exam-payment-screenshot"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileRef = storageRef(storage, `users/${userData.uid}/examPayments/${Date.now()}_${file.name}`);
                            const uploadTask = uploadBytesResumable(fileRef, file);
                            uploadTask.on('state_changed', null, 
                              (error) => { console.error('Upload failed', error); alert('Failed to upload image'); },
                              async () => {
                                const url = await getDownloadURL(uploadTask.snapshot.ref);
                                setExamForm({ ...examForm, screenshot: url });
                              }
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor="exam-payment-screenshot"
                        className="w-full flex items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] p-8 cursor-pointer hover:bg-white hover:border-[#00a5a5] transition-all group"
                      >
                        <Camera size={24} className="text-slate-400 group-hover:text-[#00a5a5]" />
                        <span className="text-sm font-bold text-slate-500 group-hover:text-black">
                          {examForm.screenshot ? 'Update Receipt Photo' : 'Upload Transaction Screenshot'}
                        </span>
                      </label>
                    </div>
                    {examForm.screenshot && (
                      <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl overflow-hidden shrink-0 animate-in zoom-in-50" onClick={() => setModalPreview({ url: examForm.screenshot, label: 'Payment Receipt' })}>
                        <img src={examForm.screenshot} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingExam}
                className="w-full bg-[#00a5a5] text-white py-6 rounded-[2.5rem] text-sm font-black capitalize tracking-widest shadow-2xl hover:bg-[#002147] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSubmittingExam ? 'Processing Submission...' : <><Save size={20} /> Submit Examination Form</>}

              </button>
            </form>
          </div>
        </div>
      )}
      {/* Quick Document Upload Modal */}
      {isUploadModalOpen && uploadingDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#002147]/80 backdrop-blur-md" onClick={() => !isUploadingDoc && setIsUploadModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#002147] p-10 text-white text-center relative">
              <button onClick={() => setIsUploadModalOpen(false)} className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="w-20 h-20 bg-[#00a5a5] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white/10">
                <Upload size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Upload {uploadingDoc.label}</h3>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-2">Official Document Submission</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select File (JPG, PNG, PDF - 1 KB to 1 MB)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    id="quick-doc-upload"
                    onChange={handleQuickUpload}
                  />
                  <label
                    htmlFor="quick-doc-upload"
                    className="w-full flex flex-col items-center justify-center gap-4 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] p-12 cursor-pointer hover:bg-white hover:border-[#00a5a5] transition-all group shadow-inner"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#00a5a5] shadow-sm border border-slate-100 transition-all">
                      <Camera size={28} />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-black text-slate-800 block mb-1">Click to browse files</span>
                      <span className="text-[11px] font-medium text-slate-400">or drag and drop your document here</span>
                    </div>
                  </label>
                </div>
              </div>

              {isUploadingDoc && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#00a5a5]">
                    <span>Uploading...</span>
                    <span>Please wait</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00a5a5] animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add Custom Document Modal */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsAddDocModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#002147] p-8 text-white text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Add Custom Document</h3>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-1">Upload additional verification files</p>
            </div>
            <form onSubmit={handleAddCustomDoc} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Document Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. TC, LC, Gap Certificate"
                  className="w-full bg-slate-50 border border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white transition-all"
                  value={addDocForm.name}
                  onChange={(e) => setAddDocForm({ ...addDocForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Upload Photo / PDF Screenshot</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="custom-doc-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileRef = storageRef(storage, `users/${userData?.uid}/customDocuments/${Date.now()}_${file.name}`);
                          const uploadTask = uploadBytesResumable(fileRef, file);
                          uploadTask.on('state_changed', null, 
                            (error) => { console.error('Upload failed', error); alert('Failed to upload image'); },
                            async () => {
                              const url = await getDownloadURL(uploadTask.snapshot.ref);
                              setAddDocForm({ ...addDocForm, file: url });
                            }
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor="custom-doc-upload"
                      className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-black rounded-2xl p-6 cursor-pointer hover:bg-slate-100 transition-all group"
                    >
                      <Camera size={20} className="text-slate-400 group-hover:text-[#002147]" />
                      <span className="text-[13px] font-medium text-slate-500 group-hover:text-black">
                        {addDocForm.file ? 'File Selected' : 'Choose Document Photo'}
                      </span>
                    </label>
                  </div>
                  {addDocForm.file && (
                    <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500 overflow-hidden shrink-0 shadow-lg">
                      <img src={addDocForm.file} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}
                </div>
              </div>
              <button
                disabled={isSavingDoc}
                type="submit"
                className="w-full bg-[#002147] text-white py-4 rounded-2xl text-[12px] font-black uppercase tracking-tight shadow-xl hover:bg-[#00a5a5] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {isSavingDoc ? 'Saving Document...' : <><Save size={16} /> Save Document</>}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Receipt Modal - A4 Modern Institutional Style */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[900px] h-[95vh] shadow-2xl relative flex flex-col rounded-3xl overflow-hidden border-[0.5px] border-black">
            {/* Receipt Controls */}
            <div className="p-6 border-b border-red-200 flex items-center justify-between bg-white shrink-0 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-[14px] font-black text-red-600 uppercase tracking-tighter block">Official Fee Receipt</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Institutional Document Preview</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadReceiptPNG}
                  disabled={isDownloadingReceipt}
                  className={cn(
                    "px-8 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2 text-[12px] font-black shadow-xl active:scale-95",
                    isDownloadingReceipt && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isDownloadingReceipt ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> GENERATING PNG...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> DOWNLOAD RECEIPT (PNG)
                    </>
                  )}
                </button>
                <button onClick={() => setShowReceipt(false)} className="p-3 rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors border-[0.5px] border-slate-200"><X size={20} /></button>
              </div>
            </div>

            {/* The A4 Receipt Container */}
            <div className="bg-slate-800 p-8 overflow-y-auto flex-1 flex justify-center no-scrollbar">
              <div
                id="receipt-print"
                className="bg-white font-serif border-[1px] border-black shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden text-red-700 shrink-0"
                style={{
                  width: '210mm',
                  height: '297mm',
                  padding: '12mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-4 pb-2 relative border-b border-[#fee2e2] shrink-0">
                  <div className="shrink-0 pt-1">
                    {lastReceipt.collegeLogo && lastReceipt.collegeLogo.length > 10 ? (
                      <img src={lastReceipt.collegeLogo} alt="Logo" className="w-16 h-16 object-contain" crossOrigin="anonymous" />
                    ) : (
                      <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-16 h-16 object-contain" crossOrigin="anonymous" />
                    )}
                  </div>
                  <div className="flex-1 text-center pr-20">
                    <h5 className="text-[10px] font-bold uppercase text-[#dc2626]">{lastReceipt.collegeParentOrg}</h5>
                    <h1 className="text-[18px] font-black text-[#b91c1c] uppercase leading-none tracking-tighter mt-1">
                      Mahalaxmi Nursing and technical institute Paradh
                    </h1>
                    <p className="text-[12px] font-bold uppercase tracking-widest mt-1 text-[#dc2626]">{lastReceipt.collegeAddress}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-end justify-between mt-4 shrink-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold uppercase italic">Receipt No :</span>
                    <span className="text-[14px] font-black border-b border-dotted border-[#f87171] px-4">{lastReceipt.receiptNo}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold uppercase italic">Date :</span>
                    <span className="text-[14px] font-black border-b border-dotted border-[#f87171] px-4">{new Date(lastReceipt.submittedAt || lastReceipt.approvedAt || lastReceipt.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Particulars */}
                <div className="mt-4 space-y-4 shrink-0">
                  <div className="flex items-center gap-10">
                    <div className="flex items-baseline gap-4 flex-1">
                      <span className="text-[13px] font-bold uppercase shrink-0">Name of Student :</span>
                      <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-1 text-[14px] font-black uppercase pl-4">{lastReceipt.studentName}</div>
                    </div>
                    <div className="flex items-baseline gap-4 flex-1">
                      <span className="text-[13px] font-bold uppercase shrink-0">College Name :</span>
                      <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-1 text-[14px] font-black pl-4 uppercase">{lastReceipt.collegeName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="flex items-baseline gap-4 flex-1">
                      <span className="text-[13px] font-bold uppercase shrink-0">Roll No :</span>
                      <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-1 text-[14px] font-black pl-4">{lastReceipt.rollNo}</div>
                    </div>
                    <div className="flex items-baseline gap-4 flex-1">
                      <span className="text-[13px] font-bold uppercase shrink-0">Academic Year :</span>
                      <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-1 text-[14px] font-black pl-4">{lastReceipt.academicYear}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="flex items-baseline gap-4 flex-1">
                      <span className="text-[13px] font-bold uppercase shrink-0">Course :</span>
                      <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-1 text-[14px] font-black uppercase pl-4">{lastReceipt.courseName}</div>
                    </div>
                    <div className="flex items-baseline gap-4 flex-1">
                      <span className="text-[13px] font-bold uppercase shrink-0">Course Type :</span>
                      <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-1 text-[14px] font-black pl-4 uppercase">{lastReceipt.courseType || 'Reg'}</div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="mt-4 border-[1.5px] border-[#dc2626] rounded-sm overflow-hidden flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#fef2f2] border-b-[1.5px] border-[#dc2626] font-black text-[11px] uppercase">
                        <th className="px-3 py-1.5 border-r-[1.5px] border-[#dc2626] w-12 text-center">Sr.</th>
                        <th className="px-4 py-1.5 border-r-[1.5px] border-[#dc2626] text-left">Particular's</th>
                        <th className="px-4 py-1.5 border-r-[1.5px] border-[#dc2626] text-left w-32">Remark</th>
                        <th className="px-4 py-1.5 text-right w-40">Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Tuition Fee", "Admission Fee/Enrollment Fee", "University Eligibility Fee", "Univ Exam. Fee", "Univ Sports Fee", "Univ Welfare Fund", "Student Insurance", "Caution Money Deposit", "I-Card, Magazines", "Journals / Stationary", "Extra Curricular Fee", "College Development Fee", "Library Fee", "Laboratory Fee", "Professional Membership", "Transportation Fee", "Medical Exam Fee", "Development Fee", "Other Fees"].map((item, idx) => (
                        <tr key={idx} className="border-b-[1px] border-[#f87171] text-[12px]">
                          <td className="px-3 py-1 border-r-[1.5px] border-[#dc2626] text-center font-bold">{idx + 1}</td>
                          <td className="px-4 py-1 border-r-[1.5px] border-[#dc2626] font-medium">{item}</td>
                          <td className="px-4 py-1 border-r-[1.5px] border-[#dc2626]">-</td>
                          <td className="px-4 py-1 text-right font-black">{idx === 0 ? `₹${parseFloat(lastReceipt.amount).toLocaleString()}` : '-'}</td>
                        </tr>
                      ))}
                      <tr className="border-t-[1.5px] border-[#dc2626] font-black bg-[#fef2f2]">
                        <td colSpan={3} className="px-4 py-2 text-right text-[12px] uppercase border-r-[1.5px] border-[#dc2626]">Total Fess</td>
                        <td className="px-4 py-2 text-right text-[14px] text-[#991b1b]">₹{parseFloat(lastReceipt.amount).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Words */}
                <div className="mt-4 space-y-4 shrink-0">
                  <div className="flex items-baseline gap-4 w-full">
                    <span className="text-[13px] font-bold uppercase shrink-0 italic">Amount In Words Rs :</span>
                    <div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-0.5 text-[14px] font-black uppercase pl-4">{numberToWords(parseFloat(lastReceipt.amount))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[12px] font-bold italic uppercase">
                    <div className="flex items-baseline gap-4"><span className="shrink-0">Cash/D.D. No :</span><div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-0.5 pl-4">{lastReceipt.utrId || 'Online Payment'}</div></div>
                    <div className="flex items-baseline gap-4"><span className="shrink-0">Bank :</span><div className="flex-1 border-b-[2px] border-dotted border-[#fca5a5] pb-0.5 pl-4">N/A</div></div>
                  </div>
                  <div className="pt-6 flex justify-end">
                    <div className="text-center space-y-2">
                      <div className="w-56 h-16 border border-[#fee2e2] rounded bg-[#fef2f2] flex items-center justify-center"><span className="text-[9px] font-bold text-[#fee2e2] uppercase italic">Institutional Stamp</span></div>
                      <p className="text-[13px] font-black text-[#b91c1c] uppercase">(Accountant / Authorized Sign.)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto text-center text-[9px] text-[#f87171] font-bold uppercase tracking-[0.2em] border-t border-[#fef2f2] pt-2 shrink-0">* Computer Generated Official Receipt - Mahalaxmi Nursing and technical institute *</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Student Portal...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

