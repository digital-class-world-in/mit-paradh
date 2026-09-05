'use client';

import {
  BarChart3,
  Building2,
  BookOpen,
  UserPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Globe,
  Search,
  ChevronDown,
  Home,
  Info,
  Building,
  Newspaper,
  MessageSquare,
  Mail,
  Shield,
  Layers,
  Briefcase,
  Users,
  CreditCard,
  UserCheck,
  FileBadge,
  Bell,
  Award,
  MailQuestion,
  IdCard,
  ExternalLink,
  Clock,
  Settings,
  Trash2,
  PhoneCall,
  HelpCircle,
  AlertCircle,
  Send,
  FileText,
  KeyRound
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  onLogout: () => void;
  adminName: string;
}

export default function AdminSidebar({ activeTab, setActiveTab, onLogout, adminName }: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Website Manager']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, id: 1 },
    {
      label: 'Website manager',
      icon: Globe,
      id: 15,
      subItems: [
        { label: 'Home Page', icon: Home, id: 101 },
        { label: 'About Page', icon: Info, id: 102 },
        { label: 'Course Setup', icon: BookOpen, id: 107 },
        { label: 'Inquiry', icon: MessageSquare, id: 104 },
        { label: 'Contact Us', icon: Mail, id: 105 },
        { label: 'Footer Setup', icon: Layers, id: 106 }
      ]
    },
    {
      label: 'Student information',
      icon: Users,
      id: 2,
      subItems: [
        { label: 'Admission list', icon: FileBadge, id: 3022 },
        { label: 'Student admission', icon: Users, id: 25 },
        { label: 'Student registration', icon: UserPlus, id: 19 },
        { label: 'Student credentials', icon: KeyRound, id: 27, url: '/admin/dashboard/student-credentials' },
        { label: 'Leave request', icon: FileText, id: 23 },
      ]
    },
    {
      label: 'Fees collection',
      icon: CreditCard,
      id: 70,
      subItems: [
        { label: 'Student fees', icon: CreditCard, id: 71 },
        { label: 'Fees management', icon: Settings, id: 72 },
      ]
    },
    {
      label: 'College information',
      icon: Building2,
      id: 60,
      subItems: [
        { label: 'College list', icon: Building, id: 61 },
        { label: 'Courses & intake', icon: BookOpen, id: 62 },
        { label: 'Staff directory', icon: UserCheck, id: 63 },
      ]
    },
    {
      label: 'Human Resource',
      icon: Briefcase,
      id: 3,
      subItems: [
        { label: 'Staff directory', icon: UserCheck, id: 31 },
        { label: 'Staff id card', icon: IdCard, id: 34 },
        { label: 'Leave card', icon: Clock, id: 33 },
        { label: 'Payroll', icon: CreditCard, id: 35 },
        { label: 'Staff login', icon: ExternalLink, id: 36, isExternal: true },
      ]
    },
    {
      label: 'Course management',
      icon: BookOpen,
      id: 4,
      subItems: [
        { label: 'Manage course', icon: BookOpen, id: 41 },
        { label: 'Syllabus management', icon: BookOpen, id: 42 },
        { label: 'Department setup', icon: BookOpen, id: 43 },
      ]
    },
    {
      label: 'Settings',
      icon: Settings,
      id: 50,
      subItems: [
        { label: 'General settings', icon: Info, id: 51 },
        { label: 'Security', icon: Shield, id: 52 },
      ]
    },
    {
      label: 'Notice Board',
      icon: Bell,
      id: 20,
    },
    {
      label: 'Front office',
      icon: PhoneCall,
      id: 90,
      subItems: [
        { label: 'Admission inquiry', icon: HelpCircle, id: 91 },
        { label: 'Concerns/complaint', icon: AlertCircle, id: 92 },
        { label: 'Postal services', icon: Send, id: 93 },
        { label: 'Contact Us', icon: Mail, id: 94 },
      ]
    },
    {
      label: 'Certificate',
      icon: Award,
      id: 80,
      subItems: [
        { label: 'Marksheet', icon: FileText, id: 81 },
        { label: 'Course Certificate', icon: Award, id: 82 },
      ]
    },
    {
      label: 'Exam Module',
      icon: FileText,
      id: 120,
      subItems: [
        { label: 'Create exam', icon: FileText, id: 120 },
        { label: 'Exam form', icon: FileText, id: 122 },
        { label: 'Exam fees', icon: CreditCard, id: 123 },
      ]
    },
    { label: 'Trash', icon: Trash2, id: 99 },
  ];

  const filteredItems = menuItems.filter(item => {
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
    >
      {/* Sidebar Header (Logo) */}
      <div className={cn("p-8 flex items-center border-b border-slate-200", collapsed ? "justify-center" : "justify-start gap-4")}>
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 hover:rotate-3 transition-transform cursor-pointer shrink-0 overflow-hidden">
          <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <p className="text-[14px] font-normal text-black tracking-tight leading-none">Mit Paradh</p>
          </div>
        )}
      </div>

      {/* Search Bar - Standard Case */}
      {!collapsed && (
        <div className="px-6 py-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-transparent rounded-2xl py-3 pl-10 pr-4 text-[16px] font-medium tracking-tight outline-none focus:bg-white focus:border-slate-200 transition-all text-black placeholder:text-black"
            />
          </div>
        </div>
      )}

      {/* Navigation - Standard Case */}
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
                  } else {
                    setActiveTab(item.id);
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
                    <span className="text-[16px]  tracking-tight truncate flex-1 text-left leading-none">{item.label}</span>
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
                      key={sub.id}
                      onClick={() => {
                        if ((sub as any).isExternal) {
                          const route = sub.label.toLowerCase().includes('staff') ? '/login/staff' : '/login/student';
                          window.open(route, '_blank');
                        } else if ((sub as any).url) {
                          router.push((sub as any).url);
                        } else {
                          setActiveTab(sub.id);
                        }
                      }}
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

      {/* Footer / Context */}
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

        {!collapsed && (
          <p className="mt-4 text-center text-[14px] font-medium text-slate-300 tracking-tight leading-relaxed">
            Institutional erp phase iv
          </p>
        )}
      </div>
    </aside>
  );
}

