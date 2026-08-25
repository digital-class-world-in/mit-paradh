import React, { useMemo } from 'react';
import { X } from 'lucide-react';

export interface FilterState {
  collegeName: string;
  courseType: string;
  courseName: string;
  duration: string;
  semester: string;
  stream: string;
  academicYear: string;
  paymentStatus: string;
}

interface GlobalDataFilterProps {
  data: any[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  keys?: {
    collegeName?: string;
    courseType?: string;
    courseName?: string;
    duration?: string;
    semester?: string;
    stream?: string;
    academicYear?: string;
    paymentStatus?: string;
  };
}

export default function GlobalDataFilter({ data, filters, setFilters, keys = {} }: GlobalDataFilterProps) {
  const kCollege = keys.collegeName || 'collegeName';
  const kCourseType = keys.courseType || 'courseType';
  const kCourseName = keys.courseName || 'courseName';
  const kDuration = keys.duration || 'duration';
  const kSemester = keys.semester || 'semester';
  const kStream = keys.stream || 'stream';
  const kAcademicYear = keys.academicYear || 'academicYear';
  const kPaymentStatus = keys.paymentStatus || 'paymentStatus';

  const options = useMemo(() => {
    const getUnique = (key: string) => {
      const vals: string[] = [];
      data.forEach(item => {
        const val = item[key];
        if (Array.isArray(val)) {
          val.forEach(v => {
            if (v && typeof v === 'string' && v.trim() !== '') vals.push(v);
          });
        } else if (val && typeof val === 'string' && val.trim() !== '') {
          vals.push(val);
        }
      });
      return Array.from(new Set(vals)).sort();
    };
    return {
      colleges: getUnique(kCollege),
      courseTypes: getUnique(kCourseType),
      courseNames: getUnique(kCourseName),
      durations: getUnique(kDuration),
      semesters: getUnique(kSemester),
      streams: getUnique(kStream),
      academicYears: getUnique(kAcademicYear),
      paymentStatuses: getUnique(kPaymentStatus),
    };
  }, [data, kCollege, kCourseType, kCourseName, kDuration, kSemester, kStream, kAcademicYear, kPaymentStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFilters({ collegeName: '', courseType: '', courseName: '', duration: '', semester: '', stream: '', academicYear: '', paymentStatus: '' });
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 relative w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Select College</label>
          <div className="relative">
            <select name="collegeName" value={filters.collegeName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Colleges</option>
              {options.colleges.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Course Type</label>
          <div className="relative">
            <select name="courseType" value={filters.courseType} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Types</option>
              {options.courseTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Course Name</label>
          <div className="relative">
            <select name="courseName" value={filters.courseName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Courses</option>
              {options.courseNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Duration</label>
          <div className="relative">
            <select name="duration" value={filters.duration} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Durations</option>
              {options.durations.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Semester</label>
          <div className="relative">
            <select name="semester" value={filters.semester} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Semesters</option>
              {options.semesters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Stream / Branch</label>
          <div className="relative">
            <select name="stream" value={filters.stream} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Streams</option>
              {options.streams.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Session / Year</label>
          <div className="relative">
            <select name="academicYear" value={filters.academicYear} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Sessions</option>
              {options.academicYears.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Status</label>
          <div className="relative">
            <select name="paymentStatus" value={filters.paymentStatus} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/20 transition-all appearance-none font-medium pr-10">
              <option value="">All Statuses</option>
              {options.paymentStatuses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end mt-4">
        <button onClick={handleReset} className="text-red-500 hover:text-red-600 text-[13px] font-bold flex items-center gap-1.5 transition-colors">
          <X size={16} /> Reset Filters
        </button>
      </div>
    </div>
  );
}

export const applyGlobalFilters = (data: any[], filters: FilterState, keys: any = {}) => {
  const kCollege = keys.collegeName || 'collegeName';
  const kCourseType = keys.courseType || 'courseType';
  const kCourseName = keys.courseName || 'courseName';
  const kDuration = keys.duration || 'duration';
  const kSemester = keys.semester || 'semester';
  const kStream = keys.stream || 'stream';
  const kAcademicYear = keys.academicYear || 'academicYear';
  const kPaymentStatus = keys.paymentStatus || 'paymentStatus';

  return data.filter(item => {
    const checkMatch = (filterVal: string, itemVal: any) => {
      if (!filterVal) return true;
      if (Array.isArray(itemVal)) return itemVal.includes(filterVal);
      return itemVal === filterVal;
    };

    if (!checkMatch(filters.collegeName, item[kCollege])) return false;
    if (!checkMatch(filters.courseType, item[kCourseType])) return false;
    if (!checkMatch(filters.courseName, item[kCourseName])) return false;
    if (!checkMatch(filters.duration, item[kDuration])) return false;
    if (!checkMatch(filters.semester, item[kSemester])) return false;
    if (!checkMatch(filters.stream, item[kStream])) return false;
    if (!checkMatch(filters.academicYear, item[kAcademicYear])) return false;
    if (!checkMatch(filters.paymentStatus, item[kPaymentStatus])) return false;

    return true;
  });
};
