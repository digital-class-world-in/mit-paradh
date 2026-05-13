'use client';

import { 
  LayoutDashboard,
  LogOut,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  Search,
  ChevronDown,
  CreditCard,
  IdCard,
  FileText,
  Wallet,
  LogIn,
  Trash2,
  PhoneCall,
  TrendingUp,
  Award
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tab: number, sub?: number, tabName?: string, subName?: string) => void;
  onLogout: () => void;
  collegeName: string;
  collegeLogo?: string;
  permissions?: Record<string, boolean>;
}

export default function CollegeSidebar({ activeTab, setActiveTab, onLogout, collegeName, collegeLogo, permissions }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

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
        { label: 'Admission list', id: 1022 },
        { label: 'Student admission', id: 25 },
        { label: 'Student registration', id: 19 },
        { label: 'Leave request', id: 23 },
      ]
    },
    { 
      label: 'Fees collection', 
      icon: CreditCard, 
      id: 70,
      subItems: [
        { label: 'Collect fees', id: 71 },
        { label: 'Fees management', id: 72 },
      ]
    },
    { 
      label: 'Payment', 
      icon: Wallet, 
      id: 2000,
      subItems: [
        { label: 'Payment history', id: 202 },
        { label: 'Payment settings', id: 51 },
      ]
    },
    { 
      label: 'Exam', 
      icon: FileText, 
      id: 60,
      subItems: [
        { label: 'Create exam', id: 61 },
        { label: 'Exam form', id: 62 },
      ]
    },
    { 
      label: 'Certificate', 
      icon: Award, 
      id: 80,
      subItems: [
        { label: 'Transfer certificate', id: 81 },
      ]
    },
    { 
      label: 'Human Resource', 
      icon: Users, 
      id: 3,
      subItems: [
        { label: 'Staff directory', id: 31 },
        { label: 'Staff id card', id: 34 },
        { label: 'Leave card', id: 33 },
        { label: 'Payroll', id: 35 },
        { label: 'Staff login', icon: LogIn, id: 36, isExternal: true },
      ]
    },
    { 
      label: 'Course management', 
      icon: BookOpen, 
      id: 4,
      subItems: [
        { label: 'Manage course', id: 41 },
        { label: 'Syllabus management', id: 42 },
        { label: 'Department setup', id: 43 },
      ]
    },
    { 
      label: 'System settings', 
      icon: Settings, 
      id: 5,
      subItems: [
        { label: 'Institution profile', id: 51 },
        { label: 'User management', id: 52 },
        { label: 'Security settings', id: 53 },
      ]
    },
    { 
      label: 'Front office', 
      icon: PhoneCall, 
      id: 90,
      subItems: [
        { label: 'Admission inquiry', id: 91 },
        { label: 'Concerns/complaint', id: 92 },
        { label: 'Postal services', id: 93 },
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
      className="w-72 bg-white h-screen fixed left-0 top-0 z-[60] flex flex-col border-r border-slate-200 shadow-xl"
      style={{ fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* College Identity Header */}
      <div className="p-8 border-b border-slate-200 bg-slate-50/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00a5a5] rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg border border-teal-600/10 shrink-0 transform hover:rotate-6 transition-transform overflow-hidden p-0.5">
            {collegeLogo ? (
              <img src={collegeLogo} alt="Logo" className="w-full h-full object-contain rounded-xl bg-white" />
            ) : (
              collegeName?.charAt(0) || 'C'
            )}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-black font-black text-sm tracking-tight truncate leading-tight">{collegeName || 'Institutional Portal'}</h4>
            <span className="text-[9px] font-black text-black tracking-tight opacity-90">College Account</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:text-[#00a5a5] transition-colors" />
          <input 
            type="text" 
            placeholder="Search modules..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:bg-white focus:border-teal-200 focus:ring-4 focus:ring-teal-50 transition-all text-black placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-6 px-4">
        <ul className="space-y-1.5">
          {filteredItems.map((item) => {
            const isExpanded = expandedMenus.includes(item.label) || searchQuery.length > 0;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = activeTab === item.id || (item.subItems?.some(sub => sub.id === activeTab));
            
            return (
              <li key={item.label}>
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.label);
                      setActiveTab(item.id, undefined, item.label);
                    } else {
                      setActiveTab(item.id, undefined, item.label);
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-[16px] font-medium transition-all group
                    ${isActive 
                      ? "bg-[#002147] text-white shadow-lg" 
                      : "text-black hover:bg-slate-50 hover:text-slate-800"
                    }
                  `}
                >
                  <item.icon size={20} className={isActive ? "text-institutional-gold" : "text-black opacity-80 group-hover:opacity-100 transition-opacity"} />
                  <span className="truncate">{item.label}</span>
                  {hasSubItems && (
                    <ChevronDown 
                      size={16} 
                      className={`ml-auto transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                  {!hasSubItems && isActive && <div className="ml-auto w-1.5 h-1.5 bg-[#00a5a5] rounded-full" />}
                </button>

                {/* Sub-modules */}
                {hasSubItems && isExpanded && (
                  <ul className="mt-1.5 ml-10 space-y-1 border-l-2 border-slate-200 pl-4 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems!.filter(sub => 
                      sub.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      item.label.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((sub) => (
                      <li key={sub.id}>
                        <button
                          onClick={() => {
                            if ((sub as any).isExternal) {
                              const route = sub.label.toLowerCase().includes('staff') ? '/login/staff' : '/login/student';
                              window.open(route, '_blank');
                            } else {
                              setActiveTab(item.id, sub.id, item.label, sub.label);
                            }
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg text-[16px] font-medium transition-all
                            ${activeTab === sub.id 
                              ? "text-[#00a5a5]" 
                              : "text-slate-900 hover:text-slate-700 hover:bg-slate-50"
                            }
                          `}
                        >
                          {sub.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Footer */}
      <div className="p-6 border-t border-slate-200 bg-slate-50/20">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-4 rounded-2xl font-black bg-slate-50 border border-slate-200 text-black hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm active:scale-95 group"
        >
          <LogOut size={22} className="shrink-0 transition-transform group-hover:-translate-x-1" />
          <span className="text-[16px]">Logout portal</span>
        </button>
      </div>
    </aside>
  );
}

