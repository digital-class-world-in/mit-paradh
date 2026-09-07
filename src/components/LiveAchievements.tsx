'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LiveAchievements() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_achievements');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAchievements(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/home/achievements');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const publishedAchievements = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        setAchievements(publishedAchievements);
        try { localStorage.setItem('cache_achievements', JSON.stringify(publishedAchievements)); } catch (e) {}
      } else {
        setAchievements([]);
        try { localStorage.removeItem('cache_achievements'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading && achievements.length === 0) {
    return null;
  }

  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-t border-slate-200 py-6 sm:py-8">
      <div className="px-4 sm:px-6 lg:px-12">
        <h2 className="text-[#003366] text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-6 tracking-tight capitalize italic">
          Our Achievements
        </h2>

        <div className="relative group">
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 lg:-translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex items-center justify-center transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {achievements.map((ach, i) => (
              <div key={i} className="w-[75vw] max-w-[260px] sm:w-[240px] md:w-[260px] snap-center bg-white rounded-xl p-5 sm:p-7 text-center border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4 sm:mb-6">
                  <Trophy size={26} className="sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mb-1.5 sm:mb-2">{ach.metric}</h3>
                <p className="text-xs sm:text-sm font-bold text-[#003366] capitalize tracking-tight mb-1.5 sm:mb-2 line-clamp-2">{ach.title}</p>
                {ach.description && <p className="text-[11px] sm:text-xs font-semibold text-slate-500 line-clamp-2">{ach.description}</p>}
              </div>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 lg:translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex items-center justify-center transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
