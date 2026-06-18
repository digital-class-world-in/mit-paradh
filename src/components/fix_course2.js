const fs = require('fs');

let code = fs.readFileSync('src/components/CourseManager.tsx', 'utf-8');

// 1. Ensure limitToFirst imports
if (!code.includes('limitToFirst')) {
    code = code.replace(
        "import { ref, onValue, push, set, remove, get } from 'firebase/database';",
        "import { ref, onValue, push, set, remove, get, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';"
    );
    code = code.replace(
        "import { ref, onValue, push, set, remove } from 'firebase/database';",
        "import { ref, onValue, push, set, remove, get, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';"
    );
}

const newState = `
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
`;

const fetchLogic = `
  const fetchPage = async (cursor: string | null = null) => {
    if (!realtimeDb || !resolvedAdminUid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const targetCid = collegeId || selectedCollegeId;
      const targetRef = targetCid ? getDbRef(\`colleges/\${targetCid}/courses\`) : getDbRef('courses');
      
      let q;
      if (cursor) {
        q = query(targetRef, orderByKey(), startAfter(cursor), limitToFirst(PAGE_SIZE));
      } else {
        q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
      }

      const snapshot = await get(q);
      const data: any[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          data.push({
            id: child.key,
            source: targetCid ? 'College' : 'Global',
            collegeName: targetCid ? 'College Course' : 'System Registry',
            ...child.val(),
            course_name: child.val().course_name || child.val().name || '',
          });
        });
      }

      if (data.length > 0) {
        setLastKey(data[data.length - 1].id);
        if (cursor) {
           setCourses(prev => {
              const newItems = data.filter(d => !prev.some(p => p.id === d.id));
              return [...prev, ...newItems];
           });
        } else {
           setCourses(data);
        }
      } else {
        if (!cursor) setCourses([]);
      }

      setHasMore(data.length === PAGE_SIZE);

      // We still need collegesList for dropdowns
      if (collegesList.length === 0) {
         const colSnap = await get(getDbRef('colleges'));
         if (colSnap.exists()) {
            setCollegesList(Object.entries(colSnap.val()).map(([id, val]: any) => ({ id, ...val })));
         }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLastKey(null);
    setHasMore(true);
    setCourses([]);
    fetchPage(null);
  }, [collegeId, resolvedAdminUid, selectedCollegeId]);
`;

// It's too complex to rewrite CourseManager blindly because it is huge (2100 lines)
// and handles a ton of state logic. 
`;

console.log("Not executing rewrite blindly.");
