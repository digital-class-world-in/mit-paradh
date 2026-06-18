'use client';

import { useState, useEffect, Suspense } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import { 
  Send, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import LiveFooter from '@/components/LiveFooter';

function InquiryPageContent() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const DEFAULT_INQUIRY_DATA = {
    heroTitle: 'Academic Inquiry Portal',
    heroSubtitle: 'Academic Session 2026-27',
    description: "Start your journey with Maharashtra's premier vocational education network. Fill out the form to receive detailed program brochures and admission guidelines.",
    benefit1Title: 'Verified Institutions',
    benefit1Desc: 'Connect directly with government-approved skill centers and vocational colleges.',
    benefit2Title: 'Fast Response',
    benefit2Desc: 'Our dedicated admission counselors typically respond within 24-48 business hours.'
  };

  // Dynamic Page Content State
  const [inquiryData, setInquiryData] = useState<any>(DEFAULT_INQUIRY_DATA);

  const searchParams = useSearchParams();

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    collegeId: searchParams.get('college') || '',
    courseName: searchParams.get('course') || '',
    message: '',
    courseType: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_inquiry');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Object.keys(parsed).length > 0) {
            setInquiryData(parsed);
          }
        }
      } catch (e) {}
    }

    const inquiryRef = ref(realtimeDb, 'settings/website/inquiry');
    const unsubscribe = onValue(inquiryRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setInquiryData(val);
        try { localStorage.setItem('cache_inquiry', JSON.stringify(val)); } catch (e) {}
      } else {
        setInquiryData(DEFAULT_INQUIRY_DATA);
        try { localStorage.removeItem('cache_inquiry'); } catch (e) {}
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch Colleges
    const collegesRef = ref(realtimeDb, 'colleges');
    const unsub = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setColleges(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (formData.collegeId) {
      // Fetch courses for the selected college
      const coursesRef = ref(realtimeDb, `colleges/${formData.collegeId}/courses`);
      onValue(coursesRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setCourses(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setCourses([]);
        }
      });
    }
  }, [formData.collegeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.collegeId) {
      alert("Please select an institution first.");
      return;
    }
    setSubmitting(true);

    try {
      const inquiryRef = ref(realtimeDb, `colleges/${formData.collegeId}/frontOffice/admissionInquiries`);
      const newInquiryRef = push(inquiryRef);
      
      const submissionData = {
        ...formData,
        date: new Date().toISOString(),
        status: 'Pending',
        source: 'Website',
        collegeName: colleges.find(c => c.id === formData.collegeId)?.name || ''
      };

      await set(newInquiryRef, submissionData);
      setSubmitted(true);
    } catch (error) {
      console.error("Inquiry submission error:", error);
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="bg-white rounded-[3.5rem] p-16 shadow-2xl border border-slate-200 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#003366] tracking-tighter capitalize italic">Inquiry Submitted!</h2>
              <p className="text-slate-500 text-lg max-w-md mx-auto">
                Thank you for your interest. Our institutional representative will contact you shortly regarding your academic preferences.
              </p>
            </div>
            <div className="pt-8">
              <Link 
                href="/"
                className="inline-flex items-center gap-3 bg-[#003366] text-white px-10 py-5 rounded-2xl font-black text-[13px] capitalize tracking-tight shadow-xl hover:bg-black transition-all active:scale-95"
              >
                Back to Home <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
        <LiveFooter />
      </div>
    );
  }

  if (!inquiryData || loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading inquiry portal...</p>
        </div>
        <LiveFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Context & Info */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#003366] text-[13px] font-bold capitalize tracking-tight">
               <Zap size={14} className="text-amber-500" /> {inquiryData.heroSubtitle}
            </div>
            <h1 className="text-6xl font-black text-[#003366] tracking-tighter leading-[0.9] capitalize italic whitespace-pre-line">
              {inquiryData.heroTitle}
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md">
              {inquiryData.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-start gap-6 group hover:shadow-md transition-shadow">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-[#003366] group-hover:text-white transition-all">
                  <ShieldCheck size={28} />
               </div>
               <div>
                  <h4 className="text-base font-bold text-slate-800">{inquiryData.benefit1Title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{inquiryData.benefit1Desc}</p>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-start gap-6 group hover:shadow-md transition-shadow">
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-[#003366] group-hover:text-white transition-all">
                  <Zap size={28} />
               </div>
               <div>
                  <h4 className="text-base font-bold text-slate-800">{inquiryData.benefit2Title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{inquiryData.benefit2Desc}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: The Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[3.5rem] p-10 lg:p-14 shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#003366]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight ml-1 flex items-center gap-2">
                    <User size={14} className="text-blue-500" /> Full Name
                  </label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm"
                    value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight ml-1 flex items-center gap-2">
                    <Mail size={14} className="text-blue-500" /> Email Address
                  </label>
                  <input 
                    required
                    type="email"
                    placeholder="rahul@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({...formData, studentEmail: e.target.value})}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight ml-1 flex items-center gap-2">
                    <Phone size={14} className="text-blue-500" /> Phone Number
                  </label>
                  <input 
                    required
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm"
                    value={formData.studentPhone}
                    onChange={(e) => setFormData({...formData, studentPhone: e.target.value})}
                  />
                </div>

                {/* Select College */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight ml-1 flex items-center gap-2">
                    <Building2 size={14} className="text-blue-500" /> Select Institution
                  </label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                    value={formData.collegeId}
                    onChange={(e) => setFormData({...formData, collegeId: e.target.value, courseName: ''})}
                  >
                    <option value="">Choose College</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Course Interest */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight ml-1 flex items-center gap-2">
                    <BookOpen size={14} className="text-blue-500" /> Interested Course
                  </label>
                  <select 
                    required
                    disabled={!formData.collegeId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm cursor-pointer appearance-none disabled:opacity-50"
                    value={formData.courseName}
                    onChange={(e) => {
                      const selectedCourse = courses.find(c => c.name === e.target.value);
                      setFormData({
                        ...formData, 
                        courseName: e.target.value,
                        courseType: selectedCourse?.type || ''
                      });
                    }}
                  >
                    <option value="">{formData.collegeId ? 'Select Preferred Course' : 'Select Institution First'}</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-700 capitalize tracking-tight ml-1 flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-500" /> Additional Message
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Tell us about your academic goals or queries..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#003366] text-white py-6 rounded-[2rem] font-black text-[15px] capitalize tracking-tight shadow-2xl hover:bg-black hover:shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? 'Processing Submission...' : <><Send size={20} /> Submit Academic Inquiry</>}
                </button>

              </div>
            </form>
          </div>
        </div>
      </main>

      <LiveFooter />
    </div>
  );
}

export default function InquiryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#003366] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium mt-4">Loading inquiry portal...</p>
      </div>
    }>
      <InquiryPageContent />
    </Suspense>
  );
}
