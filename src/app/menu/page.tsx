'use client';

import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';

export default function MenuPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans overflow-x-hidden">
      <Header />
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
         <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-[#003366]">
            <div className="w-16 h-1 bg-[#003366] rounded-full relative">
               <div className="absolute -top-3 left-0 w-16 h-1 bg-[#003366] rounded-full" />
               <div className="absolute top-3 left-0 w-16 h-1 bg-[#003366] rounded-full" />
            </div>
         </div>
         <h1 className="text-4xl font-black text-[#003366] tracking-tighter capitalize">Portal Navigation Menu</h1>
         <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            Please use the navigation bar above to explore our institutional catalog, portals, and service desk.
         </p>
      </main>
      <footer className="bg-[#020617] text-white py-8 border-t-4 border-[#003366] text-center mt-auto">
        <p className="text-white/30 font-bold text-xs">Maharashtra State Board of Skill, Vocational Education and Training</p>
      </footer>
    </div>
  );
}
