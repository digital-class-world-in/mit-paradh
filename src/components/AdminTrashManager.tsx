'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, push, set, remove, get, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

const AdminTrashManager = ({ adminUid }: { adminUid?: string }) => {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const PAGE_SIZE = 20;

  const fetchPage = async (direction: 'first' | 'next' | 'prev' = 'first') => {
    setLoading(true);

    try {
      const targetRef = ref(realtimeDb, `admin/trash`);
      let q;

      if (direction === 'first') {
         q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
         setPageHistory([]);
         setCurrentPage(1);
      } else if (direction === 'next' && lastKey) {
         setPageHistory(prev => [...prev, firstKey as string]);
         q = query(targetRef, orderByKey(), startAfter(lastKey), limitToFirst(PAGE_SIZE));
         setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev' && pageHistory.length > 0) {
         const newHistory = [...pageHistory];
         const prevFirstKey = newHistory.pop();
         setPageHistory(newHistory);
         if (newHistory.length > 0) {
            q = query(targetRef, orderByKey(), startAfter(newHistory[newHistory.length - 1]), limitToFirst(PAGE_SIZE));
         } else {
            q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
         }
         setCurrentPage(prev => prev - 1);
      } else {
         q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
      }

      const snapshot = await get(q);
      const items: any[] = [];
      let rawKeys: string[] = [];

      if (snapshot.exists()) {
         snapshot.forEach((child) => {
            items.push({ id: child.key, ...child.val() });
            rawKeys.push(child.key);
         });
      }

      if (rawKeys.length > 0) {
         setFirstKey(rawKeys[0]);
         setLastKey(rawKeys[rawKeys.length - 1]);
         
         items.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
         setTrashItems(items);
      } else if (direction === 'first') {
         setTrashItems([]);
      }

      setHasMore(rawKeys.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage('first');
  }, []);

  const handleRestore = async (item: any) => {
    if (!window.confirm(`Are you sure you want to restore this ${item.type || 'record'}?`)) return;
    try {
      let targetPath = '';
      const cId = item.collegeId;
      
      // Determine original path based on module type
      switch (item.type) {
        case 'Admission Inquiry':
          targetPath = `colleges/${cId}/frontOffice/admissionInquiries/${item.originalId || item.id}`;
          break;
        case 'Student Admission':
          targetPath = `colleges/${cId}/studentAdmissions/${item.originalId || item.id}`;
          break;
        case 'Staff':
          targetPath = `colleges/${cId}/staff/${item.originalId || item.id}`;
          break;
        default:
          targetPath = `colleges/${cId}/admissions/${item.originalId || item.id}`;
      }

      // 1. Move back to original location
      await set(ref(realtimeDb, targetPath), item.data);

      // 2. Remove from trash
      await remove(ref(realtimeDb, `admin/trash/${item.id}`));
      alert("Record restored successfully to its original module.");
    } catch (err) {
      console.error(err);
      alert("Failed to restore record.");
    }
  };

  const handlePermanentDelete = async (item: any) => {
    if (!window.confirm("CRITICAL: PERMANENTLY delete this record? This action cannot be undone and the data will be lost forever.")) return;
    try {
      // 1. Remove from Admin Trash
      await remove(ref(realtimeDb, `admin/trash/${item.id}`));
      
      // 2. Remove from College Trash if it exists
      const collegeId = item.collegeId || item.data?.collegeId;
      if (collegeId) {
        const collegeTrashSnap = await get(ref(realtimeDb, `colleges/${collegeId}/trash`));
        if (collegeTrashSnap.exists()) {
           const trashData = collegeTrashSnap.val();
           for (const [key, val] of Object.entries(trashData)) {
              const v = val as any;
              if (v.data?.id === item.data?.id || (v.originalId && v.originalId === item.data?.id)) {
                 await remove(ref(realtimeDb, `colleges/${collegeId}/trash/${key}`));
              }
           }
        }
      }

      // 3. Delete from original users collection if it's an inquiry or admission
      const uid = item.data?.studentUid || item.data?.uid;
      if (uid) {
         // Wipe global user completely if we are purging them from trash
         await remove(ref(realtimeDb, `users/${uid}`));
         
         // Also wipe from admin registrations
         const staffSnap = await get(ref(realtimeDb, `staff`));
         let resolvedAdminUid = null;
         if (staffSnap.exists()) {
            const staff = Object.values(staffSnap.val() as Record<string, any>);
            const adminStaff = staff.find((s: any) => s.role === 'Admin');
            if (adminStaff) resolvedAdminUid = adminStaff.uid;
         }
         
         if (resolvedAdminUid) {
            await remove(ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${uid}`));
         }
      }

      // 4. Delete staff record completely if it's a staff member
      if (item.type === 'Staff') {
         await remove(ref(realtimeDb, `staff/${item.data?.id || item.originalId}`));
         if (item.data?.uid) {
            await remove(ref(realtimeDb, `users/${item.data.uid}`));
         }
      }

      alert("Record permanently purged from system and all associated databases.");
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-black rounded-full" />
          <div className="w-12 h-12 border-4 border-t-[#ef4444] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-normal capitalize tracking-normal text-black animate-pulse">Synchronizing Trash Vault</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#002147] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white border-b-8 border-black shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-3 sm:space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize">
            <Trash2 size={14} className="text-[#00a5a5]" /> System Infrastructure
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-tight italic capitalize">Trash Bin</h2>
          <p className="text-xs sm:text-sm font-normal text-white/60">Manage deleted or rejected institutional records.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black shadow-xl p-4 sm:p-6 md:p-8">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50 border-b border-black">
                <th className="px-6 py-5 text-[13px] font-bold border-r border-black text-center w-20">Sr No.</th>
                <th className="px-6 py-5 text-[13px] font-bold border-r border-black">Date & Time</th>
                <th className="px-6 py-5 text-[13px] font-bold border-r border-black">Module</th>
                <th className="px-6 py-5 text-[13px] font-bold border-r border-black">Details</th>
                <th className="px-6 py-5 text-[13px] font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {trashItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 border-b border-black transition-colors">
                  <td className="px-6 py-6 border-r border-black text-center text-[13px] font-medium">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-6 border-r border-black">
                     <p className="text-[14px] font-bold text-black">
                       {item.deletedAt ? new Date(item.deletedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                     </p>
                  </td>
                  <td className="px-6 py-6 border-r border-black">
                     <span className="px-3 py-1 bg-[#5D5fb1]/10 text-[#5D5fb1] rounded-full text-[11px] font-black uppercase tracking-tighter border border-[#5D5fb1]/20">
                       {item.type || 'Admission Inquiry'}
                     </span>
                  </td>
                  <td className="px-6 py-6 border-r border-black">
                     <p className="text-[14px] font-bold text-black capitalize">{item.data?.studentName || item.metadata || 'N/A'}</p>
                     <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase">ID: {item.id.slice(0, 12)}...</p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-3">
                       <button 
                         onClick={() => handleRestore(item)} 
                         className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm" 
                         title="Restore Record"
                       >
                         <RotateCcw size={18} />
                       </button>
                       <button 
                         onClick={() => handlePermanentDelete(item)} 
                         className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-black hover:bg-rose-600 hover:text-white transition-all shadow-sm" 
                         title="Permanent Delete"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trashItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[14px] font-medium text-slate-500 bg-slate-50/50">
                    Trash is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-6 bg-slate-50 border border-black p-4 rounded-2xl">
          <button
            onClick={() => fetchPage('prev')}
            disabled={loading || currentPage === 1}
            className="px-6 py-2 bg-white border border-black text-black rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
          >
            Previous Page
          </button>
          <span className="text-[13px] font-black text-black tracking-tight">
            Page {currentPage}
          </span>
          <button
            onClick={() => fetchPage('next')}
            disabled={loading || !hasMore}
            className="px-6 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 disabled:opacity-50 transition-all"
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTrashManager;
