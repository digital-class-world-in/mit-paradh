'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import StaffHeader from '@/components/StaffHeader';
import { staffAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';

export default function PendingAdmissionsPage() {
  const [staffData, setStaffData] = useState<any>(null);
  const [collegeData, setCollegeData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(staffAuth, async (user) => {
      if (user) {
        const staffRef = ref(realtimeDb, 'staff/' + user.uid);
        onValue(staffRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setStaffData({ ...data, id: user.uid });
            if (data.collegeId) {
              const colSnap = await get(ref(realtimeDb, 'colleges/' + data.collegeId));
              if (colSnap.exists()) {
                setCollegeData(colSnap.val());
              }
            }
          } else {
            const userRef = ref(realtimeDb, 'users/' + user.uid);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
              const data = userSnap.val();
              setStaffData({ ...data, id: user.uid });
              if (data.collegeId) {
                const colSnap = await get(ref(realtimeDb, 'colleges/' + data.collegeId));
                if (colSnap.exists()) {
                  setCollegeData(colSnap.val());
                }
              }
            }
          }
        });
      } else {
        const isMaster = typeof window !== 'undefined' && sessionStorage.getItem('isStaffMaster') === 'true';
        if (!isMaster) {
          router.push('/login/staff');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleTabChange = (tab: number, sub?: number, tabName?: string, subName?: string) => {
    const params = new URLSearchParams();
    params.set('tab', tab.toString());
    if (tabName) params.set('name', tabName.toLowerCase().replace(/\s+/g, '-'));
    if (sub) {
      params.set('sub', sub.toString());
      if (subName) params.set('subName', subName.toLowerCase().replace(/\s+/g, '-'));
    }
    router.push(`/staff/dashboard?${params.toString()}`);
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isStaffMaster');
      }
      await signOut(staffAuth);
      router.push('/login/staff');
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StaffHeader
        activeTab={2}
        setActiveTab={handleTabChange}
        onLogout={handleLogout}
        staffName={staffData?.firstName || 'Staff'}
        collegeLogo={collegeData?.logo || collegeData?.headPhoto}
        collegeName={collegeData?.name}
        permissions={staffData?.permissions}
      />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <main className="p-3 sm:p-6 md:p-8 lg:p-10 pt-20 sm:pt-24 md:pt-28 flex-1 max-w-[1600px] w-full mx-auto">
          <AdmissionInquiryManager collegeId={staffData?.collegeId} collegeName={staffData?.collegeName} mode="pending" />
        </main>
      </div>
    </div>
  );
}
