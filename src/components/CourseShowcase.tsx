'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Search, BookOpen, Clock, Building2, GraduationCap, ChevronRight, ChevronUp, Filter, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CourseShowcase() {
  const searchParams = useSearchParams();
  const collegeParam = searchParams.get('college');
  const searchParam = searchParams.get('search');

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParam || '');
  const [filterType, setFilterType] = useState('All');
  const [filterCollege, setFilterCollege] = useState(collegeParam || 'All');
  const [filterCourseName, setFilterCourseName] = useState('All');
  const [visibleCount, setVisibleCount] = useState(3);

  const getNormalizedType = (c: any) => {
    const rawType = c.type || c.course_type || c.courseType || 'Regular';
    if (rawType.toLowerCase() === 'reg') return 'Regular';
    return rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (collegeParam) {
      setFilterCollege(collegeParam);
    }
  }, [collegeParam]);

  useEffect(() => {
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParam]);

  useEffect(() => {
    // Load from cache first for instant display
    try {
      const cached = localStorage.getItem('cache_courses');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Error reading course cache', e);
    }

    if (!realtimeDb) return;

    const collegesRef = ref(realtimeDb, 'colleges');
    const unsub = onValue(collegesRef, (snapshot) => {
      if (snapshot.exists()) {
        const colleges = snapshot.val();
        let allCourses: any[] = [];
        const courseGroups: { [key: string]: any } = {};

        // Process function to handle merging colleges and website courses
        const processCourseGroups = () => {
          allCourses = Object.values(courseGroups);
          const priorityCourses = [
            'bsc. bachelor of science',
            'ba bachelor of arts ( honors )',
            'pg-diploma'
          ];

          const sortedCourses = allCourses.sort((a, b) => {
            const nameA = (a.course_name || a.name || '').trim().toLowerCase();
            const nameB = (b.course_name || b.name || '').trim().toLowerCase();
            
            const indexA = priorityCourses.indexOf(nameA);
            const indexB = priorityCourses.indexOf(nameB);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return (a.course_name || a.name || '').localeCompare(b.course_name || b.name || '');
          });
          setCourses(sortedCourses);
          setLoading(false);

          // Removed localStorage caching to prevent QuotaExceeded errors and ensure Firebase is single source of truth.
        };

        const processCollegeData = (colleges: any) => {
          Object.entries(colleges).forEach(([collegeId, collegeData]: [string, any]) => {
            if (collegeData.courses) {
              Object.entries(collegeData.courses).forEach(([courseId, course]: [string, any]) => {
                const rawName = course.course_name || course.name || '';
                const normalizedName = rawName.trim().toLowerCase();

                if (!normalizedName) return;

                if (!courseGroups[normalizedName]) {
                  courseGroups[normalizedName] = {
                    ...course,
                    image: course.thumbnail || course.image,
                    id: courseId,
                    collegeIds: [collegeId],
                    collegeNames: [collegeData.name],
                    collegesInfo: [{ id: collegeId, name: collegeData.name }]
                  };
                } else {
                  if (!courseGroups[normalizedName].collegeIds.includes(collegeId)) {
                    courseGroups[normalizedName].collegeIds.push(collegeId);
                    courseGroups[normalizedName].collegeNames.push(collegeData.name);
                    courseGroups[normalizedName].collegesInfo.push({ id: collegeId, name: collegeData.name });
                  }
                  if (!courseGroups[normalizedName].image && (course.thumbnail || course.image)) {
                    courseGroups[normalizedName].image = course.thumbnail || course.image;
                  }
                  if (!courseGroups[normalizedName].duration && course.duration) {
                    courseGroups[normalizedName].duration = course.duration;
                  }
                }
              });
            }
          });
        };

        processCollegeData(colleges);

        // Fetch global courses
        const globalRef = ref(realtimeDb, 'courses');
        get(globalRef).then((globalSnap) => {
          if (globalSnap.exists()) {
            const globalCourses = globalSnap.val();
            Object.entries(globalCourses).forEach(([courseId, course]: [string, any]) => {
              const rawName = course.course_name || course.name || '';
              const normalizedName = rawName.trim().toLowerCase();

              if (!normalizedName) return;

              if (!courseGroups[normalizedName]) {
                courseGroups[normalizedName] = {
                  ...course,
                  image: course.thumbnail || course.image,
                  id: courseId,
                  collegeIds: [],
                  collegeNames: ['System Registry'],
                  collegesInfo: [{ id: 'global', name: 'System Registry' }]
                };
              } else {
                if (!courseGroups[normalizedName].collegeNames.includes('System Registry')) {
                  courseGroups[normalizedName].collegeNames.push('System Registry');
                  courseGroups[normalizedName].collegesInfo.push({ id: 'global', name: 'System Registry' });
                }
                if (!courseGroups[normalizedName].image && (course.thumbnail || course.image)) {
                  courseGroups[normalizedName].image = course.thumbnail || course.image;
                }
                if (!courseGroups[normalizedName].duration && course.duration) {
                  courseGroups[normalizedName].duration = course.duration;
                }
              }
            });
          }

          // Fetch website courses
          const websiteRef = ref(realtimeDb, 'settings/website/home/courses');
          get(websiteRef).then((webSnap) => {
            if (webSnap.exists()) {
              const data = webSnap.val();
              const arr = Array.isArray(data) ? data : Object.values(data);
              arr.forEach((course: any, idx: number) => {
                const rawName = course.course_name || course.name || '';
                const normalizedName = rawName.trim().toLowerCase();

                if (!normalizedName) return;

                if (!courseGroups[normalizedName]) {
                  courseGroups[normalizedName] = {
                    ...course,
                    image: course.thumbnail || course.image,
                    id: `website-${idx}`,
                    collegeIds: [],
                    collegeNames: ['System Registry'],
                    collegesInfo: [{ id: 'website', name: 'System Registry' }]
                  };
                } else {
                  if (!courseGroups[normalizedName].collegeNames.includes('System Registry')) {
                    courseGroups[normalizedName].collegeNames.push('System Registry');
                    courseGroups[normalizedName].collegesInfo.push({ id: 'website', name: 'System Registry' });
                  }
                  if (!courseGroups[normalizedName].image && (course.thumbnail || course.image)) {
                    courseGroups[normalizedName].image = course.thumbnail || course.image;
                  }
                  if (!courseGroups[normalizedName].duration && course.duration) {
                    courseGroups[normalizedName].duration = course.duration;
                  }
                }
              });
            }
            processCourseGroups();
          });
        });
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const filteredCourses = courses.filter(course => {
    const name = course.course_name || course.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.collegeNames?.some((cName: string) => cName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'All' || getNormalizedType(course) === filterType;
    const matchesCollege = filterCollege === 'All' || course.collegeNames?.includes(filterCollege);
    const matchesCourseName = filterCourseName === 'All' || name === filterCourseName;
    return matchesSearch && matchesType && matchesCollege && matchesCourseName;
  });

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(3);
  }, [searchTerm, filterType, filterCollege, filterCourseName]);

  const displayedCourses = filteredCourses.slice(0, visibleCount);

  const courseTypes = ['All Type', ...Array.from(new Set(courses.map(c => getNormalizedType(c)).filter(Boolean)))];
  const collegeNames = ['All Colleges', ...Array.from(new Set(courses.flatMap(c => c.collegeNames || []).filter(Boolean)))];
  const courseNames = ['All Courses', ...Array.from(new Set(courses.map(c => c.course_name || c.name).filter(Boolean)))];

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-400 font-medium">Loading Available Programs...</p>
    </div>
  );

  return (
    <section className="py-12 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Row 1: Title left-aligned */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#003366] text-[11px] font-bold uppercase tracking-widest mb-2">
            <BookOpen size={14} /> Academic Course Details
          </div>
          <h2 className="text-[#003366] text-xl md:text-2xl font-black tracking-tight capitalize italic">
            Our Courses
          </h2>
        </div>

        {/* Row 2: Filters full-width below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full mb-10">
          {/* Search Input */}
          <div className="relative group w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              placeholder="Search by course or college..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-medium outline-none focus:bg-white focus:border-[#003366] transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Course Name filter */}
          <div className="relative w-full">
            <BookOpen size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-10 text-[13px] font-bold text-slate-700 outline-none focus:border-[#003366] appearance-none cursor-pointer transition-all shadow-sm"
              value={filterCourseName}
              onChange={(e) => setFilterCourseName(e.target.value)}
            >
              {courseNames.map(name => (
                <option key={name} value={name === 'All Courses' ? 'All' : name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Course Type filter */}
          <div className="relative w-full">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-10 text-[13px] font-bold text-slate-700 outline-none focus:border-[#003366] appearance-none cursor-pointer transition-all shadow-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {courseTypes.map(type => (
                <option key={type} value={type === 'All Type' ? 'All' : type}>{type}</option>
              ))}
            </select>
          </div>

          {/* College filter */}
          <div className="relative w-full">
            <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-10 pr-10 text-[13px] font-bold text-slate-700 outline-none focus:border-[#003366] appearance-none cursor-pointer transition-all shadow-sm"
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
            >
              {collegeNames.map(name => (
                <option key={name} value={name === 'All Colleges' ? 'All' : name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              {displayedCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-slate-200 transition-all duration-500 flex flex-col overflow-hidden"
              >
                {/* Top Thumbnail Image or Fallback Gradient */}
                <div className="relative w-full h-48 bg-slate-50 overflow-hidden shrink-0">
                  {(course.image && course.image !== '__DATA_URL__' && course.image !== '[Base64 Image Omitted]') || (course.thumbnail && course.thumbnail !== '__DATA_URL__' && course.thumbnail !== '[Base64 Image Omitted]') ? (
                    <img
                      src={(course.image && course.image !== '__DATA_URL__' && course.image !== '[Base64 Image Omitted]') ? course.image : course.thumbnail}
                      alt={course.course_name || course.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#003366] to-[#001f3d] flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px]" />
                      <GraduationCap size={44} className="text-white/20 animate-pulse" />
                    </div>
                  )}
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-9 h-9 bg-white/95 backdrop-blur-md rounded-xl flex items-center justify-center text-[#003366] shadow-md border border-white/20">
                      <GraduationCap size={18} />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-[#003366] rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md border border-white/20">
                      {getNormalizedType(course)}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4 flex-1">
                    <h3 className="text-base font-black text-slate-800 leading-snug line-clamp-2 group-hover:text-[#003366] transition-colors">
                      {course.course_name || course.name}
                    </h3>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 no-scrollbar">
                      {course.collegeNames && course.collegeNames.length > 0 ? (
                        course.collegeNames.map((cName: string, cIdx: number) => (
                          <div key={cIdx} className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                            <Building2 size={15} className="text-[#003366] opacity-70 shrink-0 mt-0.5" />
                            <span className="text-xs font-bold text-slate-600 leading-normal">
                              {cName}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                          <Building2 size={15} className="text-[#003366] opacity-70 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-slate-600 leading-normal">
                            System Registry
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <Clock size={13} className="text-[#003366] opacity-70 shrink-0" />
                        <span className="text-xs font-bold text-slate-600 truncate">{course.duration || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <BookOpen size={13} className="text-[#003366] opacity-70 shrink-0" />
                        <span className="text-xs font-bold text-slate-600 truncate">{getNormalizedType(course)}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/inquiry?course=${encodeURIComponent(course.course_name || course.name || '')}&college=${encodeURIComponent(course.collegeIds?.[0] || '')}`}
                    className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002147] text-white px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] group/btn"
                  >
                    View Details <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
            </div>
            {filteredCourses.length > 3 && (
              <div className="flex justify-center mt-8">
                {visibleCount < filteredCourses.length ? (
                  <button
                    onClick={() => setVisibleCount(filteredCourses.length)}
                    className="bg-[#003366] hover:bg-[#002147] text-white px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center gap-2 group/more"
                  >
                    View More <ChevronRight size={18} className="group-hover/more:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => setVisibleCount(3)}
                    className="bg-slate-100 hover:bg-slate-200 text-[#003366] px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center gap-2 group/less border border-slate-200"
                  >
                    View Less <ChevronUp size={18} className="group-hover/less:-translate-y-1 transition-transform" />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">No courses found matching your criteria.</p>
          </div>
        )}


      </div>
    </section>
  );
}
