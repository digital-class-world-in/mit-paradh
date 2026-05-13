'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Search, BookOpen, Clock, Building2, GraduationCap, ChevronRight, Filter, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CourseShowcase() {
  const searchParams = useSearchParams();
  const collegeParam = searchParams.get('college');

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCollege, setFilterCollege] = useState(collegeParam || 'All');

  useEffect(() => {
    if (collegeParam) {
      setFilterCollege(collegeParam);
    }
  }, [collegeParam]);

  useEffect(() => {
    if (!realtimeDb) return;

    const collegesRef = ref(realtimeDb, 'colleges');
    const unsub = onValue(collegesRef, (snapshot) => {
      if (snapshot.exists()) {
        const colleges = snapshot.val();
        let allCourses: any[] = [];

        Object.entries(colleges).forEach(([collegeId, collegeData]: [string, any]) => {
          if (collegeData.courses) {
            Object.entries(collegeData.courses).forEach(([courseId, course]: [string, any]) => {
              allCourses.push({
                id: courseId,
                collegeId,
                collegeName: collegeData.name,
                ...course
              });
            });
          }
        });

        setCourses(allCourses.sort((a, b) => a.name.localeCompare(b.name)));
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.collegeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || course.type === filterType;
    const matchesCollege = filterCollege === 'All' || course.collegeName === filterCollege;
    return matchesSearch && matchesType && matchesCollege;
  });

  const courseTypes = ['All Type', ...Array.from(new Set(courses.map(c => c.type).filter(Boolean)))];
  const collegeNames = ['All Colleges', ...Array.from(new Set(courses.map(c => c.collegeName).filter(Boolean)))];

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#003366] border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-400 font-medium">Loading Available Programs...</p>
    </div>
  );

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#003366] text-[13px] font-bold uppercase tracking-widest">
              <BookOpen size={14} /> Academic Catalog
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-[#003366] capitalize leading-none">
              Explore Professional Courses
            </h2>
            <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">
              Discover industry-aligned vocational programs offered by our certified institutions across Maharashtra.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative group flex-1 sm:min-w-[280px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by course or college..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-medium outline-none focus:bg-white focus:border-[#003366] transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="relative flex-1 sm:min-w-[180px]">
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
             <div className="relative flex-1 sm:min-w-[180px]">
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
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-[#003366] transition-all duration-500 flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 opacity-0 group-hover:opacity-100 rounded-full -mr-16 -mt-16 transition-all duration-500" />
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#003366] border border-slate-100 group-hover:bg-[#003366] group-hover:text-white transition-colors duration-500 shadow-sm">
                    <GraduationCap size={32} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {course.type || 'Regular'}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      <Clock size={10} />
                      {course.duration || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 flex-1 relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight group-hover:text-[#003366] transition-colors">
                    {course.name}
                  </h3>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-[#003366]/20 transition-colors">
                        <Building2 size={14} className="text-slate-400 group-hover:text-[#003366]" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-600 line-clamp-1">{course.collegeName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <BookOpen size={14} className="text-slate-400" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-600 capitalize">{course.type || 'Regular'} Program</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-end relative z-10">
                   <button className="flex items-center gap-2 bg-[#003366] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-tight hover:bg-black transition-all shadow-lg active:scale-95 group/btn">
                     Apply Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
             <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">No courses found matching your criteria.</p>
          </div>
        )}

        <div className="mt-16 text-center">
           <button className="bg-white border-2 border-[#003366] text-[#003366] px-12 py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-[#003366] hover:text-white transition-all shadow-xl active:scale-95">
             View Full Academic Calendar
           </button>
        </div>
      </div>
    </section>
  );
}
