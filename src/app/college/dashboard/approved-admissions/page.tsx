'use client';

import { useEffect, useState } from 'react';
import StudentAdmissionManager from '@/components/StudentAdmissionManager';
import { collegeAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function ApprovedAdmissionsPage() {
  const [collegeData, setCollegeData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isBypass = sessionStorage.getItem('emergencyBypass') === 'true' || sessionStorage.getItem('isCollegeMaster') === 'true';
      if (isBypass) {
        const bypassedUid = sessionStorage.getItem('bypassedUid');
        setCollegeData({ name: 'MIT PARADH', uid: bypassedUid || 'college-demo', collegeId: 'MIT001' });
        return;
      }
    }

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
    <div className="animate-in fade-in duration-500">
      <StudentAdmissionManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />
    </div>
  );
}
