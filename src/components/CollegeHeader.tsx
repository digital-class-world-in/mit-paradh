'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, ChevronDown, Trash2, Globe } from 'lucide-react';
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
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: 'Dashboard', id: 1 },
    {
      label: 'Student info',
      id: 2,
      subItems: [
        { label: 'Pending Admission', url: '/college/dashboard/pending-admissions' },
        { label: 'Confirm Admission', url: '/college/dashboard/confirm-admissions' },
        { label: 'Cancel Admission', id: 1023 },
        { label: 'Approved Admission', url: '/college/dashboard/approved-admissions' },
        // { label: 'Student registration', id: 19 }, 
        // { label: 'Leave request', id: 23 }
      ]
    },
    {
      label: 'Fees',
      id: 70,
      subItems: [{ label: 'Fee Management', id: 71 }]
    },
    {
      label: 'Payment', id: 200,
      subItems: [{ label: 'Online Payments', id: 201 }]
    },
    {
      label: 'Exam',
      id: 60,
      subItems: [{ label: 'Create Exam', id: 61 }, { label: 'Exam Form', id: 62 }, { label: 'Exam Fees', id: 63 }]
    },
    {
      label: 'Certificate',
      id: 80,
      subItems: [{ label: 'Transfer Certificate', id: 81 }, { label: 'Marksheet', id: 83 }, { label: 'Course Certificate', id: 84 }]
    },
    {
      label: 'HR',
      id: 3,
      subItems: [{ label: 'Staff Directory', id: 31 }, { label: 'Leave Card', id: 33 }, { label: 'Staff Login', id: 36, isExternal: true }]
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

    { label: 'Website', id: 1000, icon: Globe, isExternal: true },
  ];

  const filteredItems = menuItems
    .filter(item => permissions && item.id !== undefined ? permissions[item.id] !== false : true)
    .map(item => {
      if (!item.subItems) return item;
      return {
        ...item,
        subItems: item.subItems.filter(sub => permissions && sub.id !== undefined ? permissions[sub.id] !== false : true)
      };
    });

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white text-black shadow-md border-b border-slate-200"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      <div className="max-w-full mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-4 shrink-0 cursor-pointer" onClick={() => setActiveTab(1)}>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 hover:scale-105 transition-transform overflow-hidden">
            {collegeLogo ? (
              <img src={collegeLogo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="hidden lg:block max-w-[200px]">
            <h1 className="text-lg font-bold text-[#00a5a5] truncate">{collegeName || 'MIT PARADH'}</h1>
            <p className="text-[13px] capitalize font-bold tracking-tight text-black">College Portal</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1 mx-4">
          {filteredItems.map((group, idx) => (
            <div key={idx} className="relative group/nav">
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
                  "flex items-center gap-1.5 px-3 py-3 rounded-md font-normal text-[16px] tracking-tight transition-all duration-300 whitespace-nowrap",
                  (activeTab === group.id || group.subItems?.some(i => i.id === activeTab))
                    ? "text-[#5D5fb1] bg-slate-50"
                    : "text-black hover:bg-slate-50 hover:text-[#5D5fb1]"
                )}
                title={group.label}
              >
                {group.icon ? <group.icon size={20} /> : <span>{group.label}</span>}
                {group.subItems && group.subItems.length > 0 && <ChevronDown size={14} className={cn("transition-transform duration-300 opacity-50", openDropdown === group.label && "rotate-180")} />}
              </button>

              {group.subItems && group.subItems.length > 0 && openDropdown === group.label && (
                <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white text-black rounded-md shadow-2xl py-2 border border-slate-200 z-[60] animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
                  {group.subItems.map((item, iIdx) => (
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
                        "w-full text-left px-6 py-4 text-[16px] font-normal transition-all",
                        (activeTab === item.id || pathname === (item as any).url)
                          ? "text-[#5D5fb1] font-bold bg-slate-50"
                          : "text-black hover:text-[#5D5fb1] hover:bg-slate-50"
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

        <div className="flex items-center gap-4 shrink-0">
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
