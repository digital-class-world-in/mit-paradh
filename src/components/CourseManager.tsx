'use client';

import { useState, useEffect, useRef } from 'react';
import { realtimeDb, storage } from '@/lib/firebase';
import { ref, onValue, push, set, remove, update, get, query, orderByKey, limitToFirst, startAfter, orderByChild, equalTo } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Book, Plus, Search, Timer, Edit2, Trash2, Globe, Save, Loader2, BookOpen, X, Download, Upload, Building2, Settings, GripVertical, Eye, RefreshCw, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CourseManagerProps {
  collegeId?: string;
  adminUid?: string;
}

const defaultCourseData = {
  course_type: '',
  course_faculty: '',
  course_name: '',
  duration: '',
  semester: '',
  subcategory: '',
  thumbnail: '',
  thumbnail_2: '',
  thumbnail_3: '',
  description: '',
  category: '',
  category_id: '',
  language: '',
  certificate: 'Yes',
  eligibility_criteria: '',
  minimum_document_required: '',
  maximum_document_required: '',
  price: '',
  online_price: '',
  offline_price: '',
  discount: '',
  discounted_price: '',
  onhomepage: 'Yes',
  course_learning_type: '',
  upi_id: '',
  total_seats: '',
  syllabus_copy: '',
  subject_detail: '',
  employment_opportunities: '',
  affiliate_id: '',
  hour: '',
  chapters: '',
  lectures: '',
  payment_qr: '',
  subject_teacher: '',
  chapter_detail: '',
  active: 'Yes',
};

const managedKeys = [
  'course_type',
  'course_faculty',
  'course_name',
  'duration',
  'semester',
  'subcategory',
  'category',
  'category_id',
  'language',
  'eligibility_criteria',
  'minimum_document_required',
  'maximum_document_required',
  'upi_id',
  'onhomepage',
  'course_learning_type',
  'chapters',
  'lectures'
];

const CustomDropdown = ({ value, onChange, options, placeholder, id, openDropdownId, setOpenDropdownId, className, searchable }: any) => {
  const isOpen = openDropdownId === id;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const getOptValue = (opt: any) => {
    if (opt && typeof opt === 'object') {
      return opt.value !== undefined ? opt.value : '';
    }
    return opt;
  };

  const getOptLabel = (opt: any) => {
    if (opt && typeof opt === 'object') {
      return opt.label !== undefined && opt.label !== '' ? opt.label : (opt.value !== undefined ? opt.value : '');
    }
    return opt;
  };

  const filteredOptions = options.filter((opt: any) => {
    const label = String(getOptLabel(opt)).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative custom-dropdown w-full">
      <div
        onClick={() => setOpenDropdownId(isOpen ? null : id)}
        className={`${className} flex justify-between items-center`}
      >
        <span className="truncate">
          {options.find((o: any) => getOptValue(o) === value)?.label || value || placeholder}
        </span>
        <span className="text-slate-400 text-[10px] ml-2 shrink-0">▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-2xl z-[200] max-h-60 overflow-y-scroll flex flex-col custom-scrollbar">
          {searchable && (
            <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs outline-none focus:border-[#00a5a5]"
                autoFocus
              />
            </div>
          )}
          {placeholder && !searchTerm && (
            <div
              onClick={() => { onChange(''); setOpenDropdownId(null); }}
              className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 text-slate-500 text-sm font-medium"
            >
              {placeholder}
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-slate-400 text-xs font-medium text-center">No results found</div>
          ) : (
            filteredOptions.map((opt: any) => {
              const val = getOptValue(opt);
              const label = getOptLabel(opt);
              return (
                <div
                  key={val}
                  onClick={() => { onChange(val); setOpenDropdownId(null); }}
                  className={`p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-sm font-medium ${val === value ? 'text-[#00a5a5] bg-teal-50/30' : 'text-slate-700'}`}
                >
                  {label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const getOptionLabel = (val: string) => val.includes('###') ? val.split('###')[0] : val;

const CourseManager = ({ collegeId, adminUid }: CourseManagerProps) => {
  const [resolvedAdminUid, setResolvedAdminUid] = useState(adminUid || '');

  useEffect(() => {
    if (adminUid) {
      setResolvedAdminUid(adminUid);
    } else {
      import('@/lib/adminUtils').then(({ getDefaultAdminUid }) => {
        getDefaultAdminUid().then(setResolvedAdminUid);
      });
    }
  }, [adminUid]);

  const getDbRef = (path: string) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return ref(realtimeDb, cleanPath);
  };

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [pageCache, setPageCache] = useState<Record<string, any[]>>({});
  const [allFilteredData, setAllFilteredData] = useState<any[]>([]);
  const [isFilterMode, setIsFilterMode] = useState(false);
  const PAGE_SIZE = 2000;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterCollegeId, setFilterCollegeId] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStream, setFilterStream] = useState('');

  const [formData, setFormData] = useState<any>(defaultCourseData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const [dropdownOptions, setDropdownOptions] = useState<Record<string, string[]>>({
    course_type: ['Diploma', 'Degree', 'Certificate'],
    course_faculty: [],
    course_name: [],
    duration: ['1 Year', '2 Years', '3 Years', '4 Years', '6 Months'],
    semester: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'],
    category: ['Computer Science', 'Management', 'Engineering', 'Arts', 'Science'],
    category_id: ['CS', 'MGMT', 'ENG', 'ARTS', 'SCI'],
    subcategory: ['Software Development', 'Data Science', 'Finance', 'Marketing', 'Mechanical', 'Electrical'],
    language: ['English', 'Hindi', 'Marathi'],
    eligibility_criteria: ['10th Pass', '12th Pass', 'Graduation', 'Post Graduation', 'Diploma Holder'],
    minimum_document_required: ['10th Marksheet', '12th Marksheet', 'Aadhar Card', 'Passport Photo', 'Signature'],
    maximum_document_required: ['10th Marksheet', '12th Marksheet', 'Aadhar Card', 'Passport Photo', 'Signature', 'Leaving Certificate', 'Caste Certificate', 'Income Certificate'],
    syllabus_copy: [],
    upi_id: [],
    chapters: ['5', '10', '15', '20', '30'],
    lectures: ['20', '40', '60', '80', '100'],
    onhomepage: ['Yes', 'No'],
    course_learning_type: ['Online', 'Offline', 'Hybrid']
  });

  const [manageOptionsKey, setManageOptionsKey] = useState<string | null>(null);
  const [isManageOptionsModalOpen, setIsManageOptionsModalOpen] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);

  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');


  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCourseToImport, setSelectedCourseToImport] = useState<any>(null);
  const [targetCollegeIds, setTargetCollegeIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<{ old: string, new: string } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.('.custom-dropdown')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const getGroupedCourses = (coursesList: any[]) => {
    const groups: { [key: string]: any } = {};

    coursesList.forEach((course) => {
      const nameKey = course.course_group_id || (course.course_name || '').trim();
      if (!nameKey) return;

      if (!groups[nameKey]) {
        groups[nameKey] = {
          ...course,
          assignedColleges: []
        };
      }

      const collegeObj = {
        id: course.collegeId || 'global',
        name: course.source === 'Global' ? 'System Registry' : (course.collegeName || 'Unnamed College'),
        source: course.source,
        courseId: course.id
      };

      if (!groups[nameKey].assignedColleges.some((c: any) => c.id === collegeObj.id)) {
        groups[nameKey].assignedColleges.push(collegeObj);
      }

      if (!groups[nameKey].instances) {
        groups[nameKey].instances = [];
      }
      groups[nameKey].instances.push(course);
    });

    return Object.values(groups);
  };

  const groupedCourses = getGroupedCourses(courses);

  const fetchAllCourses = async () => {
    if (!realtimeDb || !resolvedAdminUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const targetCid = collegeId || filterCollegeId;
      let allData: any[] = [];

      if (targetCid) {
        // Fetch courses for specific college only
        const snapshot = await get(getDbRef(`colleges/${targetCid}/courses`));
        const collegeName = collegesList.find((c: any) => c.id === targetCid)?.name || 'College';
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const val = child.val();
            allData.push({
              id: child.key,
              source: 'College',
              collegeId: targetCid,
              collegeName,
              ...val,
              course_name: val.course_name || val.name || '',
              course_type: val.course_type || val.type || '',
            });
          });
        }
      } else {
        // Fetch colleges list first (if not loaded)
        let currentCollegesList = collegesList;
        if (currentCollegesList.length === 0) {
          try {
            const collegesSnap = await get(ref(realtimeDb, 'colleges'));
            if (collegesSnap.exists()) {
              const fetched = Object.entries(collegesSnap.val()).map(([id, val]: any) => ({
                id,
                name: val.name || val.collegeName || id,
              }));
              setCollegesList(fetched);
              currentCollegesList = fetched;
            }
          } catch (err) {
            console.error('Error fetching colleges list', err);
          }
        }

        // Fetch global courses
        const globalSnap = await get(getDbRef('courses'));
        if (globalSnap.exists()) {
          globalSnap.forEach((child) => {
            const val = child.val();
            allData.push({
              id: child.key,
              source: 'Global',
              collegeName: 'System Registry',
              ...val,
              course_name: val.course_name || val.name || '',
              course_type: val.course_type || val.type || '',
            });
          });
        }

        // Fetch courses from ALL colleges in parallel
        if (currentCollegesList.length > 0) {
          const collegePromises = currentCollegesList.map(async (college: any) => {
            try {
              const snap = await get(getDbRef(`colleges/${college.id}/courses`));
              if (snap.exists()) {
                const items: any[] = [];
                snap.forEach((child) => {
                  const val = child.val();
                  items.push({
                    id: child.key,
                    source: 'College',
                    collegeId: college.id,
                    collegeName: college.name,
                    ...val,
                    course_name: val.course_name || val.name || '',
                    course_type: val.course_type || val.type || '',
                  });
                });
                return items;
              }
            } catch (e) {
              console.error(`Error fetching courses for college ${college.id}`, e);
            }
            return [];
          });
          const results = await Promise.all(collegePromises);
          results.forEach((items) => allData.push(...items));
        }
      }

      // Store ALL data — client-side filtering via filteredCourses
      setCourses(allData);
      setHasMore(false);
      setCurrentPage(1);
      setPageHistory([]);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Alias for compatibility
  const fetchPage = fetchAllCourses;
  const fetchAllData = fetchAllCourses;

  // Only re-fetch from Firebase when college scope changes — filters apply client-side
  useEffect(() => {
    if (!resolvedAdminUid) return;
    setCourses([]);
    fetchAllCourses();
  }, [collegeId, resolvedAdminUid, filterCollegeId]);

  useEffect(() => {
    if (!realtimeDb || !resolvedAdminUid) return;

    const staffRef = getDbRef('staff');
    const unsubStaff = onValue(staffRef, (snapshot) => {
      if (snapshot.exists()) {
        const staffData = snapshot.val();
        const list = Object.entries(staffData).map(([id, val]: any) => ({
          id,
          ...val,
          fullName: `${val.firstName || ''} ${val.lastName || ''}`.trim() || val.email || 'Unnamed Staff'
        }));
        setStaffList(list);
      } else {
        setStaffList([]);
      }
    });
    return () => unsubStaff();
  }, [resolvedAdminUid]);

  useEffect(() => {
    if (!realtimeDb || !resolvedAdminUid) return;

    const optionsRef = getDbRef('courseDropdownOptions');
    const unsubOptions = onValue(optionsRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      const merged: any = {};
      const defaultOptions: any = {
        course_type: ['Diploma', 'Degree', 'Certificate'],
        course_faculty: [],
        course_name: [],
        duration: ['1 Year', '2 Years', '3 Years', '4 Years', '6 Months'],
        semester: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester'],
        category: ['Computer Science', 'Management', 'Engineering', 'Arts', 'Science'],
        category_id: ['CS', 'MGMT', 'ENG', 'ARTS', 'SCI'],
        subcategory: ['Software Development', 'Data Science', 'Finance', 'Marketing', 'Mechanical', 'Electrical'],
        language: ['English', 'Hindi', 'Marathi'],
        eligibility_criteria: ['10th Pass', '12th Pass', 'Graduation', 'Post Graduation', 'Diploma Holder'],
        minimum_document_required: ['10th Marksheet', '12th Marksheet', 'Aadhar Card', 'Passport Photo', 'Signature'],
        maximum_document_required: ['10th Marksheet', '12th Marksheet', 'Aadhar Card', 'Passport Photo', 'Signature', 'Leaving Certificate', 'Caste Certificate', 'Income Certificate'],
        syllabus_copy: [],
        upi_id: [],
        chapters: ['5', '10', '15', '20', '30'],
        lectures: ['20', '40', '60', '80', '100'],
        onhomepage: ['Yes', 'No'],
        course_learning_type: ['Online', 'Offline', 'Hybrid']
      };

      Object.keys(defaultOptions).forEach((field) => {
        if (data[field]) {
          const arr = Array.isArray(data[field]) ? data[field] : Object.values(data[field]);
          merged[field] = arr.filter(v => v !== '__EMPTY__');
        } else {
          merged[field] = defaultOptions[field];
        }
      });
      setDropdownOptions(merged);
    });
    return () => unsubOptions();
  }, [resolvedAdminUid]);

  const handleAddOption = async () => {
    if (!manageOptionsKey || !newOptionValue.trim()) return;
    const currentOptions = dropdownOptions[manageOptionsKey] || [];
    const val = newOptionValue.trim();
    if (currentOptions.includes(val)) {
      alert("Option already exists!");
      return;
    }
    const updated = [...currentOptions, val];
    await set(getDbRef(`courseDropdownOptions/${manageOptionsKey}`), updated);
    setNewOptionValue('');
  };

  const handleDeleteOption = async (optionToDelete: string) => {
    if (!manageOptionsKey) return;
    if (window.confirm(`Are you sure you want to delete "${optionToDelete}"?`)) {
      const currentOptions = dropdownOptions[manageOptionsKey] || [];
      let updated = currentOptions.filter(opt => opt !== optionToDelete);
      if (updated.length === 0) updated = ['__EMPTY__'];

      await set(getDbRef(`courseDropdownOptions/${manageOptionsKey}`), updated);

      if (formData[manageOptionsKey] === optionToDelete) {
        setFormData((prev: any) => ({ ...prev, [manageOptionsKey]: '' }));
      } else if (manageOptionsKey === 'language' && formData.language) {
        const langs = formData.language.split(', ');
        if (langs.includes(optionToDelete)) {
          setFormData((prev: any) => ({ ...prev, language: langs.filter((l: string) => l !== optionToDelete).join(', ') }));
        }
      }
    }
  };

  const handleEditOption = async () => {
    if (!manageOptionsKey || !editingOption || !editingOption.new.trim()) return;
    const currentOptions = dropdownOptions[manageOptionsKey] || [];
    const val = editingOption.new.trim();
    if (val !== editingOption.old && currentOptions.includes(val)) {
      alert("Option already exists!");
      return;
    }
    const updated = currentOptions.map(opt => opt === editingOption.old ? val : opt);
    await set(getDbRef(`courseDropdownOptions/${manageOptionsKey}`), updated);

    if (formData[manageOptionsKey] === editingOption.old) {
      setFormData((prev: any) => ({ ...prev, [manageOptionsKey]: val }));
    } else if (manageOptionsKey === 'language' && formData.language) {
      const langs = formData.language.split(', ');
      if (langs.includes(editingOption.old)) {
        setFormData((prev: any) => ({ ...prev, language: langs.map((l: string) => l === editingOption.old ? val : l).join(', ') }));
      }
    }
    setEditingOption(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === 'price' || name === 'discount') {
      const priceVal = parseFloat(newFormData.price || '0');
      const discountVal = parseFloat(newFormData.discount || '0');

      if (priceVal > 0 && discountVal > 0) {
        const discounted = priceVal - (priceVal * (discountVal / 100));
        newFormData.discounted_price = Math.max(0, discounted).toFixed(0);
      } else if (priceVal > 0) {
        newFormData.discounted_price = priceVal.toFixed(0);
      } else {
        newFormData.discounted_price = '';
      }
    }

    setFormData(newFormData);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncToFirebase = async () => {
    if (courses.length === 0) {
      alert('No courses to sync.');
      return;
    }

    if (!window.confirm(`Sync all ${courses.length} courses to Firebase Realtime Database under "courses" path?\n\nThis will save a backup copy of every course in the global courses registry.`)) {
      return;
    }

    setIsSyncing(true);
    try {
      let synced = 0;
      for (const course of courses) {
        const { assignedColleges, instances, source, collegeName, ...courseData } = course;
        const courseId = course.id || push(getDbRef('courses')).key;
        
        await set(getDbRef(`courses/${courseId}`), {
          ...courseData,
          id: courseId,
          source: course.source || 'Global',
          collegeId: course.collegeId || '',
          collegeName: course.collegeName || '',
          synced_at: new Date().toISOString()
        });
        synced++;
      }

      alert(`Successfully synced ${synced} courses to Firebase!`);
      await fetchAllData();
    } catch (err) {
      console.error('Sync error:', err);
      alert('Failed to sync courses. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const [isRecovering, setIsRecovering] = useState(false);

  const handleRecoverFullCourses = async () => {
    // Collect courses from ALL sources
    const allRecoveredCourses = new Map<string, any>();

    const parseCache = (cacheKey: string) => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach((c: any) => {
              const name = (c.course_name || c.name || '').trim();
              if (name && !allRecoveredCourses.has(name.toLowerCase())) {
                allRecoveredCourses.set(name.toLowerCase(), c);
              }
            });
          }
        }
      } catch (e) { console.warn(`Error reading ${cacheKey}`, e); }
    };

    parseCache('cache_courses');
    parseCache('cache_navbar_courses');
    parseCache('backup_courses');
    
    // Website manager home caching
    try {
      const websiteData = localStorage.getItem('admin_website_data_home');
      if (websiteData) {
        const parsed = JSON.parse(websiteData);
        if (parsed && Array.isArray(parsed.courses)) {
          parsed.courses.forEach((c: any) => {
            const name = (c.course_name || c.name || '').trim();
            if (name && !allRecoveredCourses.has(name.toLowerCase())) {
              allRecoveredCourses.set(name.toLowerCase(), c);
            }
          });
        }
      }
    } catch (e) { console.warn('Error reading admin_website_data_home', e); }

    if (allRecoveredCourses.size === 0) {
      alert('No courses found in local caches to recover.');
      return;
    }

    // Find which course names already exist in the current table
    const existingCoursesMap = new Map();
    courses.forEach(c => {
      const name = (c.course_name || c.name || '').trim().toLowerCase();
      if (name) existingCoursesMap.set(name, c);
    });

    const missingCourses: any[] = [];
    const coursesToUpdate: { existingId: string, data: any, source: string, collegeId: string }[] = [];

    allRecoveredCourses.forEach((c, name) => {
      const existing = existingCoursesMap.get(name);
      if (!existing) {
        missingCourses.push(c);
      } else {
        // Prepare to update existing course with rich details from cache
        coursesToUpdate.push({ 
          existingId: existing.id, 
          data: c,
          source: existing.source || 'Global',
          collegeId: existing.collegeId || ''
        });
      }
    });

    if (missingCourses.length === 0 && coursesToUpdate.length === 0) {
      alert(`All ${allRecoveredCourses.size} found courses already exist. Nothing to recover.`);
      return;
    }

    if (!window.confirm(
      `Found ${allRecoveredCourses.size} total courses in browser cache.\n` +
      `${missingCourses.length} missing courses to create.\n` +
      `${coursesToUpdate.length} existing courses will have their details restored.\n` +
      `\nDo you want to fully restore details for these courses?`
    )) {
      return;
    }

    setIsRecovering(true);
    try {
      const targetId = collegeId || selectedCollegeId;
      let created = 0;
      let updated = 0;

      // Helper to convert base64 to blob and upload to Firebase Storage
      const uploadBase64Image = async (dataUrl: string, fieldName: string) => {
        if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const fileRef = storageRef(storage, `courses/recovered_thumbnails/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', null, reject, () => { resolve(null); });
          });
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          return downloadUrl;
        } catch (e) {
          console.error('Failed to upload base64 image for field', fieldName, e);
          return dataUrl;
        }
      };

      // 1. Create completely missing courses
      for (const cachedData of missingCourses) {
        const name = (cachedData.course_name || cachedData.name || '').trim();
        if (!name) continue;

        let finalCourseData = { ...cachedData };

        if (finalCourseData.image) finalCourseData.image = await uploadBase64Image(finalCourseData.image, 'image');
        if (finalCourseData.thumbnail) finalCourseData.thumbnail = await uploadBase64Image(finalCourseData.thumbnail, 'thumbnail');
        if (finalCourseData.thumbnail_2) finalCourseData.thumbnail_2 = await uploadBase64Image(finalCourseData.thumbnail_2, 'thumbnail_2');
        if (finalCourseData.thumbnail_3) finalCourseData.thumbnail_3 = await uploadBase64Image(finalCourseData.thumbnail_3, 'thumbnail_3');

        const courseData = {
          ...defaultCourseData,
          ...finalCourseData,
          course_name: name,
          course_type: finalCourseData.course_type || finalCourseData.type || '',
          course_slug: name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, ''),
          active: finalCourseData.active || 'Yes',
          onhomepage: finalCourseData.onhomepage || 'Yes',
          created_at: finalCourseData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (!courseData.course_group_id) {
          courseData.course_group_id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        }

        const newGlobalRef = push(getDbRef('courses'));
        if (targetId) {
          await set(getDbRef(`colleges/${targetId}/courses/${newGlobalRef.key}`), { ...courseData, id: newGlobalRef.key, source: 'College', collegeId: targetId });
          await set(newGlobalRef, { ...courseData, id: newGlobalRef.key, source: 'College', collegeId: targetId });
        } else {
          await set(newGlobalRef, { ...courseData, id: newGlobalRef.key });
        }
        created++;
      }

      // 2. Update existing courses with missing details
      for (const updateObj of coursesToUpdate) {
        const { existingId, data, source, collegeId: cId } = updateObj;
        
        let finalCourseData = { ...data };
        // Don't overwrite IDs
        delete finalCourseData.id;
        delete finalCourseData.source;
        delete finalCourseData.collegeId;

        if (finalCourseData.image) finalCourseData.image = await uploadBase64Image(finalCourseData.image, 'image');
        if (finalCourseData.thumbnail) finalCourseData.thumbnail = await uploadBase64Image(finalCourseData.thumbnail, 'thumbnail');
        if (finalCourseData.thumbnail_2) finalCourseData.thumbnail_2 = await uploadBase64Image(finalCourseData.thumbnail_2, 'thumbnail_2');
        if (finalCourseData.thumbnail_3) finalCourseData.thumbnail_3 = await uploadBase64Image(finalCourseData.thumbnail_3, 'thumbnail_3');

        // Only update if there are meaningful keys
        const cleanData: any = {};
        Object.keys(finalCourseData).forEach(key => {
           // Skip empty fields so we don't overwrite good data with empty cache data
           if (finalCourseData[key] !== null && finalCourseData[key] !== undefined && finalCourseData[key] !== '') {
             cleanData[key] = finalCourseData[key];
           }
        });

        if (Object.keys(cleanData).length > 0) {
           if (source === 'College' && cId) {
             await update(getDbRef(`colleges/${cId}/courses/${existingId}`), cleanData);
             await update(getDbRef(`courses/${existingId}`), cleanData); // Keep global in sync
           } else {
             await update(getDbRef(`courses/${existingId}`), cleanData);
           }
           updated++;
        }
      }

      alert(`Successfully created ${created} missing courses and restored details for ${updated} existing courses!`);
      await fetchAllData();
    } catch (err) {
      console.error('Recovery error:', err);
      alert('Failed to recover some courses. Check console for details.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const generatedSlug = (formData.course_name || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const courseData = {
        ...formData,
        course_slug: generatedSlug || formData.course_slug || '',
        updated_at: new Date().toISOString(),
        ...(editingCourseId ? {} : {
          created_at: new Date().toISOString(),
          course_group_id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
        })
      };

      if (editingCourseId) {
        const course = courses.find((c: any) => c.id === editingCourseId);
        if (course) {
          const oldTargetId = course.collegeId || '';
          const newTargetId = collegeId || selectedCollegeId || '';

          // We must remove these fields from courseData before saving
          // to prevent polluting the DB with frontend-only state
          const { assignedColleges, instances, id, source, collegeName, ...rest } = courseData;

          if (oldTargetId !== newTargetId) {
            // Course was moved to a different college or global scope
            if (oldTargetId) {
              await remove(getDbRef(`colleges/${oldTargetId}/courses/${editingCourseId}`));
            } else {
              await remove(getDbRef(`courses/${editingCourseId}`));
            }

            if (newTargetId) {
              await set(getDbRef(`colleges/${newTargetId}/courses/${editingCourseId}`), { ...rest, source: 'College', collegeId: newTargetId, id: editingCourseId });
            } else {
              await set(getDbRef(`courses/${editingCourseId}`), { ...rest, source: 'Global', id: editingCourseId });
            }
          } else {
            // Course stayed in the same location, just update it
            if (newTargetId) {
              await update(getDbRef(`colleges/${newTargetId}/courses/${editingCourseId}`), { ...rest, source: 'College', collegeId: newTargetId, id: editingCourseId });
            } else {
              await update(getDbRef(`courses/${editingCourseId}`), { ...rest, source: 'Global', id: editingCourseId });
            }
          }
        }
      } else {
        const targetId = collegeId || selectedCollegeId;
        const newCourseRefGlobal = push(getDbRef('courses'));
        courseData.id = newCourseRefGlobal.key;
        
        if (targetId) {
          await set(getDbRef(`colleges/${targetId}/courses/${newCourseRefGlobal.key}`), { ...courseData, source: 'College', collegeId: targetId });
          await set(newCourseRefGlobal, { ...courseData, source: 'College', collegeId: targetId });
        } else {
          await set(newCourseRefGlobal, courseData);
        }
      }

      setFormData(defaultCourseData);
      setSelectedCollegeId('');
      setEditingCourseId(null);
      setIsModalOpen(false);
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to save course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setSelectedCollegeId(course.collegeId || '');
    setFormData({
      ...defaultCourseData,
      ...course
    });
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (course: any) => {
    if (!confirm(`Delete this course "${course.course_name}" from all assigned locations?`)) return;
    try {
      const instances = course.instances || [course];
      const promises = instances.map(async (inst: any) => {
        if (inst.source === 'College') {
          await remove(getDbRef(`colleges/${inst.collegeId}/courses/${inst.id}`));
        } else {
          await remove(getDbRef(`courses/${inst.id}`));
        }
      });
      await Promise.all(promises);
      await fetchAllData();
      alert("Course deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete course.");
    }
  };

  const handleDeleteAllCourses = async () => {
    if (filteredCourses.length === 0) {
      alert("No courses currently shown in the table to delete.");
      return;
    }

    if (!window.confirm(`WARNING: Are you sure you want to delete all ${filteredCourses.length} courses currently visible in the table? This action is completely irreversible!`)) return;

    const confirmText = window.prompt(`To confirm deletion of all visible courses in the table, please type 'DELETE ALL' below:`);
    if (confirmText !== "DELETE ALL") {
      alert("Wipeout aborted. Confirmation text did not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const deletePromises = filteredCourses.flatMap((course) => {
        const instances = course.instances || [course];
        return instances.map(async (inst: any) => {
          if (inst.source === 'College') {
            await remove(getDbRef(`colleges/${inst.collegeId}/courses/${inst.id}`));
          } else {
            await remove(getDbRef(`courses/${inst.id}`));
          }
        });
      });

      await Promise.all(deletePromises);
      alert("Successfully deleted all courses currently shown in the table.");
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete courses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignToCollege = async () => {
    if (!selectedCourseToImport) return;
    setIsImporting(true);
    try {
      const currentAssignments = selectedCourseToImport.assignedColleges || [];
      const currentCollegeIds = currentAssignments
        .filter((ac: any) => ac.id !== 'global')
        .map((ac: any) => ac.id);

      const collegesToAdd = targetCollegeIds.filter((id: string) => !currentCollegeIds.includes(id));
      const collegesToRemove = currentCollegeIds.filter((id: string) => !targetCollegeIds.includes(id));

      const addPromises = collegesToAdd.map(async (collegeIdToAssign: string) => {
        const collegeCourseRef = push(getDbRef(`colleges/${collegeIdToAssign}/courses`));
        const { assignedColleges, instances, id, source, collegeName, collegeId, ...rest } = selectedCourseToImport;
        const importData = {
          ...rest,
          source: 'College',
          id: collegeCourseRef.key,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await set(collegeCourseRef, importData);
      });

      const removePromises = collegesToRemove.map(async (collegeIdToRemove: string) => {
        const instance = selectedCourseToImport.instances?.find((inst: any) => inst.collegeId === collegeIdToRemove);
        if (instance && instance.id) {
          await remove(getDbRef(`colleges/${collegeIdToRemove}/courses/${instance.id}`));
        }
      });

      await Promise.all([...addPromises, ...removePromises]);

      alert(`Assignments updated successfully for course "${selectedCourseToImport.course_name}"!`);
      setIsImportModalOpen(false);
      setSelectedCourseToImport(null);
      setTargetCollegeIds([]);
      await fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to update course assignments.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportExcel = () => {
    const truncateForExcel = (val: any) => {
      if (typeof val === 'string' && val.length > 32000) {
        if (val.startsWith('data:image/')) return '[Base64 Image Omitted]';
        return val.substring(0, 32000) + '...[TRUNCATED]';
      }
      return val;
    };

    const exportData = courses.map(({ id, source, collegeName, collegeId, ...rest }) => {
      const row: any = {
        ID: id,
        Course_Faculty: rest.course_faculty || '',
        Course_Name: rest.course_name,
        Affiliate_ID: rest.affiliate_id,
        Thumbnail: rest.thumbnail,
        Description: rest.description,
        Category: rest.category,
        Category_ID: rest.category_id,
        Subcategory: rest.subcategory,
        Language: rest.language,
        Certificate: rest.certificate,
        Eligibility_Criteria: rest.eligibility_criteria || '',
        Minimum_Document_Required: rest.minimum_document_required || '',
        Maximum_Document_Required: rest.maximum_document_required || '',
        Price: rest.price,
        Online_Price: rest.online_price,
        Offline_Price: rest.offline_price,
        Discount: rest.discount,
        Duration: rest.duration,
        Hour: rest.hour,
        Chapters: rest.chapters,
        Course_Type: rest.course_type,
        "Course Type (Alternate)": rest['course type'],
        Lectures: rest.lectures,
        On_Homepage: rest.onhomepage,
        Course_Slug: rest.course_slug,
        Learning_Type: rest.course_learning_type,
        Payment_QR: rest.payment_qr,
        UPI_ID: rest.upi_id,
        Total_Seats: rest.total_seats || '',
        Syllabus_Copy: rest.syllabus_copy || '',
        Teacher: rest.subject_teacher,
        Subject_Detail: rest.subject_detail,
        Employment_Opportunities: rest.employment_opportunities || '',
        Chapter_Detail: rest.chapter_detail,
        Active: rest.active,
        Created_At: rest.created_at || rest.createdAt,
        Updated_At: rest.updated_at || rest.updatedAt
      };

      // Truncate all fields to prevent Excel 32767 character limit crash
      Object.keys(row).forEach(k => {
        row[k] = truncateForExcel(row[k]);
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");
    XLSX.writeFile(workbook, "Courses_Export.csv");
  };

  const handleSampleExcel = () => {
    const sampleData = [{
      Course_Type: "Online",
      Course_Name: "Sample Course 101",
      Duration: "6 Months",
      Semester: "Semester 1",
      Stream_Branch: "Web Development",
      Description: "This is a sample description.",
      Category: "Technology",
      Category_ID: "TECH",
      Language: "English",
      Certificate: "Yes",
      Price: "5000",
      Online_Price: "4000",
      Offline_Price: "5000",
      Discount: "10",
      Discounted_Price: "4500",
      On_Homepage: "Yes",
      Course_Learning_Type: "Hybrid",
      UPI_ID: "",
      Subject_Detail: "Sample Subject Detail",
      Active: "Yes"
    }];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
    XLSX.writeFile(workbook, "Courses_Sample_Format.csv");
  };

  const getFilterDropdownOptions = (key: string) => {
    const defaultOpts = dropdownOptions[key] || [];
    let tableValues: string[] = [];

    if (key === 'course_faculty') {
      tableValues = courses.map(c => String(c.course_faculty || '').trim()).filter(Boolean);
    } else if (key === 'course_name') {
      tableValues = courses.map(c => String(c.course_name || '').trim()).filter(Boolean);
    } else if (key === 'eligibility_criteria') {
      tableValues = courses.map(c => String(c.eligibility_criteria || '').trim()).filter(Boolean);
    } else if (key === 'upi_id') {
      tableValues = courses.map(c => String(c.upi_id || '').trim()).filter(Boolean);
    } else if (key === 'minimum_document_required') {
      tableValues = courses.flatMap(c => String(c.minimum_document_required || '').split(', ').map(s => s.trim())).filter(Boolean);
    } else if (key === 'maximum_document_required') {
      tableValues = courses.flatMap(c => String(c.maximum_document_required || '').split(', ').map(s => s.trim())).filter(Boolean);
    } else if (key === 'syllabus_copy') {
      tableValues = courses.flatMap(c => String(c.syllabus_copy || '').split(', ').map(s => s.trim())).filter(Boolean);
    } else if (key === 'course_type') {
      tableValues = courses.map(c => String(c.course_type || c.type || '').trim()).filter(Boolean);
    } else if (key === 'duration') {
      tableValues = courses.map(c => String(c.duration || '').trim()).filter(Boolean);
    } else if (key === 'semester') {
      tableValues = courses.map(c => String(c.semester || '').trim()).filter(Boolean);
    } else if (key === 'subcategory') {
      tableValues = courses.map(c => String(c.subcategory || c.stream || c.branch || '').trim()).filter(Boolean);
    }

    if (tableValues.length > 0) {
      return Array.from(new Set([...defaultOpts, ...tableValues])).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
    }
    return defaultOpts.sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
  };



  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const targetId = collegeId || selectedCollegeId;

        for (const row of data as any[]) {
          const courseData = {
            course_name: row.Course_Name || row.course_name || '',
            course_faculty: row.Course_Faculty || row.course_faculty || '',
            course_type: row.Course_Type || row.course_type || '',
            duration: row.Duration || row.duration || '',
            semester: row.Semester || row.semester || '',
            subcategory: row.Stream_Branch || row.Subcategory || row.subcategory || '',
            thumbnail: row.Thumbnail || row.thumbnail || '',
            thumbnail_2: row.Thumbnail_2 || row.thumbnail_2 || '',
            thumbnail_3: row.Thumbnail_3 || row.thumbnail_3 || '',
            description: row.Description || row.description || '',
            category: row.Category || row.category || '',
            category_id: row.Category_ID || row.category_id || '',
            language: row.Language || row.language || '',
            certificate: row.Certificate || row.certificate || 'Yes',
            eligibility_criteria: row.Eligibility_Criteria || row.eligibility_criteria || '',
            minimum_document_required: row.Minimum_Document_Required || row.minimum_document_required || '',
            maximum_document_required: row.Maximum_Document_Required || row.maximum_document_required || '',
            price: row.Price || row.price || '',
            online_price: row.Online_Price || row.online_price || '',
            offline_price: row.Offline_Price || row.offline_price || '',
            discount: row.Discount || row.discount || '',
            discounted_price: row.Discounted_Price || row.discounted_price || '',
            onhomepage: row.On_Homepage || row.onhomepage || 'Yes',
            course_learning_type: row.Course_Learning_Type || row.Learning_Type || row.course_learning_type || '',
            upi_id: row.UPI_ID || row.upi_id || '',
            total_seats: row.Total_Seats || row.total_seats || '',
            syllabus_copy: row.Syllabus_Copy || row.syllabus_copy || '',
            subject_detail: row.Subject_Detail || row.subject_detail || '',
            employment_opportunities: row.Employment_Opportunities || row.employment_opportunities || '',
            active: row.Active || row.active || 'Yes',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            course_group_id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
          };

          const newGlobalRef = push(getDbRef('courses'));
          courseData['id' as keyof typeof courseData] = newGlobalRef.key as never;
          
          if (targetId) {
            await set(getDbRef(`colleges/${targetId}/courses/${newGlobalRef.key}`), { ...courseData, source: 'College', collegeId: targetId });
            await set(newGlobalRef, { ...courseData, source: 'College', collegeId: targetId });
          } else {
            await set(newGlobalRef, courseData);
          }
        }

        alert("Import successful!");
        await fetchAllData();
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to import Excel file. Ensure headers match exported format.");
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Client-side filtering on all fetched courses
  const filteredCourses = courses.filter((c: any) => {
    const matchesName = !filterName || (c.course_name || '').toLowerCase().includes(filterName.toLowerCase());
    const matchesType = !filterType || (c.course_type || c.type || '') === filterType;
    const matchesDuration = !filterDuration || (c.duration || '') === filterDuration;
    const matchesSemester = !filterSemester || (c.semester || '') === filterSemester;
    const matchesStream = !filterStream || (c.subcategory || c.stream || c.branch || '') === filterStream;

    return matchesName && matchesType && matchesDuration && matchesSemester && matchesStream;
  });

  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getFormDropdownOptions = (key: string) => {
    let opts = dropdownOptions[key] || [];
    let tableValues: string[] = [];

    if (key === 'course_faculty') {
      tableValues = courses.map(c => String(c.course_faculty || '').trim()).filter(Boolean);
    } else if (key === 'course_name') {
      tableValues = courses.map(c => String(c.course_name || '').trim()).filter(Boolean);
    } else if (key === 'course_type') {
      tableValues = courses.map(c => String(c.course_type || c.type || '').trim()).filter(Boolean);
    } else if (key === 'duration') {
      tableValues = courses.map(c => String(c.duration || '').trim()).filter(Boolean);
    } else if (key === 'semester') {
      tableValues = courses.map(c => String(c.semester || '').trim()).filter(Boolean);
    } else if (key === 'subcategory') {
      tableValues = courses.map(c => String(c.subcategory || c.stream || c.branch || '').trim()).filter(Boolean);
    }

    if (tableValues.length > 0) {
      opts = Array.from(new Set([...opts, ...tableValues])).sort();
    }
    return opts;
  };

  if (loading) return (
    <div className="p-20 text-center animate-pulse text-slate-400 font-normal tracking-tight capitalize text-xs">
      Loading course registry...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-[#003366] rounded-[3rem] p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4 text-center lg:text-left">
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">Course Management</h2>
          <p className="text-sm font-normal text-white/60">Configure and manage the academic program registry.</p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
            <span className="bg-white/10 text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
              <BookOpen size={13} /> Total Courses: {courses.length}
            </span>
            {filteredCourses.length !== courses.length && (
              <span className="bg-[#00a5a5]/20 text-[#00e1e1] border border-[#00a5a5]/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                Filtered: {filteredCourses.length}
              </span>
            )}
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap justify-center lg:justify-end gap-4">
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportExcel}
          />
          <button
            onClick={handleSyncToFirebase}
            disabled={isSyncing}
            className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-xl hover:bg-blue-500 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} strokeWidth={3} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
          <button
            onClick={handleRecoverFullCourses}
            disabled={isRecovering}
            className="bg-purple-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-xl hover:bg-purple-500 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={18} strokeWidth={3} className={isRecovering ? 'animate-spin' : ''} /> {isRecovering ? 'Recovering...' : 'Recover Courses'}
          </button>
          <button
            onClick={handleSampleExcel}
            className="bg-amber-500 text-white px-6 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-xl hover:bg-amber-400 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Download size={18} strokeWidth={3} /> Sample CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-xl hover:bg-emerald-500 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Upload size={18} strokeWidth={3} /> Import CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-xl hover:bg-indigo-500 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Download size={18} strokeWidth={3} /> Export CSV
          </button>
          {courses.length > 0 && (
            <button
              onClick={handleDeleteAllCourses}
              className="bg-rose-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-xl hover:bg-rose-500 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Trash2 size={18} strokeWidth={3} /> Delete All
            </button>
          )}
          <button
            onClick={() => {
              setEditingCourseId(null);
              setFormData(defaultCourseData);
              setSelectedCollegeId('');
              setIsModalOpen(true);
            }}
            className="bg-white text-[#003366] px-8 py-4 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={20} strokeWidth={3} /> Add New Course
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-end">
        {!collegeId && (
          <div className="space-y-2">
            <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Select College</label>
            <CustomDropdown
              id="filterCollegeId"
              value={filterCollegeId}
              onChange={setFilterCollegeId}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              placeholder="All Colleges"
              options={[
                ...collegesList.map(col => ({ value: col.id, label: col.name }))
              ]}
              className="w-full bg-slate-50 border border-black rounded-xl py-3.5 px-4 text-xs font-normal focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Type</label>
          <CustomDropdown
            id="filterType"
            value={filterType}
            onChange={setFilterType}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            placeholder="All Types"
            options={getFilterDropdownOptions('course_type')}
            className="w-full bg-slate-50 border border-black rounded-xl py-3.5 px-4 text-xs font-normal focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name</label>
          <CustomDropdown
            id="filterName"
            value={filterName}
            onChange={setFilterName}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            placeholder="All Courses"
            options={getFilterDropdownOptions('course_name')}
            searchable={true}
            className="w-full bg-slate-50 border border-black rounded-xl py-3.5 px-4 text-xs font-normal focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Duration</label>
          <CustomDropdown
            id="filterDuration"
            value={filterDuration}
            onChange={setFilterDuration}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            placeholder="All Durations"
            options={getFilterDropdownOptions('duration')}
            className="w-full bg-slate-50 border border-black rounded-xl py-3.5 px-4 text-xs font-normal focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Semester</label>
          <CustomDropdown
            id="filterSemester"
            value={filterSemester}
            onChange={setFilterSemester}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            placeholder="All Semesters"
            options={getFilterDropdownOptions('semester')}
            className="w-full bg-slate-50 border border-black rounded-xl py-3.5 px-4 text-xs font-normal focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Stream / Branch</label>
          <CustomDropdown
            id="filterStream"
            value={filterStream}
            onChange={setFilterStream}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            placeholder="All Streams"
            options={getFilterDropdownOptions('subcategory')}
            searchable={true}
            className="w-full bg-slate-50 border border-black rounded-xl py-3.5 px-4 text-xs font-normal focus:bg-white focus:border-[#00a5a5] transition-all cursor-pointer"
          />
        </div>


        {collegeId && (
          <div className="pb-1 flex items-end">
            <button
              onClick={() => {
                setFilterName('');
                setFilterType('');
                setFilterDuration('');
                setFilterCollegeId('');
                setFilterSemester('');
                setFilterStream('');
              }}
              className="text-[14px] font-medium text-rose-500 capitalize tracking-tight hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!collegeId && (
          <div className="pb-1 md:col-span-2 lg:col-span-3 xl:col-span-4 text-right">
            <button
              onClick={() => {
                setFilterName('');
                setFilterType('');
                setFilterDuration('');
                setFilterCollegeId('');
                setFilterSemester('');
                setFilterStream('');
              }}
              className="text-[14px] font-medium text-rose-500 capitalize tracking-tight hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {filteredCourses.length > 0 ? (
        <div className="bg-white rounded-[3rem] border border-black shadow-sm overflow-hidden p-8">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse border border-black">
              <thead>
                <tr className="bg-slate-50/50 border-b border-black whitespace-nowrap">
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Sr Number</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">College Name</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Course Type</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black">Course Name</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Stream/Branch</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Duration</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight border-r border-black text-center">Semester</th>
                  <th className="px-6 py-5 text-[14px] font-normal text-black capitalize tracking-tight text-center">Action</th>
                </tr>
              </thead>
              <tbody className="border-b border-black">
                {paginatedCourses.map((course, idx) => (
                  <tr key={`${course.source}-${course.id}`} className="hover:bg-slate-50/50 transition-colors group border-b border-black">
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="text-[16px] font-medium text-black">{startIndex + idx + 1}</span>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {course.source === 'Website' ? (
                          <span className="inline-block px-3 py-1.5 rounded-lg text-[13px] font-black tracking-tight border bg-amber-50 text-amber-600 border-amber-200">
                            Home Page Setup
                          </span>
                        ) : course.source === 'College' ? (
                          <span className="inline-block px-3 py-1.5 rounded-lg text-[13px] font-black tracking-tight border bg-[#00a5a5]/10 text-[#00a5a5] border-[#00a5a5]/20">
                            {course.collegeName || 'Unknown College'}
                          </span>
                        ) : course.source === 'Global' ? (
                          <span className="text-[14px] font-bold text-slate-400">—</span>
                        ) : (
                          <span className="text-[14px] font-bold text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[14px] font-bold capitalize tracking-tight border border-indigo-100">
                        {course.course_type || course.type || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-6 border-r border-black">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#00a5a5] shrink-0 border border-black">
                          <Book size={18} />
                        </div>
                        <div>
                          <p className="text-[16px] font-medium text-black capitalize tracking-tight">{course.course_name}</p>
                          {course.course_faculty && (
                            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Faculty: {course.course_faculty}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="text-[14px] font-bold text-slate-500">{course.subcategory || course.stream || course.branch || '—'}</span>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-[14px]">
                        <Timer size={14} className="text-[#00a5a5]" /> {course.duration || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-black text-center">
                      <span className="text-[14px] font-bold text-slate-500">{course.semester || '—'}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                        ><Edit2 size={14} /></button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                        ><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-6 bg-slate-50 border border-black p-4 rounded-2xl">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="px-6 py-2 bg-white border border-black text-black rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
            >
              Previous Page
            </button>
            <span className="text-[13px] font-black text-black tracking-tight">
              Page {validCurrentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="px-6 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-900 disabled:opacity-50 transition-all"
            >
              Next Page
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-black shadow-xl p-20 text-center">
          <div className="flex flex-col items-center gap-6 text-slate-300">
            <BookOpen size={80} className="opacity-10" />
            <div className="space-y-2">
              <p className="text-sm font-normal tracking-normal capitalize text-black">Registry Empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Initialize the curriculum registry by adding academic courses.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" />

          <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-300 no-scrollbar border-2 border-black">
            <div className="bg-[#003366] p-8 text-white sticky top-0 z-10 border-b border-black">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X size={28} />
              </button>
              <h3 className="text-2xl font-black tracking-tighter capitalize">{editingCourseId ? 'Update Course' : 'Add New Course'}</h3>
              <p className="text-xs font-normal text-white/70 capitalize tracking-normal mt-1">Fill in the comprehensive details below.</p>
            </div>

            <form onSubmit={handleSaveCourse} className="p-8 space-y-8">
              {!collegeId && (
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Assign to College (Optional)</label>
                  <CustomDropdown
                    id="form_assign_college"
                    value={selectedCollegeId}
                    onChange={setSelectedCollegeId}
                    openDropdownId={openDropdownId}
                    setOpenDropdownId={setOpenDropdownId}
                    placeholder="Institutional (Global)"
                    options={collegesList.map((col) => ({ value: col.id, label: `${col.name} (${col.collegeId})` }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-normal text-black focus:border-[#00a5a5] transition-all cursor-pointer"
                  />
                </div>
              )}

              {/* GRID SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* BASIC DETAILS */}
                {Object.keys(defaultCourseData).map((key) => {
                  const label = key.replace(/_/g, ' ');

                  if (key === 'syllabus_copy') {
                    return (
                      <div key={key} className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">
                          Syllabus Copy (Upload PDFs)
                        </label>
                        <div className="flex flex-col gap-2">
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) {
                                  const fileArray = Array.from(files);
                                  const pdfFiles = fileArray.filter(f => f.type === 'application/pdf');
                                  if (pdfFiles.length === 0) {
                                    alert("Only PDF files are supported!");
                                    return;
                                  }

                                  pdfFiles.forEach((file) => {
                                    const fileRef = storageRef(storage, `courses/syllabus/${Date.now()}_${file.name}`);
                                    const uploadTask = uploadBytesResumable(fileRef, file);
                                    uploadTask.on('state_changed', null,
                                      (error) => { console.error('Upload failed', error); alert('Failed to upload syllabus'); },
                                      async () => {
                                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                                        const val = `${file.name}###${url}`;
                                        setFormData((prev: any) => {
                                          const current = prev.syllabus_copy ? prev.syllabus_copy.split(', ').filter(Boolean) : [];
                                          if (current.some((c: string) => c.split('###')[0] === file.name)) {
                                            return prev;
                                          }
                                          const updated = [...current, val];
                                          return { ...prev, syllabus_copy: updated.join(', ') };
                                        });
                                      }
                                    );
                                  });
                                }
                              }}
                            />
                            <div className="border border-[#00a5a5] border-dashed rounded-lg p-4 bg-slate-50 hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center gap-1.5 text-center">
                              <Upload size={18} className="text-[#00a5a5]" />
                              <span className="text-xs font-bold text-[#00a5a5]">Click or drag to upload syllabus PDF(s)</span>
                              <span className="text-[10px] text-slate-400">Multiple files supported</span>
                            </div>
                          </label>

                          <div className="space-y-2 mt-2 max-h-40 overflow-y-auto no-scrollbar">
                            {formData.syllabus_copy ? (
                              formData.syllabus_copy.split(', ').filter(Boolean).map((pdfItem: string) => {
                                const parts = pdfItem.split('###');
                                const pdfName = parts[0];
                                const pdfData = parts[1];
                                return (
                                  <div key={pdfItem} className="flex items-center justify-between bg-teal-50/30 border border-teal-100 rounded-lg p-2 text-xs font-semibold">
                                    <span className="text-slate-700 truncate max-w-[60%]" title={pdfName}>{pdfName}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {pdfData && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = pdfData;
                                            link.download = pdfName;
                                            link.click();
                                          }}
                                          className="bg-[#00a5a5] text-white hover:bg-[#003366] p-1 rounded-md transition-all flex items-center justify-center animate-none"
                                          title="View PDF"
                                        >
                                          <Eye size={12} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newName = prompt("Rename syllabus file:", pdfName);
                                          if (newName && newName.trim()) {
                                            const cleanNewName = newName.trim().endsWith('.pdf') ? newName.trim() : `${newName.trim()}.pdf`;
                                            setFormData((prev: any) => {
                                              const current = prev.syllabus_copy ? prev.syllabus_copy.split(', ').filter(Boolean) : [];
                                              const updated = current.map((item: string) => {
                                                if (item === pdfItem) {
                                                  return `${cleanNewName}###${parts[1]}`;
                                                }
                                                return item;
                                              });
                                              return { ...prev, syllabus_copy: updated.join(', ') };
                                            });
                                          }
                                        }}
                                        className="bg-blue-600 text-white hover:bg-blue-700 p-1 rounded-md transition-all flex items-center justify-center"
                                        title="Rename File"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`Remove file "${pdfName}"?`)) {
                                            setFormData((prev: any) => {
                                              const current = prev.syllabus_copy ? prev.syllabus_copy.split(', ').filter(Boolean) : [];
                                              const updated = current.filter((item: string) => item !== pdfItem);
                                              return { ...prev, syllabus_copy: updated.join(', ') };
                                            });
                                          }
                                        }}
                                        className="bg-rose-600 text-white hover:bg-rose-700 p-1 rounded-md transition-all flex items-center justify-center"
                                        title="Delete File"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[10px] text-slate-400 italic pl-1">No syllabus files uploaded.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (['active', 'certificate'].includes(key)) {
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">{label}</label>
                        <CustomDropdown
                          id={`form_${key}`}
                          value={formData[key]}
                          onChange={(val: string) => setFormData((prev: any) => ({ ...prev, [key]: val }))}
                          openDropdownId={openDropdownId}
                          setOpenDropdownId={setOpenDropdownId}
                          placeholder=""
                          options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                          className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:border-[#00a5a5] transition-all cursor-pointer"
                        />
                      </div>
                    );
                  }

                  if (managedKeys.includes(key)) {
                    const isMultiSelect = ['language', 'minimum_document_required', 'maximum_document_required'].includes(key);
                    const doubleWidthKeys = ['course_name', 'course_faculty', 'language', 'minimum_document_required', 'maximum_document_required'];
                    return (
                      <div key={key} className={`space-y-1.5 ${doubleWidthKeys.includes(key) ? 'md:col-span-2' : ''}`}>
                        <div className="flex items-center justify-between">
                          <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">
                            {key === 'minimum_document_required'
                              ? 'Minimum Document'
                              : (key === 'maximum_document_required'
                                ? 'Maximum Document'
                                : (key === 'subcategory' ? 'Stream / Branch' : label))}
                            {key === 'course_name' && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setManageOptionsKey(key);
                              setIsManageOptionsModalOpen(true);
                            }}
                            className="text-xs text-[#00a5a5] hover:text-[#003366] font-bold flex items-center gap-1 transition-colors"
                            title={`Manage ${key === 'minimum_document_required' ? 'Minimum Document' : (key === 'maximum_document_required' ? 'Maximum Document' : label)} Options`}
                          >
                            <Settings size={12} />
                            <span>Manage</span>
                          </button>
                        </div>
                        {isMultiSelect ? (
                          <div className="relative custom-dropdown">
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                onClick={() => setOpenDropdownId(openDropdownId === `form_${key}` ? null : `form_${key}`)}
                                value={formData[key] ? formData[key].split(', ').map(getOptionLabel).join(', ') : ''}
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 pr-8 text-sm font-medium focus:border-[#00a5a5] transition-all cursor-pointer outline-none select-none"
                                placeholder={`Select ${key === 'minimum_document_required' ? 'Minimum Document' : (key === 'maximum_document_required' ? 'Maximum Document' : label)}`}
                              />
                              <span
                                onClick={() => setOpenDropdownId(openDropdownId === `form_${key}` ? null : `form_${key}`)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] cursor-pointer select-none"
                              >
                                ▼
                              </span>
                            </div>
                            {openDropdownId === `form_${key}` && (
                              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-2xl z-[200] max-h-60 overflow-y-auto">
                                {(dropdownOptions[key] || []).map((opt: string) => {
                                  const isChecked = formData[key] ? formData[key].split(', ').includes(opt) : false;
                                  return (
                                    <div
                                      key={opt}
                                      onClick={() => {
                                        const current = formData[key] ? formData[key].split(', ').filter(Boolean) : [];
                                        let updated;
                                        if (current.includes(opt)) {
                                          updated = current.filter((v: string) => v !== opt);
                                        } else {
                                          updated = [...current, opt];
                                        }
                                        setFormData({ ...formData, [key]: updated.join(', ') });
                                      }}
                                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 select-none"
                                    >
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${isChecked ? 'border-[#00a5a5] bg-white' : 'border-slate-300 bg-white'}`}>
                                        {isChecked && <div className="w-2 h-2 rounded-full bg-[#00a5a5]" />}
                                      </div>
                                      <span className="text-sm font-medium text-slate-700">{getOptionLabel(opt)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <CustomDropdown
                            id={`form_${key}`}
                            value={formData[key] || ''}
                            onChange={(val: string) => setFormData((prev: any) => ({ ...prev, [key]: val }))}
                            openDropdownId={openDropdownId}
                            setOpenDropdownId={setOpenDropdownId}
                            placeholder={`Select ${label}`}
                            options={['course_name', 'course_faculty', 'eligibility_criteria', 'upi_id', 'subcategory'].includes(key) ? getFilterDropdownOptions(key) : (dropdownOptions[key] || [])}
                            searchable={['course_name', 'course_faculty', 'eligibility_criteria', 'upi_id', 'subcategory'].includes(key)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:border-[#00a5a5] transition-all cursor-pointer"
                          />
                        )}
                      </div>
                    );
                  }

                  if (['description', 'employment_opportunities'].includes(key) || key.includes('detail')) {
                    return (
                      <div key={key} className="space-y-1.5 col-span-1 md:col-span-3 xl:col-span-4">
                        <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">{label}</label>
                        <textarea
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          rows={3}
                          className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium outline-none focus:border-[#00a5a5] transition-all"
                          placeholder={`Enter ${label}...`}
                        />
                      </div>
                    );
                  }

                  if (key.includes('thumbnail') || key.includes('payment_qr')) {
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">
                          {label}
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const fileRef = storageRef(storage, `courses/thumbnails/${key}_${Date.now()}_${file.name}`);
                                    const uploadTask = uploadBytesResumable(fileRef, file);
                                    uploadTask.on('state_changed', null,
                                      (error) => { console.error('Upload failed', error); alert('Failed to upload image'); },
                                      async () => {
                                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                                        setFormData((prev: any) => ({ ...prev, [key]: url }));
                                      }
                                    );
                                  }
                                }}
                              />
                              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-[#003366]">

                                <Upload size={14} />
                                <span>Upload File</span>
                              </div>
                            </label>
                            {formData[key] && (
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                                  <img src={formData[key]} alt="Preview" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setFormData((prev: any) => ({ ...prev, [key]: '' }))}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"
                                    title="Remove"
                                  >
                                    <X size={8} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(formData[key])}
                                  className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#00a5a5] flex items-center justify-center hover:bg-teal-100 hover:text-[#003366] transition-all"
                                  title="Preview Image"
                                >
                                  <Eye size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            name={key}
                            value={formData[key]}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium outline-none focus:border-[#00a5a5] transition-all"
                            placeholder={`Enter ${label} URL...`}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (key === 'subject_teacher') {
                    const collegeIdToUse = collegeId || selectedCollegeId;
                    const filteredStaff = collegeIdToUse
                      ? staffList.filter(s => s.collegeId === collegeIdToUse)
                      : staffList;
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">
                          {label}
                        </label>
                        <CustomDropdown
                          id={`form_${key}`}
                          value={formData[key]}
                          onChange={(val: string) => setFormData((prev: any) => ({ ...prev, [key]: val }))}
                          openDropdownId={openDropdownId}
                          setOpenDropdownId={setOpenDropdownId}
                          placeholder="Select Teacher"
                          options={[
                            ...(formData[key] && !filteredStaff.some(s => s.fullName === formData[key]) ? [{ value: formData[key], label: formData[key] }] : []),
                            ...filteredStaff.map((staff) => ({
                              value: staff.fullName,
                              label: `${staff.fullName} ${staff.collegeId ? `(${collegesList.find(c => c.id === staff.collegeId)?.name || 'College Staff'})` : ''}`
                            }))
                          ]}
                          className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:border-[#00a5a5] transition-all cursor-pointer"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[14px] font-medium text-slate-600 capitalize pl-1">
                        {label} {key === 'course_name' && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={key.includes('price') || key === 'discount' ? 'number' : 'text'}
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          readOnly={key === 'discounted_price'}
                          required={key === 'course_name'}
                          className={`w-full border border-slate-300 rounded-lg p-3 ${key === 'discount' ? 'pr-8' : ''} text-sm font-medium outline-none focus:border-[#00a5a5] transition-all ${key === 'discounted_price' ? 'bg-slate-100 cursor-not-allowed text-teal-700' : 'bg-white'}`}
                          placeholder={`Enter ${label}...`}
                        />
                        {key === 'discount' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#003366] text-white px-10 py-4 rounded-xl font-black text-[12px] capitalize tracking-tight shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 w-fit"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={18} /> Processing...</>
                  ) : (
                    <><Save size={18} /> {editingCourseId ? 'Save Changes' : 'Create Course'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign to College Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/70 backdrop-blur-md" onClick={() => !isImporting && setIsImportModalOpen(false)} />

          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-teal-600 p-10 text-white relative">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="absolute right-8 top-8 text-white/50 hover:text-white transition-colors"
                disabled={isImporting}
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                <Building2 size={32} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter capitalize">Assign to College</h3>
              {/* <p className="text-[13px] font-normal text-white/80 capitalize tracking-normal mt-2">Deploy program to an institutional catalog</p> */}
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[13px] font-normal text-slate-500 capitalize tracking-tight mb-1">Selected Program</p>
                  <p className="text-sm font-bold text-black capitalize">{selectedCourseToImport?.course_name}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[14px] font-bold text-black capitalize tracking-tight pl-1">Select Colleges</label>
                    <button
                      onClick={() => {
                        if (targetCollegeIds.length === collegesList.length) {
                          setTargetCollegeIds([]);
                        } else {
                          setTargetCollegeIds(collegesList.map(c => c.id));
                        }
                      }}
                      className="text-xs text-teal-600 font-bold hover:underline"
                    >
                      {targetCollegeIds.length === collegesList.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-white no-scrollbar">
                    {collegesList.map(col => (
                      <label key={col.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={targetCollegeIds.includes(col.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetCollegeIds([...targetCollegeIds, col.id]);
                            } else {
                              setTargetCollegeIds(targetCollegeIds.filter(id => id !== col.id));
                            }
                          }}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{col.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold tracking-tight">{col.collegeId}</p>
                        </div>
                      </label>
                    ))}
                    {collegesList.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 font-bold">No colleges available</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAssignToCollege}
                disabled={isImporting || targetCollegeIds.length === 0}
                className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-[14px] capitalize tracking-tight shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isImporting ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><Save size={18} /> Assign to {targetCollegeIds.length} College(s)</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Dropdown Options Modal */}
      {isManageOptionsModalOpen && manageOptionsKey && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsManageOptionsModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-black z-[160] no-scrollbar">
            <div className="bg-[#003366] p-6 text-white border-b border-black">
              <button
                onClick={() => { setIsManageOptionsModalOpen(false); setEditingOption(null); }}
                className="absolute right-6 top-6 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-2xl font-black capitalize tracking-tight">Manage {manageOptionsKey.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-white/70 mt-1">Add, edit, reorder or remove options for this dropdown field.</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Add New Option Form */}
              {manageOptionsKey === 'syllabus_copy' ? (
                <div className="flex flex-col gap-3 w-full bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Upload Syllabus PDF</label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            alert("Only PDF files are supported!");
                            return;
                          }
                          const fileRef = storageRef(storage, `courses/options/${Date.now()}_${file.name}`);
                          const uploadTask = uploadBytesResumable(fileRef, file);
                          uploadTask.on('state_changed', null,
                            (error) => { console.error('Upload failed', error); alert('Failed to upload PDF'); },
                            async () => {
                              const url = await getDownloadURL(uploadTask.snapshot.ref);
                              const val = `${file.name}###${url}`;
                              const currentOptions = dropdownOptions[manageOptionsKey] || [];
                              if (currentOptions.some(o => o.split('###')[0] === file.name)) return;
                              const updated = [...currentOptions, val];
                              await set(getDbRef(`courseDropdownOptions/${manageOptionsKey}`), updated);
                              alert("PDF uploaded successfully!");
                            }
                          );
                        }
                      }}
                    />
                    <div className="border border-[#00a5a5] border-dashed rounded-xl p-6 bg-white hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center gap-2 text-sm font-bold text-[#00a5a5]">
                      <Upload size={22} />
                      <span>Select and Upload Syllabus PDF</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new option..."
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#00a5a5] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="bg-[#00a5a5] text-white px-5 rounded-xl text-xs font-bold hover:bg-[#003366] transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              )}

              {/* Options List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {(dropdownOptions[manageOptionsKey] || []).map((opt, index) => (
                  <div
                    key={opt}
                    draggable
                    onDragStart={(e) => {
                      setDraggedOptionIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (draggedOptionIndex === null || draggedOptionIndex === index || !manageOptionsKey) return;
                      const currentOptions = [...(dropdownOptions[manageOptionsKey] || [])];
                      const draggedItem = currentOptions[draggedOptionIndex];
                      currentOptions.splice(draggedOptionIndex, 1);
                      currentOptions.splice(index, 0, draggedItem);

                      await set(getDbRef(`courseDropdownOptions/${manageOptionsKey}`), currentOptions);
                      setDraggedOptionIndex(null);
                    }}
                    onDragEnd={() => setDraggedOptionIndex(null)}
                    className={`flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium transition-all ${draggedOptionIndex === index ? 'opacity-40 scale-[0.98]' : 'hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-2 flex-1 mr-3">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <GripVertical size={16} />
                      </div>
                      {editingOption?.old === opt ? (
                        <input
                          type="text"
                          value={editingOption.new}
                          onChange={(e) => setEditingOption({ ...editingOption, new: e.target.value })}
                          className="flex-1 bg-white border border-[#00a5a5] rounded-lg p-1.5 text-sm font-medium outline-none w-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditOption();
                            if (e.key === 'Escape') setEditingOption(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-slate-700 truncate">{getOptionLabel(opt)}</span>
                      )}
                      {opt.includes('###') && (
                        <a
                          href={opt.split('###')[1]}
                          download={opt.split('###')[0]}
                          className="text-xs text-teal-600 hover:text-[#003366] font-bold mr-2 flex items-center gap-1 shrink-0 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 hover:bg-teal-100/50 transition-all"
                          title="Download Syllabus PDF"
                        >
                          <Download size={11} strokeWidth={2.5} /> Download PDF
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      {editingOption?.old === opt ? (
                        <>
                          <button
                            type="button"
                            onClick={handleEditOption}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
                            title="Save changes"
                          >
                            <Save size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOption(null)}
                            className="bg-slate-500 text-white hover:bg-slate-600 p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
                            title="Cancel editing"
                          >
                            <X size={13} strokeWidth={2.5} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingOption({ old: opt, new: opt })}
                            className="bg-blue-600 text-white hover:bg-blue-700 p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
                            title="Edit Option"
                          >
                            <Edit2 size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(opt)}
                            className="bg-rose-600 text-white hover:bg-rose-700 p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
                            title="Delete Option"
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {(dropdownOptions[manageOptionsKey] || []).length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">No options found. Add some options above.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#002147]/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setPreviewImageUrl(null)}
          />
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border-2 border-black flex flex-col overflow-hidden">
            <div className="bg-[#003366] p-6 text-white border-b border-black flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black tracking-tighter capitalize">Thumbnail Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-center overflow-auto flex-1">
              <img
                src={previewImageUrl}
                alt="Thumbnail Preview"
                className="max-w-full max-h-[50vh] object-contain rounded-xl border border-slate-200 shadow-md bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
