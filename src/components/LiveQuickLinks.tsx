'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { FileText, ChevronRight, ChevronDown, Link as LinkIcon, File } from 'lucide-react';

const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('MitParadhDB', 1);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore('cacheStore');
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
};

const getCache = async (key: string) => {
  try {
    const db = await initDB();
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction('cacheStore', 'readonly');
      const req = tx.objectStore('cacheStore').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
};

const setCache = async (key: string, value: any) => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('cacheStore', 'readwrite');
      tx.objectStore('cacheStore').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {}
};

export default function LiveQuickLinks() {
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const blobUrlsRef = useRef<string[]>([]);

  const dataUrlToBlobUrl = (dataUrl: string): string => {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return dataUrl;
    }
    try {
      const [header, base64] = dataUrl.split(',');
      const mimeString = header.split(':')[1].split(';')[0];
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current.push(url);
      return url;
    } catch (err) {
      console.error('Failed to convert data URL to blob', err);
      return '#';
    }
  };

  const cleanupBlobUrls = () => {
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    });
    blobUrlsRef.current = [];
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadCache = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Clear old localstorage to free up space
          localStorage.removeItem('cache_quickLinks');
          
          const cached = await getCache('cache_quickLinks');
          if (cached && Array.isArray(cached) && cached.length > 0 && isMounted) {
            const processedLinks = cached.map((link: any) => ({
              ...link,
              subLinks: link.subLinks || []
            }));
            setQuickLinks(processedLinks);
            setLoading(false);
          }
        } catch (e) {}
      }
    };
    loadCache();

    const dataRef = ref(realtimeDb, 'settings/website/home/quickLinks');
    const unsubscribe = onValue(dataRef, async (snapshot) => {
      cleanupBlobUrls();
      if (snapshot.exists()) {
        const val = snapshot.val();
        const links = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        
        if (isMounted) {
          const processedLinks = links.map((link: any) => ({
            ...link,
            subLinks: link.subLinks || []
          }));
          setQuickLinks(processedLinks);
        }
        
        try {
          // Cache the full data array containing full base64 urls into IndexedDB
          await setCache('cache_quickLinks', links);
        } catch (e) {}
      } else {
        if (isMounted) setQuickLinks([]);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
      cleanupBlobUrls();
    };
  }, []);

  if (loading && quickLinks.length === 0) {
    return (
      <aside className="order-3 lg:order-1 lg:col-span-1 space-y-4 animate-pulse">
        <div className="bg-[#003366]/80 text-white p-4 rounded-t-lg font-bold text-sm capitalize tracking-tight flex items-center gap-3">
          <FileText size={16} /> Quick Navigation
        </div>
        <div className="border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm rounded-b-lg p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-4" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (quickLinks.length === 0) {
    return (
      <aside className="order-3 lg:order-1 lg:col-span-1 space-y-4">
        <div className="bg-[#003366] text-white p-4 rounded-t-lg font-bold text-sm capitalize tracking-tight flex items-center gap-3">
          <FileText size={16} /> Quick Navigation
        </div>
        <div className="border border-slate-200 bg-white p-6 sm:p-8 text-center text-slate-400 text-xs shadow-sm rounded-b-lg">
          No links configured.
        </div>
      </aside>
    );
  }

  return (
    <aside className="order-3 lg:order-1 lg:col-span-1 space-y-4">
      <div className="bg-[#003366] text-white p-4 rounded-t-lg font-bold text-sm capitalize tracking-tight flex items-center gap-3">
        <FileText size={16} /> Quick Navigation
      </div>
      <div className="border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm rounded-b-lg overflow-hidden">
        {quickLinks.map((link, i) => {
          const isExpanded = expandedIdx === i;
          const hasSubLinks = Array.isArray(link.subLinks) && link.subLinks.length > 0;
          return (
            <div key={i} className="group">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 min-h-[48px] hover:bg-slate-50 hover:text-[#003366] transition-colors text-xs sm:text-sm font-bold text-slate-700 text-left active:bg-slate-100"
              >
                <span className="flex items-center gap-3">
                  <LinkIcon size={16} className="opacity-50 text-[#003366] shrink-0" />
                  <span className="leading-snug">{link.label}</span>
                </span>
                {hasSubLinks ? (
                  isExpanded ? (
                    <ChevronDown size={14} className="text-[#003366] transition-colors shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[#003366] transition-colors shrink-0" />
                  )
                ) : (
                  <ChevronRight size={14} className="text-slate-200 shrink-0" />
                )}
              </button>

              {isExpanded && hasSubLinks && (
                <div className="bg-slate-50 border-t border-slate-100 flex flex-col">
                  {link.subLinks.map((sub: any, sIdx: number) => {
                    // Resolve the URL
                    let finalUrl = sub.fileUrl || '#';
                    if (
                      finalUrl !== '#' &&
                      finalUrl !== '__DATA_URL__' &&
                      !finalUrl.startsWith('http://') &&
                      !finalUrl.startsWith('https://') &&
                      !finalUrl.startsWith('/') &&
                      !finalUrl.startsWith('data:') &&
                      !finalUrl.startsWith('blob:')
                    ) {
                      finalUrl = 'https://' + finalUrl;
                    }

                    const isCachedPlaceholder = finalUrl === '__DATA_URL__';

                    return (
                      <a
                        key={sIdx}
                        href={isCachedPlaceholder || finalUrl.startsWith('data:') ? '#' : finalUrl}
                        target={isCachedPlaceholder || finalUrl.startsWith('data:') ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          if (finalUrl === '#' || isCachedPlaceholder || finalUrl.startsWith('data:')) {
                            e.preventDefault();
                            if (isCachedPlaceholder) {
                              const newTab = window.open('about:blank', '_blank');
                              if (newTab) {
                                newTab.document.write(`
                                  <html>
                                    <head>
                                      <title>Loading Document...</title>
                                      <style>
                                        body {
                                          display: flex;
                                          flex-direction: column;
                                          justify-content: center;
                                          align-items: center;
                                          height: 100vh;
                                          margin: 0;
                                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                          background-color: #f8fafc;
                                          color: #1e293b;
                                        }
                                        .loader {
                                          border: 3px solid #e2e8f0;
                                          border-top: 3px solid #003366;
                                          border-radius: 50%;
                                          width: 36px;
                                          height: 36px;
                                          animation: spin 0.8s linear infinite;
                                          margin-bottom: 16px;
                                        }
                                        @keyframes spin {
                                          0% { transform: rotate(0deg); }
                                          100% { transform: rotate(360deg); }
                                        }
                                        .title {
                                          font-size: 15px;
                                          font-weight: 600;
                                        }
                                        .sub {
                                          font-size: 12px;
                                          color: #64748b;
                                          margin-top: 6px;
                                        }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="loader"></div>
                                      <div class="title">Opening document...</div>
                                      <div class="sub">Please wait while the document is retrieved.</div>
                                    </body>
                                  </html>
                                `);
                                newTab.document.close();
                              }
                              try {
                                const fileUrlRef = ref(realtimeDb, `settings/website/home/quickLinks/${i}/subLinks/${sIdx}/fileUrl`);
                                const snap = await get(fileUrlRef);
                                if (snap.exists() && snap.val()) {
                                  const realUrl = snap.val();
                                  if (realUrl === '__DATA_URL__') {
                                    if (newTab) {
                                      newTab.document.body.innerHTML = '<div style="font-family: sans-serif; text-align: center; color: #ef4444; font-weight: 600; padding: 20px;">Document data is corrupted. Please re-upload the file in the admin panel.</div>';
                                    }
                                  } else {
                                    const resolvedUrl = realUrl.startsWith('data:') ? dataUrlToBlobUrl(realUrl) : realUrl;
                                    if (newTab) {
                                      newTab.location.href = resolvedUrl;
                                    }
                                  }
                                } else {
                                  if (newTab) {
                                    newTab.document.body.innerHTML = '<div style="font-family: sans-serif; text-align: center; color: #ef4444; font-weight: 600; padding: 20px;">Document not found.</div>';
                                  }
                                }
                              } catch (err) {
                                console.error('Failed to fetch quick link file url:', err);
                                if (newTab) {
                                  newTab.document.body.innerHTML = '<div style="font-family: sans-serif; text-align: center; color: #ef4444; font-weight: 600; padding: 20px;">Failed to load document.</div>';
                                }
                              }
                            } else if (finalUrl.startsWith('data:')) {
                               const resolvedUrl = dataUrlToBlobUrl(finalUrl);
                               window.open(resolvedUrl, '_blank');
                            }
                          }
                        }}

                        className={`flex items-center gap-3 py-3 px-6 text-xs font-semibold text-slate-600 hover:text-[#003366] hover:bg-slate-100 transition-colors border-l-2 border-transparent hover:border-[#003366] cursor-pointer`}
                        title="Open document"
                      >
                        <File size={14} className="opacity-50 shrink-0" />
                        <span className="leading-snug">{sub.name}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
