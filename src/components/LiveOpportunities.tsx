'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Building2, BarChart3, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const HorizontalSection = ({ title, children, showMore = true }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
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

const DEFAULT_HIGHER_ED = [
  { name: 'Ratan Tata Maharashtra State Skill University', title: 'Ratan Tata Maharashtra State Skill University', subtitle: '' },
  { name: 'Engineering Diploma', title: 'Engineering Diploma', subtitle: '' },
  { name: 'Bachelor of Vocation (B.Voc.)', title: 'Bachelor of Vocation (B.Voc.)', subtitle: 'Circular for Admission', link: true },
  { name: 'Yashwantrao Chavan Maharashtra Open University', title: 'Yashwantrao Chavan Maharashtra Open University', subtitle: '' }
];

const DEFAULT_APPRENTICESHIPS = [
  { name: 'Commissionerate of Skill Development, Employment and Entrepreneurship', title: 'Commissionerate of Skill Development, Employment and Entrepreneurship' },
  { name: 'CM Internship Program', title: 'CM Internship Program' },
  { name: 'PM Internship Scheme', title: 'PM Internship Scheme' }
];

const DEFAULT_ENTREPRENEURSHIPS = [
  { name: 'Sant Rohidas Leather Industries & Charmakar Development Corporation', title: 'Sant Rohidas Leather Industries & Charmakar Development Corporation' },
  { name: 'Lokshahir Anna Bhau Sathe Development Corporation', title: 'Lokshahir Anna Bhau Sathe Development Corporation' },
  { name: 'Maharashtra State Khadi and Village Industries Board', title: 'Maharashtra State Khadi and Village Industries Board' }
];

export default function LiveOpportunities() {
  const [data, setData] = useState<any>({
    higherEducation: [],
    apprenticeships: [],
    entrepreneurship: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_opportunities');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Object.keys(parsed).length > 0) {
            setData(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/home');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const updatedData = {
          higherEducation: val.higherEducation || [],
          apprenticeships: val.apprenticeships || [],
          entrepreneurship: val.entrepreneurship || []
        };
        setData(updatedData);
        try { localStorage.setItem('cache_opportunities', JSON.stringify(updatedData)); } catch (e) {}
      } else {
        const defaultData = {
          higherEducation: DEFAULT_HIGHER_ED,
          apprenticeships: DEFAULT_APPRENTICESHIPS,
          entrepreneurship: DEFAULT_ENTREPRENEURSHIPS
        };
        setData(defaultData);
        try { localStorage.removeItem('cache_opportunities'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading && data.higherEducation.length === 0 && data.apprenticeships.length === 0 && data.entrepreneurship.length === 0) {
    return (
      <div className="animate-pulse space-y-8">
        <HorizontalSection title="Higher Education Opportunities" showMore={false}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[80vw] max-w-[300px] sm:w-[280px] md:w-[320px] snap-center bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 border border-slate-100 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </HorizontalSection>
      </div>
    );
  }

  return (
    <>
      {data.higherEducation.length > 0 && (
        <HorizontalSection title="Higher Education Opportunities" showMore={false}>
          {data.higherEducation.map((ed: any, i: number) => {
            let finalUrl = typeof ed.link === 'string' ? ed.link : '#';
            if (finalUrl !== '#' && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
              finalUrl = 'https://' + finalUrl;
            }
            return (
              <div key={i} className="w-[80vw] max-w-[300px] sm:w-[280px] md:w-[320px] snap-center bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-4 hover:border-blue-400 transition-colors cursor-pointer shrink-0" onClick={() => finalUrl !== '#' && window.open(finalUrl, '_blank', 'noopener,noreferrer')}>
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 border border-slate-200 rounded-full flex items-center justify-center bg-slate-50">
                  <Building2 size={24} className="text-[#003366] sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">{ed.title}</h4>
                  {ed.description && (
                    <p className={`text-[11px] sm:text-xs mt-1 truncate ${ed.link ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>{ed.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </HorizontalSection>
      )}

      {data.apprenticeships.length > 0 && (
        <HorizontalSection title="Apprenticeship, Internship and Employment Opportunities" showMore={false}>
          {data.apprenticeships.map((app: any, i: number) => {
            let finalUrl = typeof app.link === 'string' ? app.link : '#';
            if (finalUrl !== '#' && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
              finalUrl = 'https://' + finalUrl;
            }
            return (
              <div key={i} className="w-[82vw] max-w-[340px] sm:w-[300px] md:w-[340px] snap-center bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-5 hover:border-amber-400 cursor-pointer shrink-0" onClick={() => finalUrl !== '#' && window.open(finalUrl, '_blank', 'noopener,noreferrer')}>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                  <BarChart3 size={24} className="text-[#003366] sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">{app.title}</h4>
                  {app.company && <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 truncate">{app.company}</p>}
                  {app.description && <p className={`text-[11px] mt-1 truncate ${app.link ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>{app.description}</p>}
                </div>
              </div>
            );
          })}
        </HorizontalSection>
      )}

      {data.entrepreneurship.length > 0 && (
        <HorizontalSection title="Entrepreneurship Opportunities" showMore={false}>
          {data.entrepreneurship.map((ent: any, i: number) => {
            let finalUrl = typeof ent.link === 'string' ? ent.link : '#';
            if (finalUrl !== '#' && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
              finalUrl = 'https://' + finalUrl;
            }
            return (
              <div key={i} className="w-[82vw] max-w-[340px] sm:w-[300px] md:w-[340px] snap-center bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm flex items-center gap-3.5 sm:gap-5 hover:border-emerald-500 cursor-pointer shrink-0" onClick={() => finalUrl !== '#' && window.open(finalUrl, '_blank', 'noopener,noreferrer')}>
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} className="text-[#003366] sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2">{ent.title}</h4>
                  {ent.description && (
                    <p className={`text-[11px] sm:text-xs mt-1 truncate ${ent.link ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>{ent.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </HorizontalSection>
      )}
    </>
  );
}
