'use client';

import { useState } from 'react';
import { Database, HardDrive, Download, ShieldCheck, Archive } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

const loadJSZip = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).JSZip) {
      resolve((window as any).JSZip);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve((window as any).JSZip);
    script.onerror = () => reject(new Error('Failed to load JSZip'));
    document.head.appendChild(script);
  });
};

export default function BackupManager({ adminUid }: { adminUid?: string }) {
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [progressText, setProgressText] = useState('');

  const handleFullSystemBackup = async () => {
    setIsExportingFull(true);
    setProgressText('Initializing...');
    
    try {
      // 1. Fetch entire database
      setProgressText('Fetching Realtime Database...');
      // Backup the entire root database for a full system backup
      const dbRef = ref(realtimeDb, '/');
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        alert("No data found to backup.");
        setIsExportingFull(false);
        return;
      }
      
      const dbData = snapshot.val();
      const jsonString = JSON.stringify(dbData, null, 2);

      // 2. Find all Firebase Storage URLs inside the JSON string
      setProgressText('Scanning for uploaded files...');
      const urlRegex = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"']+/g;
      const urls = [...new Set(jsonString.match(urlRegex) || [])];

      // 3. Load JSZip dynamically
      setProgressText('Loading compression engine...');
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      // Add database to zip root
      zip.file('database_backup.json', jsonString);

      // Create storage folders structure
      const storageFolder = zip.folder('storage_files');
      const studentsFolder = storageFolder?.folder('students');
      const staffFolder = storageFolder?.folder('staff');
      const documentsFolder = storageFolder?.folder('documents');

      // 4. Download each URL and place in the correct folder
      const fetchWithRetry = async (url: string, retries = 3): Promise<Blob | null> => {
        for (let i = 0; i < retries; i++) {
          try {
            const res = await fetch(url);
            if (res.ok) return await res.blob();
          } catch (e) {
             // ignore and retry
          }
        }
        return null;
      };

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        setProgressText(`Downloading file ${i + 1} of ${urls.length}...`);
        
        // Determine file name and category
        let fileName = `file_${i}.dat`;
        let category = documentsFolder;
        
        try {
          const urlObj = new URL(url);
          // Firebase storage paths are URL encoded in the pathname
          const pathSegs = urlObj.pathname.split('/o/');
          if (pathSegs.length > 1) {
            const path = decodeURIComponent(pathSegs[1]);
            // Attempt to keep original filename, ensuring uniqueness just in case
            fileName = `${i}_${path.split('/').pop() || fileName}`;
            
            const fullPathLower = path.toLowerCase();
            if (fullPathLower.includes('student') || fullPathLower.includes('profile')) {
              category = studentsFolder;
            } else if (fullPathLower.includes('staff') || fullPathLower.includes('teacher')) {
              category = staffFolder;
            } else {
              category = documentsFolder;
            }
          }
        } catch (e) {
          // ignore parsing error
        }

        const blob = await fetchWithRetry(url);
        if (blob) {
          category?.file(fileName, blob);
        }
      }

      // 5. Generate ZIP
      setProgressText('Compressing all data...');
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP
      setProgressText('Downloading...');
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `full_system_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Backup failed:", error);
      alert("Failed to perform full backup. Please try again.");
    } finally {
      setIsExportingFull(false);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
      <div className="bg-[#002147] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-3 sm:space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
            <ShieldCheck size={14} className="text-[#00a5a5]" />
            System Security
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tighter capitalize leading-tight text-white">
            Data Backup Manager
          </h2>
          <p className="text-xs sm:text-sm font-normal text-white/70 max-w-xl">
            Securely export and backup your institutional data. A full backup will collect all textual data along with uploaded media files into a single ZIP archive.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 sm:space-y-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner border border-indigo-100">
            <Archive size={36} className="sm:w-12 sm:h-12" />
          </div>
          <div className="max-w-lg space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">Backup Full System</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Export all Firebase Realtime Database data as JSON and download all Firebase Storage files (images, PDFs, student documents) directly into a structured ZIP file.
            </p>
          </div>
          
          <button
            onClick={handleFullSystemBackup}
            disabled={isExportingFull}
            className="flex items-center justify-center gap-3 w-full max-w-md bg-[#5D5fb1] hover:bg-indigo-700 text-white px-6 sm:px-8 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingFull ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {progressText || 'Processing...'}
              </>
            ) : (
              <>
                <Download size={20} /> Generate Full Backup ZIP
              </>
            )}
          </button>
          
          <div className="text-[12px] font-semibold text-slate-400 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            Output Structure: database_backup.json, storage_files/ (students/, staff/, documents/)
          </div>
        </div>
      </div>
    </div>
  );
}
