'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, remove, set, push } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Trash2, RotateCcw, Clock, AlertCircle } from 'lucide-react';

export default function TrashManager({ collegeId }: { collegeId: string | undefined }) {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!collegeId) return;
    const refDB = ref(realtimeDb, `colleges/${collegeId}/trash`);
    const unsub = onValue(refDB, (snap) => {
      if (snap.exists()) {
        const items = Object.entries(snap.val()).map(([id, val]: any) => ({
          ...val,
          id
        }));
        // Sort: Newest first
        items.sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
        setTrashItems(items);
      } else {
        setTrashItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
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

  const handlePermanentDelete = async (itemId: string) => {
    if (!collegeId || isProcessing) return;
    const confirmed = window.confirm('WARNING: This action is permanent and cannot be undone. Are you sure?');
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await remove(ref(realtimeDb, `colleges/${collegeId}/trash/${itemId}`));
      alert('Item deleted permanently.');
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
                           <span className="text-[16px] font-medium text-black">{i + 1}</span>
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
                                onClick={() => handlePermanentDelete(item.id)}
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
                  {trashItems.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-slate-300">
                              <AlertCircle size={48} className="opacity-20" />
                              <p className="text-[13px] font-normal text-black capitalize tracking-tight">Trash bin is currently empty.</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}



