'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { collegeAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import CollegeSidebar from '@/components/CollegeSidebar';
import CollegeHeader from '@/components/CollegeHeader';

function CollegeLayoutContent({
  children,
}: {
  children: React.ReactNode;

}) {
  const [collegeData, setCollegeData] = useState<any>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = parseInt(searchParams.get('sub') || searchParams.get('tab') || '1');

  useEffect(() => {
    document.title = "MIT PARADh | College Pannel";
    let isMounted = true;

    const checkEmergencySession = () => {
      if (typeof window !== 'undefined') {
        const isBypass = sessionStorage.getItem('emergencyBypass') === 'true' || sessionStorage.getItem('isCollegeMaster') === 'true';
        if (isBypass) {
          const bypassedUid = sessionStorage.getItem('bypassedUid');
          setCollegeData({
            name: 'MIT PARADH',
            role: 'college',
            uid: bypassedUid || 'college-demo',
            collegeId: 'MIT001'
          });
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    if (checkEmergencySession()) {
      return;
    }

    if (!collegeAuth || typeof collegeAuth.onAuthStateChanged !== 'function') {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(collegeAuth, async (user) => {
      if (!isMounted) return;

      if (user) {
        try {
          const collegeRef = ref(realtimeDb, 'colleges/' + user.uid);
          const snapshot = await get(collegeRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.role === 'college') {
              setCollegeData(data);
            } else {
              console.error("Unauthorized: Not a college account");
              if (pathname !== '/college/login' && pathname !== '/login/college') {
                router.push('/login/college');
              }
            }

            
          } else {
            const userRef = ref(realtimeDb, 'users/' + user.uid);
            const userSnap = await get(userRef);
            if (userSnap.exists() && userSnap.val().role === 'college') {
              setCollegeData({ name: userSnap.val().name, role: 'college' });
            } else {
              if (pathname !== '/college/login' && pathname !== '/login/college') {
                router.push('/login/college');
              }
            }
          }
        } catch (err) {
          console.error("Auth error in College Layout:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (!checkEmergencySession()) {
          if (pathname !== '/college/login' && pathname !== '/login/college') {
            router.push('/login/college');
          } else {
            if (isMounted) setLoading(false);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, pathname]);

  // Separate effect for permissions to allow real-time updates without re-fetching everything
  useEffect(() => {
    if (!collegeAuth?.currentUser) return;
    import('firebase/database').then(({ onValue }) => {
      const permRef = ref(realtimeDb, `colleges/${collegeAuth.currentUser!.uid}/permissions`);
      const unsub = onValue(permRef, (snap) => {
        if (snap.exists()) {
          setPermissions(snap.val());
        } else {
          setPermissions({});
        }
      });
      return () => unsub();
    });
  }, [collegeData]); // Depend on collegeData so it runs after auth is established

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (pathname === '/college/dashboard') {
        const currentTab = searchParams.get('sub') || searchParams.get('tab');
        if (currentTab) {
          localStorage.setItem('college_active_tab', currentTab);
        } else {
          const savedTab = localStorage.getItem('college_active_tab');
          if (savedTab && savedTab !== '1') {
            router.replace(`/college/dashboard?tab=${savedTab}`);
          }
        }
      }
    }
  }, [pathname, searchParams, router]);

  const handleTabChange = (tabId: number, subId?: number, tabName?: string, subName?: string) => {
    const params = new URLSearchParams();
    params.set('tab', tabId.toString());
    if (tabName) params.set('name', tabName.toLowerCase().replace(/\s+/g, '-'));

    if (subId) {
      params.set('sub', subId.toString());
      if (subName) params.set('subName', subName.toLowerCase().replace(/\s+/g, '-'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('college_active_tab', subId.toString());
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('college_active_tab', tabId.toString());
      }
    }
    router.push(`/college/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('emergencyBypass');
        sessionStorage.removeItem('isCollegeMaster');
        sessionStorage.removeItem('bypassedUid');
        localStorage.removeItem('college_active_tab');
      }
      await signOut(collegeAuth);
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
          <div className="w-20 h-20 border-4 border-t-[#00a5a5] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="text-black font-black capitalize tracking-normal text-[13px]">
            Verifying Institutional Access
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
    <div className="min-h-screen bg-[#f8fafc] college-panel">
      <CollegeHeader
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onLogout={handleLogout}
        collegeName={collegeData?.name}
        collegeLogo={collegeData?.logo || collegeData?.headPhoto}
        permissions={permissions}
      />
      <main className="max-w-[1600px] mx-auto min-h-screen px-3 sm:px-6 md:px-8 lg:px-10 py-5 sm:py-8 pt-20 sm:pt-24 md:pt-28 transition-all w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default function CollegeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#00a5a5] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-black capitalize tracking-normal text-black animate-pulse">Loading Portal</p>
      </div>
    }>
      <CollegeLayoutContent>
        {children}
      </CollegeLayoutContent>
    </Suspense>
  );
}
