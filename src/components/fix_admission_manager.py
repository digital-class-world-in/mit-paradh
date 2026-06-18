import re

with open("src/components/StudentAdmissionManager.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add imports
if "limitToFirst" not in code:
    code = code.replace(
        "import { ref, onValue, set, remove, get, push, update } from 'firebase/database';",
        "import { ref, onValue, set, remove, get, push, update, query, orderByKey, limitToFirst, startAfter, endAt } from 'firebase/database';"
    )

# Replace state and useEffect
new_state_and_effect = """
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Accepted');

  useEffect(() => {
    setCurrentPage(1);
    setLastKey(null);
    setHasMore(true);
    setAdmissions([]);
    fetchPage(null);
  }, [statusFilter, selectedCollegeId, collegeId, resolvedAdminUid]);

  const getDbRef = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const adminId = resolvedAdminUid || 'default-admin-uid';
    return ref(realtimeDb, `users/${adminId}/modules/${cleanPath}`);
  };

  const fetchPage = async (cursor: string | null = null) => {
    if (!realtimeDb || !resolvedAdminUid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Fetch colleges for filtering once
      if (availableColleges.length === 0) {
        const collegesRef = getDbRef('colleges');
        const colSnap = await get(collegesRef);
        if (colSnap.exists()) {
           setAvailableColleges(Object.entries(colSnap.val()).map(([id, val]: any) => ({ id, ...val })));
        }
      }

      let q;
      if (collegeId || selectedCollegeId) {
        const targetCid = collegeId || selectedCollegeId;
        const admsRef = getDbRef(`colleges/${targetCid}/studentAdmissions`);
        if (cursor) {
           q = query(admsRef, orderByKey(), startAfter(cursor), limitToFirst(PAGE_SIZE));
        } else {
           q = query(admsRef, orderByKey(), limitToFirst(PAGE_SIZE));
        }
      } else {
         const usersRef = getDbRef('registrations');
         if (cursor) {
           q = query(usersRef, orderByKey(), startAfter(cursor), limitToFirst(PAGE_SIZE));
         } else {
           q = query(usersRef, orderByKey(), limitToFirst(PAGE_SIZE));
         }
      }

      const snapshot = await get(q);
      const data: any[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
           let val = child.val();
           if ((!collegeId && !selectedCollegeId) && val.profile) {
              val = val.profile; // Extract profile if querying registrations
           }
           data.push({
             id: child.key,
             source: 'Admission',
             studentName: val.studentName || `${val.firstName || ''} ${val.lastName || ''}`.trim(),
             studentEmail: val.studentEmail || val.email,
             studentPhone: val.studentPhone || val.phone,
             admissionDate: val.admissionDate || val.createdAt || val.date,
             ...val
           });
        });
      }

      let filteredData = data.filter(adm => {
        let matchStatus = true;
        if (statusFilter !== 'All') {
          const st = adm.admissionStatus || 'Pending';
          if (statusFilter === 'Accepted') {
             matchStatus = ['Accepted', 'Approved', 'Verified', 'Confirmed'].includes(st) || adm.source === 'Manual';
          } else {
             matchStatus = st === statusFilter;
          }
        }
        return matchStatus;
      });

      if (data.length > 0) {
        setLastKey(data[data.length - 1].id);
        if (cursor) {
           setAdmissions(prev => [...prev, ...filteredData]);
        } else {
           setAdmissions(filteredData);
        }
      } else {
        if (!cursor) setAdmissions([]);
      }

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const paginatedAdmissions = admissions; // Now already paginated
"""

start_str = "  const [admissions, setAdmissions] = useState<any[]>([]);"
end_str = "  const [isEditModalOpen, setIsEditModalOpen] = useState(false);"
start_idx = code.find(start_str)
end_idx = code.find(end_str)

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + new_state_and_effect + "\n" + code[end_idx:]

start_pag = "  const itemsPerPage = 10;"
end_pag = "  const paginatedAdmissions = filteredAdmissions.slice(startIndex, endIndex);"
start_idx2 = code.find(start_pag)
end_idx2 = code.find(end_pag) + len(end_pag)

if start_idx2 != -1 and end_idx2 != -1:
    code = code[:start_idx2] + code[end_idx2:] # remove the old pagination

# Fix the render part
render_part_old = "{totalPages > 0 && ("
render_part_new = "{hasMore && ("
code = code.replace(render_part_old, render_part_new)

# Add load more button
load_more = """
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchPage(lastKey)}
                disabled={loading}
                className="px-6 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
"""

# Replace pagination nav with load more
start_nav = "          {hasMore && ("
end_nav = "          )}"
snav = code.find(start_nav)
if snav != -1:
    enav = code.find("          )}", snav)
    if enav != -1:
        enav += len("          )}")
        code = code[:snav] + load_more + code[enav:]

with open("src/components/StudentAdmissionManager.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Done")
