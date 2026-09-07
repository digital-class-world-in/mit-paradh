'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const getYouTubeId = (input: string) => {
  if (!input) return null;
  let url = input;
  // Handle case where user pastes full iframe embed code
  if (url.includes('<iframe')) {
    const srcMatch = url.match(/src="([^"]+)"/);
    if (srcMatch) url = srcMatch[1];
  }
  
  // Clean URL
  url = url.trim();
  
  // Most robust regex for extracting YouTube ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  if (match && match[1]) return match[1];
  
  // Fallback simple search for any 11 chars after common markers
  const fallback = url.match(/(?:\?v=|\/embed\/|\/v\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (fallback && fallback[1]) return fallback[1];

  // If it's exactly 11 characters, assume it's an ID
  if (url.length === 11) return url;
  
  return null;
};

const HorizontalSection = ({ title, children, showMore = true }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
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

export default function LiveRelatedVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_relatedVideos');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVideos(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }
    const dataRef = ref(realtimeDb, 'settings/website/home/relatedVideos');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const publishedVideos = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        setVideos(publishedVideos);
        try { localStorage.setItem('cache_relatedVideos', JSON.stringify(publishedVideos)); } catch (e) {}
      } else {
        setVideos([]);
        try { localStorage.removeItem('cache_relatedVideos'); } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading && videos.length === 0) {
    return (
      <HorizontalSection title="Related Videos" showMore={false}>
        <div className="w-full flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 snap-x animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[82vw] max-w-[340px] sm:w-[320px] md:w-[360px] snap-center shrink-0 space-y-3">
              <div className="w-full aspect-video bg-slate-200 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </HorizontalSection>
    );
  }

  if (videos.length === 0) {
    return (
      <HorizontalSection title="Related Videos" showMore={false}>
        <div className="w-full flex justify-center py-8">
           <p className="text-slate-400 text-sm font-bold">No related videos published yet.</p>
        </div>
      </HorizontalSection>
    );
  }

  return (
    <HorizontalSection title="Related Videos" showMore={false}>
      {videos.map((vid, i) => {
        let videoId = getYouTubeId(vid.url);
        if (!videoId && vid.description) {
           videoId = getYouTubeId(vid.description);
        }
        
        return (
          <div key={i} className="w-[82vw] max-w-[340px] sm:w-[320px] md:w-[360px] snap-center group shrink-0">
            <div className="w-full aspect-video bg-[#1a1a2e] rounded-lg relative overflow-hidden mb-3 shadow-md">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={vid.description || 'YouTube video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center overflow-hidden">
                   <Play size={24} />
                   <span className="text-xs font-bold">Invalid Video URL</span>
                   <span className="text-[10px] break-all">{vid.url}</span>
                </div>
              )}
            </div>
            <p className="text-center text-xs sm:text-sm font-semibold text-slate-600 px-2 line-clamp-2">{vid.description}</p>
          </div>
        );
      })}
    </HorizontalSection>
  );
}
