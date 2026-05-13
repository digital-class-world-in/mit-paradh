'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { Book, Plus, Search, Timer, Edit2, Trash2, Globe, Save, Loader2, BookOpen, X } from 'lucide-react';

interface CourseManagerProps {
  collegeId?: string;
}

const CourseManager = ({ collegeId }: CourseManagerProps) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseType, setCourseType] = useState('');
  const [duration, setDuration] = useState('');
  const [fees, setFees] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCourseToImport, setSelectedCourseToImport] = useState<any>(null);
  const [targetCollegeId, setTargetCollegeId] = useState('');
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDuration, setFilterDuration] = useState('');

  useEffect(() => {
    const fetchAllCourses = () => {
      // Listener for Global Courses
      const globalRef = ref(realtimeDb, 'courses');
      const unsubGlobal = onValue(globalRef, (snapshot) => {
        const globalData = snapshot.exists() ? snapshot.val() : {};
        const globalList = Object.entries(globalData).map(([id, val]: any) => ({
          id,
          ...val,
          source: 'Global',
          collegeName: 'System Registry'
        }));

        // Listener for College Courses
        const collegesRef = ref(realtimeDb, 'colleges');
        onValue(collegesRef, (colSnapshot) => {
          const collegesData = colSnapshot.exists() ? colSnapshot.val() : {};
          const collegeList: any[] = [];
          const collegesArr: any[] = [];
          
          Object.entries(collegesData).forEach(([cid, college]: any) => {
            collegesArr.push({ id: cid, ...college });
            if (college.courses) {
              Object.entries(college.courses).forEach(([courseId, course]: any) => {
                // If collegeId is provided, only include courses for that college
                if (!collegeId || cid === collegeId) {
                  collegeList.push({
                    id: courseId,
                    ...course,
                    collegeId: cid,
                    source: 'College',
                    collegeName: college.name || 'Unnamed College'
                  });
                }
              });
            }
          });

          setCollegesList(collegesArr);
          
          // Final list filtering based on collegeId
          let finalGlobal = collegeId ? [] : globalList;
          
          const combined = [...finalGlobal, ...collegeList].sort((a, b) => {
            return new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime();
          });
          
          setCourses(combined);
          setLoading(false);
        });
      });

      return () => {
        unsubGlobal();
      };
    };

    const cleanup = fetchAllCourses();
    return () => cleanup();
  }, [collegeId]);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const courseData = {
        name: courseName.trim(),
        type: courseType,
        duration: duration,
        fees: fees,
        updatedAt: new Date().toISOString(),
        ...(editingCourseId ? {} : { createdAt: new Date().toISOString() })
      };

      if (editingCourseId) {
        const course = courses.find(c => c.id === editingCourseId);
        if (course?.source === 'College') {
          await set(ref(realtimeDb, `colleges/${course.collegeId}/courses/${editingCourseId}`), courseData);
        } else {
          await set(ref(realtimeDb, `courses/${editingCourseId}`), courseData);
        }
      } else {
        const targetId = collegeId || selectedCollegeId;
        if (targetId) {
          const newCourseRef = push(ref(realtimeDb, `colleges/${targetId}/courses`));
          await set(newCourseRef, { ...courseData, source: 'College' });
        } else {
          const newCourseRef = push(ref(realtimeDb, 'courses'));
          await set(newCourseRef, courseData);
        }
      }
      
      setCourseName('');
      setCourseType('');
      setDuration('');
      setFees('');
      setSelectedCollegeId('');
      setEditingCourseId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportToCollege = async () => {
    if (!selectedCourseToImport || !targetCollegeId) return;
    setIsImporting(true);
    try {
      const collegeCourseRef = push(ref(realtimeDb, `colleges/${targetCollegeId}/courses`));
      const importData = {
        name: selectedCourseToImport.name,
        type: selectedCourseToImport.type || '',
        duration: selectedCourseToImport.duration || '',
        fees: selectedCourseToImport.fees || '',
        importedFrom: 'Global',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await set(collegeCourseRef, importData);
      alert(`Course "${selectedCourseToImport.name}" imported to college successfully!`);
      setIsImportModalOpen(false);
      setSelectedCourseToImport(null);
      setTargetCollegeId('');
    } catch (err) {
      console.error(err);
      alert("Failed to import course.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setCourseName(course.name);
    setCourseType(course.type || '');
    setDuration(course.duration || '');
    setFees(course.fees || '');
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (course: any) => {
    if (!confirm(`Delete this course "${course.name}"?`)) return;
    try {
      if (course.source === 'College') {
        await remove(ref(realtimeDb, `colleges/${course.collegeId}/courses/${course.id}`));
      } else {
        await remove(ref(realtimeDb, `courses/${course.id}`));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesName = c.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesType = !filterType || (c.type && c.type.toLowerCase().includes(filterType.toLowerCase()));
    const matchesDuration = !filterDuration || (c.duration && c.duration.toLowerCase().includes(filterDuration.toLowerCase()));
    return matchesName && matchesType && matchesDuration;
  });

  if (loading) return (
    <div className="p-20 text-center animate-pulse text-slate-400 font-normal tracking-tight capitalize text-xs">
      Loading course registry...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-[#003366] rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
         <div className="relative z-10 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
              <BookOpen size={14} className="text-[#00a5a5]" /> {collegeId ? 'College Program Registry' : 'Global Curriculum Board'}
            </div>
            <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Course Management</h2>
            <p className="text-sm font-normal text-white/60">Configure and manage the academic program registry.</p>
         </div>
         <button 
           onClick={() => {
             setEditingCourseId(null);
             setCourseName('');
             setCourseType('');
             setDuration('');
             setFees('');
             setSelectedCollegeId('');
             setIsModalOpen(true);
           }}
           className="relative z-10 bg-white text-[#003366] px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-3"
         >
            <Plus size={20} strokeWidth={3} /> Add New Course
         </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm flex flex-wrap items-center gap-8">
         <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name</label>
            <div className="relative">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
               <input 
                 type="text" 
                 placeholder="Search by name..." 
                 className="w-full bg-slate-50 border border-black rounded-xl py-3 pl-11 pr-4 text-xs font-normal outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                 value={filterName}
                 onChange={(e) => setFilterName(e.target.value)}
               />
            </div>
         </div>
         <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[14px] font-medium text-black capitalize tracking-tight pl-1">Course Type</label>
            <input 
              type="text" 
              placeholder="e.g. Diploma" 
              className="w-full bg-slate-50 border border-black rounded-xl py-3 px-4 text-[14px] font-medium text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            />
         </div>
         <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[14px] font-medium text-black capitalize tracking-tight pl-1">Duration</label>
            <input 
              type="text" 
              placeholder="e.g. 2 Years" 
              className="w-full bg-slate-50 border border-black rounded-xl py-3 px-4 text-[14px] font-medium text-black outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
            />
         </div>
         <div className="flex items-end pb-1">
            <button 
              onClick={() => { setFilterName(''); setFilterType(''); setFilterDuration(''); }}
              className="text-[14px] font-medium text-rose-500 capitalize tracking-tight hover:underline"
            >
               Reset Filters
            </button>
         </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="bg-white rounded-[3rem] border border-black shadow-sm overflow-hidden p-8">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
              <thead>
                <tr className="bg-slate-50/50 border-b border-black whitespace-nowrap">
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Sr.No</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Course Name</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Source</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">College</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Type</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Duration</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Fees</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center">Action</th>
                </tr>
              </thead>
              <tbody className="border-b border-black">
                {filteredCourses.map((course, idx) => (
                  <tr key={`${course.source}-${course.id}`} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="text-[16px] font-medium text-black">{idx + 1}</span>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00a5a5] shrink-0 border border-black">
                          <Book size={18} />
                        </div>
                        <div>
                          <p className="text-[16px] font-medium text-black capitalize tracking-tight">{course.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold capitalize tracking-tight mt-0.5">ID: {course.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                       <span className={`px-3 py-1.5 rounded-full text-[14px] font-bold capitalize tracking-tight border ${course.source === 'Global' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
                          {course.source}
                       </span>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                       <span className="text-[14px] font-bold text-slate-500 max-w-[180px] truncate block mx-auto">
                          {course.collegeName || 'Institutional'}
                       </span>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[14px] font-bold capitalize tracking-tight border border-indigo-100">
                        {course.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-[14px]">
                        <Timer size={14} className="text-[#00a5a5]" /> {course.duration || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center font-medium text-black text-[16px]">
                       {course.fees ? `₹${course.fees}` : '—'}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2">
                         {course.source === 'Global' && !collegeId && (
                             <button 
                                onClick={() => {
                                  setSelectedCourseToImport(course);
                                  setIsImportModalOpen(true);
                                }}
                                className="p-2.5 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[9px] font-black capitalize tracking-tight"
                                title="Import to College"
                              >
                                 <Globe size={14} /> Import
                              </button>
                          )}
                          <button 
                            onClick={() => handleEditCourse(course)}
                            className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                          ><Edit2 size={14} /></button>
                          <button 
                            onClick={() => handleDeleteCourse(course)}
                            className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                          ><Trash2 size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-black shadow-xl p-20 text-center">
           <div className="flex flex-col items-center gap-6 text-slate-300">
              <BookOpen size={80} className="opacity-10" />
              <div className="space-y-2">
                <p className="text-sm font-normal tracking-normal capitalize text-black">Registry Empty</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Initialize the curriculum registry by adding academic courses.</p>
              </div>
           </div>
        </div>
      )}

      {/* Add/Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#003366] p-10 text-white relative">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
                 disabled={isSubmitting}
               >
                 <X size={32} />
               </button>
               <div className="w-16 h-16 bg-[#00a5a5] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                  {editingCourseId ? <Edit2 size={32} /> : <BookOpen size={32} />}
               </div>
               <h3 className="text-3xl font-black tracking-tighter capitalize">{editingCourseId ? 'Update Course' : 'Add New Course'}</h3>
               <p className="text-[13px] font-normal text-black capitalize tracking-normal mt-2">{editingCourseId ? 'Modify existing curriculum details' : 'Add a new academic course to the catalog'}</p>
            </div>

            <form onSubmit={handleSaveCourse} className="p-12 space-y-8">
              <div className="space-y-6">
                {!editingCourseId && !collegeId && (
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Select College</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm cursor-pointer"
                      value={selectedCollegeId}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                    >
                       <option value="">Institutional (Global)</option>
                       {collegesList.map((col) => (
                         <option key={col.id} value={col.id}>{col.name} ({col.collegeId})</option>
                       ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                    placeholder="e.g., Computer Engineering"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Type <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text"
                        value={courseType}
                        onChange={(e) => setCourseType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        placeholder="e.g., Diploma / Degree"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Duration <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        placeholder="e.g., 3 Years"
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Program Fees <span className="text-red-500">*</span></label>
                   <input 
                     required
                     type="text"
                     value={fees}
                     onChange={(e) => setFees(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                     placeholder="e.g., 45000"
                   />
                </div>
              </div>

              <div className="pt-4">
                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full bg-[#003366] text-white py-5 rounded-2xl font-black text-[11px] capitalize tracking-tight shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin" size={18} /> Processing...</>
                    ) : (
                      <><Save size={18} /> {editingCourseId ? 'Update Course' : 'Add New Course'}</>
                    )}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import to College Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/70 backdrop-blur-md" onClick={() => !isImporting && setIsImportModalOpen(false)} />
          
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-teal-600 p-10 text-white relative">
               <button 
                 onClick={() => setIsImportModalOpen(false)}
                 className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
                 disabled={isImporting}
               >
                 <X size={24} />
               </button>
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                  <Globe size={32} />
               </div>
               <h3 className="text-2xl font-black tracking-tighter capitalize">Import to College</h3>
               <p className="text-[13px] font-normal text-black capitalize tracking-normal mt-2">Deploy program to institutional catalog</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[13px] font-normal text-black capitalize tracking-tight mb-1">Selected Program</p>
                    <p className="text-sm font-normal text-black capitalize">{selectedCourseToImport?.name}</p>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Target Institution</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-teal-500 transition-all"
                      value={targetCollegeId}
                      onChange={(e) => setTargetCollegeId(e.target.value)}
                    >
                       <option value="">— Select College —</option>
                       {collegesList.map(col => (
                         <option key={col.id} value={col.id}>{col.name} ({col.collegeId})</option>
                       ))}
                    </select>
                 </div>
              </div>

              <button 
                onClick={handleImportToCollege}
                disabled={isImporting || !targetCollegeId}
                className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-[11px] capitalize tracking-tight shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                 {isImporting ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><Save size={18} /> Deploy to College</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
