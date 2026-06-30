import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Calendar, Bell, ExternalLink } from 'lucide-react';

export default function StudentNoticeBoard({ collegeId, userId }: { collegeId?: string, userId?: string }) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const globalRef = ref(realtimeDb, 'notices');
    const collegeRef = collegeId ? ref(realtimeDb, `colleges/${collegeId}/notices`) : null;
    const userNoticesRef = userId ? ref(realtimeDb, `users/${userId}/notifications`) : null;
    
    let globalNotices: any[] = [];
    let collegeNotices: any[] = [];
    let userNotices: any[] = [];

    const updateCombined = () => {
      const combined = [...globalNotices, ...collegeNotices, ...userNotices].sort((a: any, b: any) => (b.date || 0) - (a.date || 0));
      setNotices(combined);
      setLoading(false);
    };

    const unsubscribeGlobal = onValue(globalRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        globalNotices = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
      } else {
        globalNotices = [];
      }
      updateCombined();
    });

    let unsubscribeCollege: any = null;
    if (collegeRef) {
      unsubscribeCollege = onValue(collegeRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          collegeNotices = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        } else {
          collegeNotices = [];
        }
        updateCombined();
      });
    }

    let unsubscribeUser: any = null;
    if (userNoticesRef) {
      unsubscribeUser = onValue(userNoticesRef, (userSnap) => {
        if (userSnap.exists()) {
          const uData = userSnap.val();
          userNotices = Object.entries(uData).map(([id, val]: any) => ({ id, ...val }));
        } else {
          userNotices = [];
        }
        updateCombined();
      });
    }

    return () => {
      unsubscribeGlobal();
      if (unsubscribeCollege) unsubscribeCollege();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [collegeId, userId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading notices...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-[#003366] px-6 py-4 flex items-center gap-3">
        <Bell className="text-orange-400" size={20} />
        <h3 className="text-lg font-bold text-white tracking-tight">Notice Board</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {notices.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <p>No new notices at the moment.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="p-6 hover:bg-slate-50 transition-colors group">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h4 className="text-[15px] font-bold text-slate-800">{notice.title || 'Untitled Notice'}</h4>
                <span className="shrink-0 text-[11px] font-medium text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                  <Calendar size={12} />
                  {new Date(notice.date || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
                {notice.description}
              </p>
              {notice.link && (
                <a href={notice.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-800">
                  <ExternalLink size={14} /> View Attachment
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
