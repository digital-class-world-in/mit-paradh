'use client';

import Link from 'next/link';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import LiveFooter from '@/components/LiveFooter';
import { 
  GraduationCap, 
  Building2, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  KeyRound, 
  Sparkles, 
  Lock, 
  HelpCircle,
  PhoneCall,
  UserPlus
} from 'lucide-react';

const portals = [
  {
    role: 'student',
    title: 'Student Portal',
    subtitle: 'Academic, Exam & Results Portal',
    description: 'Access your profile, examination forms, admit card, fee receipts, marksheet, and student identity credentials.',
    href: '/login/student',
    icon: GraduationCap,
    badge: 'Students & Alumni',
    accentColor: '#d97706', // amber-600
    buttonBg: 'bg-[#d97706] hover:bg-[#b45309]',
    borderHover: 'hover:border-amber-400',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  {
    role: 'college',
    title: 'College & Branch Portal',
    subtitle: 'Institutional Management System',
    description: 'Course administration, admission verification, student registry, branch approvals, and college operations.',
    href: '/login/college',
    icon: Building2,
    badge: 'Colleges & Branches',
    accentColor: '#059669', // emerald-600
    buttonBg: 'bg-[#059669] hover:bg-[#047857]',
    borderHover: 'hover:border-emerald-400',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    role: 'staff',
    title: 'Staff Portal',
    subtitle: 'Faculty & Teacher Workspace',
    description: 'Class attendance registers, student performance, internal assessments, leave records, and departmental duties.',
    href: '/login/staff',
    icon: User,
    badge: 'Teaching & Admin Staff',
    accentColor: '#2563eb', // blue-600
    buttonBg: 'bg-[#2563eb] hover:bg-[#1d4ed8]',
    borderHover: 'hover:border-blue-400',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    role: 'admin',
    title: 'Admin Portal',
    subtitle: 'Board & Superadmin Controls',
    description: 'Institutional ERP master settings, user roles, security vault, global verification, and centralized audit logs.',
    href: '/login/admin',
    icon: ShieldCheck,
    badge: 'Master Administrator',
    accentColor: '#003366', // navy
    buttonBg: 'bg-[#003366] hover:bg-[#002244]',
    borderHover: 'hover:border-[#003366]',
    lightBg: 'bg-slate-100',
    textColor: 'text-[#003366]',
  },
];

export default function CentralLoginPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />
      <Navbar />

      <main className="flex-1 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Institutional Hero Banner */}
        <div className="bg-gradient-to-r from-[#002147] via-[#003366] to-[#001833] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl border border-white/10 mb-8 sm:mb-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-black uppercase tracking-wider text-amber-300 mb-3 sm:mb-4">
              <Lock size={13} /> Official Institutional Gateway
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-2.5 sm:mb-3">
              Central Institutional Login Portals
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed font-normal">
              Welcome to Maharashtra State Board of Vocational Education & Technical Institute Paradh. 
              Please select your designated access level below to proceed to your secure dashboard.
            </p>
          </div>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div 
                key={portal.role}
                className={`bg-white rounded-2xl border-2 border-slate-200 ${portal.borderHover} p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${portal.lightBg} flex items-center justify-center text-slate-800 shadow-inner group-hover:scale-105 transition-transform`}>
                      <Icon size={26} style={{ color: portal.accentColor }} />
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${portal.lightBg} ${portal.textColor} border border-black/5 tracking-wider`}>
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-1 group-hover:text-[#003366] transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-[10.5px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    {portal.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-5 font-medium">
                    {portal.description}
                  </p>
                </div>

                <Link
                  href={portal.href}
                  className={`w-full ${portal.buttonBg} text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg active:scale-95 min-h-[44px]`}
                >
                  Enter Portal <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Quick Assistance & Registration Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <UserPlus size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">New Student Registration</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                First time applying for courses? Complete your official institutional admission registration online.
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline capitalize"
              >
                Go to Registration Portal <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <PhoneCall size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Need Help Logging In?</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Forgot password or facing trouble accessing your account? Contact institutional helpline or inquiry office.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <Link href="/inquiry" className="text-blue-700 hover:text-blue-800 hover:underline">
                  Submit Inquiry
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/contact" className="text-blue-700 hover:text-blue-800 hover:underline">
                  Helpline Numbers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LiveFooter />
    </div>
  );
}
