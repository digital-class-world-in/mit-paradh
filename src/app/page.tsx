// src/app/page.tsx

import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  BookOpen, 
  BarChart3, 
  Play, 
  ChevronRight, 
  ChevronLeft,
  Megaphone,
  User,
  ExternalLink,
  ShieldCheck,
  FileText,
  GraduationCap,
  Calendar,
  Users,
  UserCircle,
  Info,
  Phone
} from 'lucide-react';
import CourseShowcase from '@/components/CourseShowcase';
import LiveMarquee from '@/components/LiveMarquee';
import LiveMinisters from '@/components/LiveMinisters';
import LiveQuickLinks from '@/components/LiveQuickLinks';
import LiveRelatedVideos from '@/components/LiveRelatedVideos';
import LiveTestimonials from '@/components/LiveTestimonials';
import LiveFooter from '@/components/LiveFooter';
import LiveNotices from '@/components/LiveNotices';
import LiveSuccessStories from '@/components/LiveSuccessStories';
import LiveOpportunities from '@/components/LiveOpportunities';
import LiveAchievements from '@/components/LiveAchievements';
import LiveQuotes from '@/components/LiveQuotes';

export default function Home() {

  const notices = [
    { text: 'APRIL-2026 (2 YEAR) DETAIL TIME TABLE', isNew: true },
    { text: 'REGULAR FINAL DETAIL TIME TABLE-2026', isNew: true },
    { text: 'EX STUDENT FINAL DETAIL TIME TABLE-2026', isNew: true },
    { text: 'Regarding approval of new courses from the training session 2026-27', isNew: false },
    { text: '2 Year exam April 2026 Time Table', isNew: false },
    { text: 'MARCH 2026 FINAL TIME TABLE(27-3-2026)', isNew: false },
  ];

  const stats = [
    { value: '2,232', label: 'Institutes', icon: Building2, color: 'text-amber-600' },
    { value: '38', label: 'Sectors', icon: BarChart3, color: 'text-amber-500' },
    { value: '1,614', label: 'Courses', icon: BookOpen, color: 'text-amber-600' },
    { value: '211,427', label: 'Candidates', icon: Users, color: 'text-amber-500' },
  ];



  const successStories = [
    { name: 'NITIN SURESH BEDEKAR', role: 'ELECTRICAL MAINTENANCE', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
    { name: 'ANIKET SANTOSH LAWAND', role: 'ELECTRICIAN', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
    { name: 'PRANAV RAJENDRA GURAV', role: 'ELECTRICIAN', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
    { name: 'SMRUTI RANJAN', role: 'SOFTWARE TESTER', company: 'TCS PUNE', year: '2024' },
  ];

  const higherEd = [
    { name: 'Ratan Tata Maharashtra State Skill University', subtitle: '' },
    { name: 'Engineering Diploma', subtitle: '' },
    { name: 'Bachelor of Vocation (B.Voc.)', subtitle: 'Circular for Admission', link: true },
    { name: 'Yashwantrao Chavan Maharashtra Open University', subtitle: '' }
  ];

  const apprenticeships = [
    { name: 'Commissionerate of Skill Development, Employment and Entrepreneurship' },
    { name: 'CM Internship Program' },
    { name: 'PM Internship Scheme' }
  ];

  const entrepreneurships = [
    { name: 'Sant Rohidas Leather Industries & Charmakar Development Corporation' },
    { name: 'Lokshahir Anna Bhau Sathe Development Corporation' },
    { name: 'Maharashtra State Khadi and Village Industries Board' }
  ];

  // Full-width horizontal section (no inner max-w constraint on the scroll area)
  const HorizontalSection = ({ title, children, showMore = true }: any) => (
    <div className="bg-white border-t border-slate-200 py-8">
      <div className="px-6 lg:px-12">
        <h2 className="text-[#003366] text-xl md:text-2xl font-black mb-6 tracking-tight capitalize italic">
          {title}
        </h2>

        <div className="relative group">
          <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex">
            <ChevronLeft size={24} />
          </button>

          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 snap-x">
            {children}
          </div>

          <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex">
            <ChevronRight size={24} />
          </button>
        </div>

        {showMore && (
          <div className="text-right pt-2">
            <Link href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800">See more...</Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans">
      <Header />
      <Navbar />

      {/* Marquee */}
      <div className="bg-[#fff8f0] border-b border-amber-100 py-2">
        <div className="flex items-center px-6">
          <div className="bg-red-600 text-black text-[13px] font-bold px-3 py-1 rounded-sm capitalize tracking-tight shrink-0">
            Announcements
          </div>
          <LiveMarquee />
        </div>
      </div>

      {/* ── Ministers Row (full width, above 3 columns) ── */}
      <LiveMinisters />

      {/* ── 3-Column Grid: Quick Nav | Notices | Sign In ── */}
      <main className="px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Column: Quick Navigation */}
        <LiveQuickLinks />

        {/* Center Column: Important Notices */}
        <LiveNotices />

        {/* Right Column: Sign In Portal */}
        <aside className="lg:col-span-1">
          <div className="bg-white border-2 border-[#003366] rounded-xl overflow-hidden shadow-lg h-full">
            <div className="bg-[#003366] p-4 text-center flex items-center justify-center gap-3">
              <UserCircle size={22} className="text-white" />
              <h3 className="text-white font-bold text-base tracking-tight">Sign In</h3>
            </div>
            <div className="p-6 space-y-6 bg-slate-50 flex flex-col">
              {/* Illustration placeholder */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  <User size={40} className="text-slate-300" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-700 whitespace-nowrap">Existing User ?</p>
                  <Link href="/login/student" className="bg-[#c05621] hover:bg-[#9c4221] text-white font-bold py-2 px-5 rounded-md shadow-md text-sm text-center shrink-0">
                    Sign In
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-700 whitespace-nowrap">Not Registered ?</p>
                  <Link href="/register" className="bg-[#c05621] hover:bg-[#9c4221] text-white font-bold py-2 px-4 rounded-md shadow-md text-sm text-center shrink-0">
                    Register Here
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Having Trouble Signing In?{' '}
                  <Link href="#" className="text-blue-600 font-bold hover:underline">Click Here</Link>
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ════════════════════════════════════════════
          FULL-WIDTH HORIZONTAL SECTIONS
      ════════════════════════════════════════════ */}
      <div className="bg-white">

        <LiveRelatedVideos />

        <LiveSuccessStories />

        <LiveOpportunities />

          <LiveQuotes />

          <LiveTestimonials />
      </div>

      {/* ── Dynamic Course Catalog ── */}
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-400">Loading catalog...</div>}>
        <CourseShowcase />
      </Suspense>

        <LiveAchievements />

      {/* ── Black Footer ── */}
      <LiveFooter />
    </div>
  );
}


