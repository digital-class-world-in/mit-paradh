'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Star, Quote, User } from 'lucide-react';

export default function LiveTestimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_testimonials');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTestimonials(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/home/testimonials');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const publishedTestimonials = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        setTestimonials(publishedTestimonials);
        try { localStorage.setItem('cache_testimonials', JSON.stringify(publishedTestimonials)); } catch (e) {}
      } else {
        setTestimonials([]);
        try { localStorage.removeItem('cache_testimonials'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading && (!testimonials || testimonials.length === 0)) {
    return null;
  }

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  // Duplicate the list to ensure a seamless infinite marquee scroll
  const listToRender = [...testimonials, ...testimonials];

  return (
    <div className="bg-white border-t border-slate-200 py-10 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mb-6 sm:mb-10">
        <h2 className="text-[#003366] text-lg sm:text-xl md:text-2xl font-black tracking-tight capitalize italic">
          Testimonials
        </h2>
      </div>

      <div className="relative w-full">
        {/* Style tag for CSS-based infinite marquee */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marqueeTestimonials {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .testimonials-track {
            display: flex;
            gap: 1.25rem;
            width: max-content;
            animation: marqueeTestimonials 35s linear infinite;
          }
          .testimonials-track:hover {
            animation-play-state: paused;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />

        {/* Gradient overlays for premium depth fade */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="overflow-x-auto no-scrollbar py-4">
          <div className="testimonials-track">
            {listToRender.map((t, i) => (
              <div 
                key={i} 
                className="w-[80vw] max-w-[340px] sm:w-[340px] md:w-[380px] bg-white border-2 border-slate-300 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 md:p-8 shadow-sm flex flex-col items-center text-center space-y-3 sm:space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group shrink-0"
              >
                {/* 1. Photo in first center */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-slate-400 sm:w-8 sm:h-8" />
                  )}
                </div>

                {/* 2 & 3. Student name & Course/position in center */}
                <div className="space-y-0.5 sm:space-y-1">
                  <h4 className="text-sm sm:text-base font-black text-slate-800 capitalize tracking-tight line-clamp-1">{t.name}</h4>
                  <p className="text-[10px] sm:text-[11px] font-bold text-[#003366] uppercase tracking-wider line-clamp-1">{t.course}</p>
                </div>

                {/* 4. Review in center */}
                <div className="relative pt-1 sm:pt-2 w-full flex justify-center">
                  <Quote size={18} className="text-[#003366]/10 absolute -top-1 left-1 sm:left-2 transform rotate-180" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed italic px-3 sm:px-6 relative z-10 line-clamp-4">
                    "{t.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
