'use client';

import { useState, useEffect } from 'react';
import { 
  IdCard, 
  Search, 
  Printer, 
  Download, 
  User, 
  Calendar, 
  MapPin, 
  Phone,
  ShieldCheck,
  Building2,
  Award
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  collegeId: string;
  collegeName?: string;
  courseName?: string;
  courseId?: string;
  rollNo?: string;
  phone?: string;
  address?: string;
  photo?: string;
  dob?: string;
  admissionYear?: string;
}

export default function StudentIdCardManager({ studentList }: { studentList: Student[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = studentList.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="bg-[#5D5fb1] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-bold capitalize tracking-normal">
              <IdCard size={14} className="text-[#00a5a5]" /> Identity Module
            </div>
            <h2 className="text-3xl font-black capitalize tracking-tighter italic">Student ID Card Registry</h2>
            <p className="text-white/40 text-[11px] font-bold capitalize tracking-normal">Generate & Manage Institutional Identification</p>
          </div>
          
          <div className="relative w-full md:w-80 group">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00a5a5] transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Search Student Name or ID..." 
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-[#00a5a5] transition-all placeholder:text-white/20"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Student List */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
           <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 capitalize tracking-tight">Enrollment List</h3>
              <span className="text-[13px] font-black text-black bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{filteredStudents.length} Students</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer group flex items-center justify-between ${
                    selectedStudent?.id === student.id 
                    ? 'bg-[#5D5fb1] border-[#5D5fb1] text-white shadow-xl scale-[1.02]' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-[#00a5a5] hover:shadow-lg'
                  }`}
                >
                   <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 ${selectedStudent?.id === student.id ? 'border-white/20' : 'border-slate-200'} flex items-center justify-center bg-slate-50`}>
                         {student.photo ? (
                           <img src={student.photo} className="w-full h-full object-cover" alt="" />
                         ) : (
                           <User size={24} className={selectedStudent?.id === student.id ? 'text-white/40' : 'text-slate-300'} />
                         )}
                      </div>
                      <div>
                         <h4 className={`text-sm font-black capitalize tracking-tight ${selectedStudent?.id === student.id ? 'text-white' : 'text-slate-800'}`}>
                           {student.firstName} {student.lastName}
                         </h4>
                         <p className={`text-[13px] font-bold capitalize tracking-tight ${selectedStudent?.id === student.id ? 'text-white/50' : 'text-slate-400'}`}>
                           ID: {student.id} • {student.courseName || 'Curriculum Pending'}
                         </p>
                      </div>
                   </div>
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedStudent?.id === student.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-[#00a5a5] group-hover:text-white'}`}>
                      <Printer size={18} />
                   </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                   <Search size={48} strokeWidth={1} />
                   <p className="text-xs font-black capitalize tracking-normal">No Matches Found</p>
                </div>
              )}
           </div>
        </div>

        {/* Card Preview */}
        <div className="lg:col-span-5 space-y-8">
           {selectedStudent ? (
             <>
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 sticky top-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-slate-800 capitalize tracking-tight">Card Preview</h3>
                     <div className="flex gap-2">
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#00a5a5] hover:text-white transition-all shadow-sm border border-slate-200">
                           <Download size={18} />
                        </button>
                        <button className="p-3 bg-[#5D5fb1] text-white rounded-xl hover:opacity-90 transition-all shadow-lg">
                           <Printer size={18} />
                        </button>
                     </div>
                  </div>

                  {/* ID Card Front */}
                  <div className="w-full aspect-[1.6/1] bg-gradient-to-br from-[#5D5fb1] to-[#002147] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl group cursor-default">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#00a5a5] opacity-10 rounded-full -mr-16 -mt-16 blur-2xl" />
                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12 blur-xl" />
                     
                     <div className="h-full flex flex-col relative z-10">
                        {/* Card Header */}
                        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                                 <Building2 className="text-[#5D5fb1]" size={20} />
                              </div>
                              <div>
                                 <h5 className="text-[13px] font-black capitalize tracking-normal leading-none">Institutional Portal</h5>
                                 <p className="text-[8px] font-bold text-[#00a5a5] capitalize tracking-[0.1em] mt-1">Certified Identification</p>
                              </div>
                           </div>
                           <ShieldCheck className="text-[#00a5a5]" size={24} strokeWidth={2.5} />
                        </div>

                        {/* Card Body */}
                        <div className="flex gap-6 flex-1">
                           <div className="w-28 h-36 bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-inner flex items-center justify-center p-1">
                              {selectedStudent.photo ? (
                                <img src={selectedStudent.photo} className="w-full h-full object-cover rounded-xl" alt="" />
                              ) : (
                                <User size={48} className="text-white/10" />
                              )}
                           </div>
                           <div className="flex-1 space-y-4 pt-1">
                              <div>
                                 <h4 className="text-xl font-black capitalize tracking-tight leading-none italic">{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                                 <p className="text-[13px] font-bold text-black capitalize tracking-normal mt-1.5">{selectedStudent.courseName || 'Standard Enrolled'}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                 <div>
                                    <p className="text-[7px] font-black text-white/30 capitalize tracking-tight">System ID</p>
                                    <p className="text-[13px] font-black text-black capitalize tracking-tight">{selectedStudent.id}</p>
                                 </div>
                                 <div>
                                    <p className="text-[7px] font-black text-white/30 capitalize tracking-tight">Valid Thru</p>
                                    <p className="text-[13px] font-black text-black capitalize tracking-tight">2026-2027</p>
                                 </div>
                                 <div className="col-span-2">
                                    <p className="text-[7px] font-black text-white/30 capitalize tracking-tight">Registry Link</p>
                                    <p className="text-[9px] font-bold text-white/80 tracking-tight flex items-center gap-1.5 mt-0.5">
                                       <Phone size={8} className="text-[#00a5a5]" /> {selectedStudent.phone || '91XXXXXXXX'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                           <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                              <Award size={10} className="text-[#00a5a5]" />
                              <span className="text-[7px] font-black capitalize tracking-tight">Verified Alumnus</span>
                           </div>
                           <p className="text-[8px] font-black text-white/20 capitalize tracking-normal">Official Institutional Document</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
                     <div className="flex items-center gap-3 text-[#5D5fb1]">
                        <MapPin size={18} />
                        <span className="text-[13px] font-black capitalize tracking-tight">Registered Address</span>
                     </div>
                     <p className="text-[11px] font-bold text-slate-500 leading-relaxed pl-7 capitalize">
                        {selectedStudent.address || 'Permanent residence details currently under institutional verification.'}
                     </p>
                  </div>
               </div>
             </>
           ) : (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-200">
                   <IdCard size={48} strokeWidth={1} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-sm font-black text-slate-800 capitalize tracking-tight">Preview Mode</h3>
                   <p className="text-[11px] font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">Select a student from the enrollment list to generate their digital identity card.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}




