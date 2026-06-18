  'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const HorizontalSection = ({ title, children, showMore = true }: any) => (
  <div className="bg-white border-t border-slate-200 py-8">
    <div className="px-6 lg:px-12">
      <h2 className="text-[#003366] text-xl md:text-2xl font-black mb-6 tracking-tight capitalize italic">
        {title}
      </h2>
      <div className="relative group">
        <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 snap-x">
          {children}
        </div>
        <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 bg-white border border-slate-200 p-2 rounded-full shadow-lg z-10 text-slate-400 hover:text-[#003366] hidden md:flex">
          <ChevronRight size={24} />
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
        <div key={i} className="min-w-[300px] md:min-w-[420px] snap-center bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5 shrink-0">
          <div className="w-20 h-24 bg-slate-100 shrink-0 border border-slate-200 rounded flex items-center justify-center overflow-hidden">
            {story.image ? (
              <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-slate-300" />
            )}
          </div>
          <div>
            <h4 className="text-[14px]  text-black mb-1 capitalize">{story.name}</h4>
            <p className="text-[14px] text-black leading-snug">
              Selected as <span className="font-bold text-black">{story.role}</span> at<br />
              <span className="font-bold text-black">{story.company}</span> in {story.year}
            </p>
          </div>
        </div>
      ))}
    </HorizontalSection>
  );
}
