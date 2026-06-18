'use client';

import { useEffect, useState } from 'react';
import AdmissionInquiryManager from '@/components/AdmissionInquiryManager';
import { getDefaultAdminUid } from '@/lib/adminUtils';
import { auth } from '@/lib/firebase';

export default function ConfirmAdmissionsPage() {
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
      <AdmissionInquiryManager collegeId={undefined} mode="list" adminUid={resolvedAdminUid} />
    </div>
  );
}
