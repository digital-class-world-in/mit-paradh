'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { studentAuth, realtimeDb } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';
import StudentNavbar from '@/components/StudentNavbar';
import { Header } from '@/components/MSBSVET/Header';

const cleanDataForCache = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  try {
    const cleaned = JSON.parse(JSON.stringify(data));
    const stripBase64 = (item: any) => {
      if (!item || typeof item !== 'object') return;
      for (const key in item) {
        if (typeof item[key] === 'string' && item[key].startsWith('data:')) {
          item[key] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        } else if (typeof item[key] === 'object') {
          stripBase64(item[key]);
        }
      }
    };
    stripBase64(cleaned);
    return cleaned;
  } catch (e) {
    return data;
  }
};

const safeSessionSet = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      const cleanedValue = cleanDataForCache(value);
      sessionStorage.setItem(key, typeof cleanedValue === 'string' ? cleanedValue : JSON.stringify(cleanedValue));
    } catch (e) {
      console.error(`Error writing to sessionStorage for key ${key}:`, e);
    }
  }
};

const safeSessionRemove = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from sessionStorage for key ${key}:`, e);
    }
  }
};

function StudentLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isExamConfigured, setIsExamConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = parseInt(searchParams.get('tab') || '1');

  useEffect(() => {
    document.title = "MIT PARADH | Student Pannel";

    // 1. Initial read from sessionStorage (safely client-side)
    if (typeof window !== 'undefined') {
      const cachedUserData = sessionStorage.getItem('student_user_data');
      if (cachedUserData) {
        try {
          setUserData(JSON.parse(cachedUserData));
          setLoading(false);
        } catch (e) {
          console.error("Error parsing cached student data", e);
        }
      }
      const cachedApps = sessionStorage.getItem('student_applications');
      if (cachedApps) {
        try {
          const apps = JSON.parse(cachedApps);
          setHasApplied(Object.keys(apps).length > 0);
        } catch (e) {}
      }
      const cachedExamConfig = sessionStorage.getItem('student_exam_configured');
      if (cachedExamConfig) {
        setIsExamConfigured(cachedExamConfig === 'true');
      }
    }

    let unsubUser: (() => void) | null = null;
    let unsubApps: (() => void) | null = null;
    let unsubCourse: (() => void) | null = null;
    let unsubConfig: (() => void) | null = null;

    const cleanupLayoutListeners = () => {
      if (unsubUser) unsubUser();
      if (unsubApps) unsubApps();
      if (unsubCourse) unsubCourse();
      if (unsubConfig) unsubConfig();
    };

    const unsubscribe = onAuthStateChanged(studentAuth, async (user) => {
      const isEmergencyBypass = sessionStorage.getItem('emergencyBypass') === 'true';
      const bypassedUid = sessionStorage.getItem('bypassedUid');

      cleanupLayoutListeners();

      if (user || (isEmergencyBypass && bypassedUid)) {
        const currentUid = user ? user.uid : bypassedUid;
        if (!currentUid) {
          setLoading(false);
          router.push('/login/student');
          return;
        }

        const setupCourseAndConfigListeners = (activeApp: any) => {
          const getCourseSlug = async () => {
            try {
              const cSnap = await get(ref(realtimeDb, `colleges/${activeApp.collegeId}/courses/${activeApp.courseId}`));
              if (cSnap.exists()) {
                const courseData = cSnap.val();
                if (courseData?.course_slug && courseData.course_slug !== 'NULL') {
                  return courseData.course_slug;
                }
              }
              // Fallback to global
              const gSnap = await get(ref(realtimeDb, `courses/${activeApp.courseId}`));
              if (gSnap.exists()) {
                const gData = gSnap.val();
                if (gData?.course_slug && gData.course_slug !== 'NULL') {
                  return gData.course_slug;
                }
              }
            } catch (e) {
              console.error("Error fetching course details for slug lookup:", e);
            }
            return activeApp.courseId || 'Regular';
          };

          if (unsubCourse) unsubCourse();
          const courseRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/courses/${activeApp.courseId}`);
          unsubCourse = onValue(courseRef, (courseSnap) => {
            getCourseSlug().then((courseSlug) => {
              const configId = `${activeApp.courseType || 'Regular'}_${courseSlug}`.replace(/\s+/g, '_');
              const configRef = ref(realtimeDb, `colleges/${activeApp.collegeId}/examConfigurations/${configId}`);
              
              if (unsubConfig) unsubConfig();
              unsubConfig = onValue(configRef, (configSnap) => {
                const configured = configSnap.exists();
                setIsExamConfigured(configured);
                safeSessionSet('student_exam_configured', configured ? 'true' : 'false');
              });
            });
          });
        };

        // Determine if user exists in global users first
        const userRef = ref(realtimeDb, 'users/' + currentUid);
        const userSnap = await get(userRef);

        if (userSnap.exists()) {
          // ── NORMAL STUDENT ──
          unsubUser = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const fn = data.profile?.firstName || data.firstName || data.name || 'Student';
              const mn = data.profile?.middleName || data.middleName || '';
              const ln = data.profile?.lastName || data.lastName || '';
              const rawParts = [fn, mn, ln].map(s => (s || '').trim()).filter(Boolean);
              const uniqueWords: string[] = [];
              rawParts.join(' ').split(/\s+/).forEach(w => {
                if (w && !uniqueWords.some(u => u.toLowerCase() === w.toLowerCase())) {
                  uniqueWords.push(w);
                }
              });
              const fullName = uniqueWords.join(' ').trim() || 'Student';
              const displayFirstName = fn.trim().split(/\s+/)[0] || 'Student';
              const updatedUser = { ...data, firstName: fn, middleName: mn, lastName: ln, fullName, studentName: fullName, displayFirstName, uid: currentUid };
              setUserData(updatedUser);
              safeSessionSet('student_user_data', updatedUser);
            } else {
              const updatedUser = { firstName: 'Student', fullName: 'Student', uid: currentUid };
              setUserData(updatedUser);
              safeSessionSet('student_user_data', updatedUser);
            }
            setLoading(false);
          });

          const appsRef = ref(realtimeDb, `users/${currentUid}/applications`);
          unsubApps = onValue(appsRef, (appsSnap) => {
            if (appsSnap.exists()) {
              setHasApplied(true);
              const appsVal = appsSnap.val();
              safeSessionSet('student_applications', appsVal);
              const apps = Object.values(appsVal);
              const activeApp: any = apps.find((a: any) => a.status === 'Accepted' || a.status === 'Confirmed') || apps[0];
              
              if (activeApp?.collegeId && activeApp?.courseName) {
                setupCourseAndConfigListeners(activeApp);
              } else {
                if (unsubCourse) { unsubCourse(); unsubCourse = null; }
                if (unsubConfig) { unsubConfig(); unsubConfig = null; }
                setIsExamConfigured(false);
                safeSessionSet('student_exam_configured', 'false');
              }
            } else {
              safeSessionRemove('student_applications');
              setHasApplied(false);
              safeSessionSet('student_exam_configured', 'false');
              if (unsubCourse) { unsubCourse(); unsubCourse = null; }
              if (unsubConfig) { unsubConfig(); unsubConfig = null; }
              setIsExamConfigured(false);
            }
          });
        } else {
          // ── MANUALLY REGISTERED STUDENT ──
          console.log("[student/layout] User not in users node. Searching colleges optimally...");
          let foundStudent = null;
          let foundCollegeId = null;

          try {
            const dbUrl = "https://mit-paradh-default-rtdb.firebaseio.com";
            const response = await fetch(`${dbUrl}/colleges.json?shallow=true`);
            if (response.ok) {
              const collegesData = await response.json();
              const collegeIds = Object.keys(collegesData || {});
              
              for (const cid of collegeIds) {
                const manualStudentRef = ref(realtimeDb, `colleges/${cid}/students/${currentUid}`);
                const stuSnap = await get(manualStudentRef);
                if (stuSnap.exists()) {
                  foundStudent = stuSnap.val();
                  foundCollegeId = cid;
                  break;
                }
              }
            }
          } catch (e) {
            console.error("Optimized colleges search failed in layout", e);
          }
          
          if (foundStudent && foundCollegeId) {
            console.log("[student/layout] Manual student found in college:", foundCollegeId);
            const manualStudentRef = ref(realtimeDb, `colleges/${foundCollegeId}/students/${currentUid}`);
            unsubUser = onValue(manualStudentRef, (snapshot) => {
              if (snapshot.exists()) {
                const sData = snapshot.val();
                const fn = sData.firstName || 'Student';
                const mn = sData.middleName || '';
                const ln = sData.lastName || '';
                const rawParts = [fn, mn, ln].map(s => (s || '').trim()).filter(Boolean);
                const uniqueWords: string[] = [];
                rawParts.join(' ').split(/\s+/).forEach(w => {
                  if (w && !uniqueWords.some(u => u.toLowerCase() === w.toLowerCase())) {
                    uniqueWords.push(w);
                  }
                });
                const fullName = uniqueWords.join(' ').trim() || 'Student';
                const displayFirstName = fn.trim().split(/\s+/)[0] || 'Student';
                
                const updatedUser = {
                  ...sData,
                  uid: currentUid,
                  role: 'student',
                  firstName: fn,
                  middleName: mn,
                  lastName: ln,
                  fullName,
                  studentName: fullName,
                  displayFirstName,
                  collegeId: foundCollegeId,
                  profile: {
                    firstName: sData.firstName || '',
                    lastName: sData.lastName || '',
                    fatherFirstName: sData.fatherFirstName || '',
                    motherFirstName: sData.motherFirstName || '',
                    dateOfBirth: sData.dob || '',
                    gender: sData.gender || '',
                    mobileNumber: sData.phone || '',
                    address: sData.address || '',
                    aadhaarNo: sData.aadharNumber || '',
                    photoUrl: sData.photo || '',
                    regNo: sData.studentId || '',
                    profileLocked: true,
                    status: 'Accepted'
                  }
                };
                setUserData(updatedUser);
                safeSessionSet('student_user_data', updatedUser);
                
                const simulatedApps = {
                  "manual_app": {
                    "id": "manual_app",
                    "applicationId": sData.studentId || currentUid,
                    "collegeId": foundCollegeId,
                    "courseId": sData.courseId || '',
                    "courseName": sData.courseType || 'General',
                    "courseType": sData.courseType || 'Regular',
                    "fees": sData.fees || '0',
                    "registrationFeeStatus": "Paid",
                    "status": "Accepted",
                    "studentName": fullName
                  }
                };
                setHasApplied(true);
                safeSessionSet('student_applications', simulatedApps);
                
                setupCourseAndConfigListeners(simulatedApps.manual_app);
              } else {
                const updatedUser = { firstName: 'Student', fullName: 'Student', uid: currentUid };
                setUserData(updatedUser);
                safeSessionSet('student_user_data', updatedUser);
              }
              setLoading(false);
            });
          } else {
            console.log("[student/layout] Manual student NOT found in any college.");
            const updatedUser = { firstName: 'Student', fullName: 'Student', uid: currentUid };
            setUserData(updatedUser);
            safeSessionSet('student_user_data', updatedUser);
            setLoading(false);
          }
        }
      } else {
        router.push('/login/student');
      }
    });

    return () => {
      unsubscribe();
      cleanupLayoutListeners();
    };
  }, [router]);

  const handleTabChange = (tabId: number, tabName?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId.toString());
    if (tabName) params.set('name', tabName.toLowerCase().replace(/\s+/g, '-'));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'student_user_data',
          'student_applications',
          'student_available_courses',
          'student_available_colleges',
          'student_custom_documents',
          'student_user_payments',
          'student_college_payment_settings',
          'student_exam_settings',
          'student_exam_submissions',
          'student_online_exams',
          'student_exam_configured',
          'emergencyBypass',
          'bypassedUid'
        ];
        keysToRemove.forEach(key => safeSessionRemove(key));
      }
      await signOut(studentAuth);
      router.push('/');
    } catch (error) {
      console.error('Student logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-[#f8fafc]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#00a5a5] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[13px] font-black text-[#003366] uppercase tracking-[0.3em]">Institutional Student Portal</p>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-[#00a5a5] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <div className="print:hidden">
        <Header />
      </div>
      <StudentNavbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        studentName={userData?.fullName || userData?.studentName || `${userData?.profile?.firstName || ''} ${userData?.profile?.middleName || ''} ${userData?.profile?.lastName || ''}`.trim() || userData?.firstName || 'Student'}
        onLogout={handleLogout}
        hasApplied={hasApplied}
        isExamConfigured={isExamConfigured}
      />
      <main className="max-w-[1600px] w-full mx-auto px-4 md:px-12 pb-20 pt-6 transition-all">
        {children}
      </main>
      <footer className="text-center py-12 opacity-30 mt-auto print:hidden">
        <p className="text-[13px] font-black capitalize tracking-[0.5em] text-black">Institutional ERP Phase IV | Safe Campus Edition</p>
      </footer>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#5D5fb1] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-[13px] font-black capitalize tracking-normal text-black animate-pulse">Loading Student Portal</p>
      </div>
    }>
      <StudentLayoutContent>
        {children}
      </StudentLayoutContent>
    </Suspense>
  );
}


