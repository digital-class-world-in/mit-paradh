'use client';

import { 
  LayoutDashboard,
  LogOut,
  Users,
  Search,
  ChevronDown,
  Clock,
  Calendar,
  BookOpen,
  FileText,
  GraduationCap,
  Plus,
  TrendingUp,
  Trash2,
  PhoneCall,
  HelpCircle,
  AlertCircle,
  Send,
  IdCard,
  Award,
  CreditCard,
  UserPlus,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tab: number, sub?: number, tabName?: string, subName?: string) => void;
  onLogout: () => void;
  staffName: string;
  collegeLogo?: string;
  collegeName?: string;
  permissions?: Record<string, boolean>;
}

export default function StaffSidebar({ activeTab, setActiveTab, onLogout, staffName, collegeLogo, collegeName, permissions }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, id: 1 },
    { 
      label: 'Student information', 
      icon: GraduationCap, 
      id: 2,
      subItems: [
        { label: 'Admission list', icon: FileText, id: 2022 },
        { label: 'Student admission', icon: Users, id: 25 },
        { label: 'Student registration', icon: UserPlus, id: 19 },
        { label: 'Admission reports', icon: TrendingUp, id: 24 },
        { label: 'Leave request', icon: Clock, id: 23 },
      ]
    },
    { 
      label: 'Fees collection', 
      icon: CreditCard, 
      id: 70,
      subItems: [
        { label: 'Collect fees', icon: Plus, id: 71 },
      ]
    },
    { 
      label: 'Payment', 
      icon: Wallet, 
      id: 2000,
      subItems: [
        { label: 'Payment history', icon: Clock, id: 202 },
      ]
    },
    { 
      label: 'Academic Records', 
      icon: BookOpen, 
      id: 200,
      subItems: [
        { label: 'Student Attendance', icon: Clock, id: 210 }, 
        { label: 'Grade Management', icon: FileText, id: 220 }, 
      ]
    },
    { 
      label: 'Exam', 
      icon: FileText, 
      id: 60,
      subItems: [
        { label: 'Create exam', icon: Plus, id: 61 },
      ]
    },
    { 
      label: 'Certificate', 
      icon: Award, 
      id: 80,
      subItems: [
        { label: 'Transfer certificate', icon: Plus, id: 81 },
      ]
    },
    { label: 'My Schedule', icon: Calendar, id: 3 },
    { 
      label: 'Course management', 
      icon: BookOpen, 
      id: 4,
      subItems: [
        { label: 'Manage course', icon: FileText, id: 41 },
      ]
    },
    { label: 'Profile Settings', icon: Users, id: 5 },

    { 
      label: 'Front office', 
      icon: PhoneCall, 
      id: 90,
      subItems: [
        { label: 'Admission inquiry', icon: HelpCircle, id: 91 },
        { label: 'Concerns/complaint', icon: AlertCircle, id: 92 },
        { label: 'Postal services', icon: Send, id: 93 },
      ]
    },
    { label: 'Trash', icon: Trash2, id: 99 },
  ];

  const filteredItems = menuItems
    .filter(item => permissions ? permissions[item.id] !== false : true)
    .map(item => {
      if (!item.subItems) return item;
      return {
        ...item,
        subItems: item.subItems.filter(sub => permissions ? permissions[sub.id] !== false : true)
      };
    })
    .filter(item => {
      const itemMatch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
      const subMatch = item.subItems?.some(sub => 
        sub.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return itemMatch || subMatch;
    });

  return (
    <aside 
      className={cn(
        "h-screen fixed left-0 top-0 z-[60] bg-white transition-all duration-300 border-r border-slate-200 flex flex-col",
        collapsed ? "w-20" : "w-72"
      )}
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* Sidebar Header (Logo) */}
      <div className={cn("p-8 flex items-center border-b border-slate-200", collapsed ? "justify-center" : "justify-start gap-4")}>
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 hover:rotate-3 transition-transform cursor-pointer shrink-0 overflow-hidden">
           <img src={collegeLogo || "https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg"} alt="Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
             <p className="text-[14px] font-normal text-black tracking-tight leading-none capitalize italic">{collegeName || "Institutional"} Staff Portal</p>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div className="px-6 py-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
            <input 
              type="text" 
              placeholder="Search modules..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-transparent rounded-2xl py-3 pl-10 pr-4 text-[16px] font-medium tracking-tight outline-none focus:bg-white focus:border-slate-200 transition-all text-black placeholder:text-black"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto no-scrollbar scroll-smooth">
        {filteredItems.map((item) => {
          const isExpanded = expandedMenus.includes(item.label) || searchQuery.length > 0;
          const hasActiveChild = item.subItems?.some(sub => sub.id === activeTab);
          const isActive = activeTab === item.id || hasActiveChild;

          return (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => {
                  if (item.subItems && item.subItems.length > 0) {
                    toggleMenu(item.label);
                    setActiveTab(item.id, undefined, item.label);
                  } else {
                    setActiveTab(item.id, undefined, item.label);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-3.5 rounded-2xl font-medium transition-all group relative",
                  isActive 
                    ? "bg-[#002147] text-white shadow-lg" 
                    : "text-black hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <div className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-institutional-gold" : "text-black"
                )}>
                  <item.icon size={20} />
                </div>
                {!collapsed && (
                  <>
                    <span className="text-[16px] tracking-tight truncate flex-1 text-left leading-none">{item.label}</span>
                    {item.subItems && item.subItems.length > 0 && (
                      <ChevronDown 
                        size={14} 
                        className={cn("transition-transform duration-300 text-black", isExpanded && "rotate-180")} 
                      />
                    )}
                  </>
                )}
              </button>

              {/* Nested Sub-Modules */}
              {!collapsed && item.subItems && item.subItems.length > 0 && isExpanded && (
                <div className="ml-10 space-y-1 pt-1 border-l-2 border-slate-200 pl-2">
                  {item.subItems.map(sub => (
                      <button
                        onClick={() => setActiveTab(item.id, sub.id, item.label, sub.label)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-xl text-[16px] font-medium tracking-tight transition-all",
                          activeTab === sub.id 
                            ? "text-[#00a5a5]" 
                            : "text-slate-900 hover:text-slate-700 hover:bg-slate-50"
                        )}
                      >
                      <sub.icon size={14} className={cn("shrink-0", activeTab === sub.id ? "text-[#00a5a5]" : "text-black")} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 bg-slate-50/50">
        <button 
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-4 p-4 rounded-2xl font-medium bg-white border border-slate-200 text-black hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm active:scale-95 group",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="text-[16px] tracking-tight">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

