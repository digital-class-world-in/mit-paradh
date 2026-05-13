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
  
  // Hide global navbar on specialized portals, inquiry page, and courses catalog
  const showGlobalNav = !isHomepage && !isAuthPage && !isStudentPortal && !isAdminPortal && !isCollegePortal && !isStaffPortal && !isInquiryPage && !isCoursesPage;

  return (
    <>
      {showGlobalNav && <Navbar />}
      <main>{children}</main>
    </>
  );
}

