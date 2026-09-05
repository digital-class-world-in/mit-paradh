'use client';

import { useEffect, useState } from 'react';
import StudentCredentialsManager from '@/components/StudentCredentialsManager';
import { getDefaultAdminUid } from '@/lib/adminUtils';
import { auth } from '@/lib/firebase';

export default function StudentCredentialsPage() {
  const [resolvedAdminUid, setResolvedAdminUid] = useState<string>('');

  useEffect(() => {
    async function resolve() {
      if (auth.currentUser?.uid) {
        setResolvedAdminUid(auth.currentUser.uid);
      } else {
        try {
          const defaultUid = await getDefaultAdminUid();
          setResolvedAdminUid(defaultUid);
        } catch (e) {
          console.error("Failed to resolve default admin UID:", e);
        }
      }
    }
    resolve();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <StudentCredentialsManager collegeId={undefined} adminUid={resolvedAdminUid} />
    </div>
  );
}
