'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CourseShowcase from '@/components/CourseShowcase';

const getPrice = (val: any) => {
  if (val === undefined || val === null || String(val).toLowerCase() === 'null' || String(val).trim() === '') return null;
  return val;
};

export default function CourseDetailView({ slug }: { slug: string }) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!realtimeDb) return;
    const collegesRef = ref(realtimeDb, 'colleges');
    const coursesRef = ref(realtimeDb, 'courses');

    let currentGlobal: any[] = [];
    let currentCollege: any[] = [];
    let collegesLoaded = false;
    let globalLoaded = false;

    const findAndSetCourse = () => {
      if (collegesLoaded && globalLoaded) {
        // Decode the slug as it might be URL encoded
        const decodedSlug = decodeURIComponent(slug);
        
        // Combine courses (college courses first for precedence)
        const combined = [...currentCollege, ...currentGlobal];
        
        // Read collegeId from search params
        const collegeIdParam = searchParams.get('college');

        let found;
        if (collegeIdParam) {
          found = combined.find(c => {
            const cSlug = String(c.course_slug || '').trim().toLowerCase();
            const cId = String(c.id || '').trim().toLowerCase();
            const cName = String(c.course_name || c.name || '').trim().toLowerCase();
            const target = decodedSlug.trim().toLowerCase();

            return ((cSlug && cSlug !== 'null' && cSlug === target) ||
                   cId === target ||
                   cName === target) && String(c.collegeId || '').toLowerCase() === collegeIdParam.toLowerCase();
          });
        }

        // Fallback if no college param or college-specific course not found
        if (!found) {
          found = combined.find(c => {
            const cSlug = String(c.course_slug || '').trim().toLowerCase();
            const cId = String(c.id || '').trim().toLowerCase();
            const cName = String(c.course_name || c.name || '').trim().toLowerCase();
            const target = decodedSlug.trim().toLowerCase();

            return (cSlug && cSlug !== 'null' && cSlug === target) ||
                   cId === target ||
                   cName === target;
          });
        }

        setCourse(found || null);
        setLoading(false);
      }
    };

    const unsubColleges = onValue(collegesRef, (snap) => {
      currentCollege = [];
      if (snap.exists()) {
        const data = snap.val();
        Object.entries(data).forEach(([collegeId, college]: any) => {
          if (college.courses) {
            Object.entries(college.courses).forEach(([courseId, c]: any) => {
              currentCollege.push({ id: courseId, collegeId, collegeName: college.name, ...c });
            });
          }
        });
      }
      collegesLoaded = true;
      findAndSetCourse();
    });

    const unsubGlobal = onValue(coursesRef, (snap) => {
      currentGlobal = [];
      if (snap.exists()) {
        const data = snap.val();
        Object.entries(data).forEach(([courseId, c]: any) => {
          currentGlobal.push({ id: courseId, ...c });
        });
      }
      globalLoaded = true;
      findAndSetCourse();
    });

    return () => {
      unsubColleges();
      unsubGlobal();
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#003366]">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p className="font-bold">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 space-y-4">
        <h2 className="text-3xl font-black text-black">Course Not Found</h2>
        <p>The course you are looking for does not exist or has been removed.</p>
        <Link href="/" className="bg-[#003366] text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const courseName = course.course_name || course.name || 'Untitled Course';
  const description = course.description || course.subject_detail || 'No overview available for this course.';
  const thumbnail = course.thumbnail || course.image || 'https://via.placeholder.com/800x600?text=Course+Thumbnail';

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* LEFT COLUMN: Overview & Checklist */}
          <div className="flex-1 space-y-8 w-full">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-black tracking-tight">Overview:</h2>
              <div className="text-sm font-normal text-slate-700 leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            </div>

            {course.employment_opportunities && String(course.employment_opportunities).toLowerCase() !== 'null' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="text-2xl font-black text-black tracking-tight">Employment Opportunities:</h2>
                <div className="text-sm font-normal text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {course.employment_opportunities}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <h3 className="text-[17px] font-black text-black tracking-tight">This includes following</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check size={20} className="text-emerald-500 shrink-0" /> Videos
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check size={20} className="text-emerald-500 shrink-0" /> Duration: {course.duration && String(course.duration).toLowerCase() !== 'null' ? course.duration : 'N/A'}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check size={20} className="text-emerald-500 shrink-0" /> Semester: {course.semester && String(course.semester).toLowerCase() !== 'null' ? course.semester : 'N/A'}
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check size={20} className="text-emerald-500 shrink-0" /> Certificate: {course.certificate && String(course.certificate).toLowerCase() !== 'null' ? course.certificate : 'Yes'}
                </li>
                {course.course_faculty && String(course.course_faculty).toLowerCase() !== 'null' && (
                  <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <Check size={20} className="text-emerald-500 shrink-0" /> Faculty: {course.course_faculty}
                  </li>
                )}
                {course.eligibility_criteria && String(course.eligibility_criteria).toLowerCase() !== 'null' && (
                  <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <Check size={20} className="text-emerald-500 shrink-0" /> Eligibility: {course.eligibility_criteria}
                  </li>
                )}
                {course.minimum_document_required && String(course.minimum_document_required).toLowerCase() !== 'null' && (
                  <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <Check size={20} className="text-emerald-500 shrink-0" /> Documents Required: {course.minimum_document_required}
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-6 flex flex-wrap gap-4 items-center">
              <Link href="/register">
                <button className="bg-[#005c29] hover:bg-[#003d1b] text-white px-8 py-3.5 rounded font-bold text-sm transition-colors shadow-sm shrink-0">
                  Register Here
                </button>
              </Link>
              {course.syllabus_copy && String(course.syllabus_copy).toLowerCase() !== 'null' && (
                <div className="flex flex-wrap gap-2">
                  {course.syllabus_copy.split(', ').map((pdfItem: string) => {
                    const hasPdfData = pdfItem.includes('###');
                    const pdfName = hasPdfData ? pdfItem.split('###')[0] : pdfItem;
                    const pdfData = hasPdfData ? pdfItem.split('###')[1] : null;
                    if (pdfData) {
                      return (
                        <a 
                          key={pdfItem}
                          href={pdfData} 
                          download={pdfName}
                          className="bg-[#00a5a5] hover:bg-[#003366] text-white px-6 py-3.5 rounded font-bold text-sm transition-all shadow-sm inline-flex items-center gap-2"
                        >
                          Download Syllabus ({pdfName})
                        </a>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Card */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-24">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <img 
                src={thumbnail} 
                alt={courseName} 
                className="w-full h-auto object-cover border-b border-slate-200"
              />
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-[#444] leading-snug">
                  {courseName}
                </h2>
                
                {(() => {
                  const rawPrice = getPrice(course.price);
                  const rawDiscount = getPrice(course.discount);
                  const rawDiscountedPrice = getPrice(course.discounted_price);

                  if (!rawPrice) {
                    return (
                      <span className="text-2xl font-black text-slate-800">
                        Free / Contact College
                      </span>
                    );
                  }

                  const hasDiscount = rawDiscount && parseFloat(rawDiscount) > 0;
                  const finalPrice = hasDiscount && rawDiscountedPrice ? rawDiscountedPrice : rawPrice;

                  return (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl font-black text-slate-800">
                        ₹{finalPrice}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-[15px] font-bold text-slate-500 line-through">
                            ₹{rawPrice}
                          </span>
                          <span className="text-[15px] font-bold text-red-500 ml-1">
                            {rawDiscount}% Off
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM SECTION: Our Courses */}
      <div className="mt-12 py-16 bg-white border-t border-slate-200">
        <h2 className="text-center text-3xl font-black text-slate-800 mb-10">Our Courses</h2>
        <CourseShowcase />
      </div>
    </div>
  );
}
