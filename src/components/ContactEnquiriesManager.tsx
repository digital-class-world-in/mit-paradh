'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Mail, Search, Trash2, Calendar, User, MessageSquare, Phone } from 'lucide-react';

export default function ContactEnquiriesManager({ adminUid }: { adminUid?: string }) {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const enquiriesRef = ref(realtimeDb, 'contact_enquiries');
    const unsubscribe = onValue(enquiriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data)
          .map(([id, val]: any) => ({
            id,
            ...val
          }))
          .sort((a, b) => {
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            return timeB - timeA;
          });
        setEnquiries(list);
      } else {
        setEnquiries([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      await remove(ref(realtimeDb, `contact_enquiries/${id}`));
      // Don't need to alert, it'll just disappear from the list
    } catch (error: any) {
      alert("Failed to delete: " + error.message);
    }
  };

  const filteredEnquiries = enquiries.filter(e =>
    (e.name?.toLowerCase() || '').includes(filterQuery.toLowerCase()) ||
    (e.email?.toLowerCase() || '').includes(filterQuery.toLowerCase()) ||
    (e.phone?.toLowerCase() || '').includes(filterQuery.toLowerCase()) ||
    (e.message?.toLowerCase() || '').includes(filterQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-20 text-center animate-pulse font-semibold text-slate-300 tracking-tight">Loading contact enquiries...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <div className="bg-[#003366] text-white py-8 px-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <Mail size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tighter">Contact Us Enquiries</h3>
            <p className="text-[13px] font-normal text-white/80 tracking-tight capitalize">Messages submitted via the your website</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search name, email, mobile, message..."
              className="bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-6 text-[13px] font-normal text-white placeholder-white/50 outline-none focus:bg-white/20 transition-all w-full"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-black shadow-xl p-8">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50 border-b border-black whitespace-nowrap">
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight text-center border-r border-black w-16">Sr.No</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black w-48">Date & Time</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black w-56">Name</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black w-64">Email</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black w-48">Mobile Number</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight border-r border-black">Message Content</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black capitalize tracking-tight text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enquiry, index) => (
                <tr key={enquiry.id} className="hover:bg-slate-50 transition-colors border-b border-black">
                  <td className="px-4 py-6 text-[16px] font-medium text-black text-center border-r border-black">{index + 1}</td>

                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={16} />
                      <span className="text-[14px] font-medium">
                        {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#00a5a5]" />
                      <span className="text-[15px] font-bold text-slate-800 capitalize">{enquiry.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="text-[13px] font-medium text-blue-600">
                        <a href={`mailto:${enquiry.email}`} className="hover:underline">{enquiry.email}</a>
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-700">
                        {enquiry.phone ? (
                          <a href={`tel:${enquiry.phone}`} className="hover:underline">{enquiry.phone}</a>
                        ) : '-'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-start gap-3">
                      <MessageSquare size={16} className="text-slate-400 shrink-0 mt-1" />
                      <p className="text-[14px] text-slate-700 font-medium leading-relaxed max-w-2xl whitespace-pre-line">
                        {enquiry.message}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-6 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleDelete(enquiry.id)}
                        className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95"
                        title="Delete Enquiry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-[15px] font-medium text-slate-500 capitalize tracking-tight">
                    No enquiries found.
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
