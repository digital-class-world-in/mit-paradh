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
      <div className="bg-white border-b border-slate-200 py-5 px-6 lg:px-12">
        <div className="flex flex-wrap justify-evenly gap-4 md:gap-6 lg:gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center flex flex-col items-center w-[130px] animate-pulse">
              <div className="w-20 h-20 bg-slate-100 rounded-full mb-3 shrink-0" />
              <div className="h-3 w-16 bg-slate-200/60 rounded mb-1" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 py-5 px-6 lg:px-12">
      <div className="flex flex-wrap justify-evenly gap-4 md:gap-6 lg:gap-8">
        {ministers.map((m: any, i: number) => (
          <div key={i} className="text-center group flex flex-col items-center w-[130px]">
            <div className="w-20 h-20 bg-slate-100 rounded-full mb-3 flex items-center justify-center overflow-hidden border-2 border-slate-200 group-hover:border-amber-400 transition-colors shadow-sm shrink-0">
              {m.image ? (
                <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-slate-300" />
              )}
            </div>
            <p className="text-xs font-bold text-[#003366] leading-tight capitalize">{m.name}</p>
            <p className="text-[13px] text-black font-bold mt-0.5 capitalize">{m.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
