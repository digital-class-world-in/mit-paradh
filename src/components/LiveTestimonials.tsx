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
    <div className="bg-white border-t border-slate-200 py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-10">
        <h2 className="text-[#003366] text-xl md:text-2xl font-black tracking-tight capitalize italic">
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
            gap: 1.5rem;
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
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="overflow-x-auto no-scrollbar py-4">
          <div className="testimonials-track">
            {listToRender.map((t, i) => (
              <div 
                key={i} 
                className="w-[280px] sm:w-[350px] md:w-[400px] bg-white border-2 border-black rounded-[2rem] p-8 shadow-sm flex flex-col items-center text-center space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group shrink-0"
              >
                {/* 1. Photo in first center */}
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-400" />
                  )}
                </div>

                {/* 2 & 3. Student name & Course/position in center */}
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-800 capitalize tracking-tight">{t.name}</h4>
                  <p className="text-[11px] font-bold text-[#003366] uppercase tracking-wider">{t.course}</p>
                </div>



                {/* 4. Review in center */}
                <div className="relative pt-2 w-full flex justify-center">
                  <Quote size={20} className="text-[#003366]/5 absolute -top-1 left-2 transform rotate-180" />
                  <p className="text-xs md:text-sm font-bold text-slate-600 leading-relaxed italic px-6 relative z-10">
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
