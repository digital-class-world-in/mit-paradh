'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, studentAuth, collegeAuth, staffAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check Master Admin (session-based)
    const isMaster = sessionStorage.getItem('isAdminMaster') === 'true';
    if (isMaster) {
      router.push('/admin/dashboard');
      return;
    }

    // Check Student Auth
    const unsubStudent = onAuthStateChanged(studentAuth, (user) => {
      if (user) {
        router.push('/student/dashboard');
        return;
      }
    });

    // Check Admin Auth
    const unsubAdmin = onAuthStateChanged(auth, async (user) => {
      if (user) router.push('/admin/dashboard');
    });

    // Check College Auth
    const unsubCollege = onAuthStateChanged(collegeAuth, (user) => {
      if (user) router.push('/college/dashboard');
    });

    // Check Staff Auth
    const unsubStaff = onAuthStateChanged(staffAuth, (user) => {
      if (user) router.push('/staff/dashboard');
    });

    // Fallback if neither is logged in after a short delay
    const timer = setTimeout(() => {
       if (!studentAuth.currentUser && !auth.currentUser && !collegeAuth.currentUser && !staffAuth.currentUser) {
         router.push('/');
       }
    }, 2000);

    return () => {
      unsubStudent();
      unsubAdmin();
      unsubCollege();
      unsubStaff();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-[#002147] font-black animate-pulse capitalize tracking-normal text-xs">
        Syncing Secure Portal Sessions...
      </div>
    </div>
  );
}

