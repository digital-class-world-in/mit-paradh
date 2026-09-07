'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  ChevronDown, 
  Trash2, 
  Globe, 
  Menu, 
  X, 
  Search, 
  Building2, 
  User, 
  LayoutDashboard, 
  CreditCard, 
  Award, 
  Users, 
  BookOpen, 
  Clock, 
  FileText
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CollegeHeaderProps {
  activeTab: number;
  setActiveTab: (tab: number, sub?: number, tabName?: string, subName?: string) => void;
  onLogout: () => void;
  collegeName: string;
  collegeLogo?: string;
  permissions?: Record<string, boolean>;
}

export default function CollegeHeader({ activeTab, setActiveTab, onLogout, collegeName, collegeLogo, permissions }: CollegeHeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  // Body scroll lock on mobile drawer open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Click outside & Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const menuItems = [
    { label: 'Dashboard', id: 1, icon: LayoutDashboard },
    {
      label: 'Student Info',
      id: 2,
      icon: Users,
      subItems: [
        { label: 'Student Admission', id: 25 },
        { label: 'Student Registration', id: 19 },
        { label: 'Pending Admission', url: '/college/dashboard/pending-admissions' },
        { label: 'Confirm Admission', url: '/college/dashboard/confirm-admissions' },
        { label: 'Approved Admission', url: '/college/dashboard/approved-admissions' },
        { label: 'Cancel Admission', id: 1023 },
        { label: 'Student ID Card', id: 26 },
      ]
    },
    {
      label: 'Fees',
      id: 70,
      icon: CreditCard,
      subItems: [{ label: 'Fee Management', id: 71 }]
    },
    {
      label: 'Payment', 
      id: 200,
      icon: CreditCard,
      subItems: [
        { label: 'Online Payments', id: 201 },
        { label: 'Payment History', id: 202 }
      ]
    },
    {
      label: 'Exam',
      id: 60,
      icon: FileText,
      subItems: [
        { label: 'Create Exam', id: 61 }, 
        { label: 'Exam Form', id: 62 }, 
        { label: 'Exam Fees', id: 63 }
      ]
    },
    {
      label: 'Certificate',
      id: 80,
      icon: Award,
      subItems: [
        { label: 'Transfer Certificate', id: 81 }, 
        { label: 'Marksheet', id: 83 }, 
        { label: 'Course Certificate', id: 84 }
      ]
    },
    {
      label: 'HR',
      id: 3,
      icon: User,
      subItems: [
        { label: 'Staff Directory', id: 31 }, 
        { label: 'Leave Card', id: 33 }, 
        { label: 'Staff Login', id: 36, isExternal: true }
      ]
    },
    {
      label: 'Course',
      id: 4,
      icon: BookOpen,
      subItems: [{ label: 'Manage Course', id: 41 }]
    },
    {
      label: 'Front Office',
      id: 90,
      icon: Building2,
      subItems: [
        { label: 'Admission Inquiry', id: 91 }, 
        { label: 'Contact Us', id: 94 }
      ]
    },
    {
      label: 'Notice Board',
      id: 20,
      icon: Clock
    },
    {
      label: 'Trash',
      id: 99,
      icon: Trash2
    },
    { label: 'Website', id: 1000, icon: Globe, isExternal: true },
  ];

  const filteredItems = useMemo(() => {
    return menuItems
      .filter(item => permissions && item.id !== undefined ? permissions[item.id] !== false : true)
      .map(item => {
        if (!item.subItems) return item;
        return {
          ...item,
          subItems: item.subItems.filter(sub => permissions && sub.id !== undefined ? permissions[sub.id] !== false : true)
        };
      });
  }, [permissions]);

  // Filter items for mobile drawer search
  const searchedDrawerItems = useMemo(() => {
    if (!drawerSearch.trim()) return filteredItems;
    const q = drawerSearch.toLowerCase();
    return filteredItems.filter(item => {
      const matchParent = item.label.toLowerCase().includes(q);
      const matchSub = item.subItems?.some(s => s.label.toLowerCase().includes(q));
      return matchParent || matchSub;
    });
  }, [filteredItems, drawerSearch]);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-white text-black shadow-md border-b border-slate-200"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      <div className="max-w-full mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 cursor-pointer group" 
          onClick={() => setActiveTab(1)}
          title="Return to Dashboard"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-200 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
            {collegeLogo ? (
              <img src={collegeLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="max-w-[140px] sm:max-w-[200px] md:max-w-[280px]">
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-[#00a5a5] truncate leading-tight">{collegeName || 'MIT PARADH'}</h1>
            <p className="text-[10px] sm:text-xs capitalize font-semibold tracking-tight text-slate-500 truncate">College Portal</p>
          </div>
        </div>

        {/* Mobile & Tablet Action Bar (Globe, 1-tap Logout, Hamburger) */}
        <div className="flex xl:hidden items-center gap-1.5 sm:gap-2">
          <Link 
            href="/" 
            target="_blank"
            className="p-2 sm:p-2.5 text-slate-600 hover:text-[#00a5a5] hover:bg-slate-100 rounded-xl transition-all"
            title="View Public Website"
            aria-label="View Public Website"
          >
            <Globe size={18} />
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-xl transition-all active:scale-95"
            title="Logout"
          >
            <LogOut size={14} />
            <span className="hidden xs:inline text-[11px]">Logout</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 sm:p-2.5 text-[#00a5a5] hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 active:scale-95"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Desktop Navigation Menu (overflow-visible to prevent clipping dropdowns) */}
        <div className="hidden xl:flex flex-1 items-center justify-center gap-0.5 2xl:gap-1.5 mx-2 overflow-visible">
          {filteredItems.map((group, idx) => {
            const isGroupActive = activeTab === group.id || 
              group.subItems?.some((i: any) => i.id === activeTab || (i.url && pathname === i.url));

            return (
              <div key={idx} className="relative">
                <button
                  onClick={() => {
                    const g = group as any;
                    if (g.subItems && g.subItems.length > 0) {
                      setOpenDropdown(openDropdown === group.label ? null : group.label);
                    } else if (g.isExternal) {
                      window.open('/', '_blank');
                    } else if (g.url) {
                      router.push(g.url);
                      setOpenDropdown(null);
                    } else if (g.id) {
                      setActiveTab(group.id);
                      setOpenDropdown(null);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 2xl:px-2.5 py-2 rounded-lg font-medium text-[12.5px] 2xl:text-[13.5px] tracking-tight transition-all duration-200 whitespace-nowrap",
                    isGroupActive
                      ? "text-[#5D5fb1] bg-slate-100 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#5D5fb1]"
                  )}
                  title={group.label}
                >
                  <span>{group.label}</span>
                  {group.subItems && group.subItems.length > 0 && (
                    <ChevronDown size={13} className={cn("transition-transform duration-200 opacity-60", openDropdown === group.label && "rotate-180")} />
                  )}
                </button>

                {group.subItems && group.subItems.length > 0 && openDropdown === group.label && (
                  <div className="absolute top-full left-0 mt-1 min-w-[210px] bg-white text-black rounded-xl shadow-2xl py-1.5 border border-slate-200 z-[100] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[70vh] overflow-y-auto">
                    {group.subItems.map((item, iIdx) => {
                      const isItemActive = activeTab === item.id || (item as any).url === pathname;
                      return (
                        <button
                          key={iIdx}
                          onClick={() => {
                            const subItem = item as any;
                            if (subItem.isExternal) {
                              window.open('/login/staff', '_blank');
                            } else if (subItem.url) {
                              router.push(subItem.url);
                              setOpenDropdown(null);
                            } else if (item.id && group.id) {
                              setActiveTab(group.id, item.id, group.label, item.label);
                              setOpenDropdown(null);
                            }
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-medium transition-all flex items-center justify-between",
                            isItemActive
                              ? "text-[#5D5fb1] font-bold bg-slate-50"
                              : "text-slate-700 hover:text-[#5D5fb1] hover:bg-slate-50"
                          )}
                        >
                          <span>{item.label}</span>
                          {isItemActive && <span className="w-1.5 h-1.5 rounded-full bg-[#5D5fb1]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden xl:flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5"
            title="Open Public Website"
          >
            <Globe size={14} className="text-[#00a5a5]" /> 
            <span>Website</span>
          </Link>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center gap-1.5 shadow-sm"
            title="Logout of Portal"
          >
            <LogOut size={14} /> 
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Touch Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm xl:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[86vw] max-w-[340px] bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-200 shrink-0">
                    {collegeLogo ? (
                      <img src={collegeLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
                    )}
                 </div>
                 <div className="max-w-[180px]">
                    <h2 className="text-sm font-bold text-[#00a5a5] truncate">{collegeName || 'MIT PARADH'}</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">College Portal</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Live Search Filter */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter modules & links..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-7 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
                {drawerSearch && (
                  <button onClick={() => setDrawerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Scrollable Nav List */}
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
               {searchedDrawerItems.length > 0 ? (
                 searchedDrawerItems.map((group: any, idx) => {
                   const isMatchesSub = Boolean(drawerSearch.trim() && group.subItems?.some((s: any) => s.label.toLowerCase().includes(drawerSearch.toLowerCase())));
                   const isExpanded = openDropdown === group.label || isMatchesSub;
                   const isGroupActive = activeTab === group.id || group.subItems?.some((i: any) => i.id === activeTab || (i.url && pathname === i.url));

                   return (
                     <div key={idx} className="rounded-xl overflow-hidden mb-0.5">
                       <button
                         onClick={() => {
                           const g = group as any;
                           if (g.subItems && g.subItems.length > 0) {
                             setOpenDropdown(openDropdown === group.label ? null : group.label);
                           } else if (g.isExternal) {
                             window.open('/', '_blank');
                             setIsMobileMenuOpen(false);
                           } else if (g.url) {
                             router.push(g.url);
                             setIsMobileMenuOpen(false);
                           } else if (g.id) {
                             setActiveTab(group.id);
                             setIsMobileMenuOpen(false);
                           }
                         }}
                         className={cn(
                           "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px]",
                           isGroupActive
                             ? "text-[#5D5fb1] bg-indigo-50/70"
                             : "text-slate-700 hover:bg-slate-50 hover:text-[#5D5fb1]"
                         )}
                       >
                         <div className="flex items-center gap-2.5">
                           {group.icon && <group.icon size={16} className="text-[#00a5a5]" />}
                           <span>{group.label}</span>
                         </div>
                         {group.subItems && group.subItems.length > 0 && (
                           <ChevronDown size={14} className={cn("transition-transform duration-200 text-slate-400", isExpanded && "rotate-180")} />
                         )}
                       </button>

                       {group.subItems && group.subItems.length > 0 && isExpanded && (
                         <div className="pl-8 pr-2 py-1 space-y-0.5 animate-in slide-in-from-top-2 duration-150 bg-slate-50/50 rounded-b-xl">
                           {group.subItems.map((item: any, iIdx: number) => {
                             const isItemActive = activeTab === item.id || (item as any).url === pathname;
                             return (
                               <button
                                 key={iIdx}
                                 onClick={() => {
                                   const subItem = item as any;
                                   if (subItem.isExternal) {
                                     window.open('/login/staff', '_blank');
                                   } else if (subItem.url) {
                                     router.push(subItem.url);
                                   } else if (item.id && group.id) {
                                     setActiveTab(group.id, item.id, group.label, item.label);
                                   }
                                   setIsMobileMenuOpen(false);
                                 }}
                                 className={cn(
                                   "w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold transition-all min-h-[38px] flex items-center justify-between",
                                   isItemActive
                                     ? "text-[#5D5fb1] bg-white font-bold shadow-xs"
                                     : "text-slate-600 hover:text-[#5D5fb1] hover:bg-white"
                                 )}
                               >
                                 <span>{item.label}</span>
                                 {isItemActive && <span className="w-1.5 h-1.5 rounded-full bg-[#5D5fb1]" />}
                               </button>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   );
                 })
               ) : (
                 <div className="py-12 text-center text-slate-400 text-xs">
                   No modules matching &quot;{drawerSearch}&quot;
                 </div>
               )}
            </div>
            
            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/60 space-y-2">
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs min-h-[42px]"
              >
                <Globe size={15} className="text-[#00a5a5]" /> 
                <span>View Public Website</span>
              </Link>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 min-h-[42px]"
              >
                <LogOut size={15} /> 
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
