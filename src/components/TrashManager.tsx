'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, remove, set, push, get, update, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Trash2, RotateCcw, Clock, AlertCircle } from 'lucide-react';

export default function TrashManager({ collegeId }: { collegeId: string | undefined }) {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const PAGE_SIZE = 20;

  const fetchPage = async (direction: 'first' | 'next' | 'prev' = 'first') => {
    if (!collegeId) return;
    setLoading(true);

    try {
      const targetRef = ref(realtimeDb, `colleges/${collegeId}/trash`);
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
         
         // Client-side sort just for the visible page
         items.sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
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
  }, [collegeId]);

  const handleRestore = async (item: any) => {
    if (!collegeId || isProcessing) return;
    const confirmed = window.confirm(`Are you sure you want to restore this ${item.type}?`);
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      let targetPath = '';
      const data = item.data;

      if (item.type === 'Admission Inquiry') {
        targetPath = `colleges/${collegeId}/frontOffice/admissionInquiries/${data.id || item.originalId || push(ref(realtimeDb)).key}`;
      } else if (item.type === 'Student Admission') {
        targetPath = `colleges/${collegeId}/studentAdmissions/${data.id || item.originalId || push(ref(realtimeDb)).key}`;
      } else if (item.type === 'Staff') {
        targetPath = `staff/${data.id || item.originalId || push(ref(realtimeDb)).key}`;
      }

      if (targetPath) {
        await set(ref(realtimeDb, targetPath), data);
        await remove(ref(realtimeDb, `colleges/${collegeId}/trash/${item.id}`));
        alert('Item restored successfully.');
      } else {
        alert('Unknown module type. Cannot restore.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to restore item.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async (item: any) => {
    if (!collegeId || isProcessing) return;
    const confirmed = window.confirm('WARNING: This action is permanent and cannot be undone. Are you sure?');
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      // 1. Delete from College Trash
      await remove(ref(realtimeDb, `colleges/${collegeId}/trash/${item.id}`));

      // 2. Find and delete from Admin Trash
      const adminTrashSnap = await get(ref(realtimeDb, `admin/trash`));
      if (adminTrashSnap.exists()) {
        const adminTrashData = adminTrashSnap.val();
        for (const [key, val] of Object.entries(adminTrashData)) {
          const v = val as any;
          if (v.data?.id === item.data?.id || (v.originalId && v.originalId === item.data?.id)) {
             await remove(ref(realtimeDb, `admin/trash/${key}`));
          }
        }
      }

      // 3. Delete from original users collection if it's an inquiry or admission
      const uid = item.data?.studentUid || item.data?.uid;
      if (uid) {
         // Wipe global user completely if we are purging them from trash, 
         // as this means they are permanently deleted.
         await remove(ref(realtimeDb, `users/${uid}`));
         
         // Also wipe from admin registrations
         const adminStaffSnap = await get(ref(realtimeDb, `colleges/${collegeId}/staff`));
         let resolvedAdminUid = null;
         if (adminStaffSnap.exists()) {
            const staff = Object.values(adminStaffSnap.val() as Record<string, any>);
            const adminStaff = staff.find((s: any) => s.role === 'Admin');
            if (adminStaff) resolvedAdminUid = adminStaff.uid;
         }
         if (!resolvedAdminUid) {
            const staffSnap = await get(ref(realtimeDb, `staff`));
            if (staffSnap.exists()) {
               const staff = Object.values(staffSnap.val() as Record<string, any>);
               const adminStaff = staff.find((s: any) => s.role === 'Admin');
               if (adminStaff) resolvedAdminUid = adminStaff.uid;
            }
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

      alert('Item deleted permanently from all databases.');
    } catch (error) {
      console.error(error);
      alert('Failed to delete item.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-normal tracking-tight capitalize text-xs">Loading Trash...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#002147] rounded-[3rem] p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            <Trash2 size={14} className="text-[#00a5a5]" /> System Module
          </div>
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Global Trash Bin</h2>
          <p className="text-sm font-normal text-white/60">Manage deleted or rejected institutional records.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-black shadow-sm overflow-hidden p-8">
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-black">
                     <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Sr.No</th>
                     <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Module</th>
                     <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Date & Time</th>
                     <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Details</th>
                     <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center">Action</th>
                  </tr>
               </thead>
               <tbody className="border-b border-black">
                  {trashItems.map((item, i) => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-black">
                        <td className="px-6 py-6 border-r border-black text-center">
                           <span className="text-[16px] font-medium text-black">{(currentPage - 1) * PAGE_SIZE + i + 1}</span>
                        </td>
                        <td className="px-6 py-6 border-r border-black text-center">
                           <span className="px-4 py-1.5 rounded-lg bg-red-50 text-red-600 text-[14px] font-bold capitalize border border-red-100">
                              {item.type || 'N/A'}
                           </span>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <div className="flex items-center gap-2 text-[15px] font-medium text-black">
                              <Clock size={14} className="text-[#003366]" />
                              {new Date(item.deletedAt).toLocaleString()}
                           </div>
                        </td>
                        <td className="px-6 py-6 border-r border-black">
                           <div className="space-y-1">
                              <p className="text-[16px] font-medium text-black capitalize">
                                 {item.data?.studentName || item.data?.firstName + ' ' + (item.data?.lastName || '') || 'Unknown Record'}
                              </p>
                              <p className="text-[13px] font-normal text-slate-500 capitalize tracking-tight">
                                 {item.data?.courseName || item.data?.department || 'Institutional Data'}
                              </p>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center justify-center gap-3">
                              <button 
                                onClick={() => handleRestore(item)}
                                disabled={isProcessing}
                                className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                title="Restore Item"
                              >
                                 <RotateCcw size={18} />
                              </button>
                              <button 
                                onClick={() => handlePermanentDelete(item)}
                                disabled={isProcessing}
                                className="p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
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
}
