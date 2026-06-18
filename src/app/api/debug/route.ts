import { NextResponse } from 'next/server';
import { get, ref } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export async function GET() {
  try {
    const snapshot = await get(ref(realtimeDb, 'users'));
    if (!snapshot.exists()) return NextResponse.json({ error: 'No users found' });
    
    const users = snapshot.val();
    const result: any = {};
    
    for (const uid in users) {
      const user = users[uid];
      const role = user?.role;
      const modules = user?.modules || {};
      const coursesCount = modules.courses ? Object.keys(modules.courses).length : 0;
      const collegesCount = modules.colleges ? Object.keys(modules.colleges).length : 0;
      
      let collegeCoursesCount = 0;
      if (modules.colleges) {
        for (const cid in modules.colleges) {
          if (modules.colleges[cid].courses) {
            collegeCoursesCount += Object.keys(modules.colleges[cid].courses).length;
          }
        }
      }

      if (role === 'admin' || coursesCount > 0 || collegesCount > 0 || collegeCoursesCount > 0) {
        result[uid] = {
          role,
          globalCourses: coursesCount,
          colleges: collegesCount,
          collegeCourses: collegeCoursesCount,
          email: user?.email,
          name: user?.firstName || user?.name
        };
      }
    }

    // Also check root
    const rootCoursesSnap = await get(ref(realtimeDb, 'courses'));
    const rootCollegesSnap = await get(ref(realtimeDb, 'colleges'));
    
    result['__ROOT__'] = {
      globalCourses: rootCoursesSnap.exists() ? Object.keys(rootCoursesSnap.val()).length : 0,
      colleges: rootCollegesSnap.exists() ? Object.keys(rootCollegesSnap.val()).length : 0
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
