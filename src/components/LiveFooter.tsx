'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import Link from 'next/link';
import { ChevronRight, MapPin, Phone, Mail } from 'lucide-react';

export default function LiveFooter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('cache_footer');
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    }

    const footerRef = ref(realtimeDb, 'settings/website/footer');
    const unsubscribe = onValue(footerRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const addresses = val.addresses || (val.address ? [val.address] : ['Paradh Budruk, Taluka Bhokardan, District Jalna - 431114']);
        const contactNumbers = val.contactNumbers || (val.contactNumber ? [val.contactNumber] : ['1800-456-7890']);
        const emails = val.emails || (val.email ? [val.email] : []);
        const addressLinks = val.addressLinks || [];
        const branches = val.branches || (() => {
          const merged = [];
          const maxLen = Math.max(addresses.length, contactNumbers.length, emails.length, addressLinks.length);
          for (let i = 0; i < maxLen; i++) {
            merged.push({
              address: addresses[i] || '',
              contactNumber: contactNumbers[i] || '',
              email: emails[i] || '',
              addressLink: addressLinks[i] || ''
            });
          }
          return merged;
        })();

        const currentYear = new Date().getFullYear();
        const defaultCopyright = `© ${currentYear} MAHALAXMI NURSING AND TECHNICAL INSTITUTE PARADH • All rights reserved. • Designed and developed by Digital Class`;
        const isOldCopyright = !val.copyrightText || 
                               val.copyrightText === 'New server' || 
                               val.copyrightText.includes('MAHAVISHNU');
        let copyrightText = isOldCopyright ? defaultCopyright : val.copyrightText;
        if (copyrightText && !copyrightText.startsWith('©')) {
          copyrightText = `© ${currentYear} ${copyrightText}`;
        }

        const dataObj = {
          sansthaName: val.sansthaName || 'MAHAVISHNU GRAMIN VIKAS & SHAIKSHNIK B. SANSTHA DHAMANGAON (DHAD)',
          instituteName: val.instituteName || 'Mahalaxmi Nursing and technical institute Paradh',
          facebookUrl: val.facebookUrl || 'https://facebook.com',
          instagramUrl: val.instagramUrl || 'https://instagram.com',
          youtubeUrl: val.youtubeUrl || 'https://youtube.com',
          copyrightText,
          totalVisitors: val.totalVisitors || '1222146',
          todayCount: val.todayCount || '5730',
          lastUpdated: val.lastUpdated || '18-04-2026',
          branches,
          aboutLinks: val.aboutLinks || [
            { label: 'About MIT PARADH', url: '/about' },
            { label: 'Board of Directors', url: '/about#leadership' }
          ],
          supportLinks: val.supportLinks || [
            { label: 'Contact Us', url: '/contact' },
            { label: 'Inquiry Us', url: '/inquiry' },
            { label: 'Help', url: '#' },
            { label: 'Sitemap', url: '#' }
          ],
          policiesLinks: val.policiesLinks || [
            { label: 'Disclaimer and Policies', url: '#' }
          ],
          aboutHeading: val.aboutHeading || 'About Us',
          supportHeading: val.supportHeading || 'Support',
          policiesHeading: val.policiesHeading || 'Policies'
        };

        setData(dataObj);
        try { localStorage.setItem('cache_footer', JSON.stringify(dataObj)); } catch (e) {}
      } else {
        setData(getDefaultFooterData());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function getDefaultFooterData() {
    const currentYear = new Date().getFullYear();
    return {
      sansthaName: 'MAHAVISHNU GRAMIN VIKAS & SHAIKSHNIK B. SANSTHA DHAMANGAON (DHAD)',
      instituteName: 'Mahalaxmi Nursing and technical institute Paradh',
      facebookUrl: 'https://facebook.com',
      instagramUrl: 'https://instagram.com',
      youtubeUrl: 'https://youtube.com',
      copyrightText: `© ${currentYear} MAHALAXMI NURSING AND TECHNICAL INSTITUTE PARADH • All rights reserved. • Designed and developed by Digital Class`,
      totalVisitors: '1222146',
      todayCount: '5730',
      lastUpdated: '18-04-2026',
      branches: [{
        address: 'Paradh Budruk, Taluka Bhokardan, District Jalna - 431114',
        contactNumber: '1800-456-7890',
        email: ''
      }],
      aboutHeading: 'About Us',
      supportHeading: 'Support',
      policiesHeading: 'Policies',
      aboutLinks: [
        { label: 'About MIT PARADH', url: '/about' },
        { label: 'Board of Directors', url: '/about#leadership' }
      ],
      supportLinks: [
        { label: 'Contact Us', url: '/contact' },
        { label: 'Inquiry Us', url: '/inquiry' },
        { label: 'Help', url: '#' },
        { label: 'Sitemap', url: '#' }
      ],
      policiesLinks: [
        { label: 'Disclaimer and Policies', url: '#' }
      ]
    };
  }

  if (!data) {
    return <footer className="bg-[#020817] h-60 w-full animate-pulse border-t border-white/5" />;
  }

  return (
    <footer className="bg-[#020817] text-white py-10 sm:py-16 px-4 sm:px-6 lg:px-16 border-t border-white/5 font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-10 relative z-10">
        
        {/* Brand and Social Links */}
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3 space-y-5 sm:space-y-6">
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Government Of Maharashtra</p>
            <h3 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase leading-snug">{data.sansthaName}</h3>
            <p className="text-xs font-bold text-amber-400 mt-1 leading-relaxed">{data.instituteName}</p>
          </div>
          <div className="flex gap-3">
            {data.instagramUrl && (
              <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-gradient-to-tr hover:from-yellow-600 hover:to-purple-600 flex items-center justify-center transition-all text-white border border-white/10 hover:border-transparent min-h-[36px] min-w-[36px]" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            )}
            {data.facebookUrl && (
              <a href={data.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600 flex items-center justify-center transition-all text-white border border-white/10 hover:border-transparent min-h-[36px] min-w-[36px]" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
            )}
            {data.youtubeUrl && (
              <a href={data.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-600 flex items-center justify-center transition-all text-white border border-white/10 hover:border-transparent min-h-[36px] min-w-[36px]" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.969.502 5.837a3.003 3.003 0 002.11 2.11c1.872.507 9.388.507 9.388.507s7.517 0 9.389-.507a3.003 3.003 0 002.11-2.11C24 15.969 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* About Us Links */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <h4 className="font-bold text-white mb-4 sm:mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-2.5 sm:pb-3">{data.aboutHeading}</h4>
          <ul className="space-y-2.5 sm:space-y-3">
            {data.aboutLinks.map((link: any, idx: number) => (
              <li key={idx}>
                <Link href={link.url} className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-xs sm:text-sm py-0.5">
                  <ChevronRight size={14} className="shrink-0 text-amber-400/80" /> {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Links */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <h4 className="font-bold text-white mb-4 sm:mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-2.5 sm:pb-3">{data.supportHeading}</h4>
          <ul className="space-y-2.5 sm:space-y-3">
            {data.supportLinks.map((link: any, idx: number) => (
              <li key={idx}>
                <Link href={link.url} className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-xs sm:text-sm py-0.5">
                  <ChevronRight size={14} className="shrink-0 text-amber-400/80" /> {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Policies Links */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <h4 className="font-bold text-white mb-4 sm:mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-2.5 sm:pb-3">{data.policiesHeading}</h4>
          <ul className="space-y-2.5 sm:space-y-3">
            {data.policiesLinks.map((link: any, idx: number) => (
              <li key={idx}>
                <Link href={link.url} className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-xs sm:text-sm py-0.5">
                  <ChevronRight size={14} className="shrink-0 text-amber-400/80" /> {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
          <h4 className="font-bold text-white mb-4 sm:mb-5 capitalize text-xs tracking-tight border-b border-white/10 pb-2.5 sm:pb-3">Contact Info</h4>
          <div className="space-y-5 sm:space-y-6 text-blue-300">
            {(data.branches || []).map((branch: any, idx: number) => {
              const showLabels = (data.branches || []).length > 1 || branch.name?.trim();
              const labelText = branch.name?.trim() || `Branch #${idx + 1}`;
              return (
                <div key={idx} className="space-y-3 sm:space-y-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  {showLabels && (
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5">{labelText}</p>
                  )}
                  {branch.address?.trim() && (
                    <div className="flex gap-2.5 sm:gap-3 items-start">
                      <MapPin size={16} className="text-amber-400 shrink-0 mt-1" />
                      <a 
                        href={branch.addressLink?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-line text-white hover:text-amber-400 transition-colors"
                      >
                        {branch.address}
                      </a>
                    </div>
                  )}
                  {branch.contactNumber?.trim() && (
                    <div className="flex gap-2.5 sm:gap-3 items-center">
                      <Phone size={16} className="text-amber-400 shrink-0" />
                      <p className="text-xs sm:text-sm font-bold text-white">
                        <a href={`tel:${branch.contactNumber}`} className="hover:text-amber-400 transition-colors">{branch.contactNumber}</a>
                      </p>
                    </div>
                  )}
                  {branch.email?.trim() && (
                    <div className="flex gap-2.5 sm:gap-3 items-center">
                      <Mail size={16} className="text-amber-400 shrink-0" />
                      <p className="text-xs sm:text-sm font-bold text-white break-all">
                        <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${branch.email}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">{branch.email}</a>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 mt-8 sm:mt-12 pt-6 px-4 sm:px-6 lg:px-16 flex flex-col items-center justify-center text-center gap-2">
        {data.copyrightText?.trim() && (
          <p className="text-white/40 font-semibold text-[10px] sm:text-xs md:text-sm tracking-wide leading-relaxed">
            {data.copyrightText}
          </p>
        )}
      </div>
    </footer>
  );
}
