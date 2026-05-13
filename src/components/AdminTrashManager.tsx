'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

const AdminTrashManager = () => {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trashRef = ref(realtimeDb, `admin/trash`);
    const unsub = onValue(trashRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const sorted = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
        setTrashItems(sorted);
      } else {
        setTrashItems([]);
      }
      setLoading(false);
    });
    return () => unsub();
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

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm("CRITICAL: PERMANENTLY delete this record? This action cannot be undone and the data will be lost forever.")) return;
    try {
      await remove(ref(realtimeDb, `admin/trash/${id}`));
      alert("Record permanently purged from system.");
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
      <div className="bg-[#002147] rounded-[3rem] p-12 text-white border-b-8 border-black shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize">
            <Trash2 size={14} className="text-[#00a5a5]" /> System Infrastructure
          </div>
          <h2 className="text-4xl font-black tracking-tighter leading-none italic capitalize">Trash Bin</h2>
          <p className="text-sm font-normal text-white/60">Manage deleted or rejected institutional records.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-black shadow-xl p-8">
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
                  <td className="px-6 py-6 border-r border-black text-center text-[13px] font-medium">{idx + 1}</td>
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
                         onClick={() => handlePermanentDelete(item.id)} 
                         className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-black hover:bg-rose-600 hover:text-white transition-all shadow-sm" 
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
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-200">
                      <Trash2 size={64} className="opacity-10" />
                      <p className="text-[13px] font-bold text-black capitalize tracking-tight">The trash vault is currently empty</p>
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
};

export default AdminTrashManager;
