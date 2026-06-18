"use client";

import { useState } from 'react';
import { realtimeDb, storage } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ArrowRight, Loader2, Database, AlertCircle } from 'lucide-react';

export default function MigratePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [itemsToMigrate, setItemsToMigrate] = useState<{ path: string, base64: string }[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const base64ToBlob = (base64: string) => {
    try {
      const parts = base64.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      return null;
    }
  };

  const getExtension = (base64: string) => {
    if (base64.startsWith('data:image/jpeg')) return '.jpg';
    if (base64.startsWith('data:image/png')) return '.png';
    if (base64.startsWith('data:image/gif')) return '.gif';
    if (base64.startsWith('data:application/pdf')) return '.pdf';
    return '.bin';
  };

  const traverse = (obj: any, path: string, found: any[]) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      if (obj.startsWith('data:image/') || obj.startsWith('data:application/')) {
        found.push({ path, base64: obj });
      }
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => traverse(obj[key], `${path}/${key}`, found));
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setLog([]);
    setItemsToMigrate([]);
    try {
      addLog('Scanning /users node...');
      const usersSnap = await get(ref(realtimeDb, 'users'));
      const found: any[] = [];
      if (usersSnap.exists()) {
        traverse(usersSnap.val(), 'users', found);
      }

      addLog('Scanning /colleges node...');
      const collegesSnap = await get(ref(realtimeDb, 'colleges'));
      if (collegesSnap.exists()) {
        traverse(collegesSnap.val(), 'colleges', found);
      }
      
      setItemsToMigrate(found);
      addLog(`Scan complete. Found ${found.length} Base64 files to migrate.`);
    } catch (e: any) {
      addLog(`Error scanning: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleMigrate = async () => {
    if (itemsToMigrate.length === 0) return;
    setIsMigrating(true);
    setProgress(0);
    
    let successCount = 0;
    for (let i = 0; i < itemsToMigrate.length; i++) {
      const item = itemsToMigrate[i];
      try {
        const blob = base64ToBlob(item.base64);
        if (!blob) {
          addLog(`[SKIP] Invalid Base64 at ${item.path}`);
          continue;
        }
        
        const ext = getExtension(item.base64);
        const fileName = `migrations/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const sRef = storageRef(storage, fileName);
        
        await uploadBytesResumable(sRef, blob);
        const url = await getDownloadURL(sRef);
        
        await set(ref(realtimeDb, item.path), url);
        
        successCount++;
        addLog(`[OK] Migrated: ${item.path}`);
      } catch (err: any) {
        addLog(`[FAIL] Error on ${item.path}: ${err.message}`);
      }
      setProgress(Math.round(((i + 1) / itemsToMigrate.length) * 100));
    }
    
    addLog(`Migration complete. Successfully moved ${successCount} out of ${itemsToMigrate.length} files.`);
    setIsMigrating(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-[#002147] p-8 text-white flex items-center gap-4">
          <Database size={32} className="text-[#00a5a5]" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">Database Migration Tool</h1>
            <p className="text-sm font-medium text-white/70">Convert Base64 entries to Firebase Storage</p>
          </div>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex gap-4">
            <button 
              onClick={handleScan}
              disabled={isScanning || isMigrating}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="animate-spin" size={20} /> : <AlertCircle size={20} />}
              {isScanning ? 'Scanning...' : '1. Scan Database'}
            </button>
            
            <button 
              onClick={handleMigrate}
              disabled={isScanning || isMigrating || itemsToMigrate.length === 0}
              className="flex-1 bg-[#00a5a5] hover:bg-[#008b8b] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isMigrating ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              {isMigrating ? 'Migrating...' : `2. Migrate ${itemsToMigrate.length} Files`}
            </button>
          </div>
          
          {(isMigrating || progress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Migration Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#00a5a5] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          
          <div className="bg-slate-900 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-xs text-emerald-400">
            {log.length === 0 ? (
              <span className="text-slate-600">Waiting to scan...</span>
            ) : (
              log.map((line, i) => (
                <div key={i} className={line.includes('[FAIL]') ? 'text-red-400' : line.includes('[OK]') ? 'text-emerald-400' : 'text-slate-300'}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
