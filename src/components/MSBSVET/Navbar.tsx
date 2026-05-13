'use client';

import Link from 'next/link';
import { Home, Info, Book, Phone, LogIn, ChevronDown, ChevronRight, ShieldCheck, Building2, GraduationCap, User, ArrowRight, Mail, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export const Navbar = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    if (!realtimeDb) return;
    const collegesRef = ref(realtimeDb, 'colleges');
    const unsub = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const collegesList = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setColleges(collegesList);

        const typesSet = new Set<string>();
        collegesList.forEach((college: any) => {
          if (college.courses) {
            Object.values(college.courses).forEach((course: any) => {
              if (course.type) typesSet.add(course.type);
            });
          }
        });
        setCourseTypes(Array.from(typesSet).sort());
      }
    });
    return () => unsub();
  }, []);

  const [courseTypes, setCourseTypes] = useState<string[]>([]);

  const portals = [
    { label: 'College Portal', href: '/login/college', icon: Building2, color: 'text-emerald-500' },
    { label: 'Admin Portal', href: '/login/admin', icon: ShieldCheck, color: 'text-slate-400' },
    { label: 'Staff Portal', href: '/login/staff', icon: User, color: 'text-blue-400' },
    { label: 'Student Portal', href: '/login/student', icon: GraduationCap, color: 'text-amber-500' },
  ];

  const mainNav = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'About Us', icon: Info, href: '/about' },
    { label: 'Courses', icon: Book, href: '/courses', hasDropdown: true },
    { label: 'Inquiry', icon: Mail, href: '/inquiry' },
    { label: 'Contact Us', icon: Phone, href: '/contact' },
  ];

  return (
    <nav className="bg-[#003366] px-4 md:px-10 h-14 flex items-center justify-between shadow-md relative z-50">
      <div className="flex items-center h-full">
        {mainNav.map((item, idx) => (
          <div 
            key={idx} 
            className="h-full relative group/nav"
            onMouseEnter={() => item.hasDropdown && setIsCoursesOpen(true)}
            onMouseLeave={() => item.hasDropdown && setIsCoursesOpen(false)}
          >
            <Link 
              href={item.href} 
              className="flex items-center gap-2 px-6 h-full text-white/80 hover:text-white hover:bg-white/10 transition-all font-bold text-xs capitalize tracking-tight border-r border-white/10"
            >
              <item.icon size={14} className="opacity-50" />
              {item.label}
              {item.hasDropdown && <ChevronDown size={12} className={`transition-transform duration-300 ${isCoursesOpen ? 'rotate-180' : ''}`} />}
            </Link>

            {item.hasDropdown && (
              <div className={`absolute left-0 top-full pt-2 w-[480px] transition-all duration-300 origin-top-left ${isCoursesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                <div className="bg-[#002244] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl flex">
                  {/* Left Column: Categories */}
                  <div className="w-1/3 bg-white/5 border-r border-white/5 p-4 space-y-4">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Categories</p>
                     <div className="space-y-1">
                        <Link href="/courses" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-[11px] font-bold text-white transition-colors">
                           <Book size={14} className="text-amber-400" /> All Programs
                        </Link>
                        {courseTypes.map((type) => (
                          <Link 
                            key={type} 
                            href={`/courses?type=${encodeURIComponent(type)}`} 
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-[11px] font-bold text-white/60 transition-colors group/type"
                          >
                             <FileText size={14} className="opacity-50 group-hover/type:opacity-100 group-hover/type:text-blue-400" />
                             {type} Courses
                          </Link>
                        ))}
                     </div>
                  </div>

                  {/* Right Column: Institutions */}
                  <div className="flex-1 p-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Partner Institutions</p>
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {colleges.length > 0 ? (
                        colleges.map((college) => (
                          <Link 
                            key={college.id} 
                            href={`/courses?college=${encodeURIComponent(college.name)}`}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Building2 size={14} />
                              </div>
                              <span className="text-[11px] font-bold text-white/80 group-hover:text-white capitalize line-clamp-1">{college.name}</span>
                            </div>
                            <ChevronRight size={12} className="text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                          </Link>
                        ))
                      ) : (
                        <p className="text-[10px] text-white/30 italic p-4 text-center">Loading colleges...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 relative">
        <div className="relative group">
          <button 
            onMouseEnter={() => setIsLoginOpen(true)}
            onMouseLeave={() => setIsLoginOpen(false)}
            className="bg-amber-400 hover:bg-amber-500 text-[#003366] px-6 py-2 rounded-md font-black text-xs capitalize tracking-tight transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <LogIn size={14} /> Portals Login <ChevronDown size={14} className={`transition-transform duration-300 ${isLoginOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <div 
            onMouseEnter={() => setIsLoginOpen(true)}
            onMouseLeave={() => setIsLoginOpen(false)}
            className={`absolute right-0 top-full pt-2 w-64 transition-all duration-300 origin-top-right ${isLoginOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
          >
            <div className="bg-[#002244] border border-white/10 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl">

              <div className="bg-white/5 p-3 border-b border-white/5">
                <p className="text-[9px] font-black text-white/40 capitalize tracking-tight">Select Access Level</p>
              </div>
              <div className="p-2 space-y-1">
                {portals.map((portal, idx) => (
                  <Link 
                    key={idx} 
                    href={portal.href} 
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-white/10 transition-colors group"
                  >
                    <portal.icon size={16} className={`${portal.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors capitalize tracking-wider">{portal.label}</span>
                  </Link>
                ))}
              </div>
              <div className="bg-amber-400/10 p-3 text-center">
                <Link href="/register" className="text-[9px] font-black text-amber-400 hover:text-amber-300 capitalize underline-offset-4 hover:underline">
                  New student registration portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

