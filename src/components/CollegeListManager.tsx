'use client';

import { useState, useEffect } from 'react';
import { realtimeDb, firebaseConfig } from '@/lib/firebase';
import { ref, onValue, get, set, remove, push } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { Building2, Plus, Search, Edit2, Trash2, X, ChevronRight, Loader2, Globe, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const CollegeListManager = () => {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [collegeName, setCollegeName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [headPhoto, setHeadPhoto] = useState<string | null>(null);
  const [collegeLogo, setCollegeLogo] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);

  // Permissions State
  const [isPermDrawerOpen, setIsPermDrawerOpen] = useState(false);
  const [selectedPermCollege, setSelectedPermCollege] = useState<any>(null);
  const [collegePermissions, setCollegePermissions] = useState<Record<string, boolean>>({});
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const collegeModules = [
    { label: 'Dashboard', id: 1 },
    { 
      label: 'Student information', id: 2,
      subItems: [{ label: 'Student admission', id: 25 }, { label: 'New admission', id: 21 }, { label: 'Admission list', id: 1022 }, { label: 'Admission reports', id: 24 }]
    },
    { 
      label: 'Fees collection', id: 70,
      subItems: [{ label: 'Collect fees', id: 71 }, { label: 'Fees management', id: 72 }]
    },
    { 
      label: 'Human Resource', id: 3,
      subItems: [{ label: 'Staff directory', id: 31 }, { label: 'Staff id card', id: 34 }, { label: 'Leave card', id: 33 }, { label: 'Payroll', id: 35 }, { label: 'Staff login', id: 36 }]
    },
    { 
      label: 'Course management', id: 4,
      subItems: [{ label: 'Manage course', id: 41 }, { label: 'Syllabus management', id: 42 }, { label: 'Department setup', id: 43 }]
    },
    { 
      label: 'System settings', id: 5,
      subItems: [{ label: 'Institution profile', id: 51 }, { label: 'User management', id: 52 }, { label: 'Security settings', id: 53 }]
    },
    { 
      label: 'Front office', id: 90,
      subItems: [{ label: 'Admission inquiry', id: 91 }, { label: 'Concerns/complaint', id: 92 }, { label: 'Postal services', id: 93 }]
    },
    { label: 'Trash', id: 99 },
  ];

  useEffect(() => {
    const collegesRef = ref(realtimeDb, 'colleges');
    const unsub = onValue(collegesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setColleges(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setColleges([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setCollegeName('');
    setCollegeId('');
    setEmail('');
    setPassword('');
    setHeadPhoto(null);
    setCollegeLogo(null);
    setWebsiteUrl('');
    setOwnerName('');
    setMobileNumber('');
    setIsEditing(false);
    setEditingCollegeId(null);
    setError('');
    setIsModalOpen(false);
  };

  const handleEdit = (college: any) => {
    setCollegeName(college.name || '');
    setCollegeId(college.collegeId || '');
    setEmail(college.email || '');
    setPassword('********');
    setHeadPhoto(college.headPhoto || null);
    setCollegeLogo(college.logo || null);
    setWebsiteUrl(college.websiteUrl || '');
    setOwnerName(college.ownerName || '');
    setMobileNumber(college.mobileNumber || '');
    setIsEditing(true);
    setEditingCollegeId(college.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanently delete this college?')) {
      try {
        await remove(ref(realtimeDb, `colleges/${id}`));
        await remove(ref(realtimeDb, `users/${id}`));
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleOpenPermissions = async (college: any) => {
    setSelectedPermCollege(college);
    const permRef = ref(realtimeDb, `colleges/${college.id}/permissions`);
    const snap = await get(permRef);
    setCollegePermissions(snap.exists() ? snap.val() : {});
    setIsPermDrawerOpen(true);
  };

  const handleTogglePermission = (id: string, value: boolean) => {
    setCollegePermissions(prev => ({ ...prev, [id]: value }));
  };

  const handleSavePermissions = async () => {
    if (!selectedPermCollege) return;
    setIsSavingPerms(true);
    try {
      await set(ref(realtimeDb, `colleges/${selectedPermCollege.id}/permissions`), collegePermissions);
      alert("Permissions updated!");
      setIsPermDrawerOpen(false);
    } catch (err) {
      alert("Failed to save.");
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && colleges.length >= 4) {
      setError("Maximum limit of 4 colleges reached.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing && editingCollegeId) {
        const collegeData = {
          name: collegeName, collegeId, email, headPhoto, logo: collegeLogo, websiteUrl,
          ownerName, mobileNumber, role: 'college', updatedAt: new Date().toISOString(), uid: editingCollegeId
        };
        await set(ref(realtimeDb, `colleges/${editingCollegeId}`), collegeData);
        await set(ref(realtimeDb, `users/${editingCollegeId}`), { email, role: 'college', name: collegeName, uid: editingCollegeId });
      } else {
        const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;
        const collegeData = {
          name: collegeName, collegeId, email, headPhoto, logo: collegeLogo, websiteUrl,
          ownerName, mobileNumber, role: 'college', createdAt: new Date().toISOString(), uid
        };
        await set(ref(realtimeDb, `colleges/${uid}`), collegeData);
        await set(ref(realtimeDb, `users/${uid}`), { email, role: 'college', name: collegeName, uid });
      }
      alert("Success!");
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-300">Loading institutions...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-[#003366] rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize">
             <Building2 size={14} className="text-[#00a5a5]" /> Institutional Registry
           </div>
           <h2 className="text-4xl font-black tracking-tighter leading-none">College Management</h2>
           <p className="text-sm font-normal text-white/60">Manage affiliated institutions and their access profiles.</p>
        </div>
        <button onClick={() => { setIsEditing(false); setIsModalOpen(true); }} className="relative z-10 bg-white text-[#003366] px-10 py-5 rounded-2xl text-[11px] font-black capitalize shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-3">
           <Plus size={20} strokeWidth={3} /> Register Institution
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-black shadow-xl p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50 border-b border-black">
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black text-center">Sr.</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black">Institution Name</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black text-center">ID</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black text-center">Contact</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((col, idx) => (
                <tr key={col.id} className="hover:bg-slate-50 border-b border-black">
                  <td className="px-6 py-6 border-r border-black text-center font-medium">{idx + 1}</td>
                  <td className="px-6 py-6 border-r border-black font-medium">{col.name}</td>
                  <td className="px-6 py-6 border-r border-black text-center font-bold text-slate-500">{col.collegeId}</td>
                  <td className="px-6 py-6 border-r border-black text-center text-sm">{col.mobileNumber}</td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleOpenPermissions(col)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"><ShieldCheck size={16} /></button>
                       <button onClick={() => handleEdit(col)} className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white transition-all"><Edit2 size={16} /></button>
                       <button onClick={() => handleDelete(col.id)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#003366] p-10 text-white flex items-center justify-between">
               <div>
                  <h3 className="text-3xl font-black tracking-tighter">{isEditing ? 'Update Institution' : 'Register Institution'}</h3>
                  <p className="text-sm font-normal text-white/60">Configure institutional profile and access.</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={32} /></button>
            </div>
            <form onSubmit={handleAddCollege} className="p-12 overflow-y-auto space-y-8 no-scrollbar">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">College Name</label>
                    <input type="text" required value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">College ID</label>
                    <input type="text" required value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" />
                 </div>
                 {!isEditing && (
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                       <div className="relative">
                          <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                       </div>
                    </div>
                 )}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                    <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Website URL</label>
                    <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" />
                 </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#003366] text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                 {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Globe size={18} /> {isEditing ? 'Update Institution' : 'Register Institution'}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {isPermDrawerOpen && selectedPermCollege && (
        <div className="fixed inset-0 z-[200] flex">
           <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSavingPerms && setIsPermDrawerOpen(false)} />
           <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-8 border-b border-slate-200 bg-[#003366] text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black">Permissions</h3>
                    <p className="text-xs opacity-60">{selectedPermCollege.name}</p>
                 </div>
                 <button onClick={() => setIsPermDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/50">
                 {collegeModules.map((mod) => (
                    <div key={mod.id} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                       <div className="flex items-center justify-between border-b pb-4">
                          <span className="text-sm font-bold">{mod.label}</span>
                          <button onClick={() => handleTogglePermission(mod.id.toString(), !collegePermissions[mod.id])} className={`w-12 h-6 rounded-full transition-colors relative ${collegePermissions[mod.id] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${collegePermissions[mod.id] ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="p-8 bg-white border-t">
                 <button onClick={handleSavePermissions} disabled={isSavingPerms} className="w-full bg-[#00a5a5] text-white font-black py-4 rounded-2xl shadow-lg">
                    {isSavingPerms ? 'Saving...' : 'Save Permissions'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CollegeListManager;
