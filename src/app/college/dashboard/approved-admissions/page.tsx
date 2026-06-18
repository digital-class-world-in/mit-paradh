'use client';

import { useEffect, useState } from 'react';
import StudentAdmissionManager from '@/components/StudentAdmissionManager';
import { collegeAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function ApprovedAdmissionsPage() {
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
      <StudentAdmissionManager collegeId={collegeData?.uid || collegeAuth.currentUser?.uid} />
    </div>
  );
}
