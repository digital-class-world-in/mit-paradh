'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { User, UserPlus, FileText, Download, Upload, CheckCircle, XCircle, Search, Trash2, Edit, ChevronDown, Check, X, File, ShieldAlert, Loader2, Eye, ShieldCheck, Mail, LogOut, ArrowRight, Save, LayoutDashboard, Settings, Filter, FileSpreadsheet, MapPin, Users, Tag, GraduationCap, Briefcase, Landmark, History, CheckCircle2, Phone, Calendar, EyeOff, Image as ImageIcon, Lock, Edit2 } from 'lucide-react';
import GlobalDataFilter, { FilterState, applyGlobalFilters } from './GlobalDataFilter';
import { remove, update } from 'firebase/database';
import { getDefaultAdminUid } from '@/lib/adminUtils';

export default function StudentRegistrationManager({ collegeId, adminUid }: { collegeId?: string; adminUid?: string }) {
  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || '');

  useEffect(() => {
    if (adminUid) {
      setResolvedAdminUid(adminUid);
    } else {
      getDefaultAdminUid().then(setResolvedAdminUid);
    }
  }, [adminUid]);
  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCollegeId]);

  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [fullUserData, setFullUserData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    firstName: '', middleName: '', lastName: '', fatherFirstName: '',
    dateOfBirth: '', gender: '',
    email: '', password: '', phone: '', alternatePhone: '',
    securityQuestion: '', securityAnswer: '', regNo: '', manualRegNo: ''
  });

  useEffect(() => {
    try {
      const cached = localStorage.getItem(collegeId ? `cache_admin_student_reg_${collegeId}` : 'cache_admin_student_reg_global');
      if (cached) {
        setRegistrations(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) { }

    if (!realtimeDb || !resolvedAdminUid) {
      setLoading(false);
      return;
    }

    try {
      const safetyTimer = setTimeout(() => setLoading(false), 500);
      // Fetch colleges for filtering (Admin only)
      if (!collegeId) {
        const collegesRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/colleges`);
        onValue(collegesRef, (snap) => {
          if (snap.exists()) {
            setAvailableColleges(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
          }
        });
      }

      // Fetch from the global users node to get all registered students
      const regsRef = ref(realtimeDb, `users`);
      const unsub = onValue(regsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log("[StudentRegistrationManager] Global users data:", data);
          let lockedProfs: any[] = [];
          const entries = Object.entries(data).filter(([id, user]: [string, any]) => {
            if (!user || typeof user !== 'object') return false;
            return user?.role !== 'admin' && user?.role !== 'college' && user?.role !== 'staff';
          });

          lockedProfs = entries.map(([id, user]: [string, any]) => {
            try {
              const appList = user.applications ? Object.values(user.applications) : [];
              const appliedColleges = appList.map((a: any) => a?.collegeId).filter(Boolean);
              if (user.collegeId) appliedColleges.push(user.collegeId);

              const courseTypes = Array.from(new Set(appList.map((a: any) => a?.courseType).concat(user.profile?.courseType, user.courseType).filter(Boolean)));
              const courseNames = Array.from(new Set(appList.map((a: any) => a?.courseName).concat(user.profile?.courseName, user.courseName).filter(Boolean)));
              const durations = Array.from(new Set(appList.map((a: any) => a?.duration).concat(user.profile?.duration, user.duration).filter(Boolean)));
              const semesters = Array.from(new Set(appList.map((a: any) => a?.semester).concat(user.profile?.semester, user.semester).filter(Boolean)));
              const streams = Array.from(new Set(appList.map((a: any) => a?.stream || a?.branch || a?.streamName || a?.branchName).concat(user.profile?.stream, user.profile?.branch, user.stream, user.branch).filter(Boolean)));

              return {
                id,
                ...(user.profile || {}),
                email: user.email || '',
                password: user.password || '',
                regNo: user.regNo || 'PENDING',
                manualRegNo: user.manualRegNo || user.profile?.manualRegNo || '',
                profileLocked: user.profile?.profileLocked || false,
                createdAt: user.createdAt || user.registrationDate || user.profile?.createdAt || user.profile?.submittedAt || user.profile?.registrationDate || user.profile?.date || null,
                appliedColleges,
                courseType: courseTypes,
                courseName: courseNames,
                duration: durations,
                semester: semesters,
                stream: streams,
              };
            } catch (err) {
              console.error(`[StudentRegistrationManager] Error parsing user ${id}:`, err);
              return null;
            }
          }).filter(Boolean);

          // If collegeId is provided, only show students who applied to this college
          let finalRegs = [];
          if (collegeId) {
            finalRegs = lockedProfs.filter(reg => reg.appliedColleges?.includes(collegeId));
          } else {
            finalRegs = lockedProfs;
          }
          if (finalRegs.length === 0) {
            finalRegs.push({
              id: 'dummy-student-123',
              firstName: 'Test',
              lastName: 'Student',
              email: 'test@student.com',
              password: 'password123',
              regNo: 'MIT-2026-TEST',
              profileLocked: false,
              createdAt: new Date().toISOString(),
              appliedColleges: [],
              phone: '9876543210',
              gender: 'male',
              dateOfBirth: '2000-01-01'
            });
            console.log("[StudentRegistrationManager] Added dummy student for demonstration");
          }

          console.log("[StudentRegistrationManager] Setting finalRegs:", finalRegs);
          setRegistrations(finalRegs);
          try {
            localStorage.setItem(collegeId ? `cache_admin_student_reg_${collegeId}` : 'cache_admin_student_reg_global', JSON.stringify(finalRegs));
          } catch (e) { }
        } else {
          console.log("[StudentRegistrationManager] No snapshot data found for users node");
          setRegistrations([{
            id: 'dummy-student-123',
            firstName: 'Test',
            lastName: 'Student',
            email: 'test@student.com',
            password: 'password123',
            regNo: 'MIT-2026-TEST',
            profileLocked: false,
            createdAt: new Date().toISOString(),
            appliedColleges: [],
            phone: '9876543210',
            gender: 'male',
            dateOfBirth: '2000-01-01'
          }]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Realtime DB Error:', error);
        setRegistrations([{
          id: 'dummy-student-123',
          firstName: 'Test',
          lastName: 'Student',
          email: 'test@student.com',
          password: 'password123',
          regNo: 'MIT-2026-TEST',
          profileLocked: false,
          createdAt: new Date().toISOString(),
          appliedColleges: [],
          phone: '9876543210',
          gender: 'male',
          dateOfBirth: '2000-01-01'
        }]);
        setLoading(false);
      });
      return () => {
        clearTimeout(safetyTimer);
        unsub();
      };
    } catch (err) {
      console.error('Error setting up registrations listener:', err);
      setLoading(false);
    }
  }, [collegeId, resolvedAdminUid]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfileStatus, setFilterProfileStatus] = useState('');
  const [globalFilters, setGlobalFilters] = useState<FilterState>({
    collegeName: '', courseType: '', courseName: '', duration: '', semester: '', stream: '', academicYear: '', paymentStatus: ''
  });

  const baseFilteredRegistrations = registrations.filter(reg => {
    const matchesCollege = !selectedCollegeId || (reg.appliedColleges?.includes(selectedCollegeId) || reg.collegeId === selectedCollegeId);
    const matchesSearch = !searchQuery ||
      (reg.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.regNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProfile = !filterProfileStatus ||
      (filterProfileStatus === 'Locked' && reg.profileLocked) ||
      (filterProfileStatus === 'In Progress' && !reg.profileLocked);

    return matchesCollege && matchesSearch && matchesProfile;
  });

  const filteredRegistrations = applyGlobalFilters(baseFilteredRegistrations, globalFilters);

  const itemsPerPage = 10;
  const totalItems = filteredRegistrations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  const handleViewDetails = async (regId: string) => {
    setLoading(true);
    try {
      const userRef = ref(realtimeDb, `users/${regId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        setFullUserData(snap.val());
        setSelectedReg(registrations.find(r => r.id === regId));
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching full user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (regId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this student registration? This will remove all data and cannot be undone.")) return;

    try {
      const userRef = ref(realtimeDb, `users/${regId}`);
      await remove(userRef);
      if (resolvedAdminUid) {
        const adminRegRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${regId}`);
        await remove(adminRegRef);
      }
      alert("Student registration permanently deleted.");
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete registration.");
    }
  };

  const handleEditOpen = async (regId: string) => {
    try {
      const userRef = ref(realtimeDb, `users/${regId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const u = snap.val();       // root user node
        const p = u.profile || {};  // profile sub-node (filled after profile wizard)

        setSelectedReg({ ...registrations.find(r => r.id === regId), id: regId });
        setEditForm({
          // Name: registration form saves at root; profile wizard saves under profile
          firstName: u.firstName || p.firstName || '',
          lastName: u.lastName || p.lastName || '',
          middleName: u.middleName || p.middleName || '',
          // DOB & Gender
          dateOfBirth: u.dateOfBirth || p.dateOfBirth || '',
          gender: u.gender || p.gender || '',
          // Contact
          phone: u.phone || p.phone || '',
          alternatePhone: u.secondaryPhone || p.secondaryPhone || p.alternatePhone || p.alternativeMobile || '',
          // Father
          fatherFirstName: p.fatherFirstName || '',
          // Security (stored at root by registration form)
          securityQuestion: u.securityQuestion || '',
          securityAnswer: u.securityAnswer || '',
          // Credentials
          email: u.email || '',
          password: u.password || '',
          regNo: u.regNo || p.regNo || '',
          manualRegNo: u.manualRegNo || p.manualRegNo || ''
        });
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error opening edit modal:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedReg?.id) return;
    if (!editForm.email) { alert('Email is required.'); return; }
    setIsSavingEdit(true);
    try {
      const uid = selectedReg.id;
      const updates: any = {};

      // Global User updates
      if (resolvedAdminUid) {
        updates[`users/${uid}/adminUid`] = resolvedAdminUid;
      }
      updates[`users/${uid}/email`] = editForm.email;
      updates[`users/${uid}/password`] = editForm.password;
      updates[`users/${uid}/firstName`] = editForm.firstName;
      updates[`users/${uid}/lastName`] = editForm.lastName;
      updates[`users/${uid}/middleName`] = editForm.middleName || '';
      updates[`users/${uid}/phone`] = editForm.phone;
      updates[`users/${uid}/secondaryPhone`] = editForm.alternatePhone;
      updates[`users/${uid}/gender`] = editForm.gender;
      updates[`users/${uid}/dateOfBirth`] = editForm.dateOfBirth;
      updates[`users/${uid}/securityQuestion`] = editForm.securityQuestion;
      updates[`users/${uid}/securityAnswer`] = editForm.securityAnswer;
      updates[`users/${uid}/regNo`] = editForm.regNo;
      updates[`users/${uid}/manualRegNo`] = editForm.manualRegNo;
      updates[`users/${uid}/profile/firstName`] = editForm.firstName;
      updates[`users/${uid}/profile/lastName`] = editForm.lastName;
      updates[`users/${uid}/profile/fatherFirstName`] = editForm.fatherFirstName;
      updates[`users/${uid}/profile/dateOfBirth`] = editForm.dateOfBirth;
      updates[`users/${uid}/profile/gender`] = editForm.gender;
      updates[`users/${uid}/profile/phone`] = editForm.phone;
      updates[`users/${uid}/profile/alternatePhone`] = editForm.alternatePhone;

      // Admin-scoped registration updates
      if (resolvedAdminUid) {
        const adminRegPath = `users/${resolvedAdminUid}/modules/registrations/${uid}`;
        updates[`${adminRegPath}/adminUid`] = resolvedAdminUid;
        updates[`${adminRegPath}/email`] = editForm.email;
        updates[`${adminRegPath}/password`] = editForm.password;
        updates[`${adminRegPath}/firstName`] = editForm.firstName;
        updates[`${adminRegPath}/lastName`] = editForm.lastName;
        updates[`${adminRegPath}/middleName`] = editForm.middleName || '';
        updates[`${adminRegPath}/phone`] = editForm.phone;
        updates[`${adminRegPath}/secondaryPhone`] = editForm.alternatePhone;
        updates[`${adminRegPath}/gender`] = editForm.gender;
        updates[`${adminRegPath}/dateOfBirth`] = editForm.dateOfBirth;
        updates[`${adminRegPath}/securityQuestion`] = editForm.securityQuestion;
        updates[`${adminRegPath}/securityAnswer`] = editForm.securityAnswer;
        updates[`${adminRegPath}/regNo`] = editForm.regNo;
        updates[`${adminRegPath}/manualRegNo`] = editForm.manualRegNo;
        updates[`${adminRegPath}/profile/firstName`] = editForm.firstName;
        updates[`${adminRegPath}/profile/lastName`] = editForm.lastName;
        updates[`${adminRegPath}/profile/fatherFirstName`] = editForm.fatherFirstName;
        updates[`${adminRegPath}/profile/dateOfBirth`] = editForm.dateOfBirth;
        updates[`${adminRegPath}/profile/gender`] = editForm.gender;
        updates[`${adminRegPath}/profile/phone`] = editForm.phone;
        updates[`${adminRegPath}/profile/alternatePhone`] = editForm.alternatePhone;
      }

      await update(ref(realtimeDb), updates);
      alert('Student information updated successfully.');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to update student information.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openImagePreview = (url: string, title: string) => {
    setPreviewImage({ url, title });
    setIsPreviewOpen(true);
  };

  const handleExportData = () => {
    if (!filteredRegistrations || filteredRegistrations.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Auto Registration No",
      "First Name",
      "Middle Name",
      "Last Name",
      "Date of Birth",
      "Gender",
      "Mobile Number",
      "Email",
      "Profile Status",
      "Status",
      "Registration Date"
    ];

    const csvRows = [headers.join(",")];

    filteredRegistrations.forEach((reg, index) => {
      const row = [
        index + 1,
        `"${reg.regNo || ''}"`,
        `"${reg.firstName || ''}"`,
        `"${reg.middleName || ''}"`,
        `"${reg.lastName || ''}"`,
        `"${reg.dateOfBirth || ''}"`,
        `"${reg.gender || ''}"`,
        `"${reg.phone || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.profileLocked ? 'Locked' : 'In Progress'}"`,
        `"Submitted"`,
        `"${reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : ''}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-black rounded-full" />
          <div className="w-12 h-12 border-4 border-t-[#00a5a5] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-normal capitalize tracking-normal text-black animate-pulse">Loading Registrations</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {!collegeId && (
        <div className="bg-[#003366] text-white py-6 px-10 rounded-[2.5rem] shadow-2xl flex items-center justify-between border-b-4 border-black flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[14px] font-medium capitalize tracking-tight text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
            >
              <option value="" className="text-black">Filter by College</option>
              {availableColleges.map(c => (
                <option key={c.id} value={c.id} className="text-black">{c.name}</option>
              ))}
            </select>

            <select
              value={filterProfileStatus}
              onChange={(e) => setFilterProfileStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-[14px] font-medium capitalize tracking-tight text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
            >
              <option value="" className="text-black">All Profile Statuses</option>
              <option value="Locked" className="text-black">Profile Locked</option>
              <option value="In Progress" className="text-black">In Progress</option>
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, email, reg no..."
                className="bg-white/10 border border-white/20 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-white placeholder-white/60 outline-none focus:bg-white/20 transition-all w-60"
              />
              <User size={14} className="absolute left-3 top-2.5 text-white/60" />
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 px-6 py-2 rounded-xl border border-white/20">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Total Students</span>
            <span className="text-2xl font-black text-white">{totalItems}</span>
          </div>
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 bg-[#00a5a5] hover:bg-[#008f8f] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-tight transition-all shadow-md"
          >
            <Download size={18} /> Export Data
          </button>
        </div>
      )}

      <GlobalDataFilter
        data={registrations}
        filters={globalFilters}
        setFilters={setGlobalFilters}
      />

      <div className="bg-white rounded-[2.5rem] border border-black shadow-xl p-8">
        {collegeId && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-black uppercase tracking-tight">Registered Students</h2>
            <div className="bg-slate-100 text-[#003366] px-4 py-2 rounded-xl text-sm font-bold border border-slate-200">
              Total Students: {totalItems}
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-black">
            <thead>
              <tr className="bg-slate-50/50 border-b border-r border-black whitespace-nowrap">
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black text-center w-16">Sr No.</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black">Registration Date & Time</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black">Applicant Details</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black text-center">DOB</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black text-center">Gender</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black text-center">Mobile Number</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal border-r border-black">Login Credentials</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal text-center border-r border-black">Profile Status</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal text-center border-r border-black">Status</th>
                <th className="px-4 py-5 text-[14px] font-bold text-black tracking-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="border-b border-black">
              {paginatedRegistrations.length > 0 ? paginatedRegistrations.map((reg, index) => (
                <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors border-b border-black whitespace-nowrap">
                  <td className="px-4 py-6 border-r border-black text-center text-[14px] font-medium text-black">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-6 border-r border-black">
                    {reg.createdAt ? (
                      <>
                        <p className="text-[13px] font-bold text-black">{new Date(reg.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        <p className="text-[11px] font-medium text-slate-500">{new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </>
                    ) : (
                      <p className="text-[12px] font-medium text-slate-400 italic">N/A</p>
                    )}
                  </td>
                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-black overflow-hidden">
                        {reg.photoUrl ? (
                          <img src={reg.photoUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-normal text-black tracking-tight">{`${reg.firstName || ''} ${reg.middleName || ''} ${reg.lastName || ''}`.trim()}</p>
                        <p className="text-[11px] font-bold text-[#003366] mt-0.5">AUTO REG: {reg.regNo}</p>
                        {reg.manualRegNo && <p className="text-[11px] font-bold text-[#00a5a5] mt-0.5">MANUAL REG: {reg.manualRegNo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6 border-r border-black text-center">
                    <p className="text-[13px] font-medium text-black">{reg.dateOfBirth || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-6 border-r border-black text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${reg.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                      {reg.gender || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-6 border-r border-black text-center">
                    <p className="text-[13px] font-black text-[#00a5a5]">{reg.phone || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-6 border-r border-black">
                    <div className="flex flex-col gap-1">
                      <p className="text-[12px] font-medium text-black flex items-center gap-1.5"><Mail size={12} className="text-slate-400 shrink-0" /> <span className="truncate max-w-[150px]" title={reg.email}>{reg.email || 'N/A'}</span></p>
                      <p className="text-[12px] font-medium text-black flex items-center gap-1.5"><Lock size={12} className="text-slate-400 shrink-0" /> <span className="font-mono bg-slate-100 px-1 rounded">{reg.password || 'N/A'}</span></p>
                    </div>
                  </td>
                  <td className="px-4 py-6 border-r border-black text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${reg.profileLocked ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                      {reg.profileLocked ? 'LOCKED' : 'IN PROGRESS'}
                    </span>
                  </td>
                  <td className="px-4 py-6 text-center border-r border-black">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-semibold border border-emerald-100  tracking-tight">
                      SUBMITTED
                    </span>
                  </td>
                  <td className="px-4 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleViewDetails(reg.id)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                        title="Preview Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEditOpen(reg.id)}
                        className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm group"
                        title="Edit Registration"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRegistration(reg.id)}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        title="Delete Registration"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <UserPlus size={48} className="opacity-20" />
                      <p className="text-xs font-medium  tracking-tight">No registrations found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-black">
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Showing {startIndex + 1} to {endIndex} of {totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 border border-black rounded-xl text-xs font-bold transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent text-black cursor-pointer"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {(() => {
                  let pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className={`w-8 h-8 rounded-xl border border-black text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === 1 ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-50'
                          }`}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="dots-start" className="px-1 text-slate-400 font-bold">...</span>);
                    }
                  }

                  for (let p = startPage; p <= endPage; p++) {
                    pages.push(
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl border border-black text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === p ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-50'
                          }`}
                      >
                        {p}
                      </button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="dots-end" className="px-1 text-slate-400 font-bold">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-8 h-8 rounded-xl border border-black text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === totalPages ? 'bg-black text-white' : 'bg-white text-black hover:bg-slate-50'
                          }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 border border-black rounded-xl text-xs font-bold transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent text-black cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {isDetailsModalOpen && fullUserData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)} />
          <div className="bg-[#f8fafc] w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

            {/* Header */}
            <div className="bg-[#003366] p-8 text-white relative shrink-0">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="absolute right-8 top-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl">
                  {fullUserData.profile?.photoUrl ? (
                    <img src={fullUserData.profile.photoUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">
                      {`${fullUserData.profile?.firstName || ''} ${fullUserData.profile?.middleName || ''} ${fullUserData.profile?.lastName || ''}`.trim()}
                    </h3>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black capitalize tracking-tight border border-emerald-500/30">
                      Profile Locked
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-white/60">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Login Email</span>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Mail size={12} className="text-[#00a5a5]" />
                        <input
                          type="text"
                          value={fullUserData.email || ''}
                          onChange={(e) => setFullUserData({ ...fullUserData, email: e.target.value })}
                          className="bg-transparent border-none outline-none text-[13px] font-medium text-white/80 w-48"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Login Password</span>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 group">
                        <Lock size={12} className="text-[#00a5a5]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={fullUserData.password || ''}
                          onChange={(e) => setFullUserData({ ...fullUserData, password: e.target.value })}
                          className="bg-transparent border-none outline-none text-[13px] font-medium text-white/80 w-32"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Contact Phone</span>
                      <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Phone size={12} className="text-[#00a5a5]" /> {fullUserData.profile?.phone || 'No Phone'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Auto Registration No</span>
                      <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                        <Calendar size={12} className="text-[#00a5a5]" /> {fullUserData.regNo}
                      </p>
                    </div>

                    {(fullUserData.manualRegNo || fullUserData.profile?.manualRegNo) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest">Manual Registration No</span>
                        <p className="text-[13px] font-normal capitalize tracking-tight flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                          <Calendar size={12} className="text-[#00a5a5]" /> {fullUserData.manualRegNo || fullUserData.profile?.manualRegNo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">

              {/* Grid for Primary Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Personal Information */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <User size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Personal Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Full Name" value={`${fullUserData.profile?.firstName} ${fullUserData.profile?.middleName || ''} ${fullUserData.profile?.lastName}`} />
                    <DetailItem label="Gender" value={fullUserData.profile?.gender} />
                    <DetailItem label="Date of Birth" value={fullUserData.profile?.dateOfBirth} />
                    <DetailItem label="Marital Status" value={fullUserData.profile?.maritalStatus} />
                    <DetailItem label="Blood Group" value={fullUserData.profile?.bloodGroup} />
                    <DetailItem label="Religion" value={fullUserData.profile?.religion} />
                    <DetailItem label="Aadhaar Number" value={fullUserData.profile?.aadhaarNo} />
                  </div>
                </section>

                {/* Parent Details */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                      <Users size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Parent Details</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <DetailItem label="Father Name" value={`${fullUserData.profile?.fatherFirstName} ${fullUserData.profile?.fatherLastName}`} />
                      <DetailItem label="Father Phone" value={fullUserData.profile?.fatherPhone} />
                      <DetailItem label="Mother Name" value={`${fullUserData.profile?.motherFirstName} ${fullUserData.profile?.motherLastName}`} />
                      <DetailItem label="Mother Phone" value={fullUserData.profile?.motherPhone} />
                    </div>
                  </div>
                </section>

                {/* Address Information */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <MapPin size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Address Details</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailItem label="Residential Address" value={fullUserData.profile?.address} />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <DetailItem label="State" value={fullUserData.profile?.state} />
                      <DetailItem label="District" value={fullUserData.profile?.district} />
                      <DetailItem label="Taluka" value={fullUserData.profile?.taluka} />
                      <DetailItem label="Pincode" value={fullUserData.profile?.pincode} />
                    </div>
                  </div>
                </section>

                {/* Category & Caste */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                      <Tag size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Category & Caste</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <DetailItem label="Category" value={fullUserData.profile?.category} />
                    <DetailItem label="Caste" value={fullUserData.profile?.caste} />
                    <DetailItem label="Physically Handicapped" value={fullUserData.profile?.isPhysicallyHandicapped} />
                    {fullUserData.profile?.disabilityType && (
                      <DetailItem label="Disability Type" value={fullUserData.profile?.disabilityType} />
                    )}
                  </div>
                </section>
              </div>

              {/* Educational Qualifications */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Educational Qualifications</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[13px] font-normal text-black capitalize tracking-tight">
                        <th className="px-4 py-3 rounded-l-xl">Exam</th>
                        <th className="px-4 py-3">Board/University</th>
                        <th className="px-4 py-3">Result</th>
                        <th className="px-4 py-3">Passing Date</th>
                        <th className="px-4 py-3 text-right">Marks/Percentage</th>
                        <th className="px-4 py-3 rounded-r-xl text-center">Marksheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(fullUserData.qualifications || []).map((q: any, i: number) => (
                        <tr key={i} className="text-xs font-normal text-slate-600">
                          <td className="px-4 py-4 capitalize">{q.examination}</td>
                          <td className="px-4 py-4 capitalize">{q.board}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded ${q.result === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {q.result}
                            </span>
                          </td>
                          <td className="px-4 py-4">{q.passingDate}</td>
                          <td className="px-4 py-4 text-right">
                            {q.marksObtained}/{q.outOfMarks} ({q.percentage}%)
                          </td>
                          <td className="px-4 py-4 flex justify-center">
                            {q.marksheetUrl ? (
                              <PreviewButton label="View" onClick={() => openImagePreview(q.marksheetUrl, `${q.examination} Marksheet`)} />
                            ) : (
                              <span className="text-[13px] text-black">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Work Experience */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                      <Briefcase size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Work Experience</h4>
                  </div>
                  <div className="space-y-4">
                    {fullUserData.profile?.hasWorkExperience === 'Yes' && (fullUserData.workExperiences || []).length > 0 ? (
                      (fullUserData.workExperiences || []).map((exp: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-black">
                          <p className="text-xs font-normal text-slate-800 capitalize">{exp.organization}</p>
                          <p className="text-[13px] font-normal text-black capitalize mt-1">{exp.designation}</p>
                          <p className="text-[9px] font-bold text-[#00a5a5] mt-1">{exp.fromDate} - {exp.toDate}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] font-normal text-black capitalize tracking-tight text-center py-4">No Work Experience Recorded</p>
                    )}
                  </div>
                  {/* Training Section */}
                  {fullUserData.profile?.hasTraining === 'Yes' && (
                    <div className="pt-6 border-t border-black space-y-4">
                      <h4 className="text-[13px] font-normal text-black capitalize tracking-tight">Vocational Training</h4>
                      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-slate-700">Training Period</p>
                          <p className="text-[13px] text-black font-normal">{fullUserData.profile.trainingStartDate} to {fullUserData.profile.trainingEndDate}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Bank Details */}
                <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-black pb-4">
                    <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-500">
                      <Landmark size={20} />
                    </div>
                    <h4 className="text-sm font-normal text-black capitalize tracking-tight">Bank Details</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-y-4">
                    <DetailItem label="Bank Name" value={fullUserData.bankDetails?.bankName} />
                    <DetailItem label="Account Number" value={fullUserData.bankDetails?.accountNumber} />
                    <DetailItem label="IFSC Code" value={fullUserData.bankDetails?.ifscCode} />
                    <DetailItem label="Branch Name" value={fullUserData.bankDetails?.branchName} />
                    <DetailItem label="PAN Card No" value={fullUserData.profile?.panCardNo} />
                  </div>
                </section>
              </div>

              {/* Applications Section */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">Applications Details</h4>
                </div>
                <div className="space-y-4">
                  {fullUserData.applications && Object.values(fullUserData.applications).length > 0 ? (
                    Object.values(fullUserData.applications).map((app: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-black flex justify-between items-center">
                        <div>
                          <p className="text-[13px] font-black text-[#002147] capitalize">{app.collegeName || 'Unknown College'}</p>
                          <p className="text-[11px] font-bold text-slate-600 capitalize mt-1">{app.courseName || 'Unknown Course'} ({app.courseType || 'Regular'})</p>
                          <p className="text-[10px] font-medium text-slate-500 mt-1">Duration: {app.duration || 'N/A'} | Fees: ₹{app.fees || '0'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${app.status === 'Accepted' || app.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              app.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            {app.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] font-normal text-black capitalize tracking-tight text-center py-4">No Applications Found</p>
                  )}
                </div>
              </section>

              {/* Uploaded Documents Section */}
              <section className="bg-white rounded-3xl p-8 border border-black shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-black pb-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-sm font-normal text-black capitalize tracking-tight">All Uploaded Documents</h4>
                </div>
                <div className="flex flex-wrap gap-4">
                  {fullUserData.profile?.photoUrl && (
                    <PreviewButton label="Student Photo" onClick={() => openImagePreview(fullUserData.profile.photoUrl, "Student Photo")} />
                  )}
                  {fullUserData.profile?.signUrl && (
                    <PreviewButton label="Signature" onClick={() => openImagePreview(fullUserData.profile.signUrl, "Student Signature")} />
                  )}
                  {fullUserData.profile?.aadhaarFrontUrl && (
                    <PreviewButton label="Aadhaar Front" onClick={() => openImagePreview(fullUserData.profile.aadhaarFrontUrl, "Aadhaar Card Front")} />
                  )}
                  {fullUserData.profile?.aadhaarBackUrl && (
                    <PreviewButton label="Aadhaar Back" onClick={() => openImagePreview(fullUserData.profile.aadhaarBackUrl, "Aadhaar Card Back")} />
                  )}
                  {fullUserData.profile?.transferCertificateUrl && (
                    <PreviewButton label="Transfer Certificate" onClick={() => openImagePreview(fullUserData.profile.transferCertificateUrl, "Transfer Certificate")} />
                  )}
                  {fullUserData.profile?.bonafideCertificateUrl && (
                    <PreviewButton label="Bonafide Certificate" onClick={() => openImagePreview(fullUserData.profile.bonafideCertificateUrl, "Bonafide Certificate")} />
                  )}
                  {fullUserData.profile?.casteCertificateUrl && (
                    <PreviewButton label="Caste Certificate" onClick={() => openImagePreview(fullUserData.profile.casteCertificateUrl, "Caste Certificate")} />
                  )}
                  {fullUserData.profile?.domicileUrl && (
                    <PreviewButton label="Domicile Certificate" onClick={() => openImagePreview(fullUserData.profile.domicileUrl, "Domicile Certificate")} />
                  )}
                  {fullUserData.profile?.pwdCertificateUrl && (
                    <PreviewButton label="PWD Certificate" onClick={() => openImagePreview(fullUserData.profile.pwdCertificateUrl, "PWD Certificate")} />
                  )}
                  {fullUserData.profile?.trainingCertificateUrl && (
                    <PreviewButton label="Training Certificate" onClick={() => openImagePreview(fullUserData.profile.trainingCertificateUrl, "Training Certificate")} />
                  )}
                  {fullUserData.profile?.bankPassbookUrl && (
                    <PreviewButton label="Bank Passbook/Cheque" onClick={() => openImagePreview(fullUserData.profile.bankPassbookUrl, "Bank Document")} />
                  )}
                  {fullUserData.profile?.panCardUrl && (
                    <PreviewButton label="PAN Card" onClick={() => openImagePreview(fullUserData.profile.panCardUrl, "PAN Card")} />
                  )}
                  {(() => {
                    const sscQ = (fullUserData.profile?.qualifications || fullUserData.qualifications || []).find((q: any) => {
                      const e = (q.examination || '').toLowerCase();
                      return e === 'ssc' || e.includes('ssc') || e.includes('10th');
                    });
                    const url = fullUserData.profile?.sscMarksheetUrl || fullUserData.sscMarksheetUrl || sscQ?.marksheetUrl;
                    return url ? (
                      <PreviewButton label="SSC Marksheet (10th)" onClick={() => openImagePreview(url, "SSC Marksheet")} />
                    ) : null;
                  })()}
                  {(() => {
                    const hscQ = (fullUserData.profile?.qualifications || fullUserData.qualifications || []).find((q: any) => {
                      const e = (q.examination || '').toLowerCase();
                      return e === 'hsc' || e.includes('hsc') || e.includes('12th');
                    });
                    const url = fullUserData.profile?.hscMarksheetUrl || fullUserData.hscMarksheetUrl || hscQ?.marksheetUrl;
                    return url ? (
                      <PreviewButton label="HSC Marksheet (12th)" onClick={() => openImagePreview(url, "HSC Marksheet")} />
                    ) : null;
                  })()}
                  {(fullUserData.profile?.qualifications || fullUserData.qualifications || [])
                    .filter((q: any) => {
                      const e = (q.examination || '').toLowerCase();
                      return !e.includes('ssc') && !e.includes('10th') && !e.includes('hsc') && !e.includes('12th');
                    })
                    .map((q: any, i: number) =>
                      q.marksheetUrl ? (
                        <PreviewButton key={i} label={`${q.examination} Marksheet`} onClick={() => openImagePreview(q.marksheetUrl, `${q.examination} Marksheet`)} />
                      ) : null
                    )}
                </div>
                {(!fullUserData.profile?.photoUrl && !fullUserData.profile?.signUrl && !fullUserData.profile?.aadhaarFrontUrl && !fullUserData.profile?.aadhaarBackUrl && !fullUserData.profile?.bankPassbookUrl && !fullUserData.profile?.transferCertificateUrl && !fullUserData.profile?.bonafideCertificateUrl) && (
                  <p className="text-[13px] font-normal text-black capitalize tracking-tight text-center w-full py-4">No Documents Uploaded</p>
                )}
              </section>

            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white border-t border-black flex items-center justify-end shrink-0 gap-4">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 capitalize tracking-tight hover:bg-slate-100 transition-all border border-black"
              >
                Close View
              </button>
              <button
                onClick={async () => {
                  try {
                    const userRef = ref(realtimeDb, `users/${selectedReg.id}`);
                    await update(userRef, {
                      email: fullUserData.email,
                      password: fullUserData.password
                    });
                    if (resolvedAdminUid) {
                      const adminRegRef = ref(realtimeDb, `users/${resolvedAdminUid}/modules/registrations/${selectedReg.id}`);
                      await update(adminRegRef, {
                        email: fullUserData.email,
                        password: fullUserData.password
                      });
                    }
                    alert('Student credentials updated successfully.');
                    setIsDetailsModalOpen(false);
                  } catch (err) {
                    console.error(err);
                    alert('Failed to update student data.');
                  }
                }}
                className="bg-[#003366] hover:bg-black text-white font-black px-12 py-4 rounded-2xl text-[11px] uppercase tracking-wider transition-all shadow-xl flex items-center gap-3"
              >
                Update Information
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {isPreviewOpen && previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsPreviewOpen(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-white border-b border-black flex items-center justify-between">
              <h5 className="font-normal text-[#003366] capitalize tracking-tight text-sm flex items-center gap-2">
                <ImageIcon size={18} className="text-[#00a5a5]" /> {previewImage.title}
              </h5>
              <div className="flex gap-3">
                <a
                  href={previewImage.url}
                  download={`${previewImage.title.replace(/\s+/g, '_')}.png`}
                  className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all"
                  title="Download Image"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Registration Modal ──────────────────────────────── */}
      {isEditModalOpen && selectedReg && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/70 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

            {/* Header */}
            <div className="bg-[#003366] px-10 py-8 text-white shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-lg">
                  <Edit2 size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter leading-tight">Edit Registration</h3>
                  <p className="text-[12px] text-white/60 font-normal capitalize mt-0.5">
                    REG ID: {selectedReg.regNo || 'PENDING'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">

              {/* ── Account / Login ─────────────────── */}
              <div>
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Lock size={12} /> Login Credentials
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email ID</label>
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-black rounded-2xl px-4 py-3">
                      <Mail size={14} className="text-[#00a5a5] shrink-0" />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Enter email address"
                        className="flex-1 bg-transparent outline-none text-[14px] font-bold text-black placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-black rounded-2xl px-4 py-3">
                      <Lock size={14} className="text-[#00a5a5] shrink-0" />
                      <input
                        type={editShowPassword ? 'text' : 'password'}
                        value={editForm.password}
                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                        placeholder="Enter new password"
                        className="flex-1 bg-transparent outline-none text-[14px] font-bold text-black placeholder:text-slate-300"
                      />
                      <button onClick={() => setEditShowPassword(!editShowPassword)} className="text-slate-400 hover:text-[#003366] transition-colors">
                        {editShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Personal Info ────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User size={12} /> Personal Information
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={e => setEditForm({ ...editForm, firstName: capitalizeWords(e.target.value) })}
                      placeholder="Enter first name"
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Name (Surname)</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={e => setEditForm({ ...editForm, lastName: capitalizeWords(e.target.value) })}
                      placeholder="Enter last name / surname"
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Auto Registration No.</label>
                    <input
                      type="text"
                      value={editForm.regNo}
                      onChange={e => setEditForm({ ...editForm, regNo: e.target.value })}
                      placeholder="Enter Custom Auto Registration No."
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Manual Registration No.</label>
                    <input
                      type="text"
                      value={editForm.manualRegNo}
                      onChange={e => setEditForm({ ...editForm, manualRegNo: e.target.value })}
                      placeholder="Enter Manual Registration No."
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ── Father Details ────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={12} /> Father Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Father First Name</label>
                    <input
                      type="text"
                      value={editForm.fatherFirstName}
                      onChange={e => setEditForm({ ...editForm, fatherFirstName: capitalizeWords(e.target.value) })}
                      placeholder="Father's first name"
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ── Security Question ────────────────── */}
              <div>
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Lock size={12} /> Security Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Security Question</label>
                    <select
                      value={editForm.securityQuestion}
                      onChange={e => setEditForm({ ...editForm, securityQuestion: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Select a security question</option>
                      <option value="What is your pet's name?">What is your pet&apos;s name?</option>
                      <option value="What was your first school?">What was your first school?</option>
                      <option value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Security Answer</label>
                    <input
                      type="text"
                      value={editForm.securityAnswer}
                      onChange={e => setEditForm({ ...editForm, securityAnswer: e.target.value })}
                      placeholder="Enter your answer"
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl px-5 py-3 text-[14px] font-bold text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ── Contact ─────────────────────────── */}
              <div>
                <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Phone size={12} /> Contact Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Primary Mobile Number</label>
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-black rounded-2xl px-4 py-3">
                      <Phone size={14} className="text-[#00a5a5] shrink-0" />
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Enter mobile number"
                        className="flex-1 bg-transparent outline-none text-[14px] font-bold text-black placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Alternative Mobile Number</label>
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-black rounded-2xl px-4 py-3">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <input
                        type="tel"
                        value={editForm.alternatePhone}
                        onChange={e => setEditForm({ ...editForm, alternatePhone: e.target.value })}
                        placeholder="Enter alternate number (optional)"
                        className="flex-1 bg-transparent outline-none text-[14px] font-bold text-black placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-6 bg-white border-t border-black shrink-0 flex items-center justify-end gap-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-8 py-3.5 rounded-2xl text-[12px] font-black text-slate-500 capitalize tracking-tight hover:bg-slate-100 transition-all border border-black"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="bg-[#003366] hover:bg-[#00a5a5] text-white font-black px-12 py-3.5 rounded-2xl text-[12px] uppercase tracking-wider transition-all shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSavingEdit ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 size={18} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 capitalize tracking-tight mb-1">{label}</p>
      <p className="text-xs font-normal text-slate-700 capitalize tracking-tight break-words">{value || 'N/A'}</p>
    </div>
  );
}

function PreviewButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-black rounded-xl text-[13px] font-normal text-black capitalize tracking-tight hover:bg-[#00a5a5] hover:text-black hover:border-[#00a5a5] transition-all shadow-sm active:scale-95 group"
    >
      <Eye size={12} className="text-[#00a5a5] group-hover:text-white" /> {label}
    </button>
  );
}






