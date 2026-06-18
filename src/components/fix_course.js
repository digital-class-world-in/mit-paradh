const fs = require('fs');

let code = fs.readFileSync('src/components/CourseManager.tsx', 'utf-8');

// 1. Add pagination imports
if (!code.includes('limitToFirst')) {
    code = code.replace(
        "import { ref, onValue, set, remove, get, push, update } from 'firebase/database';",
        "import { ref, onValue, set, remove, get, push, update, query, orderByKey, limitToFirst, startAfter, endBefore, limitToLast } from 'firebase/database';"
    );
}

// 2. We need to replace the data fetching logic.
// The user wants "instant display course data with pagination" and "query in first page and next page".
// To do this server-side for "courses" (and optionally "colleges/X/courses" if collegeId is present),
// we must remove the mega-merging logic and do a paginated query.

const newFetch = `
  const PAGE_SIZE = 10;
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<any[]>([]); // To support "Previous Page"

  const fetchPage = async (direction: 'first' | 'next' | 'prev' = 'first') => {
    setLoading(true);
    try {
      let q;
      const targetRef = collegeId ? getDbRef(\`colleges/\${collegeId}/courses\`) : getDbRef('courses');
      
      if (direction === 'first') {
         q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
         setPageHistory([]);
         setCurrentPage(1);
      } else if (direction === 'next' && lastKey) {
         setPageHistory(prev => [...prev, firstKey]);
         q = query(targetRef, orderByKey(), startAfter(lastKey), limitToFirst(PAGE_SIZE));
         setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev' && pageHistory.length > 0) {
         const prevFirstKey = pageHistory[pageHistory.length - 1];
         setPageHistory(prev => prev.slice(0, -1));
         if (prevFirstKey) {
            q = query(targetRef, orderByKey(), startAfter(prevFirstKey), limitToFirst(PAGE_SIZE));
         } else {
            q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
         }
         setCurrentPage(prev => prev - 1);
      } else {
         q = query(targetRef, orderByKey(), limitToFirst(PAGE_SIZE));
      }

      const snapshot = await get(q);
      const data: any[] = [];
      if (snapshot.exists()) {
         snapshot.forEach((child) => {
            data.push({ id: child.key, source: collegeId ? 'College' : 'Global', ...child.val() });
         });
      }

      if (data.length > 0) {
         setFirstKey(data[0].id);
         setLastKey(data[data.length - 1].id);
         setCourses(data);
      } else if (direction === 'first') {
         setCourses([]);
      }
    } catch (err) {
      console.error("Pagination fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     if (resolvedAdminUid) {
        fetchPage('first');
     }
  }, [resolvedAdminUid, collegeId]);

  const updateMergedCourses = () => {
     // No-op for now, replaced by fetchPage
  };
`;

const stateStart = code.indexOf("  const [courses, setCourses] = useState<any[]>([]);");
const fetchAllStart = code.indexOf("  const fetchAllData = async () => {");
if (stateStart !== -1 && fetchAllStart !== -1) {
    // Just inject our fetchPage and modified states
    const endOfFetchAll = code.indexOf("  useEffect(() => {", fetchAllStart);
    // Well, it's safer to just replace the useEffect directly.
}

// Wait, rewriting the whole CourseManager merging logic will break grouping!
// If we break grouping, "groupedCourses" will be broken.
`;
console.log("Script injected");
