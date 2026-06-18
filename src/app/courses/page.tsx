'use client';

import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import CourseShowcase from '@/components/CourseShowcase';
import { Suspense } from 'react';
import LiveFooter from '@/components/LiveFooter';

export default function CoursesPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans overflow-x-hidden">
      <Header />
      <Navbar />
      <div className="pt-8">
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-400">Loading catalog...</div>}>
          <CourseShowcase />
        </Suspense>
      </div>
      <LiveFooter />
    </div>
  );
}
