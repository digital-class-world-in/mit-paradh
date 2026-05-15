'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { studentAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';
import StudentNavbar from '@/components/StudentNavbar';

function StudentLayoutContent({
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
    document.title = "MIT PARADH | Student Portal";
    const unsubscribe = onAuthStateChanged(studentAuth, (user) => {
      if (user) {
        const userRef = ref(realtimeDb, 'users/' + user.uid);
        const unsubUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const firstName = data.profile?.firstName || data.firstName || 'Student';
            const middleName = data.profile?.middleName || '';
            const lastName = data.profile?.lastName || data.lastName || '';
            const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
            setUserData({ ...data, firstName: fullName, uid: user.uid });
          } else {
            setUserData({ firstName: 'Student', uid: user.uid });
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        router.push('/login/student');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleTabChange = (tabId: number, tabName?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId.toString());
    if (tabName) params.set('name', tabName.toLowerCase().replace(/\s+/g, '-'));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      await signOut(studentAuth);
      router.push('/');
    } catch (error) {
      console.error('Student logout error:', error);
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
           <div className="text-[#5D5fb1] font-black capitalize tracking-normal text-[13px]">
             Initializing Student Portal
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
      <StudentNavbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        studentName={userData?.firstName} 
        onLogout={handleLogout}
      />
      <main className="max-w-[1600px] mx-auto px-4 md:px-12 pb-20 pt-32 transition-all">
        {children}
      </main>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#5D5fb1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-black capitalize tracking-normal text-black animate-pulse">Loading Student Portal</p>
      </div>
    }>
      <StudentLayoutContent>
        {children}
      </StudentLayoutContent>
    </Suspense>
  );
}


