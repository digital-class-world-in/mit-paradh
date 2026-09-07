'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ChevronDown, Trash2, Globe, FileText, Database, Menu, X, Search, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminHeaderProps {
  activeTab: number;
  setActiveTab: (tab: number, sub?: number, tabName?: string, subName?: string) => void;
  onLogout: () => void;
  adminName: string;
}

interface MenuItem {
  label: string;
  id?: number;
  url?: string;
  icon?: any;
  subItems?: { label: string; id?: number; url?: string }[];
  isExternal?: boolean;
}

export default function AdminHeader({ activeTab, setActiveTab, onLogout, adminName }: AdminHeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  const router = useRouter();
  const pathname = usePathname();

  // Lock body scroll when mobile menu is open
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

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', id: 1 },
    {
      label: 'Student info',
      id: 2,
      subItems: [
        { label: 'Student Credentials & Passwords', url: '/admin/dashboard/student-credentials' },
        { label: 'Pending Admission', url: '/admin/dashboard/pending-admissions' },
        { label: 'Confirm Admission', url: '/admin/dashboard/confirm-admissions' },
        { label: 'Cancel Admission', id: 3023 },
        { label: 'Approved Admission', url: '/admin/dashboard/approved-admissions' },
        { label: 'Student Registration', id: 19 }
      ]
    },
    {
      label: 'Student Credentials',
      id: 27,
      url: '/admin/dashboard/student-credentials'
    },
    {
      label: 'Exam',
      id: 600,
      subItems: [
        { label: 'Exam List', id: 601 },
        { label: 'Create Online Exam', id: 602 },
        { label: 'Exam Form', id: 603 },
        { label: 'Exam Fees', id: 604 }
      ]
    },
    {
      label: 'Certificate',
      id: 80,
      subItems: [
        { label: 'Marksheet', id: 81 },
        { label: 'Course Certificate', id: 82 }
      ]
    },
    {
      label: 'Fees',
      id: 70,
      subItems: [{ label: 'Fee Management', id: 71 }]
    },
    {
      label: 'Payment', id: 200,
      subItems: [
        { label: 'Online Payments', id: 201 },
        { label: 'Payment History', id: 202 }
      ]
    },
    {
      label: 'College',
      id: 60,
      subItems: [{ label: 'College List', id: 61 }]
    },
    {
      label: 'HR',
      id: 3,
      subItems: [{ label: 'Staff Directory', id: 31 }]
    },
    {
      label: 'Course',
      id: 4,
      subItems: [{ label: 'Manage Course', id: 41 }]
    },
    {
      label: 'Front Office',
      id: 90,
      subItems: [{ label: 'Admission Inquiry', id: 91 }, { label: 'Contact Us', id: 94 }]
    },
    {
      label: 'Notice Board',
      id: 20
    },
    {
      label: 'Website Manager',
      id: 15,
      icon: Globe,
      subItems: [
        { label: 'Home Page', id: 101 },
        { label: 'About Page', id: 102 },
        { label: 'Course Setup', id: 107 },
        { label: 'Inquiry', id: 104 },
        { label: 'Contact Us', id: 105 },
        { label: 'Footer Setup', id: 106 }
      ]
    },
    { label: 'Back Up', id: 110, icon: Database },
  ];

  const filteredMenuItems = drawerSearch.trim()
    ? menuItems.filter(item => {
        const matchMain = item.label.toLowerCase().includes(drawerSearch.toLowerCase());
        const matchSub = item.subItems?.some(s => s.label.toLowerCase().includes(drawerSearch.toLowerCase()));
        return matchMain || matchSub;
      })
    : menuItems;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white text-black shadow-md border-b border-slate-200"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      <div className="max-w-full mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab(1)}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-200 hover:scale-105 transition-transform overflow-hidden shrink-0">
            <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-[#00a5a5] truncate leading-tight">MIT PARADH</h1>
            <p className="text-[10.5px] sm:text-xs capitalize font-bold tracking-tight text-slate-600 truncate leading-tight">Admin Portal</p>
          </div>
        </div>

        {/* Mobile & Tablet Quick Controls */}
        <div className="xl:hidden flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            target="_blank"
            className="p-2 text-slate-600 hover:text-[#00a5a5] hover:bg-slate-100 rounded-lg transition-colors"
            title="View Website"
          >
            <Globe size={18} />
          </Link>
          <button
            onClick={onLogout}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-[#00a5a5] hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden xl:flex flex-1 items-center justify-center gap-1 mx-2 overflow-x-auto no-scrollbar">
          {menuItems.map((group, idx) => (
            <div key={idx} className="relative group/nav">
              <button
                onClick={() => {
                  if (group.subItems && group.subItems.length > 0) {
                    setOpenDropdown(openDropdown === group.label ? null : group.label);
                  } else if (group.isExternal) {
                    window.open('/', '_blank');
                  } else if (group.url) {
                    router.push(group.url);
                    setOpenDropdown(null);
                  } else if (group.id) {
                    setActiveTab(group.id);
                    setOpenDropdown(null);
                  }
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-2 rounded-lg font-semibold text-[13px] 2xl:text-[13.5px] tracking-tight transition-all duration-200 whitespace-nowrap",
                  (activeTab === group.id || group.subItems?.some(i => i.id === activeTab) || (group.url && pathname === group.url))
                    ? "text-[#5D5fb1] bg-slate-100 font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#5D5fb1]"
                )}
                title={group.label}
              >
                {group.icon ? <group.icon size={16} /> : <span>{group.label}</span>}
                {group.subItems && group.subItems.length > 0 && (
                  <ChevronDown size={13} className={cn("transition-transform duration-200 opacity-60", openDropdown === group.label && "rotate-180")} />
                )}
              </button>

              {group.subItems && group.subItems.length > 0 && openDropdown === group.label && (
                <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white text-black rounded-xl shadow-2xl py-2 border border-slate-200 z-[60] animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
                  {group.subItems.map((item, iIdx) => (
                    <button
                      key={iIdx}
                      onClick={() => {
                        if (item.url) {
                          router.push(item.url);
                        } else if (item.id && group.id) {
                          setActiveTab(group.id, item.id, group.label, item.label);
                        }
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full text-left px-5 py-2.5 text-xs 2xl:text-[13px] font-medium transition-all",
                        (activeTab === item.id || pathname === item.url)
                          ? "text-[#5D5fb1] font-bold bg-slate-50"
                          : "text-slate-700 hover:text-[#5D5fb1] hover:bg-slate-50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Logout & View Website */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5"
            title="Open Public Website"
          >
            <Globe size={14} /> Website
          </Link>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-lg font-bold text-xs tracking-tight transition-all flex items-center gap-1.5 shadow-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm xl:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[320px] bg-white flex flex-col overflow-y-auto animate-in slide-in-from-left duration-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-200 shrink-0">
                    <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
                 </div>
                 <div>
                    <h2 className="text-sm font-bold text-[#00a5a5]">MIT PARADH</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Admin Portal</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Quick Drawer Search */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter admin modules..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#00a5a5] focus:bg-white transition-all"
                />
                {drawerSearch && (
                  <button onClick={() => setDrawerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Drawer Menu Items */}
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
               {filteredMenuItems.map((group, idx) => {
                 const isMatchesSub = Boolean(drawerSearch.trim() && group.subItems?.some(s => s.label.toLowerCase().includes(drawerSearch.toLowerCase())));
                 const isExpanded = openDropdown === group.label || isMatchesSub;

                 return (
                   <div key={idx} className="rounded-xl overflow-hidden">
                     <button
                       onClick={() => {
                         if (group.subItems && group.subItems.length > 0) {
                           setOpenDropdown(openDropdown === group.label ? null : group.label);
                         } else if (group.isExternal) {
                           window.open('/', '_blank');
                         } else if (group.url) {
                           router.push(group.url);
                           setIsMobileMenuOpen(false);
                         } else if (group.id) {
                           setActiveTab(group.id);
                           setIsMobileMenuOpen(false);
                         }
                       }}
                       className={cn(
                         "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px]",
                         (activeTab === group.id || group.subItems?.some(i => i.id === activeTab) || (group.url && pathname === group.url))
                           ? "text-[#5D5fb1] bg-indigo-50/70 font-bold"
                           : "text-slate-700 hover:bg-slate-50 hover:text-[#5D5fb1]"
                       )}
                     >
                       <div className="flex items-center gap-3">
                         {group.icon && <group.icon size={17} className="text-[#00a5a5]" />}
                         <span>{group.label}</span>
                       </div>
                       {group.subItems && group.subItems.length > 0 && (
                         <ChevronDown size={15} className={cn("transition-transform duration-200 opacity-60", isExpanded && "rotate-180")} />
                       )}
                     </button>
                     {group.subItems && group.subItems.length > 0 && isExpanded && (
                       <div className="pl-9 pr-2 py-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200 bg-slate-50/50 rounded-b-xl">
                         {group.subItems.map((item, iIdx) => (
                           <button
                             key={iIdx}
                             onClick={() => {
                               if (item.url) {
                                 router.push(item.url);
                               } else if (item.id && group.id) {
                                 setActiveTab(group.id, item.id, group.label, item.label);
                               }
                               setIsMobileMenuOpen(false);
                             }}
                             className={cn(
                               "w-full text-left px-2 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] flex items-center",
                               (activeTab === item.id || pathname === item.url)
                                 ? "text-[#5D5fb1] font-bold bg-white shadow-xs"
                                 : "text-slate-600 hover:text-[#5D5fb1] hover:bg-white"
                             )}
                           >
                             {item.label}
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-2">
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Globe size={15} /> Visit Public Website
              </Link>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 min-h-[42px] shadow-sm"
              >
                <LogOut size={15} /> Logout Admin Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
