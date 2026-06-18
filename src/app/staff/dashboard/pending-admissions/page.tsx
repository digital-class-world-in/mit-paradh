'use client';

import { useEffect, useState } from 'react';
import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import { staffAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';

export default function PendingAdmissionsPage() {
  const [staffData, setStaffData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(staffAuth, async (user) => {
      if (user) {
        const staffRef = ref(realtimeDb, 'staff/' + user.uid);
        onValue(staffRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setStaffData({ ...data, id: user.uid });
          } else {
            const userRef = ref(realtimeDb, 'users/' + user.uid);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
               setStaffData({ ...userSnap.val(), id: user.uid });
            }
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 p-10 pt-32 min-h-screen">
      <AdmissionInquiryManager collegeId={staffData?.collegeId} collegeName={staffData?.collegeName} mode="pending" />
    </div>
  );
}
