'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export const Header = () => {
  const [helpline, setHelpline] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('cache_helpline');
    if (cached) {
      setHelpline(cached);
      setLoading(false);
    }

    const dataRef = ref(realtimeDb, 'settings/website/home/headerHelpline');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val()) {
        setHelpline(snapshot.val());
        localStorage.setItem('cache_helpline', snapshot.val());
      } else {
        setHelpline('1800-456-7890');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full">
      {/* Top Recognition and Invocation Bar */}
      <div className="w-full bg-[#001f3f] text-white pt-2 pb-1.5 px-4 md:px-10 border-b border-white/10 select-none">
        <div className="max-w-full mx-auto flex flex-col gap-0.5">
          {/* Line 1: Left | Center | Right */}
          <div className="flex flex-row justify-between items-center">
            <span className="text-amber-400 font-extrabold tracking-wide text-[12px] md:text-sm shrink-0">
              महाराष्ट्र शासन मान्यता प्राप्त
            </span>
            <span className="text-[#ff9933] font-black tracking-widest text-[12px] md:text-sm bg-white/5 px-3 py-0.5 rounded-full border border-white/5 animate-pulse">
              !! श्री बालाजी प्रसन्न !!
            </span>
            <span className="text-amber-400 font-extrabold tracking-wide text-[12px] md:text-sm shrink-0">
              केंद्र शासन मान्यता प्राप्त
            </span>
          </div>
          {/* Line 2: Institution name — center aligned */}
          <div className="text-center text-[12.5px] text-white/90 font-bold leading-snug">
            महाविष्णू ग्रामीण विकास व शैक्षणिक बहु उद्देशीय संस्था धामणगांव ( धाड ) द्वारा संचलित.
          </div>
        </div>
      </div>

      {/* Primary Header */}
      <header className="bg-white px-4 md:px-10 py-4 md:py-6 flex items-center justify-between border-b-4 border-[#003366]">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-md flex items-center justify-center shadow-inner border border-slate-200 overflow-hidden p-1 shrink-0">
            <img src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[9px] sm:text-[12px] md:text-3xl font-bold text-[#003366] tracking-tight leading-none md:leading-tight capitalize whitespace-nowrap md:whitespace-normal">
              MAHALAXMI NURSING AND TECHNICAL INSTITUTE PARADH
            </h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <Link href="/contact" className="flex items-center gap-6 group hover:opacity-80 transition-opacity cursor-pointer">
            <div className="text-right">
              <p className="text-[13px] font-bold text-black capitalize tracking-tight mb-1 group-hover:text-[#00a5a5] transition-colors">Helpline Number</p>
              <p className="text-lg font-bold text-[#003366] min-h-[28px] flex items-center justify-end">
                {loading && !helpline ? (
                  <span className="inline-block h-5 w-28 bg-slate-200 animate-pulse rounded" />
                ) : (
                  helpline
                )}
              </p>
            </div>
            <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-3xl border border-slate-200 group-hover:border-[#00a5a5] transition-colors">
              💠
            </div>
          </Link>
        </div>
      </header>
    </div>
  );
};


