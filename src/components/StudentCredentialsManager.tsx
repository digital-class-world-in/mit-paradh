'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import {
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  KeyRound,
  Mail,
  Phone,
  User,
  ShieldCheck,
  RotateCcw,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Building2,
  Calendar,
  Lock,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import GlobalDataFilter, { FilterState, applyGlobalFilters } from './GlobalDataFilter';

interface StudentCredentialsManagerProps {
  collegeId?: string;
  adminUid?: string;
}

export default function StudentCredentialsManager({ collegeId, adminUid }: StudentCredentialsManagerProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfileStatus, setFilterProfileStatus] = useState('');
  const [filterPasswordStatus, setFilterPasswordStatus] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');

  // Password visibility
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit Password Modal
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Global filters (Stream / Branch, Course, Course Type, etc.)
  const [globalFilters, setGlobalFilters] = useState<FilterState>({
    collegeName: '',
    courseType: '',
    courseName: '',
    duration: '',
    semester: '',
    stream: '',
    academicYear: '',
    paymentStatus: ''
  });

  // Fetch available colleges
  useEffect(() => {
    if (!realtimeDb) return;
    try {
      const collegesRef = ref(realtimeDb, 'colleges');
      onValue(collegesRef, (snap) => {
        if (snap.exists()) {
          const cols = Object.entries(snap.val()).map(([id, val]: any) => ({
            id,
            name: val.name || val.collegeName || 'Unknown College',
            ...val
          }));
          setAvailableColleges(cols);
        }
      });
    } catch (e) {
      console.error('Error fetching colleges:', e);
    }
  }, []);

  // Fetch all students and their credentials from Realtime Database
  useEffect(() => {
    if (!realtimeDb) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = ref(realtimeDb, 'users');

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const parsedStudents: any[] = [];

          Object.entries(rawData).forEach(([uid, val]: [string, any]) => {
            if (!val || typeof val !== 'object') return;

            // Only include student accounts
            const role = (val.role || '').toLowerCase();
            if (role === 'admin' || role === 'college' || role === 'staff') {
              return;
            }

            const profile = val.profile || {};
            const applications = val.applications ? Object.values(val.applications) : [];

            // Extract Course, Stream/Branch, CourseType arrays across applications & profile
            const courseNames = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.courseName),
                  profile.courseName,
                  val.courseName
                ].filter(Boolean)
              )
            );

            const courseTypes = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.courseType),
                  profile.courseType,
                  val.courseType
                ].filter(Boolean)
              )
            );

            const streams = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.stream || a?.branch || a?.streamName || a?.branchName),
                  profile.stream,
                  profile.branch,
                  val.stream,
                  val.branch
                ].filter(Boolean)
              )
            );

            const durations = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.duration),
                  profile.duration,
                  val.duration
                ].filter(Boolean)
              )
            );

            const semesters = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.semester),
                  profile.semester,
                  val.semester
                ].filter(Boolean)
              )
            );

            const collegeNames = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.collegeName),
                  profile.collegeName,
                  val.collegeName
                ].filter(Boolean)
              )
            );

            const appliedCollegeIds = Array.from(
              new Set(
                [
                  ...applications.map((a: any) => a?.collegeId),
                  profile.collegeId,
                  val.collegeId
                ].filter(Boolean)
              )
            );

            // Construct full name
            const firstName = val.firstName || profile.firstName || '';
            const middleName = val.middleName || profile.middleName || '';
            const lastName = val.lastName || profile.lastName || '';
            const fullName = `${firstName} ${middleName} ${lastName}`.trim() || val.studentName || profile.studentName || 'Student';

            // Extract password
            const password = val.password || profile.password || val.profileData?.password || val.plainPassword || '';

            // Extract email
            const email = val.email || profile.email || '';

            // Extract phone
            const phone = val.phone || profile.phone || val.mobile || '';

            // Extract reg number
            const regNo = val.regNo || profile.regNo || 'PENDING';
            const manualRegNo = val.manualRegNo || profile.manualRegNo || '';

            // Registration date
            const createdAt =
              val.createdAt ||
              val.registrationDate ||
              profile.registrationDate ||
              profile.createdAt ||
              profile.submittedAt ||
              null;

            parsedStudents.push({
              id: uid,
              uid,
              name: fullName,
              firstName,
              middleName,
              lastName,
              email,
              password,
              phone,
              regNo,
              manualRegNo,
              gender: val.gender || profile.gender || '',
              dateOfBirth: val.dateOfBirth || profile.dateOfBirth || '',
              profileLocked: Boolean(profile.profileLocked || val.profileLocked),
              createdAt,
              courseName: courseNames,
              courseType: courseTypes,
              stream: streams,
              duration: durations,
              semester: semesters,
              collegeName: collegeNames,
              appliedCollegeIds,
              raw: val
            });
          });

          // Sort by creation date descending
          parsedStudents.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          setStudents(parsedStudents);
          setLoading(false);
        } else {
          setStudents([]);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    // 1. Base filters
    const base = students.filter((st) => {
      // College filter
      if (selectedCollegeId) {
        if (!st.appliedCollegeIds?.includes(selectedCollegeId)) return false;
      }

      // Profile status filter
      if (filterProfileStatus === 'Locked' && !st.profileLocked) return false;
      if (filterProfileStatus === 'In Progress' && st.profileLocked) return false;

      // Password status filter
      if (filterPasswordStatus === 'Available' && (!st.password || st.password.trim() === '')) return false;
      if (filterPasswordStatus === 'Missing' && st.password && st.password.trim() !== '') return false;

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = st.name.toLowerCase().includes(q);
        const matchesEmail = st.email.toLowerCase().includes(q);
        const matchesPhone = st.phone.toLowerCase().includes(q);
        const matchesReg = (st.regNo || '').toLowerCase().includes(q);
        const matchesManualReg = (st.manualRegNo || '').toLowerCase().includes(q);
        const matchesPass = (st.password || '').toLowerCase().includes(q);
        const matchesCourse = (st.courseName || []).some((c: string) => c.toLowerCase().includes(q));
        const matchesStream = (st.stream || []).some((s: string) => s.toLowerCase().includes(q));

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesReg && !matchesManualReg && !matchesPass && !matchesCourse && !matchesStream) {
          return false;
        }
      }

      return true;
    });

    // 2. Global Stream/Branch, Course, CourseType filters
    return applyGlobalFilters(base, globalFilters);
  }, [students, selectedCollegeId, filterProfileStatus, filterPasswordStatus, searchQuery, globalFilters]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterProfileStatus, filterPasswordStatus, selectedCollegeId, globalFilters, itemsPerPage]);

  // Pagination calculation
  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle individual password visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Open Edit Password Modal
  const handleOpenEditPassword = (student: any) => {
    setEditStudent(student);
    setNewPassword(student.password || '');
    setEditSuccessMsg('');
  };

  // Save updated password to Realtime Database
  const handleSavePassword = async () => {
    if (!editStudent || !newPassword.trim()) {
      alert('Please enter a valid password.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const userRef = ref(realtimeDb, `users/${editStudent.id}`);
      await update(userRef, {
        password: newPassword.trim(),
        'profile/password': newPassword.trim()
      });

      // Update local state immediately
      setStudents((prev) =>
        prev.map((st) => (st.id === editStudent.id ? { ...st, password: newPassword.trim() } : st))
      );

      setEditSuccessMsg('Password updated successfully in database!');
      setTimeout(() => {
        setEditStudent(null);
        setEditSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error('Error updating student password:', err);
      alert('Failed to update password. Please check permissions.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('No student records to export.');
      return;
    }

    const headers = [
      'Sr No.',
      'Registration Date',
      'Auto Reg No',
      'Manual Reg No',
      'Student Name',
      'Email ID',
      'Password',
      'Mobile Number',
      'Gender',
      'DOB',
      'Stream / Branch',
      'Course Name',
      'Course Type',
      'College Name',
      'Profile Status'
    ];

    const rows = filteredStudents.map((st, idx) => [
      idx + 1,
      st.createdAt ? new Date(st.createdAt).toLocaleDateString('en-IN') : 'N/A',
      st.regNo || '',
      st.manualRegNo || '',
      `"${st.name.replace(/"/g, '""')}"`,
      st.email || '',
      `"${(st.password || '').replace(/"/g, '""')}"`,
      st.phone || '',
      st.gender || '',
      st.dateOfBirth || '',
      `"${(st.stream || []).join(', ').replace(/"/g, '""')}"`,
      `"${(st.courseName || []).join(', ').replace(/"/g, '""')}"`,
      `"${(st.courseType || []).join(', ').replace(/"/g, '""')}"`,
      `"${(st.collegeName || []).join(', ').replace(/"/g, '""')}"`,
      st.profileLocked ? 'Locked' : 'In Progress'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MIT_Student_Credentials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-[#002147] text-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold tracking-widest uppercase text-amber-300">
              <KeyRound size={14} /> Student Access & Security Vault
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Student Credentials & Passwords</h1>
            <p className="text-sm text-white/70 max-w-2xl font-medium">
              View, search, and manage student portal login credentials. Filter by stream/branch, course, course type, or
              college, and export anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                showAllPasswords
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {showAllPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              {showAllPasswords ? 'Hide All Passwords' : 'Show All Passwords'}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-[#00a5a5] hover:bg-[#008f8f] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
            >
              <FileSpreadsheet size={16} /> Export to CSV
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
            <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">Total Registered</span>
            <p className="text-xl font-black text-white mt-0.5">{students.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
            <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">Filtered Results</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">{totalItems}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
            <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">With Passwords</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {students.filter((s) => s.password && s.password.trim() !== '').length}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
            <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">Profiles Locked</span>
            <p className="text-xl font-black text-indigo-300 mt-0.5">{students.filter((s) => s.profileLocked).length}</p>
          </div>
        </div>
      </div>

      {/* Global Stream / Course / Course Type / College Filters */}
      <GlobalDataFilter data={students} filters={globalFilters} setFilters={setGlobalFilters} />

      {/* Secondary Filter & Search Bar */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, password, reg no..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {availableColleges.length > 0 && (
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#002147] transition-all"
            >
              <option value="">All Colleges</option>
              {availableColleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterPasswordStatus}
            onChange={(e) => setFilterPasswordStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#002147] transition-all"
          >
            <option value="">All Passwords</option>
            <option value="Available">Password Available</option>
            <option value="Missing">Password Missing</option>
          </select>

          <select
            value={filterProfileStatus}
            onChange={(e) => setFilterProfileStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#002147] transition-all"
          >
            <option value="">All Profiles</option>
            <option value="Locked">Profile Locked</option>
            <option value="In Progress">In Progress</option>
          </select>

          {(searchQuery || filterPasswordStatus || filterProfileStatus || selectedCollegeId) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterPasswordStatus('');
                setFilterProfileStatus('');
                setSelectedCollegeId('');
              }}
              className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors px-2 py-1"
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-5 md:px-8 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">Student Credentials Roster</h2>
            <span className="px-3 py-1 bg-[#002147]/10 text-[#002147] rounded-full text-xs font-bold">
              {totalItems} Students
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Per Page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#002147]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-b border-slate-200">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 whitespace-nowrap text-slate-600 uppercase tracking-wider text-[11px] font-black">
                <th className="px-4 py-4 text-center w-12 border-r border-slate-200">Sr.</th>
                <th className="px-5 py-4 border-r border-slate-200">Student Name & Reg No</th>
                <th className="px-5 py-4 border-r border-slate-200">Email ID</th>
                <th className="px-5 py-4 border-r border-slate-200 bg-amber-50/40 text-amber-900">Password</th>
                <th className="px-5 py-4 border-r border-slate-200">Mobile Number</th>
                <th className="px-5 py-4 border-r border-slate-200">Stream / Branch</th>
                <th className="px-5 py-4 border-r border-slate-200">Course & Type</th>
                <th className="px-5 py-4 border-r border-slate-200 text-center">Profile Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold tracking-wider uppercase text-slate-600">
                        Loading Student Credentials...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <AlertCircle size={28} />
                      </div>
                      <h3 className="text-base font-bold text-slate-700">No Students Found</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No student accounts match the active search or filter criteria. Try adjusting or resetting your
                        filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st, idx) => {
                  const isPassVisible = showAllPasswords || Boolean(visiblePasswords[st.id]);
                  const hasPassword = Boolean(st.password && st.password.trim() !== '');

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                      {/* Sr */}
                      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500 border-r border-slate-200">
                        {startIndex + idx + 1}
                      </td>

                      {/* Name & Reg */}
                      <td className="px-5 py-4 border-r border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#002147] font-bold text-sm shrink-0">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 tracking-tight">{st.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-[#002147] bg-[#002147]/5 px-1.5 py-0.5 rounded">
                                {st.regNo}
                              </span>
                              {st.manualRegNo && (
                                <span className="text-[10px] font-bold text-[#00a5a5] bg-[#00a5a5]/10 px-1.5 py-0.5 rounded">
                                  {st.manualRegNo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800" title={st.email}>
                            {st.email || 'N/A'}
                          </span>
                          {st.email && (
                            <button
                              onClick={() => handleCopy(st.email, `email-${st.id}`)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                              title="Copy Email"
                            >
                              {copiedKey === `email-${st.id}` ? (
                                <Check size={13} className="text-emerald-500" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Password */}
                      <td className="px-5 py-4 border-r border-slate-200 bg-amber-50/20">
                        <div className="flex items-center gap-2">
                          <Lock size={13} className="text-amber-600 shrink-0" />
                          {hasPassword ? (
                            <>
                              <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-amber-200 px-2.5 py-1 rounded shadow-inner select-all">
                                {isPassVisible ? st.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(st.id)}
                                className="p-1 text-slate-400 hover:text-amber-700 rounded transition-colors"
                                title={isPassVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                onClick={() => handleCopy(st.password, `pass-${st.id}`)}
                                className="p-1 text-slate-400 hover:text-amber-700 rounded transition-colors"
                                title="Copy Password"
                              >
                                {copiedKey === `pass-${st.id}` ? (
                                  <Check size={14} className="text-emerald-500" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-rose-500 font-bold italic">Not Set</span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">{st.phone || 'N/A'}</span>
                          {st.phone && (
                            <button
                              onClick={() => handleCopy(st.phone, `phone-${st.id}`)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                              title="Copy Phone"
                            >
                              {copiedKey === `phone-${st.id}` ? (
                                <Check size={13} className="text-emerald-500" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Stream / Branch */}
                      <td className="px-5 py-4 border-r border-slate-200">
                        {st.stream && st.stream.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {st.stream.map((str: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {str}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">General / None</span>
                        )}
                      </td>

                      {/* Course & Type */}
                      <td className="px-5 py-4 border-r border-slate-200">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">
                            {(st.courseName || []).join(', ') || 'N/A'}
                          </p>
                          {(st.courseType || []).length > 0 && (
                            <p className="text-[10px] font-semibold text-[#00a5a5]">
                              {st.courseType.join(' • ')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Profile Status */}
                      <td className="px-5 py-4 text-center border-r border-slate-200">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            st.profileLocked
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {st.profileLocked ? 'Locked' : 'In Progress'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditPassword(st)}
                            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            title="Edit Password"
                          >
                            <Edit2 size={13} />
                            <span>Edit Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 md:px-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 font-medium">
            Showing <span className="font-bold text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
            <span className="font-bold text-slate-800">{totalItems}</span> students
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="First Page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    );
                  })
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400 font-bold">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === page
                              ? 'bg-[#002147] text-white shadow-sm'
                              : 'border border-slate-200 text-slate-700 hover:bg-white'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Last Page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Password Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-[#002147] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm tracking-tight">Edit Student Password</h3>
              </div>
              <button
                onClick={() => setEditStudent(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p className="text-xs font-bold text-slate-800">{editStudent.name}</p>
                <p className="text-[11px] text-slate-500">{editStudent.email}</p>
                <p className="text-[10px] font-bold text-[#00a5a5]">REG NO: {editStudent.regNo}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-800 outline-none focus:border-[#002147] focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will immediately update the student&apos;s password in the database.
                </p>
              </div>

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                  <Check size={14} />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={isSavingPassword || !newPassword.trim()}
                  className="px-5 py-2 bg-[#002147] hover:bg-[#001833] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
                >
                  {isSavingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
