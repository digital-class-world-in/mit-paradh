'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function LiveMarquee() {
  const [marqueeText, setMarqueeText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('cache_marqueeText');
    if (cached) {
      setMarqueeText(cached);
      setLoading(false);
    }

    const dataRef = ref(realtimeDb, 'settings/website/home/marqueeText');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (typeof val === 'string' && val) {
          setMarqueeText(val);
          try { localStorage.setItem('cache_marqueeText', val); } catch (e) {}
        } else {
          setMarqueeText('The new institution/ course/ unit approval process for the admission session 2026-27 is being made available online. | Final Timetable for April-2026 Exam (2 Year Category) is now published. | Student Registration Portal v4.0 is now live for all technical courses.');
        }
      } else {
        setMarqueeText('The new institution/ course/ unit approval process for the admission session 2026-27 is being made available online. | Final Timetable for April-2026 Exam (2 Year Category) is now published. | Student Registration Portal v4.0 is now live for all technical courses.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading && !marqueeText) {
    return <div className="h-4 w-full bg-slate-200 animate-pulse rounded ml-4 max-w-lg" />;
  }

  const Marquee = 'marquee' as any;

  return (
    <Marquee className="text-[13px] font-medium text-slate-600 ml-4">
      {marqueeText}
    </Marquee>
  );
}
