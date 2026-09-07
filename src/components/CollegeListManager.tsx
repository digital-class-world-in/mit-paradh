'use client';

import { useState, useEffect } from 'react';
import { realtimeDb, firebaseConfig, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref, onValue, get, set, remove, push } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { Building2, Plus, Search, Edit2, Trash2, X, ChevronRight, Loader2, Globe, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const CollegeListManager = ({ adminUid }: { adminUid?: string }) => {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
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
  const [collegePhoto, setCollegePhoto] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [headName, setHeadName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
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
    try {
      const cached = localStorage.getItem('cache_admin_colleges');
      if (cached) {
        setColleges(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) { }

    const collegesRef = ref(realtimeDb, 'colleges');
    const unsub = onValue(collegesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsedData = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setColleges(parsedData);
        try {
          localStorage.setItem('cache_admin_colleges', JSON.stringify(parsedData));
        } catch (e) { }
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
    setCollegePhoto(null);
    setWebsiteUrl('');
    setOwnerName('');
    setHeadName('');
    setMobileNumber('');
    setContactNumber('');
    setIsEditing(false);
    setEditingCollegeId(null);
    setError('');
    setIsModalOpen(false);
  };

  const handleEdit = (college: any) => {
    setCollegeName(college.name || '');
    setCollegeId(college.collegeId || '');
    setEmail(college.email || '');
    setPassword(college.password || '');
    setHeadPhoto(college.headPhoto || null);
    setCollegeLogo(college.logo || null);
    setCollegePhoto(college.collegePhoto || null);
    setWebsiteUrl(college.websiteUrl || '');
    setOwnerName(college.ownerName || '');
    setHeadName(college.headName || '');
    setMobileNumber(college.mobileNumber || '');
    setContactNumber(college.contactNumber || '');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'head' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const fileRef = storageRef(storage, `colleges/${type}_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on('state_changed', null,
        (error) => { console.error('Upload failed:', error); alert('Failed to upload image.'); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          if (type === 'head') setHeadPhoto(url);
          else setCollegeLogo(url);
        }
      );
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
          name: collegeName, collegeId, email, password, headPhoto, logo: collegeLogo, collegePhoto, websiteUrl,
          ownerName, headName, mobileNumber, contactNumber, role: 'college', updatedAt: new Date().toISOString(), uid: editingCollegeId
        };
        await set(ref(realtimeDb, `colleges/${editingCollegeId}`), collegeData);
        await set(ref(realtimeDb, `users/${editingCollegeId}`), { email, role: 'college', name: collegeName, uid: editingCollegeId });
      } else {
        const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;
        const collegeData = {
          name: collegeName, collegeId, email, password, headPhoto, logo: collegeLogo, collegePhoto, websiteUrl,
          ownerName, headName, mobileNumber, contactNumber, role: 'college', createdAt: new Date().toISOString(), uid
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
      <div className="bg-[#003366] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 sm:gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-3 sm:space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize">
            <Building2 size={14} className="text-[#00a5a5]" /> Institutional Registry
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-tight">College Management</h2>
          <p className="text-xs sm:text-sm font-normal text-white/60">Manage affiliated institutions and their access profiles.</p>
        </div>
        <button onClick={() => { setIsEditing(false); setIsModalOpen(true); }} className="relative z-10 bg-white text-[#003366] w-full md:w-auto px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-[11px] font-black capitalize shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center justify-center gap-3 shrink-0">
          <Plus size={20} strokeWidth={3} /> Register College
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-black shadow-xl p-4 sm:p-6 md:p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50 border-b border-black">
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black text-center">Sr.</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black">College Name</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black text-center">ID</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black border-r border-black text-center">Contact</th>
                <th className="px-6 py-5 text-[14px] font-normal text-black text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-slate-800">
              {colleges.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((col: any, idx: number) => (
                <tr key={col.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6 text-[14px] font-medium text-black text-center border-r border-black">{((currentPage - 1) * PAGE_SIZE) + idx + 1}.</td>
                  <td className="px-6 py-6 border-r border-black font-medium">{col.name}</td>
                  <td className="px-6 py-6 border-r border-black text-center font-bold text-slate-500">{col.collegeId}</td>
                  <td className="px-6 py-6 border-r border-black text-center text-sm">{col.mobileNumber}</td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(col)} className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(col.id)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {Math.max(1, Math.ceil(colleges.length / PAGE_SIZE))}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(colleges.length / PAGE_SIZE)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#003366] p-4 sm:p-8 md:p-10 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter">{isEditing ? 'Update Institution' : 'Register Institution'}</h3>
                <p className="text-xs sm:text-sm font-normal text-white/60">Configure college profile and access.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={24} className="sm:w-8 sm:h-8" /></button>
            </div>
            <form onSubmit={handleAddCollege} className="p-4 sm:p-8 md:p-12 overflow-y-auto space-y-6 sm:space-y-8 no-scrollbar">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 flex flex-wrap gap-8 p-6 bg-slate-50 rounded-3xl border border-black shadow-sm">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-black uppercase tracking-widest text-center">Head Photo</p>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'head')} />
                      <div className="w-32 h-40 rounded-2xl overflow-hidden border border-black shadow-md bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        {headPhoto ? (
                          <img src={headPhoto} className="w-full h-full object-cover" alt="Head" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-20">
                            <Plus size={20} />
                            <span className="text-[8px] font-bold">Upload</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-black uppercase tracking-widest text-center">Logo</p>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border border-black shadow-md flex items-center justify-center bg-white p-2 hover:bg-slate-50 transition-colors">
                        {collegeLogo ? (
                          <img src={collegeLogo} className="max-w-full max-h-full object-contain" alt="Logo" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-20 text-black">
                            <Plus size={20} />
                            <span className="text-[8px] font-bold uppercase">Upload</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>


                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">College Head Photo URL</label>
                  <input type="url" value={headPhoto || ''} onChange={(e) => setHeadPhoto(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">College Logo URL</label>
                  <input type="url" value={collegeLogo || ''} onChange={(e) => setCollegeLogo(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">College Head Name</label>
                  <input type="text" value={headName} onChange={(e) => setHeadName(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">College Name</label>
                  <input type="text" required value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">College ID</label>
                  <input type="text" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5] pr-12"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003366] transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">Mobile Number</label>
                  <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">Contact Number</label>
                  <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">Website URL</label>
                  <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full bg-white border border-black rounded-xl p-4 text-sm outline-none focus:border-[#00a5a5]" autoComplete="off" />
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
