'use client';

import { useState, useEffect } from 'react';
import { realtimeDb, staffAuth } from '@/lib/firebase';
import { ref, onValue, set, remove, push, get } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Users, Search, Plus, User, ShieldCheck, Edit2, Trash2, X, ChevronRight, Loader2, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';

interface StaffRegistryManagerProps {
  collegeId?: string;
  adminUid?: string;
}

interface StaffForm {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  mobileNumber?: string;
  qualification?: string;
  workExperience?: string;
  currentAddress?: string;
  permanentAddress?: string;
  basicSalary?: string;
  pfDeduction?: string;
  esicDeduction?: string;
  profTax?: string;
  photo?: string | null;
  id?: string;
  collegeId?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Record<string, boolean>;
}

const InputField = ({ label, value, onChange, type = "text", placeholder = "", rightElement }: any) => (
  <div className="space-y-1.5 relative">
    <label className="text-[13px] font-normal text-black capitalize tracking-tight ml-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-normal text-black outline-none focus:border-[#003366] focus:bg-white transition-all shadow-sm"
      />
      {rightElement && <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">{rightElement}</div>}
    </div>
  </div>
);

const StaffRegistryManager = ({ collegeId, adminUid }: StaffRegistryManagerProps) => {
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [colleges, setColleges] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Action States
  const [isPermDrawerOpen, setIsPermDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [staffPerms, setStaffPerms] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Form States
  const [editForm, setEditForm] = useState<StaffForm>({});
  const [addForm, setAddForm] = useState<StaffForm>({
    firstName: '', lastName: '', email: '', password: '', employeeId: '', department: '',
    designation: '', joiningDate: '', mobileNumber: '', qualification: '', workExperience: '',
    currentAddress: '', permanentAddress: '', basicSalary: '', pfDeduction: '0', esicDeduction: '0',
    profTax: '0', photo: null
  });

  const staffModules = [
    { label: 'Dashboard', id: 1 },
    {
      label: 'Student information', id: 2,
      subItems: [{ label: 'Pending Admission', id: 1024 }, { label: 'Confirm Admission', id: 1022 }, { label: 'Cancel Admission', id: 1023 }, { label: 'Approved Admission', id: 25 }]
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
      subItems: [{ label: 'Admission inquiry', id: 91 }, { label: 'Concerns/complaint', id: 92 }, { label: 'Postal services', id: 93 }, { label: 'Contact Us', id: 94 }]
    },
    { label: 'Trash', id: 99 },
  ];

  useEffect(() => {
    const safetyTimer = setTimeout(() => setLoading(false), 500);
    const collegesRef = ref(realtimeDb, 'colleges');
    const staffRef = ref(realtimeDb, 'staff');

    // Use get() — staff list doesn't need real-time updates
    const loadData = async () => {
      try {
        const [collegeSnap, staffSnap] = await Promise.all([
          get(collegesRef),
          get(staffRef)
        ]);

        const collegesData = collegeSnap.exists() ? collegeSnap.val() : {};
        const collegeList = Object.entries(collegesData).map(([id, data]: [string, any]) => ({ id, name: data.name }));
        setColleges(collegeList);

        if (staffSnap.exists()) {
          const staffData = staffSnap.val();
          const staffList = Object.entries(staffData)
            .map(([id, data]: [string, any]) => ({
              ...data,
              id,
              collegeName: collegesData[data.collegeId]?.name || 'Unknown Institution'
            }))
            .filter(s => !collegeId || s.collegeId === collegeId);
          setAllStaff(staffList);
        } else {
          setAllStaff([]);
        }
      } catch (err) {
        console.error('Error loading staff data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => clearTimeout(safetyTimer);
  }, [collegeId]);

  const handleEditClick = (staff: any) => {
    setSelectedStaff(staff);
    setEditForm({ ...staff });
    setIsEditModalOpen(true);
  };

  const handlePermClick = (staff: any) => {
    setSelectedStaff(staff);
    setStaffPerms(staff.permissions || {});
    setIsPermDrawerOpen(true);
  };

  const handleAssignClick = (staff: any) => {
    setSelectedStaff(staff);
    setIsAssignModalOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    setIsSaving(true);
    try {
      await set(ref(realtimeDb, `staff/${selectedStaff.id}`), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });

      const userRef = ref(realtimeDb, `users/${selectedStaff.id}`);
      await set(userRef, {
        email: editForm.email,
        role: 'staff',
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        collegeId: editForm.collegeId || selectedStaff.collegeId || ''
      });

      alert('Staff profile updated!');
      setIsEditModalOpen(false);
    } catch (error: any) {
      alert('Update failed: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (staff: any) => {
    if (!window.confirm(`Are you sure you want to delete ${staff.firstName} ${staff.lastName}? The record will be moved to the trash bin.`)) return;
    try {
      // 1. Move to Trash
      const adminTrashRef = push(ref(realtimeDb, `admin/trash`));
      await set(adminTrashRef, {
        type: 'Staff',
        data: staff,
        originalId: staff.id,
        collegeId: staff.collegeId,
        deletedAt: Date.now(),
        metadata: `${staff.firstName} ${staff.lastName} (${staff.designation})`
      });

      // 2. Remove from active nodes
      await remove(ref(realtimeDb, `staff/${staff.id}`));
      await remove(ref(realtimeDb, `users/${staff.id}`));
      alert('Staff member moved to trash successfully.');
    } catch (error: any) {
      alert('Deletion failed: ' + error.message);
    }
  };

  const handleAddStaff = async () => {
    if (!addForm.email || !addForm.password) return alert('Email and Password are required');
    setIsSaving(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(staffAuth, addForm.email, addForm.password);
      const uid = userCredential.user.uid;

      const staffData = {
        ...addForm,
        id: uid,
        role: 'staff',
        collegeId: collegeId || '',
        createdAt: new Date().toISOString()
      };
      // Keep the password in the database so admin can view/edit it

      await set(ref(realtimeDb, `staff/${uid}`), staffData);

      await set(ref(realtimeDb, `users/${uid}`), {
        email: addForm.email,
        role: 'staff',
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        collegeId: collegeId || ''
      });

      alert('Staff created successfully!');
      setIsAddModalOpen(false);
      setAddForm({
        firstName: '', lastName: '', email: '', password: '', employeeId: '', department: '',
        designation: '', joiningDate: '', mobileNumber: '', qualification: '', workExperience: '',
        currentAddress: '', permanentAddress: '', basicSalary: '', pfDeduction: '0', esicDeduction: '0',
        profTax: '0', photo: null
      });
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignStaff = async (cid: string) => {
    if (!selectedStaff || !cid) return;
    setIsSaving(true);
    try {
      await set(ref(realtimeDb, `staff/${selectedStaff.id}/collegeId`), cid);
      alert('Staff assigned to college successfully!');
      setIsAssignModalOpen(false);
    } catch (error: any) {
      alert('Assignment failed: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePerms = async () => {
    if (!selectedStaff) return;
    setIsSaving(true);
    try {
      await set(ref(realtimeDb, `staff/${selectedStaff.id}/permissions`), staffPerms);
      alert('Access permissions updated!');
      setIsPermDrawerOpen(false);
    } catch (error: any) {
      alert('Permission update failed: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStaff = allStaff.filter(s => {
    const matchesSearch = (s.firstName?.toLowerCase() + ' ' + s.lastName?.toLowerCase()).includes(filterName.toLowerCase()) ||
      s.employeeId?.toLowerCase().includes(filterName.toLowerCase()) ||
      s.collegeName?.toLowerCase().includes(filterName.toLowerCase());
    const matchesCollege = !selectedCollege || s.collegeId === selectedCollege;
    return matchesSearch && matchesCollege;
  });

  if (loading) return <div className="p-20 text-center animate-pulse font-semibold text-slate-300 tracking-tight">Loading staff directory...</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 relative">
      <div className="bg-[#003366] text-white py-5 sm:py-8 px-4 sm:px-8 md:px-10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tighter">Staff Directory</h3>
            <p className="text-[13px] font-normal text-white/80 tracking-tight capitalize">{collegeId ? 'Institutional human resources' : 'Global human resources management'}</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {!collegeId && (
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-[13px] font-normal text-white outline-none focus:bg-white/20 transition-all w-full md:w-48 capitalize cursor-pointer"
            >
              <option value="" className="text-black">All Colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id} className="text-black">{c.name}</option>
              ))}
            </select>
          )}
          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search staff..."
              className="bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-6 text-[13px] font-normal text-white placeholder:text-white/60 outline-none focus:bg-white/20 transition-all w-full"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-white/90">
                Page {currentPage} of {Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE))}
              </span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(filteredStaff.length / PAGE_SIZE)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white text-[#003366] px-6 py-3 rounded-xl text-[12px] font-black capitalize shadow-xl hover:bg-slate-50 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={18} strokeWidth={3} /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-black shadow-xl p-4 sm:p-6 md:p-8">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50 border-b border-black whitespace-nowrap">
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Sr.No</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Staff Name</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">ID</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Department</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Designation</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">College</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center border-r border-black">Joining Date</th>
                <th className="px-4 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-slate-800">
              {filteredStaff.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((staff, index) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors border-b border-black">
                  <td className="px-4 py-6 text-[16px] font-medium text-black text-center border-r border-black">{((currentPage - 1) * PAGE_SIZE) + index + 1}</td>
                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-black">
                        {staff.photo ? <img src={staff.photo} className="w-full h-full object-cover" /> : <User size={16} className="text-slate-300" />}
                      </div>
                      <div>
                        <p className="text-[16px] font-medium text-black capitalize leading-none mb-1">{staff.firstName} {staff.lastName}</p>
                        <p className="text-[13px] text-black font-normal tracking-tight">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-center text-[15px] font-semibold border-r border-black">{staff.employeeId}</td>
                  <td className="px-4 py-6 text-center border-r border-black">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[14px] font-bold capitalize border border-indigo-100">{staff.department}</span>
                  </td>
                  <td className="px-4 py-6 text-center border-r border-black">
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[14px] font-bold capitalize border border-black">{staff.designation}</span>
                  </td>
                  <td className="px-4 py-6 text-center text-[15px] font-medium border-r border-black">{staff.collegeName}</td>
                  <td className="px-4 py-6 text-center text-[15px] font-medium border-r border-black">{staff.joiningDate || '-'}</td>
                  <td className="px-4 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {!staff.collegeId && !collegeId && (
                        <button onClick={() => handleAssignClick(staff)} className="p-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all border border-orange-100 shadow-sm active:scale-95" title="Assign to College">
                          <LinkIcon size={16} />
                        </button>
                      )}
                      <button onClick={() => handlePermClick(staff)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm active:scale-95" title="Manage Permissions">
                        <ShieldCheck size={16} />
                      </button>
                      <button onClick={() => handleEditClick(staff)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm active:scale-95" title="Edit Profile">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteStaff(staff)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95" title="Delete Staff">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-[13px] font-normal text-black capitalize tracking-tight">No staff members found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Drawer */}
      {isPermDrawerOpen && selectedStaff && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSaving && setIsPermDrawerOpen(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-200 bg-[#003366] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black capitalize tracking-tight">Permissions</h3>
                <p className="text-[13px] font-normal text-black capitalize tracking-normal">{selectedStaff.firstName} {selectedStaff.lastName}</p>
              </div>
              <button onClick={() => setIsPermDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 no-scrollbar">
              {staffModules.map(module => (
                <div key={module.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-sm font-normal text-black capitalize">{module.label}</span>
                      {module.subItems && (
                        <div className="flex items-center gap-3 mt-1">
                          <span onClick={() => {
                            const newPerms = { ...staffPerms, [module.id.toString()]: true };
                            module.subItems.forEach(s => newPerms[s.id.toString()] = true);
                            setStaffPerms(newPerms);
                          }} className="text-[9px] font-black text-emerald-500 capitalize tracking-tight cursor-pointer hover:underline">Enable All</span>
                          <span className="text-slate-200">|</span>
                          <span onClick={() => {
                            const newPerms = { ...staffPerms, [module.id.toString()]: false };
                            module.subItems.forEach(s => newPerms[s.id.toString()] = false);
                            setStaffPerms(newPerms);
                          }} className="text-[9px] font-black text-red-500 capitalize tracking-tight cursor-pointer hover:underline">Disable All</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setStaffPerms(prev => ({ ...prev, [module.id.toString()]: !prev[module.id.toString()] }))} className={`w-12 h-6 rounded-full transition-colors relative ${staffPerms[module.id.toString()] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${staffPerms[module.id.toString()] ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {module.subItems && staffPerms[module.id.toString()] && (
                    <div className="space-y-3 pl-4">
                      {module.subItems.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
                          <span className="text-xs font-normal text-slate-600 capitalize">{sub.label}</span>
                          <button onClick={() => setStaffPerms(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))} className={`w-10 h-5 rounded-full transition-colors relative ${staffPerms[sub.id] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${staffPerms[sub.id] ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-8 bg-white border-t border-slate-200">
              <button onClick={handleSavePerms} disabled={isSaving} className="w-full bg-[#00a5a5] text-white font-black py-4 rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                {isSaving ? 'Processing...' : 'Save Access Rules'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to College Modal */}
      {isAssignModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsAssignModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#003366] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LinkIcon size={24} />
                <h3 className="text-xl font-black">Assign to College</h3>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-normal text-black uppercase tracking-widest ml-1">Select Institution</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-normal outline-none focus:border-[#003366] transition-all"
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  value={selectedCollege}
                >
                  <option value="">Select College...</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button
                onClick={() => handleAssignStaff(selectedCollege)}
                disabled={isSaving || !selectedCollege}
                className="w-full bg-[#003366] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all disabled:opacity-50"
              >
                {isSaving ? 'Assigning...' : 'Assign Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-5xl bg-[#f8fafc] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
            <div className="p-4 sm:p-8 bg-[#003366] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center"><Edit2 size={20} className="sm:w-6 sm:h-6" /></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black capitalize tracking-tight">Edit Staff Details</h3>
                  <p className="text-xs sm:text-[13px] font-normal text-black uppercase tracking-widest">{selectedStaff?.firstName} {selectedStaff?.lastName}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} className="sm:w-6 sm:h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="First Name" value={editForm.firstName} onChange={(v: string) => setEditForm({ ...editForm, firstName: v })} />
                <InputField label="Last Name" value={editForm.lastName} onChange={(v: string) => setEditForm({ ...editForm, lastName: v })} />
                <InputField label="Employee ID" value={editForm.employeeId} onChange={(v: string) => setEditForm({ ...editForm, employeeId: v })} />
                <InputField label="Department" value={editForm.department} onChange={(v: string) => setEditForm({ ...editForm, department: v })} />
                <InputField label="Designation" value={editForm.designation} onChange={(v: string) => setEditForm({ ...editForm, designation: v })} />
                <InputField label="Mobile Number" value={editForm.mobileNumber} onChange={(v: string) => setEditForm({ ...editForm, mobileNumber: v })} />
                <InputField label="Joining Date" type="date" value={editForm.joiningDate} onChange={(v: string) => setEditForm({ ...editForm, joiningDate: v })} />
                <InputField label="Qualification" value={editForm.qualification} onChange={(v: string) => setEditForm({ ...editForm, qualification: v })} />
                <InputField label="Salary" value={editForm.basicSalary} onChange={(v: string) => setEditForm({ ...editForm, basicSalary: v })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight ml-1">Current Address</label>
                  <textarea
                    value={editForm.currentAddress}
                    onChange={(e) => setEditForm({ ...editForm, currentAddress: e.target.value })}
                    placeholder="Enter current residential address"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-normal text-black outline-none focus:border-[#003366] min-h-[100px] transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight ml-1">Permanent Address</label>
                  <textarea
                    value={editForm.permanentAddress}
                    onChange={(e) => setEditForm({ ...editForm, permanentAddress: e.target.value })}
                    placeholder="Enter permanent address"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-normal text-black outline-none focus:border-[#003366] min-h-[100px] transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Email Address (Login ID)" value={editForm.email} onChange={(v: string) => setEditForm({ ...editForm, email: v })} placeholder="staff@mitparadh.com" />
                <InputField
                  label="Password"
                  type={showEditPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(v: string) => setEditForm({ ...editForm, password: v })}
                  placeholder="••••••••"
                  rightElement={
                    <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="text-slate-400 hover:text-[#003366]">
                      {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-4 shrink-0">
              <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 capitalize tracking-tight hover:bg-slate-100">Cancel</button>
              <button onClick={handleUpdateStaff} disabled={isSaving} className="px-12 py-4 bg-[#003366] text-white rounded-2xl text-[11px] font-black capitalize shadow-xl hover:bg-black transition-all disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-5xl bg-[#f8fafc] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
            <div className="p-4 sm:p-8 bg-[#003366] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center"><Users size={20} className="sm:w-6 sm:h-6" /></div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black capitalize tracking-tight">Register New Staff</h3>
                  <p className="text-xs sm:text-[13px] font-normal text-black uppercase tracking-widest">{collegeId ? 'Institutional human resources' : 'Global HR Management'}</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} className="sm:w-6 sm:h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField label="First Name" value={addForm.firstName} onChange={(v: string) => setAddForm({ ...addForm, firstName: v })} />
                <InputField label="Last Name" value={addForm.lastName} onChange={(v: string) => setAddForm({ ...addForm, lastName: v })} />
                <InputField label="Employee ID" value={addForm.employeeId} onChange={(v: string) => setAddForm({ ...addForm, employeeId: v })} />
                <InputField label="Department" value={addForm.department} onChange={(v: string) => setAddForm({ ...addForm, department: v })} />
                <InputField label="Designation" value={addForm.designation} onChange={(v: string) => setAddForm({ ...addForm, designation: v })} />
                <InputField label="Mobile Number" value={addForm.mobileNumber} onChange={(v: string) => setAddForm({ ...addForm, mobileNumber: v })} />
                <InputField label="Joining Date" type="date" value={addForm.joiningDate} onChange={(v: string) => setAddForm({ ...addForm, joiningDate: v })} />
                <InputField label="Qualification" value={addForm.qualification} onChange={(v: string) => setAddForm({ ...addForm, qualification: v })} />
                <InputField label="Salary" value={addForm.basicSalary} onChange={(v: string) => setAddForm({ ...addForm, basicSalary: v })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight ml-1">Current Address</label>
                  <textarea
                    value={addForm.currentAddress}
                    onChange={(e) => setAddForm({ ...addForm, currentAddress: e.target.value })}
                    placeholder="Enter current residential address"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-normal text-black outline-none focus:border-[#003366] min-h-[100px] transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight">Permanent Address</label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-[#003366] focus:ring-[#003366]"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddForm((prev: StaffForm) => ({ ...prev, permanentAddress: prev.currentAddress }));
                          }
                        }}
                      />
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#003366] transition-colors">Same as current</span>
                    </label>
                  </div>
                  <textarea
                    value={addForm.permanentAddress}
                    onChange={(e) => setAddForm({ ...addForm, permanentAddress: e.target.value })}
                    placeholder="Enter permanent address"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-normal text-black outline-none focus:border-[#003366] min-h-[100px] transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Email Address (Login ID)" value={addForm.email} onChange={(v: string) => setAddForm({ ...addForm, email: v })} placeholder="staff@mitparadh.com" />
                <InputField
                  label="Initial Password"
                  type={showAddPassword ? "text" : "password"}
                  value={addForm.password}
                  onChange={(v: string) => setAddForm({ ...addForm, password: v })}
                  placeholder="••••••••"
                  rightElement={
                    <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} className="text-slate-400 hover:text-[#003366]">
                      {showAddPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-4 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 capitalize tracking-tight hover:bg-slate-100">Discard</button>
              <button onClick={handleAddStaff} disabled={isSaving} className="px-12 py-4 bg-[#003366] text-white rounded-2xl text-[11px] font-black capitalize shadow-xl hover:bg-black transition-all disabled:opacity-50">
                {isSaving ? 'Creating Account...' : 'Register Staff Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffRegistryManager;
