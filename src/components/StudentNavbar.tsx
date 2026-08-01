'use client';

import { useState, useEffect } from 'react';
import {
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  activeTab: number;
  setActiveTab: (tab: number, tabName?: string) => void;
  studentName: string;
  onLogout: () => void;
  hasApplied?: boolean;
  isExamConfigured?: boolean;
}

export default function StudentNavbar({ activeTab, setActiveTab, studentName, onLogout, hasApplied, isExamConfigured = false }: NavbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.student-nav-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navigation = [
    { label: 'Dashboard', id: 1, type: 'single' },
    { label: 'Notice Board', id: 10, type: 'single' },
    { label: 'ID Card', id: 12, type: 'single' },
    { label: 'Apply for Admission', id: 3, type: 'single' },
    { label: 'Payment', id: 15, type: 'single' },
    {
      label: 'My Applications',
      type: 'dropdown',
      items: [
        { name: 'Your application', id: 2 },
        { name: 'Print application', id: 22 },
      ]
    },
    {
      label: 'Fee Details',
      type: 'dropdown',
      items: [
        { name: 'Course Fee', id: 5 },
        { name: 'Payment Slip', id: 5 },
        { name: 'Fee Table', id: 14 },
      ]
    },
    { label: 'Exam Form', id: 4, type: 'single' },
    { label: 'Question Paper', id: 7, type: 'single' },
    {
      label: 'Certificate',
      type: 'dropdown',
      items: [
        { name: 'Marksheet', id: 6 },
        { name: 'Course Certificate', id: 13 },
        { name: 'Bonafide Certificate', id: 16 },
      ]
    },
    { label: 'Document', id: 11, type: 'single' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#003366] text-white shadow-md border-b border-white/10 print:hidden">
      <div className="max-w-full mx-auto px-3 md:px-6 h-12 flex items-center gap-2">
        
        {/* Branding/Logo Badge */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-85 transition-opacity" onClick={() => setActiveTab(1)}>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-white flex items-center justify-center p-0.5">
            <img
              src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg"
              alt="MIT Paradh Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider hidden xl:inline whitespace-nowrap">
            Student Portal
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/20 shrink-0 hidden lg:block" />

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center h-full gap-0 flex-1">
          {navigation.map((group, idx) => {
            const isActive = activeTab === group.id || (group.type === 'dropdown' && group.items?.some(i => i.id === activeTab));
            return (
              <div
                key={idx}
                className="relative h-12 shrink-0 student-nav-dropdown-container"
              >
                <button
                  onClick={() => {
                    if (group.type === 'dropdown') {
                      setOpenDropdown(openDropdown === group.label ? null : group.label);
                    } else {
                      setActiveTab(group.id!, group.label);
                      setOpenDropdown(null);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-0.5 px-2.5 h-full text-[10.5px] font-bold transition-all border-b-[2px] whitespace-nowrap cursor-pointer uppercase tracking-tight",
                    isActive
                      ? "text-white bg-white/5 border-amber-400 font-extrabold"
                      : "text-white/75 hover:bg-white/10 hover:text-white border-transparent"
                  )}
                >
                  <span>{group.label}</span>
                  {group.type === 'dropdown' && <ChevronDown size={10} className={cn("transition-transform duration-300 opacity-60", openDropdown === group.label && "rotate-180")} />}
                </button>

                {/* Dropdown Menu */}
                {group.type === 'dropdown' && openDropdown === group.label && (
                  <div className="absolute top-full left-0 mt-0 min-w-[180px] bg-[#002244] text-white rounded-b-md shadow-2xl py-1.5 border border-white/10 z-[60] animate-in fade-in slide-in-from-top-1 duration-150">
                    {group.items?.map((item, iIdx) => (
                      <button
                        key={iIdx}
                        onClick={() => {
                          setActiveTab(item.id, item.name);
                          setOpenDropdown(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-[10.5px] font-bold transition-all hover:bg-white/10 text-white/80 hover:text-white uppercase tracking-tight",
                          activeTab === item.id ? "bg-white/10 text-amber-400 font-black" : ""
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Hub */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button onClick={() => setActiveTab(10, 'Notice Board')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#00a5a5] hover:text-white transition-all border border-white/10 relative">
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-[#003366]" />
          </button>
          <div className="text-right hidden xl:block">
            <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest leading-none">Student</p>
            <p className="text-[11px] font-bold text-white tracking-tight mt-0.5 capitalize">{studentName || 'Student'}</p>
          </div>

          <button
            onClick={onLogout}
            className="hidden md:flex bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-[10.5px] font-bold tracking-tight transition-all items-center gap-1.5 shadow-lg active:scale-95"
          >
            <LogOut size={13} /> Logout
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all border border-white/10"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>


      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-[#002147] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <p className="text-sm font-black text-white tracking-tighter uppercase">MIT PARADH</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
              {navigation.map((group, idx) => (
                <div key={idx} className="flex flex-col">
                  <button
                    onClick={() => {
                      if (group.type === 'dropdown') {
                        setOpenDropdown(openDropdown === group.label ? null : group.label);
                      } else {
                        setActiveTab(group.id!, group.label);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between px-4 py-4 rounded-xl font-bold text-[15px] transition-all",
                      activeTab === group.id ? "bg-[#00a5a5] text-white" : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    <span>{group.label}</span>
                    {group.type === 'dropdown' && <ChevronDown size={18} className={cn("transition-transform duration-300", openDropdown === group.label && "rotate-180")} />}
                  </button>

                  {group.type === 'dropdown' && openDropdown === group.label && (
                    <div className="pl-4 py-2 space-y-1 border-l border-white/10 ml-4 mt-1">
                      {group.items?.map((item, iIdx) => (
                        <button
                          key={iIdx}
                          onClick={() => {
                            setActiveTab(item.id, item.name);
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl font-medium text-[14px] transition-all",
                            activeTab === item.id ? "bg-[#00a5a5]/20 text-[#00a5a5]" : "text-white/60 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/10 bg-black/20">
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold text-[15px] tracking-tight transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


