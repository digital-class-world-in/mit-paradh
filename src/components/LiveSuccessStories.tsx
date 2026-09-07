  'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const HorizontalSection = ({ title, children, showMore = true }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 py-6 sm:py-8">
      <div className="px-4 sm:px-6 lg:px-12">
        <h2 className="text-[#003366] text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-6 tracking-tight capitalize italic">
          {title}
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
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 lg:translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex items-center justify-center transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {showMore && (
          <div className="text-right pt-2">
            <Link href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800">See more...</Link>
          </div>
        )}
      </div>
    </div>
  );
};

const DEFAULT_SUCCESS_STORIES = [
  { name: 'NITIN SURESH BEDEKAR', role: 'ELECTRICAL MAINTENANCE', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
  { name: 'ANIKET SANTOSH LAWAND', role: 'ELECTRICIAN', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
  { name: 'PRANAV RAJENDRA GURAV', role: 'ELECTRICIAN', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
  { name: 'SMRUTI RANJAN', role: 'SOFTWARE TESTER', company: 'TCS PUNE', year: '2024' },
];

export default function LiveSuccessStories() {
  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_successStories');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSuccessStories(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/home/successStories');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const publishedStories = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        setSuccessStories(publishedStories);
        try { localStorage.setItem('cache_successStories', JSON.stringify(publishedStories)); } catch (e) {}
      } else {
        setSuccessStories([]);
        try { localStorage.removeItem('cache_successStories'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading && successStories.length === 0) {
    return null;
  }

  if (successStories.length === 0) {
    return null; // Don't render the section if there are no success stories
  }

  return (
    <HorizontalSection title="Board Success Stories" showMore={false}>
      {successStories.map((story, i) => (
        <div key={i} className="w-[85vw] max-w-[380px] sm:w-[350px] md:w-[380px] snap-center bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5 sm:gap-5 shrink-0">
          <div className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-100 shrink-0 border border-slate-200 rounded flex items-center justify-center overflow-hidden">
            {story.image ? (
              <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-slate-300 sm:w-8 sm:h-8" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-[14px] font-bold text-black mb-1 capitalize truncate">{story.name}</h4>
            <p className="text-xs sm:text-[14px] text-slate-700 leading-snug">
              Selected as <span className="font-bold text-black">{story.role}</span> at<br />
              <span className="font-bold text-black">{story.company}</span> in {story.year}
            </p>
          </div>
        </div>
      ))}
    </HorizontalSection>
  );
}
