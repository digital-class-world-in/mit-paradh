'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { Plus, Trash2, Calendar, Link as LinkIcon, Bell, Megaphone, Loader2 } from 'lucide-react';

interface NoticeManagerProps {
  collegeId?: string;
  adminUid?: string;
}

const defaultNotice = {
  title: '',
  description: '',
  link: '',
};

export default function NoticeManager({ collegeId, adminUid }: NoticeManagerProps) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultNotice);
  const [isAddMode, setIsAddMode] = useState(false);

  // Derive the target database path based on the context
  const getDbPath = () => {
    return collegeId ? `colleges/${collegeId}/notices` : `notices`;
  };

  useEffect(() => {
    const noticesRef = ref(realtimeDb, getDbPath());
    const unsubscribe = onValue(noticesRef, (snapshot) => {
      let parsed: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        parsed = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val
        }));
      }
      setNotices(parsed.sort((a: any, b: any) => (b.date || 0) - (a.date || 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collegeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Title and Description are required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const noticeData = {
        ...formData,
        date: Date.now(),
        createdBy: adminUid || 'admin',
      };

      const newNoticeRef = push(ref(realtimeDb, getDbPath()));
      await set(newNoticeRef, noticeData);

      setFormData(defaultNotice);
      setIsAddMode(false);
      alert("Notice created successfully!");
    } catch (error) {
      console.error("Error creating notice:", error);
      alert("Failed to create notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noticeId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the notice "${title}"?`)) return;

    try {
      await remove(ref(realtimeDb, `${getDbPath()}/${noticeId}`));
    } catch (error) {
      console.error("Error deleting notice:", error);
      alert("Failed to delete notice.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span>Loading Notices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-black shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-[#002147] rounded-2xl flex items-center justify-center text-white shadow-lg border border-black/10 shrink-0">
            <Megaphone size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#002147] tracking-tighter uppercase">Notice Board Management</h2>
            <p className="text-[13px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              {collegeId ? 'Manage Institutional Notices' : 'Manage Global System Notices'}
            </p>
          </div>
        </div>
        <div className="relative z-10 shrink-0">
          {!isAddMode && (
            <button
              onClick={() => setIsAddMode(true)}
              className="bg-[#00a5a5] hover:bg-[#003366] text-white px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-tight shadow-xl transition-all flex items-center gap-3 active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Post New Notice
            </button>
          )}
        </div>
      </div>

      {/* Add Notice Form */}
      {isAddMode && (
        <div className="bg-white rounded-[2rem] border-2 border-[#00a5a5] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-[#00a5a5] px-8 py-6 flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Bell size={24} /> Create Announcement
            </h3>
            <button 
              onClick={() => { setIsAddMode(false); setFormData(defaultNotice); }}
              className="px-4 py-2 bg-white/20 hover:bg-white text-white hover:text-[#00a5a5] rounded-xl text-xs font-bold transition-colors"
            >
              CANCEL
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide pl-1">Notice Title <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                placeholder="E.g. Important Exam Schedule Update"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide pl-1">Description <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={4}
                placeholder="Enter the full details of the notice..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wide pl-1">Attachment Link (Optional)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <LinkIcon size={18} />
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-4 pr-4 pl-12 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#002147] hover:bg-[#00a5a5] disabled:opacity-50 text-white px-10 py-4 rounded-xl text-[14px] font-black uppercase tracking-tight shadow-xl transition-all flex items-center gap-2 active:scale-95"
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin" size={18} /> Posting...</>
                ) : (
                  <><Megaphone size={18} /> Post Notice</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices List */}
      <div className="bg-white border border-black rounded-[2rem] shadow-xl overflow-hidden">
        <div className="bg-slate-50 px-8 py-5 border-b border-black flex justify-between items-center">
          <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Active Notices ({notices.length})</h3>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
          {notices.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                <Megaphone size={40} />
              </div>
              <p className="text-lg font-bold text-slate-600">No notices posted yet</p>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">Use the 'Post New Notice' button above to create an announcement for students.</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="p-8 hover:bg-slate-50 transition-colors group flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-[#002147]">{notice.title}</h4>
                    <span className="shrink-0 text-[10px] font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase">
                      <Calendar size={12} />
                      {new Date(notice.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[14px] font-medium text-slate-600 leading-relaxed max-w-4xl whitespace-pre-wrap">
                    {notice.description}
                  </p>
                  {notice.link && (
                    <a 
                      href={notice.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-[12px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 w-fit transition-colors"
                    >
                      <LinkIcon size={14} /> View Attachment
                    </a>
                  )}
                </div>
                
                <div className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(notice.id, notice.title)}
                    className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl shadow-sm border border-rose-100 transition-all flex items-center gap-2 text-xs font-bold uppercase"
                  >
                    <Trash2 size={16} /> <span className="md:hidden">Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
