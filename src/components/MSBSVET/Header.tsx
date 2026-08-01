'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export const Header = () => {
  const [helpline, setHelpline] = useState('');
  const [loading, setLoading] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('cache_helpline');
    if (cached) {
      setHelpline(cached);
      setLoading(false);
    }

    if (realtimeDb) {
      const dataRef = ref(realtimeDb, 'settings/website/home/headerHelpline');
      const unsubscribe = onValue(dataRef, (snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
          setHelpline(snapshot.val());
          localStorage.setItem('cache_helpline', snapshot.val());
        } else {
          setHelpline('1800-456-7890');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setHelpline('1800-456-7890');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isContrast = localStorage.getItem('cache_high_contrast') === 'true';
      if (isContrast) {
        setHighContrast(true);
        document.documentElement.classList.add('high-contrast');
      }
    }
  }, []);

  const toggleContrast = () => {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cache_high_contrast', String(nextVal));
      if (nextVal) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
  };

  const handleFontChange = (scale: 'decrease' | 'reset' | 'increase') => {
    if (typeof window !== 'undefined') {
      const htmlEl = document.documentElement;
      if (scale === 'decrease') {
        htmlEl.style.fontSize = '90%';
      } else if (scale === 'increase') {
        htmlEl.style.fontSize = '110%';
      } else {
        htmlEl.style.fontSize = '100%';
      }
    }
  };

  return (
    <div className="w-full bg-white select-none">
      {/* High Contrast Global Style Hack */}
      <style dangerouslySetInnerHTML={{__html: `
        .high-contrast {
          filter: invert(1) hue-rotate(180deg) !important;
          background-color: #000 !important;
        }
        .high-contrast img, .high-contrast video, .high-contrast iframe, .high-contrast .no-invert {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `}} />

      {/* Top Recognition and Invocation Bar (Black Line) */}
      <div className="w-full bg-[#0a0a0a] text-white pt-2.5 pb-2 px-4 md:px-10 border-b border-white/5 select-none text-[11px] md:text-sm font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
          {/* Line 1: Left | Center | Right */}
          <div className="flex flex-row justify-between items-center w-full">
            <span className="text-amber-400 font-extrabold tracking-wide shrink-0">
              महाराष्ट्र शासन मान्यता प्राप्त
            </span>
            <span className="text-[#ff9933] font-black tracking-widest bg-white/5 px-3 py-0.5 rounded-full border border-white/5 animate-pulse shrink-0">
              !! श्री बालाजी प्रसन्न !!
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-amber-400 font-extrabold tracking-wide hidden sm:inline">
                केंद्र शासन मान्यता प्राप्त
              </span>
              <span className="text-zinc-700 font-normal hidden sm:inline">|</span>
              {/* Accessibility Controls */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => handleFontChange('decrease')} className="hover:text-amber-400 transition-colors px-1 text-[11px] font-bold text-zinc-300" title="Decrease Font Size">A-</button>
                <span className="text-zinc-700 font-normal">|</span>
                <button onClick={() => handleFontChange('reset')} className="hover:text-amber-400 transition-colors px-1 text-[12px] font-bold text-zinc-300" title="Reset Font Size">A</button>
                <span className="text-zinc-700 font-normal">|</span>
                <button onClick={() => handleFontChange('increase')} className="hover:text-amber-400 transition-colors px-1 text-[13px] font-bold text-zinc-300" title="Increase Font Size">A+</button>
                <span className="text-zinc-700 font-normal">|</span>
                <button onClick={toggleContrast} className="hover:text-amber-400 transition-colors p-0.5 text-zinc-300" title="Toggle Contrast">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M6.343 6.343l.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Line 2: Institution name — center aligned with helpline */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-center text-[10.5px] md:text-[12.5px] text-white/90 font-bold leading-snug border-t border-white/5 pt-1.5 gap-1">
            <div className="flex items-center gap-1 text-[10px] md:text-[12px]">
              <span className="text-[#a1a1aa] font-medium">Helpline:</span>
              {loading && !helpline ? (
                <span className="inline-block h-3 w-20 bg-zinc-800 animate-pulse rounded" />
              ) : (
                <span className="text-amber-400 font-bold tracking-wider">{helpline}</span>
              )}
            </div>
            <div className="flex-1 text-center md:pr-24">
              महाविष्णू ग्रामीण विकास व शैक्षणिक बहु उद्देशीय संस्था धामणगांव ( धाड ) द्वारा संचलित.
            </div>
          </div>
        </div>
      </div>

      {/* Main Branding Header */}
      <header className="bg-white px-4 md:px-10 py-4 md:py-6 border-b-[3px] border-[#003366] shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          
          {/* Institute Logo */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="h-20 w-20 md:h-[96px] md:w-[96px] rounded-full overflow-hidden border-2 border-[#003366] shadow-md bg-white flex items-center justify-center p-1">
              <img
                src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg"
                alt="Mahalaxmi Nursing And Technical Institute Paradh Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Middle Typography */}
          <div className="flex-1 text-center flex flex-col items-center gap-1">
            <h2 className="text-[11px] md:text-[13px] font-bold text-[#334155] tracking-wide leading-tight">
              Affiliated By Government Of Maharashtra &nbsp;|&nbsp; Affiliated By Government of India
            </h2>
            <h3 className="text-[11px] md:text-[14px] font-semibold text-[#475569] tracking-normal leading-snug max-w-[28rem] md:max-w-none">
              Mahavishnu Gramin Vikas V Shaikshanik Bahu Uddeshiy Sanstha Dhamangaon (Dhad) Dwara Sanchalit....
            </h3>
            <h1 className="text-[14px] md:text-[22px] font-black text-[#0f52ba] tracking-tight leading-tight uppercase max-w-[26rem] md:max-w-none font-sans">
              Mahalaxmi Nursing And Technical Institute Paradh Bk, Goregaon
            </h1>
          </div>

        </div>
      </header>
    </div>
  );
};


