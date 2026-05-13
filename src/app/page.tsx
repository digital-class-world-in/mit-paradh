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

export default function Home() {
  const ministers = [
    { name: 'Shri. Devendra Fadnavis', title: "Hon' Chief Minister" },
    { name: 'Shri. Eknath Shinde', title: "Hon' Deputy Chief Minister" },
    { name: 'Smt. Sunetra Ajit Pawar', title: "Hon' Deputy Chief Minister" },
    { name: 'Shri. Mangal Prabhat Lodha', title: "Hon' Minister" },
  ];

  const sideLinks = [
    { label: 'User Manual', icon: FileText, href: '/user-manual' },
    { label: 'Notifications / Circulars', icon: Megaphone, href: '/notifications' },
    { label: 'Related Websites', icon: ExternalLink, href: '/related' },
    { label: 'Acts and Resolution', icon: ShieldCheck, href: '/acts' },
    { label: 'Approval Order', icon: ShieldCheck, href: '/approval' },
    { label: 'About', icon: Info, href: '/about' },
    { label: 'Contact Us', icon: Phone, href: '/contact' }
  ];

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

  const relatedVideos = [
    { title: 'मंडळाच्या कार्याबाबत संक्षिप्त माहिती', desc: 'MSBSVET च्या कार्याबाबत' },
    { title: 'मंडळ कार्यालय', desc: '100 दिवसांच्या काळात' },
    { title: 'Candidate Registration', desc: 'Google' },
    { title: 'Demo for Online Exam', desc: 'Guideline Video' },
    { title: 'Apply for MSBSVET Courses', desc: 'How to apply' }
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
    <div className="bg-[#f8fafc] min-h-screen font-sans overflow-x-hidden">
      <Header />
      <Navbar />

      {/* Marquee */}
      <div className="bg-[#fff8f0] border-b border-amber-100 py-2">
        <div className="flex items-center px-6">
          <div className="bg-red-600 text-black text-[13px] font-bold px-3 py-1 rounded-sm capitalize tracking-tight shrink-0">
            Announcements
          </div>
          {(() => {
            const Marquee = 'marquee' as any;
            return (
              <Marquee className="text-[11px] font-medium text-slate-600 ml-4">
                The new institution/ course/ unit approval process for the admission session 2026-27 is being made available online. | Final Timetable for April-2026 Exam (2 Year Category) is now published. | Student Registration Portal v4.0 is now live for all technical courses.
              </Marquee>
            );
          })()}
        </div>
      </div>

      {/* ── Ministers Row (full width, above 3 columns) ── */}
      <div className="bg-white border-b border-slate-200 py-5 px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ministers.map((m, i) => (
            <div key={i} className="text-center group">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden border-2 border-slate-200 group-hover:border-amber-400 transition-colors shadow-sm">
                <User size={28} className="text-slate-300" />
              </div>
              <p className="text-xs font-bold text-[#003366] leading-tight capitalize">{m.name}</p>
              <p className="text-[13px] text-black font-bold mt-0.5 capitalize">{m.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-Column Grid: Quick Nav | Notices | Sign In ── */}
      <main className="px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Column: Quick Navigation */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-[#003366] text-white p-4 rounded-t-lg font-bold text-sm capitalize tracking-tight flex items-center gap-3">
            <FileText size={16} /> Quick Navigation
          </div>
          <div className="border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm rounded-b-lg">
            {sideLinks.map((link, i) => (
              <Link key={i} href={link.href || '#'} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 hover:text-[#003366] transition-colors text-sm font-bold text-slate-700 group">
                <span className="flex items-center gap-3">
                  <link.icon size={16} className="opacity-50 text-[#003366]" />
                  {link.label}
                </span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-[#003366] transition-colors" />
              </Link>
            ))}
          </div>
        </aside>

        {/* Center Column: Important Notices */}
        <section className="lg:col-span-2">
          <div className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white h-full">
            <div className="bg-[#003366] p-4 text-white font-bold text-sm capitalize tracking-tight flex items-center justify-between">
              <span className="flex items-center gap-3"><FileText size={18} /> Important Notices</span>
              <Link href="#" className="text-xs text-amber-400 hover:text-amber-300 font-semibold">View All</Link>
            </div>
            <div className="p-6 space-y-4">
              {notices.map((n, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0 hover:translate-x-1 transition-transform">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-700 hover:text-blue-900 cursor-pointer">{n.text}</p>
                    {n.isNew && <span className="inline-block mt-1 text-[13px] font-black text-black capitalize italic">New Update!</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

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

        <HorizontalSection title="Related Videos" showMore={false}>
          {relatedVideos.map((vid, i) => (
            <div key={i} className="min-w-[280px] md:min-w-[340px] snap-center cursor-pointer group shrink-0">
              <div className="w-full aspect-video bg-[#1a1a2e] rounded-lg relative overflow-hidden mb-3 shadow-md">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play fill="currentColor" size={22} />
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold text-[#003366]">M</div>
                  <div>
                    <p className="text-black text-[13px] font-bold truncate w-40">{vid.title}</p>
                    <p className="text-white/70 text-[9px]">MahaSkillBoard</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm font-semibold text-slate-600">{vid.desc}</p>
            </div>
          ))}
        </HorizontalSection>

        <HorizontalSection title="Success Stories of Board">
          {successStories.map((story, i) => (
            <div key={i} className="min-w-[300px] md:min-w-[420px] snap-center bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5 shrink-0">
              <div className="w-20 h-24 bg-slate-100 shrink-0 border border-slate-200 rounded flex items-center justify-center">
                <User size={32} className="text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 mb-1 capitalize">{story.name}</h4>
                <p className="text-xs text-slate-500 leading-snug">
                  Selected as <span className="font-bold text-slate-700">{story.role}</span> at<br />
                  <span className="font-bold text-[#003366]">{story.company}</span> in {story.year}
                </p>
              </div>
            </div>
          ))}
        </HorizontalSection>

        <HorizontalSection title="Higher Education Opportunities" showMore={false}>
          {higherEd.map((ed, i) => (
            <div key={i} className="min-w-[240px] md:min-w-[300px] snap-center bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-4 hover:border-blue-400 transition-colors cursor-pointer shrink-0">
              <div className="w-14 h-14 shrink-0 border border-slate-200 rounded-full flex items-center justify-center bg-slate-50">
                <Building2 size={28} className="text-[#003366]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{ed.name}</h4>
                {ed.subtitle && (
                  <p className={`text-xs mt-1 ${ed.link ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>{ed.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </HorizontalSection>

        <HorizontalSection title="Apprenticeship, Internship and Employment Opportunities" showMore={false}>
          {apprenticeships.map((app, i) => (
            <div key={i} className="min-w-[260px] md:min-w-[340px] snap-center bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-5 hover:border-amber-400 cursor-pointer shrink-0">
              <div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                <BarChart3 size={26} className="text-[#003366]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">{app.name}</h4>
            </div>
          ))}
        </HorizontalSection>

        <HorizontalSection title="Entrepreneurship Opportunities" showMore={false}>
          {entrepreneurships.map((ent, i) => (
            <div key={i} className="min-w-[260px] md:min-w-[340px] snap-center bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center gap-5 hover:border-emerald-500 cursor-pointer shrink-0">
              <div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                <ShieldCheck size={26} className="text-[#003366]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">{ent.name}</h4>
            </div>
          ))}
        </HorizontalSection>
      </div>

      {/* ── Dynamic Course Catalog ── */}
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-400">Loading catalog...</div>}>
        <CourseShowcase />
      </Suspense>

      {/* ── Full-Width Stats ── */}
      <div className="bg-[#f8fafc] py-16 border-y border-slate-200">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className={`bg-white p-10 text-center hover:-translate-y-1 transition-transform cursor-pointer ${i < 3 ? 'border-r border-slate-200' : ''}`}>
              <s.icon size={44} className={`mx-auto mb-5 ${s.color}`} />
              <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-2">{s.value}</h3>
              <p className="text-xs font-bold text-slate-400 capitalize tracking-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Black Footer ── */}
      <footer className="bg-[#020617] text-white pt-16 pb-8 border-t-4 border-[#003366]">
        <div className="px-6 lg:px-16 grid grid-cols-1 md:grid-cols-12 gap-12 text-sm">

          <div className="md:col-span-4 space-y-5">
            <p className="text-white/50 font-medium text-xs capitalize tracking-tight">Government of Maharashtra</p>
            <div className="text-blue-100 text-sm leading-relaxed font-medium">
              Skill, Employment, Entrepreneurship and Innovation Department<br />
              <span className="text-white text-base font-bold">Maharashtra State Board of Skill, Vocational Education and Training</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="#" className="w-10 h-10 rounded-lg bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </Link>
              <Link href="#" className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </Link>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-white mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-3">About Us</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"><ChevronRight size={14} /> About MSBSVET</Link></li>
              <li><Link href="#" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"><ChevronRight size={14} /> Board of Directors</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-white mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-3">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/contact" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"><ChevronRight size={14} /> Contact Us</Link></li>
              <li><Link href="#" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"><ChevronRight size={14} /> Help</Link></li>
              <li><Link href="#" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"><ChevronRight size={14} /> Sitemap</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-white mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-3">Policies</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"><ChevronRight size={14} /> Disclaimer and Policies</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-white mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-3">Statistics</h4>
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="bg-[#020617] p-2 rounded shrink-0"><Users size={14} className="text-blue-400" /></div>
                <div>
                  <p className="text-[9px] capitalize text-white/50 tracking-wider font-bold">Total Visitors</p>
                  <p className="font-bold text-white text-sm">1222146</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="bg-[#020617] p-2 rounded shrink-0"><User size={14} className="text-blue-400" /></div>
                <div>
                  <p className="text-[9px] capitalize text-white/50 tracking-wider font-bold">Today's Count</p>
                  <p className="font-bold text-white text-sm">5730</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#020617] p-2 rounded shrink-0"><Calendar size={14} className="text-blue-400" /></div>
                <div>
                  <p className="text-[9px] capitalize text-white/50 tracking-wider font-bold">Last Updated</p>
                  <p className="font-bold text-white text-sm">18-04-2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-12 pt-6 px-6 lg:px-16">
          <p className="text-white/30 font-bold text-xs">New server</p>
        </div>
      </footer>
    </div>
  );
}


