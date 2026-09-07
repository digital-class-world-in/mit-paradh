'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, LayoutDashboard, ChevronDown, User, ShieldCheck, Building2, GraduationCap, LogIn } from 'lucide-react';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        const isAdmin = localStorage.getItem('isAdmin');
        setIsLoggedIn(isAdmin === 'true');
      }
    });

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('isAdmin');
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#002147]/90 backdrop-blur-md border-b border-white/5 z-[100] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Institutional Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform overflow-hidden">
            <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
             <p className="text-[14px] font-black text-white/40 tracking-tight leading-none mb-1">National skills</p>
             <p className="text-[17px] font-black text-white tracking-tighter">Sector councils</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-8">
          {!isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-institutional-gold text-[#002147] px-8 py-3 rounded-xl text-[17px] font-black tracking-tight hover:bg-white transition-all shadow-lg shadow-yellow-900/20 active:scale-95 flex items-center gap-2"
              >
                Login <ChevronDown size={14} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Enhanced Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-300 z-[110]">
                   {[
                     { label: 'Student Login', href: '/login/student', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50' },
                     { label: 'College Login', href: '/login/college', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                     { label: 'Staff Login', href: '/login/staff', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                     { label: 'Admin Login', href: '/login/admin', icon: ShieldCheck, color: 'text-slate-700', bg: 'bg-slate-100' },
                   ].map((item, idx) => (
                     <Link 
                       key={idx}
                       href={item.href}
                       onClick={() => setShowDropdown(false)}
                       className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group"
                     >
                        <div className={`p-2 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                           <item.icon size={18} />
                        </div>
                        <span className="text-[15px] font-black text-black tracking-tight">{item.label}</span>
                     </Link>
                   ))}
                   <div className="border-t border-slate-100 mt-1 pt-1 px-3">
                     <Link
                       href="/login"
                       onClick={() => setShowDropdown(false)}
                       className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors text-center"
                     >
                       <LogIn size={14} /> All Login Portals
                     </Link>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-[17px] font-black text-black hover:text-black tracking-tight transition-colors bg-white/5 px-5 py-3 rounded-xl border border-white/10">
                <LayoutDashboard size={14} className="text-institutional-gold" /> Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-black px-8 py-3 rounded-xl text-[17px] font-black tracking-tight shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all flex items-center gap-2 active:scale-95"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


