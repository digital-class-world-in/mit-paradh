'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {




  


  const pathname = usePathname();
  // Hide global Navbar on the home page, login, register, and student portal
  // These sections have their own specialized headers/navbars
  const isHomepage = pathname === '/';
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isStudentPortal = pathname.startsWith('/student');
  const isAdminPortal = pathname.startsWith('/admin');
  const isCollegePortal = pathname.startsWith('/college');
  const isStaffPortal = pathname.startsWith('/staff');
  const isInquiryPage = pathname.startsWith('/inquiry');
  const isCoursesPage = pathname.startsWith('/courses');
  const isAboutPage = pathname.startsWith('/about');
  const isContactPage = pathname.startsWith('/contact');
  const isCourseViewPage = pathname.endsWith('/courseview') || pathname.includes('/courseview');
  
  // Hide global navbar on all public website pages and specialized portals
  const showGlobalNav = !isHomepage && !isAboutPage && !isContactPage && !isAuthPage && !isStudentPortal && !isAdminPortal && !isCollegePortal && !isStaffPortal && !isInquiryPage && !isCoursesPage && !isCourseViewPage;

  return (
    <>
      {showGlobalNav && <Navbar />}
      <main>{children}</main>
    </>
  );
}

