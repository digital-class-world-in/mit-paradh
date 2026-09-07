'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { User } from 'lucide-react';

export default function LiveMinisters() {
  function getDefaultMinisters() {
    return [
      { name: 'Shri. Devendra Fadnavis', title: "Hon' Chief Minister", image: '' },
      { name: 'Shri. Eknath Shinde', title: "Hon' Deputy Chief Minister", image: '' },
      { name: 'Smt. Sunetra Ajit Pawar', title: "Hon' Deputy Chief Minister", image: '' },
      { name: 'Shri. Mangal Prabhat Lodha', title: "Hon' Minister", image: '' },
    ];
  }

  const [ministers, setMinisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_ministers');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMinisters(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/home/ministers');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const publishedMinisters = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        setMinisters(publishedMinisters);
        try { localStorage.setItem('cache_ministers', JSON.stringify(publishedMinisters)); } catch (e) {}
      } else {
        setMinisters(getDefaultMinisters());
        try { localStorage.removeItem('cache_ministers'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);



  if (loading && ministers.length === 0) {
    return (
      <div className="bg-white border-b border-slate-200 py-3 sm:py-5 px-3 sm:px-6 lg:px-12 overflow-hidden">
        <div className="flex flex-nowrap items-start justify-between sm:justify-evenly gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto overflow-x-auto no-scrollbar py-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-center flex flex-col items-center shrink-0 w-[64px] sm:w-[110px] md:w-[140px] lg:w-[150px] animate-pulse">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-slate-100 rounded-full mb-1.5 sm:mb-2 md:mb-3 shrink-0" />
              <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-slate-200/60 rounded mb-1" />
              <div className="h-2 sm:h-2.5 w-10 sm:w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 py-3 sm:py-5 px-2 sm:px-6 lg:px-12 overflow-hidden">
      <div className="flex flex-nowrap items-start justify-between sm:justify-evenly gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto overflow-x-auto no-scrollbar py-1">
        {ministers.map((m: any, i: number) => (
          <div key={i} className="text-center group flex flex-col items-center shrink-0 w-[64px] sm:w-[110px] md:w-[140px] lg:w-[150px]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-slate-100 rounded-full mb-1.5 sm:mb-2 md:mb-3 flex items-center justify-center overflow-hidden border-2 border-slate-200 group-hover:border-amber-400 transition-colors shadow-sm shrink-0">
              {m.image ? (
                <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-300 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              )}
            </div>
            <p className="text-[9.5px] sm:text-[11px] md:text-xs font-bold text-[#003366] leading-tight capitalize line-clamp-2">{m.name}</p>
            <p className="text-[8.5px] sm:text-[10px] md:text-[12px] text-black font-bold mt-0.5 capitalize line-clamp-2">{m.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
