'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { FileText } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_NOTICES = [
  { text: 'APRIL-2026 (2 YEAR) DETAIL TIME TABLE', isNew: true },
  { text: 'REGULAR FINAL DETAIL TIME TABLE-2026', isNew: true },
  { text: 'EX STUDENT FINAL DETAIL TIME TABLE-2026', isNew: true },
  { text: 'Regarding approval of new courses from the training session 2026-27', isNew: false },
  { text: '2 Year exam April 2026 Time Table', isNew: false },
  { text: 'MARCH 2026 FINAL TIME TABLE(27-3-2026)', isNew: false },
];

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


export default function LiveNotices() {
  const [notices, setNotices] = useState<any[]>([]);
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
          localStorage.removeItem('cache_notices');
          
          const cached = await getCache('cache_notices');
          if (cached && Array.isArray(cached) && cached.length > 0 && isMounted) {
            setNotices(cached);
            setLoading(false);
          }
        } catch (e) {}
        if (isMounted) setLoading(false);
      }
    };
    
    loadCache();

    const dataRef = ref(realtimeDb, 'settings/website/home/notices');
    const unsubscribe = onValue(dataRef, async (snapshot) => {
      cleanupBlobUrls();
      if (snapshot.exists()) {
        const val = snapshot.val();
        const publishedNotices = Array.isArray(val) ? val : (val ? Object.values(val) : []);
        
        if (isMounted) {
          setNotices(publishedNotices);
        }
        
        try {
          // Cache the full data array containing full base64 urls into IndexedDB
          await setCache('cache_notices', publishedNotices);
        } catch (e) {}
      } else {
        if (isMounted) setNotices([]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      cleanupBlobUrls();
    };
  }, []);

  if (loading && notices.length === 0) {
    return (
      <section className="lg:col-span-2 animate-pulse">
        <div className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white h-full">
          <div className="bg-[#003366]/80 p-4 text-white font-bold text-sm capitalize tracking-tight flex items-center justify-between">
            <span className="flex items-center gap-3"><FileText size={18} /> Important Notices</span>
            <span className="h-4 bg-slate-200/50 rounded w-12" />
          </div>
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                <div className="w-2.5 h-2.5 bg-slate-200 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-11/12" />
                  <div className="h-3 bg-slate-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-2">
      <div className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white h-full">
        <div className="bg-[#003366] p-4 text-white font-bold text-sm capitalize tracking-tight flex items-center justify-between">
          <span className="flex items-center gap-3"><FileText size={18} /> Important Notices</span>
          <Link href="#" className="text-xs text-amber-400 hover:text-amber-300 font-semibold">View All</Link>
        </div>
        <div className="p-6 space-y-4">
          {notices.map((n, i) => {
            let finalUrl = n.fileUrl || '#';
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

            const content = (
              <div>
                <p className="text-sm font-bold text-blue-700 hover:text-blue-900 cursor-pointer">{n.text}</p>
                {n.isNew && <span className="inline-block mt-1 text-[13px] font-black text-black capitalize italic">New Update!</span>}
              </div>
            );

            return (
              <div key={i} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0 hover:translate-x-1 transition-transform">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full mt-1.5 shrink-0" />
                {finalUrl !== '#' && !isCachedPlaceholder && !finalUrl.startsWith('data:') ? (
                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 block"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={async () => {
                      if (isCachedPlaceholder) {
                        const newTab = window.open('about:blank', '_blank');
                        if (newTab) {
                          newTab.document.write(`
                            <html>
                              <head>
                                <title>Loading Notice...</title>
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
                                <div class="title">Opening Notice...</div>
                                <div class="sub">Please wait while the document is retrieved.</div>
                              </body>
                            </html>
                          `);
                          newTab.document.close();
                        }
                        try {
                          const fileUrlRef = ref(realtimeDb, `settings/website/home/notices/${i}/fileUrl`);
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
                          console.error('Failed to fetch notice file url:', err);
                          if (newTab) {
                            newTab.document.body.innerHTML = '<div style="font-family: sans-serif; text-align: center; color: #ef4444; font-weight: 600; padding: 20px;">Failed to load document.</div>';
                          }
                        }
                      } else if (finalUrl.startsWith('data:')) {
                         const resolvedUrl = dataUrlToBlobUrl(finalUrl);
                         window.open(resolvedUrl, '_blank');
                      }
                    }}
                    title="Open document"
                  >
                    {content}
                  </div>
                )}
              </div>
            );
          })}

          {notices.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-4">No important notices at this time.</div>
          )}
        </div>
      </div>
    </section>
  );
}
