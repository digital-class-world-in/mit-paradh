'use client';

import { useEffect, useState } from 'react';
import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import { collegeAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function PendingAdmissionsPage() {
  const [collegeData, setCollegeData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(collegeAuth, async (user) => {
      if (user) {
        const collegeRef = ref(realtimeDb, 'colleges/' + user.uid);
        const snapshot = await get(collegeRef);
        if (snapshot.exists()) {
          setCollegeData(snapshot.val());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 p-10 pt-32 min-h-screen">
      <AdmissionInquiryManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} collegeName={collegeData?.name} mode="pending" />
    </div>
  );
}
