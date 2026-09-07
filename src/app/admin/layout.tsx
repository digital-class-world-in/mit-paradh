'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = parseInt(searchParams.get('tab') || '1');

  useEffect(() => {
    document.title = "MIT PARADH | admin pannel";
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setLoading(false);
      return;
    }

    let isMounted = true;
    try {
      // Immediate check for existing session
      const isMaster = typeof window !== 'undefined' && sessionStorage.getItem('isAdminMaster') === 'true';
      if (isMaster) {
        setUserData({ role: 'admin', firstName: 'MIT PARADH', email: 'mitparadh@gmail.com' });
        setLoading(false);
      } else if (auth.currentUser) {
        setUserData({ role: 'admin', uid: auth.currentUser.uid });
        setLoading(false);
      }

      const timeout = setTimeout(() => {
        if (loading) {
          const checkMaster = typeof window !== 'undefined' && sessionStorage.getItem('isAdminMaster') === 'true';
          if (!checkMaster && !auth.currentUser) {
            console.warn("Admin Layout: Auth handshake taking longer than expected, forcing redirect...");
            router.push('/login/admin');
          } else if (checkMaster) {
            setUserData({ role: 'admin', firstName: 'MIT PARADH', email: 'mitparadh@gmail.com' });
            setLoading(false);
          }
        }
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!isMounted) return;
        clearTimeout(timeout);
        const checkMaster = typeof window !== 'undefined' && sessionStorage.getItem('isAdminMaster') === 'true';

        if (checkMaster) {
          setUserData({ role: 'admin', firstName: 'MIT PARADH', email: 'mitparadh@gmail.com' });
          setLoading(false);
          return;
        }

        if (user) {
          setUserData({ role: 'admin', uid: user.uid });
          setLoading(false);
        } else {
          // Only redirect if we've given it enough time and still no user
          const finalTimeout = setTimeout(() => {
            if (!auth.currentUser && !sessionStorage.getItem('isAdminMaster')) {
              router.push('/login/admin');
            }
          }, 1000);
          return () => clearTimeout(finalTimeout);
        }
      });
      return () => {
        isMounted = false;
        unsubscribe();
        clearTimeout(timeout);
      };
    } catch (err) {
      console.error("Auth listener error in Layout:", err);
      if (isMounted) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentTab = searchParams.get('tab');
      if (currentTab) {
        localStorage.setItem('admin_active_tab', currentTab);
      } else {
        const savedTab = localStorage.getItem('admin_active_tab');
        if (savedTab && savedTab !== '1') {
          router.replace(`${pathname}?tab=${savedTab}`);
        }
      }
    }
  }, [pathname, searchParams, router]);

  const handleTabChange = (tabId: number, subId?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const finalTab = subId || tabId;
    params.set('tab', finalTab.toString());
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_tab', finalTab.toString());
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isAdminMaster');
      }
      if (auth.currentUser) {
        await signOut(auth);
      }
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#5D5fb1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-black font-black capitalize tracking-normal text-[13px]">
            Verifying Admin Access
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminHeader activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} adminName="MIT PARADH" />
      <main className="max-w-[1600px] mx-auto min-h-screen px-3 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-8 pt-20 sm:pt-24 md:pt-28 transition-all">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </Suspense>
  );
}



