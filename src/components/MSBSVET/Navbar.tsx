'use client';

import Link from 'next/link';
import { Home, Info, Book, Phone, LogIn, ChevronDown, ChevronRight, ShieldCheck, Building2, GraduationCap, User, ArrowRight, Mail, FileText, Search, X, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [mobileCourseSearch, setMobileCourseSearch] = useState('');
  const [courseTypes, setCourseTypes] = useState<string[]>([]);

  const [managedCourseNames, setManagedCourseNames] = useState<string[]>([]);

  useEffect(() => {
    if (!realtimeDb) return;
    const optionsRef = ref(realtimeDb, 'courseDropdownOptions/course_name');
    const unsub = onValue(optionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Array.isArray(data) ? data : Object.values(data);
        setManagedCourseNames(arr.filter(v => v && v !== '__EMPTY__'));
      } else {
        setManagedCourseNames([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Load from cache first for instant display
    try {
      const cached = localStorage.getItem('cache_navbar_courses');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllCourses(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading navbar courses cache', e);
    }

    if (!realtimeDb) return;
    
    let currentGlobal: any[] = [];
    let currentCollege: any[] = [];
    let currentWebsite: any[] = [];

    const processCourses = () => {
      const combined = [...currentGlobal, ...currentCollege, ...currentWebsite];
      const courseGroups: { [key: string]: any } = {};

      combined.forEach(course => {
        const name = course.course_name || course.name;
        if (!name) return;
        const normalizedName = name.trim().toLowerCase();

        if (!courseGroups[normalizedName]) {
          courseGroups[normalizedName] = {
            ...course,
            collegeNames: course.collegeName ? [course.collegeName] : []
          };
        } else {
          if (course.collegeName && !courseGroups[normalizedName].collegeNames.includes(course.collegeName)) {
            courseGroups[normalizedName].collegeNames.push(course.collegeName);
          }
        }
      });

      let uniqueCourses = Object.values(courseGroups);

      // Filter and sort according to managedCourseNames if populated
      // Sort courses: prioritize those in managedCourseNames in their specified order,
      // and sort the rest alphabetically below them.
      uniqueCourses.sort((a, b) => {
        const aName = (a.course_name || a.name || '').trim().toLowerCase();
        const bName = (b.course_name || b.name || '').trim().toLowerCase();
        
        if (managedCourseNames.length > 0) {
          const aIndex = managedCourseNames.findIndex(opt => opt.trim().toLowerCase() === aName);
          const bIndex = managedCourseNames.findIndex(opt => opt.trim().toLowerCase() === bName);
          
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
        }
        
        return aName.localeCompare(bName);
      });

      setAllCourses(uniqueCourses);
      
      try {
        const essentialCourses = uniqueCourses.map((course: any) => ({
          id: course.id,
          name: course.name || '',
          course_name: course.course_name || '',
          course_slug: course.course_slug || '',
          collegeId: course.collegeId || '',
          collegeNames: course.collegeNames || []
        }));
        localStorage.setItem('cache_navbar_courses', JSON.stringify(essentialCourses));
      } catch (e) {
        console.warn('Failed to cache navbar courses', e);
      }
    };

    const unsubGlobal = onValue(ref(realtimeDb, 'courses'), (snap) => {
      currentGlobal = [];
      if (snap.exists()) {
         Object.entries(snap.val()).forEach(([id, c]: any) => currentGlobal.push({ id, collegeName: '', ...c }));
      }
      processCourses();
    });

    const unsubColleges = onValue(ref(realtimeDb, 'colleges'), (snap) => {
      currentCollege = [];
      if (snap.exists()) {
         const data = snap.val();
         const collegesList = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
         setColleges(collegesList);
         
         collegesList.forEach((college: any) => {
           if (college.courses) {
             Object.entries(college.courses).forEach(([id, c]: any) => currentCollege.push({ id, collegeId: college.id, collegeName: college.name, ...c }));
           }
         });
      } else {
         setColleges([]);
      }
      processCourses();
    });

    const unsubWebsite = onValue(ref(realtimeDb, 'settings/website/home/courses'), (snap) => {
      currentWebsite = [];
      if (snap.exists()) {
         const data = snap.val();
         const arr = Array.isArray(data) ? data : Object.values(data);
         arr.forEach((c: any, idx: number) => {
           currentWebsite.push({ id: `website-${idx}`, collegeName: 'System Registry', ...c });
         });
      }
      processCourses();
    });

    return () => {
      unsubGlobal();
      unsubColleges();
      unsubWebsite();
    };
  }, [managedCourseNames]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.courses-dropdown-container')) {
        setIsCoursesOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    <nav className="bg-[#003366] px-4 md:px-10 h-14 flex items-center justify-between shadow-md sticky top-0 z-50 relative">
      
      {/* Mobile Hamburger Button */}
      <button 
        className="md:hidden text-white p-1 hover:text-amber-400 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center h-full shrink-0">
        {mainNav.map((item, idx) => (
          <div 
            key={idx} 
            className={`h-full relative group/nav ${item.hasDropdown ? 'courses-dropdown-container' : ''}`}
          >
            <Link 
              href={item.href} 
              onClick={(e) => {
                if (item.hasDropdown) {
                  e.preventDefault();
                  setIsCoursesOpen(!isCoursesOpen);
                }
              }}
              className="flex items-center gap-2 px-6 h-full text-white/80 hover:text-white hover:bg-white/10 transition-all font-black text-[17px] capitalize tracking-tight border-r border-white/10 cursor-pointer"
            >
              <item.icon size={14} className="opacity-50" />
              {item.label}
              {item.hasDropdown && <ChevronDown size={12} className={`transition-transform duration-300 ${isCoursesOpen ? 'rotate-180' : ''}`} />}
            </Link>

            {item.hasDropdown && (
              <div 
                className={`absolute left-0 top-full pt-2 w-[400px] transition-all duration-300 origin-top-left z-[999] ${
                  isCoursesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                }`}
              >
                <div className="bg-[#002244] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl p-4 flex flex-col gap-3">
                  
                  {/* 1. Search Bar first */}
                  <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-amber-400 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search courses..." 
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-8 text-xs font-bold text-white placeholder:text-white/80 placeholder:text-opacity-80 outline-none focus:bg-white/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                    {courseSearch && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCourseSearch('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* 2. Scrollable Course List */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Available Courses</span>
                    <span className="text-[9px] font-bold text-[#00a5a5] bg-[#00a5a5]/10 px-2 py-0.5 rounded-full uppercase">Registry</span>
                  </div>

                  <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {allCourses.length > 0 ? (
                      (() => {
                        const filtered = allCourses.filter(c => 
                          (c.course_name || c.name || '').toLowerCase().includes(courseSearch.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-8 text-white/30">
                              <p className="text-xs italic">No courses match your search.</p>
                            </div>
                          );
                        }

                        return filtered.map((course) => (
                          <Link 
                            key={`${course.collegeId}-${course.id}`} 
                            href={`/${course.course_slug && course.course_slug !== 'NULL' ? course.course_slug : course.id}/courseview?college=${course.collegeId || ''}`}
                            onClick={() => setIsCoursesOpen(false)}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-all group min-w-0"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
                                <GraduationCap size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-white group-hover:text-amber-300 capitalize block truncate transition-colors">
                                  {course.course_name || course.name}
                                </span>
                                {course.collegeNames && course.collegeNames.length > 0 && (
                                  <span className="text-[10px] font-semibold text-white/40 block truncate mt-0.5">
                                    {course.collegeNames.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-white/20 group-hover:text-amber-400 transition-all transform group-hover:translate-x-1 shrink-0 ml-2" />
                          </Link>
                        ));
                      })()
                    ) : (
                      <p className="text-xs text-white/30 italic p-4 text-center">Loading courses...</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 relative shrink-0">
        <div className="relative group">
          <button 
            onMouseEnter={() => setIsLoginOpen(true)}
            onMouseLeave={() => setIsLoginOpen(false)}
            className="bg-amber-400 hover:bg-amber-500 text-[#003366] px-8 py-3 rounded-md font-black text-[17px] capitalize tracking-tight transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <LogIn size={16} /> Login <ChevronDown size={14} className={`transition-transform duration-300 ${isLoginOpen ? 'rotate-180' : ''}`} />
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

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#002244] border-t border-white/10 shadow-2xl flex flex-col py-2 z-[999] max-h-[80vh] overflow-y-auto">
          {mainNav.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <Link 
                href={item.href}
                onClick={(e) => {
                  if (item.hasDropdown) {
                    e.preventDefault();
                    setIsCoursesOpen(!isCoursesOpen);
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="flex items-center justify-between px-6 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-all font-bold text-[15px] border-b border-white/5"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className="opacity-50" />
                  {item.label}
                </div>
                {item.hasDropdown && <ChevronDown size={16} className={`transition-transform duration-300 ${isCoursesOpen ? 'rotate-180' : ''}`} />}
              </Link>
              
              {item.hasDropdown && isCoursesOpen && (
                <div className="bg-[#001122] flex flex-col px-4 py-3 gap-2">
                  {/* Mobile Search Bar */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={mobileCourseSearch}
                      onChange={(e) => setMobileCourseSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-9 pr-8 text-xs font-bold text-white placeholder:text-white/50 outline-none focus:bg-white/15 focus:border-amber-400 transition-all"
                    />
                    {mobileCourseSearch && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMobileCourseSearch(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filtered Course List */}
                  <div className="flex flex-col max-h-[260px] overflow-y-auto no-scrollbar">
                    {allCourses.length > 0 ? (() => {
                      const mobileFiltered = allCourses.filter(c =>
                        (c.course_name || c.name || '').toLowerCase().includes(mobileCourseSearch.toLowerCase())
                      );
                      if (mobileFiltered.length === 0) {
                        return <p className="text-white/30 text-xs py-4 text-center italic">No courses match your search.</p>;
                      }
                      return mobileFiltered.map((course) => (
                        <Link
                          key={`mobile-${course.collegeId}-${course.id}`}
                          href={`/${course.course_slug && course.course_slug !== 'NULL' ? course.course_slug : course.id}/courseview?college=${course.collegeId || ''}`}
                          onClick={() => { setIsMobileMenuOpen(false); setMobileCourseSearch(''); }}
                          className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
                            <GraduationCap size={14} />
                          </div>
                          <span className="text-white/80 text-[13px] font-semibold group-hover:text-amber-400 leading-snug transition-colors truncate">
                            {course.course_name || course.name}
                          </span>
                        </Link>
                      ));
                    })() : <span className="text-white/30 text-xs py-2 text-center">Loading courses...</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

