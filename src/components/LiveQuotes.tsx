'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Quote, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';

const staticQuotes = [
  {
    theme: "TRUE EDUCATION VS INFORMATION",
    text: "Education is not the amount of information that is put into your brain and runs riot there, undigested, all your life. We must have life-building, manmaking, character-making assimilation of ideas. If you have accumulated five ideas and made them your life and character, you have more education than any man who has got by heart a whole library. If education is identical with information, the libraries are the greatest sages in the world and encyclopedias are the Rishis."
  },
  {
    theme: "SELF-RELIANCE & CHARACTER",
    text: "We want that education by which character is formed, strength of mind is increased, the intellect is expanded, and by which one can stand on one's own feet."
  },
  {
    theme: "CONTROL OF WILL",
    text: "What is education? Is it book-learning? No. Is it diverse knowledge? Not even that. The training by which the current and expression of will are brought under control and become fruitful is called education."
  },
  {
    theme: "CONCENTRATION OF MIND",
    text: "To me the very essence of education is concentration of mind, not the collecting of facts."
  },
  {
    theme: "ROLE OF THE TEACHER",
    text: "My idea of education is personal contact with the teacher—guru-griha-vasa. Without the personal life of a teacher there would be no education. One should live from his very boyhood with one whose character is like a blazing fire and should have before him a living example of the highest teaching. In our country, the imparting of education has always been through men of renunciation."
  },
  {
    theme: "SYNTHESIS OF SCIENCE & VEDANTA",
    text: "The old institution of 'living with the guru' and similar systems of imparting education are needed. What we want is Western science coupled with Vedanta, Brahmacharya as the guidance motto, and also Shraddha and faith in one's own self."
  }
];

export default function LiveQuotes() {
  const [quotes, setQuotes] = useState<any[]>(staticQuotes);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_quotes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuotes(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/about');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const publishedQuotes = snapshot.val().quotes || [];
        setQuotes(publishedQuotes);
        try { localStorage.setItem('cache_quotes', JSON.stringify(publishedQuotes)); } catch (e) {}
      } else {
        setQuotes(staticQuotes);
        try { localStorage.removeItem('cache_quotes'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  const displayQuotes = quotes.length > 0 ? quotes : (loading ? [] : staticQuotes);

  if (loading && displayQuotes.length === 0) {
    return (
      <div className="bg-slate-50 border-t border-slate-200 py-8 sm:py-12 animate-pulse">
        <div className="px-4 sm:px-6 lg:px-12">
          <div className="mb-4 sm:mb-6 space-y-2">
            <div className="h-6 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-100 rounded w-72 sm:w-96" />
          </div>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-6 snap-x pt-2 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[85vw] max-w-[380px] sm:w-[350px] md:w-[400px] snap-center bg-white border border-slate-200 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm flex flex-col justify-between shrink-0 space-y-4">
                <div className="space-y-4">
                  <div className="h-6 bg-slate-150 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-5/6" />
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border-t border-slate-200 py-8 sm:py-12">
      <div className="px-4 sm:px-6 lg:px-12">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-[#003366] text-lg sm:text-xl md:text-2xl font-black tracking-tight capitalize italic">
            Swami Vivekananda on Education
          </h2>
          <p className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-1">
            Swamiji's visionary words that shape our teaching pedagogy
          </p>
        </div>

        <div className="relative group/container">
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 lg:-translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex items-center justify-center transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory pt-2 px-1 scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {displayQuotes.map((q, idx) => (
              <div 
                key={idx} 
                className="w-[85vw] max-w-[380px] sm:w-[350px] md:w-[400px] snap-center bg-white border-2 border-slate-300 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 md:p-8 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 group shrink-0"
              >
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-black text-[#00a5a5] uppercase bg-[#00a5a5]/10 px-3 py-1 rounded-full tracking-wider truncate">
                      {q.theme}
                    </span>
                    <Quote size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                  </div>
                  <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed italic line-clamp-6">
                    "{q.text}"
                  </p>
                </div>
                
                <div className="pt-4 sm:pt-6 border-t border-slate-100 mt-4 sm:mt-6 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-50 border flex items-center justify-center text-slate-400 shrink-0">
                    <GraduationCap size={12} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">MIT Vision Core</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
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
