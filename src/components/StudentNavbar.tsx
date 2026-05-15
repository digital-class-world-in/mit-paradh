'use client';

import { useState } from 'react';
import { 
  LogOut,
  ChevronDown
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
}

export default function StudentNavbar({ activeTab, setActiveTab, studentName, onLogout }: NavbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navigation = [
    { label: 'Dashboard', id: 1, type: 'single' },
    { 
      label: 'Application form', 
      type: 'dropdown',
      items: [
        { name: 'Your application', id: 2 },
        { name: 'Print application', id: 22 },
      ]
    },
    { label: 'Exam form', id: 4, type: 'single' },
    { 
      label: 'Fee', 
      type: 'dropdown',
      items: [
        { name: 'a) Fee', id: 5 },
        { name: 'b) Payment slip', id: 15 },
      ]
    },
    { 
      label: ' Course', 
      type: 'dropdown',
      items: [
        { name: 'a) Mark sheet/mark memo pdf', id: 6 },
        { name: 'b) Certificate pdf', id: 6 },
      ]
    },
    { label: 'Question paper', id: 7, type: 'single' },
    { label: 'Document', id: 11, type: 'single' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-black shadow-md border-b border-slate-200">
      <div className="max-w-full mx-auto px-6 h-24 flex items-center justify-between">
        {/* Branding/Logo */}
        <div className="flex items-center gap-4 shrink-0 cursor-pointer" onClick={() => setActiveTab(1)}>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 hover:scale-105 transition-transform overflow-hidden">
             <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[18px] font-black text-[#003366] tracking-tight uppercase hidden md:block">MIT PARADH</h1>
        </div>

        {/* NSSC Style Menu (No Icons) */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {navigation.map((group, idx) => (
            <div 
              key={idx} 
              className="relative"
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
                  "flex items-center gap-1.5 px-4 py-3 rounded-md font-normal text-[16px] tracking-tight transition-all duration-300 whitespace-nowrap",
                  (activeTab === group.id || (group.type === 'dropdown' && group.items?.some(i => i.id === activeTab)))
                    ? "text-[#00a5a5] bg-slate-50" 
                    : "text-black hover:bg-slate-50 hover:text-[#00a5a5]"
                )}
              >
                <span>{group.label}</span>
                {group.type === 'dropdown' && <ChevronDown size={14} className={cn("transition-transform duration-300 opacity-50 text-black", openDropdown === group.label && "rotate-180")} />}
              </button>

              {/* NSSC Style Dropdown */}
              {group.type === 'dropdown' && openDropdown === group.label && (
                <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white text-black rounded-md shadow-2xl py-2 border border-slate-200 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                  {group.items?.map((item, iIdx) => (
                    <button 
                      key={iIdx} 
                      onClick={() => {
                        setActiveTab(item.id, item.name);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full text-left px-6 py-3 text-[16px] font-normal transition-all hover:bg-slate-50",
                        activeTab === item.id ? "bg-[#00a5a5] text-white" : "text-black hover:text-[#00a5a5]"
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

        {/* User Hub */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <p className="text-[13px] font-medium text-black capitalize tracking-tight leading-none">Welcome,</p>
            <p className="text-[16px] font-semibold text-slate-800 tracking-tight mt-1 capitalize">{studentName || 'Student'}</p>
          </div>
          
          <button 
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-normal text-[15px] tracking-tight transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}


