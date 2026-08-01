'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Users,
  Tag,
  GraduationCap,
  Briefcase,
  PlusCircle,
  Landmark,
  History,
  Lock,
  Unlock,
  ChevronRight,
  RotateCcw,
  Save,
  Upload,
  Download,
  Camera,
  PenTool,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  X,
  ArrowRight,
  FileText,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { ref, get, set, push, onValue, update, remove } from 'firebase/database';

import { realtimeDb, storage, studentStorage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ApplicationPreviewModal from './ApplicationPreviewModal';
import {
  INDIAN_STATES,
  DISTRICT_MAP,
  TALUKA_MAP,
  RELIGIONS,
  CASTE_CATEGORIES,
  EXAMINATIONS,
  BOARDS,
  BLOOD_GROUPS,
  LANGUAGES,
  DISABILITY_TYPES,
  ACCOUNT_TYPES
} from '@/lib/india-data';

interface ProfileWizardProps {
  userId: string;
  initialData: any;
  onStepComplete?: (step: number, percentage: number) => void;
  initialStep?: number;
  isAdmitted?: boolean;
  isFullFormMode?: boolean;
  editingApplication?: any;
  isOtherCourseMode?: boolean;
}

export default function ProfileWizard({
  userId,
  initialData,
  onStepComplete,
  initialStep = 1,
  isAdmitted = false,
  isFullFormMode = false,
  editingApplication,
  isOtherCourseMode = false
}: ProfileWizardProps) {
  const router = useRouter();
  const [showLockPopup, setShowLockPopup] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<any>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Temporary state for multi-entry forms
  const [tempQual, setTempQual] = useState({
    examination: '',
    board: '',
    customBoard: '',
    college: '',
    passingDate: '',
    result: 'Pass',
    mode: 'Regular',
    marksSystem: 'Marks',
    marksObtained: '',
    outOfMarks: '',
    percentage: '',
    grade: '',
    marksheetUrl: '',
    marksheetName: ''
  });

  const [tempLang, setTempLang] = useState({
    language: '',
    read: false,
    write: false,
    speak: false
  });

  const [tempExp, setTempExp] = useState({
    organization: '',
    designation: '',
    fromDate: '',
    toDate: ''
  });

  const [editQualIndex, setEditQualIndex] = useState<number | null>(null);
  const [editLangIndex, setEditLangIndex] = useState<number | null>(null);
  const [editExpIndex, setEditExpIndex] = useState<number | null>(null);

  // State variables for Course Selection
  const [availableColleges, setAvailableColleges] = useState<any[]>([]);
  const [collegeCourses, setCollegeCourses] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedFees, setSelectedFees] = useState<string>('');
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [dbDurationOptions, setDbDurationOptions] = useState<string[]>([]);
  const [dbSemesterOptions, setDbSemesterOptions] = useState<string[]>([]);
  const [dbStreamOptions, setDbStreamOptions] = useState<string[]>([]);
  const [userSelectedCollege, setUserSelectedCollege] = useState<boolean>(false);

  const steps = [
    { id: 1, label: 'Primary', icon: User },
    { id: 2, label: 'Address', icon: MapPin },
    { id: 3, label: 'Parent', icon: Users },
    { id: 4, label: 'Category', icon: Tag },
    { id: 5, label: 'Qualification', icon: GraduationCap },
    { id: 6, label: 'Training', icon: Briefcase },
    { id: 7, label: 'Additional', icon: PlusCircle },
    { id: 8, label: 'Bank', icon: Landmark },
    { id: 9, label: 'Work Experience', icon: History },
    { id: 10, label: 'Select Course', icon: BookOpen },
  ];

  // Fetch dropdown options from admin options config
  useEffect(() => {
    const optionsRef = ref(realtimeDb, 'courseDropdownOptions');
    const unsubscribe = onValue(optionsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        
        const durationVal = data.duration;
        const durationArr = durationVal ? (Array.isArray(durationVal) ? durationVal : Object.values(durationVal)) : [];
        setDbDurationOptions(durationArr.filter((v: any) => v !== '__EMPTY__'));

        const semesterVal = data.semester;
        const semesterArr = semesterVal ? (Array.isArray(semesterVal) ? semesterVal : Object.values(semesterVal)) : [];
        setDbSemesterOptions(semesterArr.filter((v: any) => v !== '__EMPTY__'));

        const subcategoryVal = data.subcategory;
        const subcategoryArr = subcategoryVal ? (Array.isArray(subcategoryVal) ? subcategoryVal : Object.values(subcategoryVal)) : [];
        setDbStreamOptions(subcategoryArr.filter((v: any) => v !== '__EMPTY__'));
      } else {
        setDbDurationOptions(['1 Year', '2 Years', '3 Years', '4 Years', '6 Months']);
        setDbSemesterOptions(['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester']);
        setDbStreamOptions(['Software Development', 'Data Science', 'Finance', 'Marketing', 'Mechanical', 'Electrical']);
      }
    });
    return () => unsubscribe();
  }, []);

  // Reset manual selection flag when editing application or mode changes
  useEffect(() => {
    setUserSelectedCollege(false);
  }, [editingApplication, isOtherCourseMode]);

  // Fetch colleges list efficiently
  useEffect(() => {
    const collegesRef = ref(realtimeDb, 'colleges');
    const unsubscribe = onValue(collegesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const fetchedColleges = Object.keys(data).map(id => ({
          id,
          name: data[id].name || 'Unnamed College'
        }));
        setAvailableColleges(fetchedColleges);
      } else {
        setAvailableColleges([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch student's applications
  useEffect(() => {
    if (userId) {
      const appsRef = ref(realtimeDb, `users/${userId}/applications`);
      const unsubscribe = onValue(appsRef, (snap) => {
        if (snap.exists()) {
          setUserApplications(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
        } else {
          setUserApplications([]);
        }
      });
      return () => unsubscribe();
    }
  }, [userId]);

  // Fetch courses specific to selected college
  useEffect(() => {
    if (!selectedCollege) {
      setCollegeCourses([]);
      return;
    }
    const coursesRef = ref(realtimeDb, `colleges/${selectedCollege}/courses`);
    const unsubscribe = onValue(coursesRef, (snap) => {
      if (snap.exists()) {
        setCollegeCourses(Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val })));
      } else {
        setCollegeCourses([]);
      }
    });
    return () => unsubscribe();
  }, [selectedCollege]);

  // Unique course types for selected college
  const availableCourseTypes = useMemo(() => {
    const types = new Set(collegeCourses.map(c => c.course_type || 'Untitled'));
    return Array.from(types).filter(Boolean);
  }, [collegeCourses]);

  const availableCourseNames = useMemo(() => {
    const names = new Set(collegeCourses.filter(c => (c.course_type || 'Untitled') === selectedCourseType).map(c => c.course_name || c.name || 'Untitled'));
    return Array.from(names).filter(Boolean);
  }, [collegeCourses, selectedCourseType]);

  const availableDurations = useMemo(() => {
    const durationsInCourses = new Set(
      collegeCourses
        .filter(c => (c.course_type || 'Untitled') === selectedCourseType && (c.course_name || c.name || 'Untitled') === selectedCourseName)
        .map(c => c.duration || 'Untitled')
    );
    if (dbDurationOptions.length > 0) {
      const filtered = dbDurationOptions.filter(d => durationsInCourses.has(d));
      const extra = Array.from(durationsInCourses).filter(d => !dbDurationOptions.includes(d));
      return [...filtered, ...extra].filter(Boolean);
    }
    return Array.from(durationsInCourses).filter(Boolean);
  }, [collegeCourses, selectedCourseType, selectedCourseName, dbDurationOptions]);

  const availableSemesters = useMemo(() => {
    const semestersInCourses = new Set(
      collegeCourses
        .filter(c => (c.course_type || 'Untitled') === selectedCourseType && (c.course_name || c.name || 'Untitled') === selectedCourseName && (c.duration || 'Untitled') === selectedDuration)
        .map(c => c.semester || 'Untitled')
    );
    if (dbSemesterOptions.length > 0) {
      const filtered = dbSemesterOptions.filter(s => semestersInCourses.has(s));
      const extra = Array.from(semestersInCourses).filter(s => !dbSemesterOptions.includes(s));
      return [...filtered, ...extra].filter(Boolean);
    }
    return Array.from(semestersInCourses).filter(Boolean);
  }, [collegeCourses, selectedCourseType, selectedCourseName, selectedDuration, dbSemesterOptions]);

  const availableStreams = useMemo(() => {
    const streamsInCourses = new Set(
      collegeCourses
        .filter(c => (c.course_type || 'Untitled') === selectedCourseType && (c.course_name || c.name || 'Untitled') === selectedCourseName && (c.duration || 'Untitled') === selectedDuration && (c.semester || 'Untitled') === selectedSemester)
        .map(c => c.subcategory || 'Untitled')
    );
    if (dbStreamOptions.length > 0) {
      const filtered = dbStreamOptions.filter(s => streamsInCourses.has(s));
      const extra = Array.from(streamsInCourses).filter(s => !dbStreamOptions.includes(s));
      return [...filtered, ...extra].filter(Boolean);
    }
    return Array.from(streamsInCourses).filter(Boolean);
  }, [collegeCourses, selectedCourseType, selectedCourseName, selectedDuration, selectedSemester, dbStreamOptions]);

  // Set courseId when all selections are made
  useEffect(() => {
    const matches = collegeCourses.filter(c => 
      (c.course_type || 'Untitled') === selectedCourseType && 
      (c.course_name || c.name || 'Untitled') === selectedCourseName && 
      (c.duration || 'Untitled') === selectedDuration && 
      (c.semester || 'Untitled') === selectedSemester && 
      (c.subcategory || 'Untitled') === selectedStream
    );
    if (matches.length > 1) {
      const notAccepted = matches.filter(c => !userApplications.some(app => app.courseId === c.id && (app.status === 'Accepted' || app.status === 'Confirmed')));
      const courseToSelect = notAccepted.length > 0 ? notAccepted[0] : matches[0];
      setSelectedCourseId(courseToSelect.id);
      setSelectedFees(courseToSelect.fees || '0');
    } else if (matches.length === 1) {
      setSelectedCourseId(matches[0].id);
      setSelectedFees(matches[0].fees || '0');
    } else {
      setSelectedCourseId('');
      setSelectedFees('');
    }
  }, [collegeCourses, selectedCourseType, selectedCourseName, selectedDuration, selectedSemester, selectedStream, userApplications]);

  // Prefill existing application details when opening or step loads
  useEffect(() => {
    if (userSelectedCollege) return;
    if (isOtherCourseMode) {
      // In other course mode, we do not overwrite manual selections with empty values on state updates.
      // Since local states are initialized to empty string anyway, we just return.
      return;
    }
    const app = editingApplication || (userApplications.length > 0 ? userApplications[0] : null);
    if (app && app.courseId && collegeCourses.length > 0) {
      const course = collegeCourses.find(c => c.id === app.courseId);
      if (course) {
        setSelectedCollege(app.collegeId || '');
        setSelectedCourseType(course.course_type || '');
        setSelectedCourseName(course.course_name || course.name || '');
        setSelectedDuration(course.duration || 'Untitled');
        setSelectedSemester(course.semester || 'Untitled');
        setSelectedStream(course.subcategory || 'Untitled');
        setSelectedCourseId(course.id);
        if (app.id !== 'new' && app.profileLocked !== undefined) {
           setFormData((prev: any) => ({ ...prev, profileLocked: app.profileLocked }));
        }
      } else {
        if (app.collegeId) setSelectedCollege(app.collegeId);
      }
    } else if (app) {
       if (app.collegeId) setSelectedCollege(app.collegeId);
    }
  }, [userApplications, editingApplication, isOtherCourseMode, collegeCourses, userSelectedCollege]);

  useEffect(() => {
    if (userId) {
      const userRef = ref(realtimeDb, `users/${userId}/profile`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const globalProfile = snapshot.val();
          // Prioritize editingApplication details if they exist so the user sees the snapshotted details for that specific application!
          const appSpecificDetails = (editingApplication && editingApplication.firstName) ? editingApplication : {};
          setFormData((prev: any) => ({ ...prev, ...globalProfile, ...appSpecificDetails }));
        }
      });
      return () => unsubscribe();
    }
  }, [userId, editingApplication]);

  // Step 4 Auto-defaults
  useEffect(() => {
    if (currentStep === 4) {
      setFormData((prev: any) => {
        const updates: any = {};
        if (!prev.nationality) updates.nationality = 'India';
        // Auto-select Yes if state is Maharashtra and it hasn't been set yet
        if (!prev.isMaharashtraDomiciled && prev.state === 'Maharashtra') {
          updates.isMaharashtraDomiciled = 'Yes';
        } else if (!prev.isMaharashtraDomiciled) {
          updates.isMaharashtraDomiciled = 'No';
        }
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [currentStep]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, isTemp: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInKB = file.size / 1024;
    const maxKb = (fieldName === 'sscMarksheetUrl' || fieldName === 'hscMarksheetUrl' || fieldName === 'marksheetUrl') ? 5120 : 1024;
    if (sizeInKB < 1 || sizeInKB > maxKb) {
      alert(`File size must be between 1 KB and ${maxKb / 1024} MB`);
      e.target.value = '';
      return;
    }

    const fileRef = storageRef(studentStorage || storage, `students/${userId}/documents/${fieldName}_${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('File upload failed:', error);
        alert('Failed to upload file.');
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        if (isTemp) {
          setTempQual(prev => ({ ...prev, [fieldName]: downloadURL, marksheetName: file.name }));
        } else {
          setFormData((prev: any) => ({
            ...prev,
            [fieldName]: downloadURL,
            [`${fieldName}FileName`]: file.name
          }));

          if (fieldName === 'sscMarksheetUrl') {
            alert('SSC Marksheet uploaded successfully.');
          } else if (fieldName === 'hscMarksheetUrl') {
            alert('HSC Marksheet uploaded successfully.');
          }

          // Immediately save critical documents to Firebase
          const criticalFields = ['photoUrl', 'signUrl', 'aadhaarFrontUrl', 'aadhaarBackUrl', 'casteCertificateUrl', 'domicileUrl', 'transferCertificateUrl', 'bonafideCertificateUrl', 'sscMarksheetUrl', 'hscMarksheetUrl'];
          if (userId && criticalFields.includes(fieldName)) {
            try {
              const userRef = ref(realtimeDb, `users/${userId}/profile`);
              await update(userRef, {
                [fieldName]: downloadURL,
                [`${fieldName}FileName`]: file.name
              });
            } catch (err) {
              console.error(`Error syncing ${fieldName}:`, err);
            }
          }
        }
      }
    );
  };

  const handleRemoveFile = async (fieldName: string) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      delete newData[fieldName];
      delete newData[`${fieldName}FileName`];
      return newData;
    });

    const criticalFields = ['photoUrl', 'signUrl', 'aadhaarFrontUrl', 'aadhaarBackUrl', 'casteCertificateUrl', 'domicileUrl', 'transferCertificateUrl', 'bonafideCertificateUrl'];
    if (userId && criticalFields.includes(fieldName)) {
      try {
        const userRef = ref(realtimeDb, `users/${userId}/profile`);
        await update(userRef, {
          [fieldName]: null,
          [`${fieldName}FileName`]: null
        });
      } catch (err) {
        console.error(`Error removing ${fieldName}:`, err);
      }
    }
  };

  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState('');

  const handleIFSCChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ifsc = e.target.value.toUpperCase();
    setFormData((prev: any) => ({ ...prev, ifscCode: ifsc }));
    setIfscError('');

    if (ifsc.length === 11) {
      setIfscLoading(true);
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (res.ok) {
          const data = await res.json();
          setFormData((prev: any) => ({
            ...prev,
            bankName: data.BANK,
            branchName: data.BRANCH
          }));
        } else {
          setIfscError('Invalid IFSC Code');
          setFormData((prev: any) => ({ ...prev, bankName: '', branchName: '' }));
        }
      } catch (error) {
        setIfscError('Validation failed');
      } finally {
        setIfscLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Auto-capitalize first letter of each word for all student and parent name fields
    let processedValue = value;
    if ([
      'firstName', 'middleName', 'lastName',
      'fatherFirstName', 'fatherMiddleName', 'fatherLastName',
      'motherFirstName', 'motherMiddleName', 'motherLastName',
      'spouseFirstName', 'spouseMiddleName', 'spouseLastName'
    ].includes(name)) {
      processedValue = value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    setFormData((prev: any) => {
      const newState = { ...prev, [name]: processedValue };

      // Cascading reset logic
      if (name === 'state') {
        newState.district = '';
        newState.taluka = '';
      } else if (name === 'district') {
        newState.taluka = '';
      } else if (name === 'permState') {
        newState.permDistrict = '';
        newState.permTaluka = '';
      } else if (name === 'permDistrict') {
        newState.permTaluka = '';
      }

      // Auto-sync for "Same as Correspondence Address"
      if (newState.sameAsCorrespondence) {
        if (['address', 'pincode', 'state', 'district', 'taluka', 'city'].includes(name) || name === 'sameAsCorrespondence') {
          newState.permAddress = newState.address;
          newState.permPincode = newState.pincode;
          newState.permState = newState.state;
          newState.permDistrict = newState.district;
          newState.permTaluka = newState.taluka;
          newState.permCity = newState.city;
        }
      }

      return newState;
    });
  };

  // Percentage calculation
  useEffect(() => {
    if (tempQual.marksObtained && tempQual.outOfMarks) {
      const per = (parseFloat(tempQual.marksObtained) / parseFloat(tempQual.outOfMarks)) * 100;
      setTempQual(prev => ({ ...prev, percentage: per.toFixed(2) }));
    }
  }, [tempQual.marksObtained, tempQual.outOfMarks]);

  const startEditQualification = (index: number) => {
    const qual = (formData.qualifications || [])[index];
    setTempQual({ ...qual });
    setEditQualIndex(index);
  };

  const addQualification = () => {
    if (!tempQual.examination || !tempQual.board || !tempQual.college || !tempQual.marksObtained || !tempQual.outOfMarks) {
      alert("Please fill mandatory qualification details marked with *");
      return;
    }
    const finalQual = { ...tempQual };
    if (finalQual.board === 'Other' && finalQual.customBoard) {
      finalQual.board = finalQual.customBoard;
    }
    const currentQuals = [...(formData.qualifications || [])];

    if (editQualIndex !== null) {
      currentQuals[editQualIndex] = finalQual;
      setEditQualIndex(null);
    } else {
      currentQuals.push(finalQual);
    }

    setFormData((prev: any) => ({
      ...prev,
      qualifications: currentQuals
    }));
    setTempQual({
      examination: '', board: '', customBoard: '', college: '', passingDate: '',
      result: 'Pass', mode: 'Regular', marksSystem: 'Marks',
      marksObtained: '', outOfMarks: '', percentage: '', grade: '',
      marksheetUrl: '', marksheetName: ''
    });
  };

  const removeQualification = (index: number) => {
    const quals = [...(formData.qualifications || [])];
    quals.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, qualifications: quals }));
    if (editQualIndex === index) setEditQualIndex(null);
  };

  const startEditLanguage = (index: number) => {
    const lang = (formData.languagesKnown || [])[index];
    setTempLang({ ...lang });
    setEditLangIndex(index);
  };

  const addLanguage = () => {
    if (!tempLang.language) {
      alert("Please select a language.");
      return;
    }
    const currentLangs = [...(formData.languagesKnown || [])];

    if (editLangIndex !== null) {
      currentLangs[editLangIndex] = tempLang;
      setEditLangIndex(null);
    } else {
      // Avoid duplicates only for new entries
      if (currentLangs.some((l: any) => l.language === tempLang.language)) {
        alert("Language already added.");
        return;
      }
      currentLangs.push(tempLang);
    }

    setFormData((prev: any) => ({
      ...prev,
      languagesKnown: currentLangs
    }));
    setTempLang({ language: '', read: false, write: false, speak: false });
  };

  const removeLanguage = (index: number) => {
    const langs = [...(formData.languagesKnown || [])];
    langs.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, languagesKnown: langs }));
    if (editLangIndex === index) setEditLangIndex(null);
  };

  const startEditExperience = (index: number) => {
    const exp = (formData.workExperiences || [])[index];
    setTempExp({ ...exp });
    setEditExpIndex(index);
  };

  const addExperience = () => {
    if (!tempExp.organization || !tempExp.designation || !tempExp.fromDate || !tempExp.toDate) {
      alert("Please fill all experience details marked with *");
      return;
    }
    const currentExps = [...(formData.workExperiences || [])];

    if (editExpIndex !== null) {
      currentExps[editExpIndex] = tempExp;
      setEditExpIndex(null);
    } else {
      currentExps.push(tempExp);
    }

    setFormData((prev: any) => ({
      ...prev,
      workExperiences: currentExps
    }));
    setTempExp({ organization: '', designation: '', fromDate: '', toDate: '' });
  };

  const removeExperience = (index: number) => {
    const exps = [...(formData.workExperiences || [])];
    exps.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, workExperiences: exps }));
    if (editExpIndex === index) setEditExpIndex(null);
  };

  const handleLockProfile = async (shouldRoute: boolean = true) => {
    // Validate profile steps before locking
    for (let s = 1; s <= 9; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        window.scrollTo(0, 0);
        return;
      }
    }

    setLoading(true);
    setShowLockPopup(false);
    try {
      const profileRef = ref(realtimeDb, `users/${userId}/profile`);
      await update(profileRef, {
        profileLocked: true,
        lockedAt: Date.now(),
        status: 'Submitted'
      });


      // Only update the current application to be locked
      const currentAppId = editingApplication?.id || new URLSearchParams(window.location.search).get('appId');
      if (currentAppId && currentAppId !== 'new') {
        const currentAppRef = ref(realtimeDb, `users/${userId}/applications/${currentAppId}`);
        const currentAppSnap = await get(currentAppRef);
        if (currentAppSnap.exists()) {
          const currentStatus = currentAppSnap.val().status;
          await update(currentAppRef, {
            profileLocked: true,
            status: (currentStatus === 'Unlocked' || currentStatus === 'Updated') ? 'Updated' : (currentStatus || 'Submitted')
          });
        }
      }

      const appsRef = ref(realtimeDb, `users/${userId}/applications`);
      const appsSnap = await get(appsRef);

      // Synchronize profile data and applications to admission inquiries
      if (appsSnap.exists()) {
        const apps = appsSnap.val();
        for (const [appId, appData] of Object.entries(apps)) {
          const { collegeId, collegeName, courseName, courseType, duration, semester, stream, applicationId, fees, regNo, status: appStatus } = appData as any;
          if (!collegeId) continue;

          const inqRef = ref(realtimeDb, `colleges/${collegeId}/frontOffice/admissionInquiries`);
          const inqSnap = await get(inqRef);
          let existingInqId = null;

          if (inqSnap.exists()) {
            const inquiries = inqSnap.val();
            for (const [id, data] of Object.entries(inquiries)) {
              // Match by applicationId first (most reliable), fallback to studentUid + courseName
              if ((data as any).applicationId === applicationId ||
                ((data as any).studentUid === userId && (data as any).courseName === courseName)) {
                existingInqId = id;
                break;
              }
            }
          }

          const inqData: any = {
            ...formData,
            // Preserve critical admission fields
            applicationId: applicationId || null,
            studentUid: userId,
            studentName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Unknown Student',
            studentPhone: formData.phone || '',
            studentEmail: formData.email || '',
            courseName: courseName || null,
            courseType: courseType || null,
            duration: duration || null,
            semester: semester || null,
            stream: stream || null,
            collegeId: collegeId || null,
            collegeName: collegeName || null,
            fees: fees || null,
            regNo: regNo || 'N/A',
            profileLocked: true,
            status: (appStatus === 'Unlocked' || appStatus === 'Updated') ? 'Updated' : (appStatus || 'Submitted'),
            source: 'Student Portal',
            updatedAt: Date.now()
          };

          const cleanInqData = JSON.parse(JSON.stringify(inqData));


          if (existingInqId) {
            await update(ref(realtimeDb, `colleges/${collegeId}/frontOffice/admissionInquiries/${existingInqId}`), cleanInqData);
          } else {
            await push(inqRef, {
              ...cleanInqData,
              appliedAt: Date.now(),
              date: new Date().toISOString()
            });
          }

          // Also update or CREATE studentAdmissions
          const admRef = ref(realtimeDb, `colleges/${collegeId}/studentAdmissions`);
          const admSnap = await get(admRef);
          let existingAdmId = null;
          if (admSnap.exists()) {
            const admissions = admSnap.val();
            for (const [admId, admData] of Object.entries(admissions)) {
              if ((admData as any).uid === userId || (admData as any).studentUid === userId) {
                existingAdmId = admId;
                break;
              }
            }
          }

          const baseAdmData = {
            ...formData,
            applicationId: applicationId || null,
            studentUid: userId,
            studentName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Unknown Student',
            studentPhone: formData.phone || '',
            studentEmail: formData.email || '',
            courseName: courseName || null,
            courseType: courseType || null,
            duration: duration || null,
            semester: semester || null,
            stream: stream || null,
            collegeId: collegeId || null,
            collegeName: collegeName || null,
            fees: fees || null,
            profileLocked: true,
          };

          // Deep clean baseAdmData
          const cleanBaseAdmData = JSON.parse(JSON.stringify(baseAdmData));

          if (existingAdmId) {
            await update(ref(realtimeDb, `colleges/${collegeId}/studentAdmissions/${existingAdmId}`), {
              ...cleanBaseAdmData,
              lastModified: Date.now()
            });
          } else {
            await push(admRef, {
              ...cleanBaseAdmData,
              status: (appStatus === 'Unlocked' || appStatus === 'Updated') ? 'Updated' : (appStatus || 'Submitted'),
              admissionStatus: 'Pending',
              createdAt: Date.now()
            });
          }
        }
      }

      if (shouldRoute) {
        router.push('/student/dashboard?tab=2&msg=submitted');
      }
    } catch (error) {
      console.error("Lock error:", error);
      alert("Failed to lock profile. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockProfile = async () => {
    setLoading(true);
    try {
      const userRef = ref(realtimeDb, `users/${userId}/profile`);
      await update(userRef, {
        profileLocked: false,
        status: 'In Progress'
      });
      alert("Application Unlocked Successfully! You can now edit your details.");
    } catch (error) {
      console.error("Unlock error:", error);
      alert("Failed to unlock profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkStepValid = (stepId: number, data: any): boolean => {
    return true;
    let required: string[] = [];
    if (stepId === 1) {
      required = ['firstName', 'gender', 'dateOfBirth', 'aadhaarNo', 'phone'];
    } else if (stepId === 2) {
      required = ['address', 'pincode', 'state', 'district', 'taluka', 'city'];
    } else if (stepId === 3) {
      required = ['isOrphan', 'fatherFirstName', 'motherFirstName', 'maritalStatus'];
      if (data.maritalStatus === 'Married') {
        required.push('spouseTitle', 'spouseFirstName');
      }
    } else if (stepId === 4) {
      required = ['nationality', 'religion', 'casteCategory', 'caste', 'isMaharashtraDomiciled', 'isPWD'];
      if (!required.every(field => data[field])) return false;
      // Domicile, PWD, and Caste certificates are no longer mandatory for locking
      // if (data.isMaharashtraDomiciled === 'Yes' && !data.domicileUrl) return false;
      // if (data.isPWD === 'Yes' && (!data.disabilityType || !data.pwdCertificateUrl)) return false;
      // if (data.casteCategory && data.casteCategory !== 'Open' && !data.casteCertificateUrl) return false;
      return true;
    } else if (stepId === 5) {
      return data.qualifications && data.qualifications.length > 0;
    } else if (stepId === 6) {
      if (!data.hasTraining) return false;
      if (data.hasTraining === 'Yes') {
        if (!data.trainingStartDate || !data.trainingEndDate || !data.trainingCertificateUrl) return false;
      }
      return true;
    } else if (stepId === 7) {
      if (!data.motherTongue) return false;
      return data.languagesKnown && data.languagesKnown.length > 0;
    } else if (stepId === 8) {
      if (data.hasBankAccount === 'Yes') {
        const req = ['accountType', 'accountNumber', 'accountHolderName', 'ifscCode', 'bankName', 'branchName'];
        return req.every(field => data[field]) && !!data.bankPassbookUrl;
      } else if (data.hasBankAccount === 'No') {
        // PAN number and PAN card are no longer mandatory for locking
        return true;
      }
      return false;
    } else if (stepId === 9) {
      if (!data.hasWorkExperience) return false;
      if (data.hasWorkExperience === 'Yes') {
        return data.workExperiences && data.workExperiences.length > 0;
      }
      return true;
    } else if (stepId === 10) {
      return !!selectedCollege && !!selectedCourseId;
    }
    return required.every(field => data[field]);
  };

  const isStepUnlocked = (stepId: number): boolean => {
    for (let i = 1; i < stepId; i++) {
      if (!checkStepValid(i, formData)) return false;
    }
    return true;
  };

  const validateStep = (step: number) => {
    return true;
    let required: string[] = [];
    if (step === 1) {
      required = ['firstName', 'gender', 'dateOfBirth', 'aadhaarNo', 'phone'];
    } else if (step === 2) {
      required = ['address', 'pincode', 'state', 'district', 'taluka', 'city'];
    } else if (step === 3) {
      required = ['isOrphan', 'fatherFirstName', 'motherFirstName', 'maritalStatus'];
      if (formData.maritalStatus === 'Married') {
        required.push('spouseTitle', 'spouseFirstName');
      }
    } else if (step === 4) {
      required = ['nationality', 'religion', 'casteCategory', 'caste', 'isMaharashtraDomiciled', 'isPWD'];

      // Domicile, PWD, and Caste certificates are no longer mandatory for locking
      /*
      if (formData.isMaharashtraDomiciled === 'Yes' && !formData.domicileUrl) {
        alert('Please upload your Domicile Certificate.');
        return false;
      }
      if (formData.isPWD === 'Yes') {
        if (!formData.disabilityType || !formData.pwdCertificateUrl) {
          alert('Please fill in disability details and upload the certificate.');
          return false;
        }
      }
      if (formData.casteCategory && formData.casteCategory !== 'Open' && !formData.casteCertificateUrl) {
        alert('Please upload your Caste Certificate.');
        return false;
      }
      */
    } else if (step === 5) {
      if (!formData.qualifications || formData.qualifications.length === 0) {
        alert("Please add at least one qualification (SSC or equivalent).");
        return false;
      }
      return true;
    } else if (step === 6) {
      required = ['hasTraining'];
      if (formData.hasTraining === 'Yes') {
        required.push('trainingStartDate', 'trainingEndDate');
        if (!formData.trainingCertificateUrl) {
          alert("Please upload your Training Certificate.");
          return false;
        }
      }
    } else if (step === 7) {
      required = ['motherTongue'];

      if (!formData.languagesKnown || formData.languagesKnown.length === 0) {
        alert("Please add at least one language you know.");
        return false;
      }
    } else if (step === 8) {
      if (formData.hasBankAccount === 'Yes') {
        required = ['accountType', 'accountNumber', 'accountHolderName', 'ifscCode', 'bankName', 'branchName'];
        if (!formData.bankPassbookUrl) {
          alert('Please upload your Bank Passbook Cover Page / Cheque.');
          return false;
        }
      } else if (formData.hasBankAccount === 'No') {
        // PAN Number and PAN Card are no longer mandatory
        required = [];
      } else {
        alert('Please select whether you have a bank account.');
        return false;
      }
    } else if (step === 9) {
      required = ['hasWorkExperience'];
      if (formData.hasWorkExperience === 'Yes') {
        if (!formData.workExperiences || formData.workExperiences.length === 0) {
          alert("Please add at least one work experience record.");
          return false;
        }
      }
    } else if (step === 10) {
      if (!selectedCollege || !selectedCourseId) {
        alert("Please select target college and course details.");
        return false;
      }
      return true;
    }

    for (const field of required) {
      if (!formData[field]) {
        alert(`Please fill the mandatory field: ${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
        return false;
      }
    }
    return true;
  };

  const handleSaveAndNext = async () => {
    if (formData.profileLocked && currentStep < 10) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    try {
      // If "Same as Correspondence" is checked, sync the permanent fields before saving
      let dataToSave = { ...formData };
      if (formData.sameAsCorrespondence) {
        dataToSave = {
          ...dataToSave,
          permAddress: formData.address,
          permPincode: formData.pincode,
          permState: formData.state,
          permDistrict: formData.district,
          permTaluka: formData.taluka,
          permCity: formData.city,
        };
      }

      // Remove undefined values early to prevent Firebase errors in appData and inquiryData
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      if (currentStep === 10) {
        if (!selectedCollege || !selectedCourseId) {
          alert("Please select target college and course details.");
          setLoading(false);
          return;
        }

        const college = availableColleges.find(c => c.id === selectedCollege);
        const course = collegeCourses.find(c => c.id === selectedCourseId);

        // Find or create application
        const existingApp = (editingApplication && editingApplication.id !== 'new') ? editingApplication : null;

        let appRef;
        if (existingApp && existingApp.id) {
          appRef = ref(realtimeDb, `users/${userId}/applications/${existingApp.id}`);
        } else if (existingApp) {
          const foundApp = userApplications.find(app => app.id === existingApp.id || app.applicationId === existingApp.applicationId);
          const appKey = foundApp?.id || Object.keys(userApplications)[0] || 'app_1';
          appRef = ref(realtimeDb, `users/${userId}/applications/${appKey}`);
        } else {
          appRef = push(ref(realtimeDb, `users/${userId}/applications`));
        }

        const applicationId = existingApp?.applicationId || `APP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const appData = {
          ...dataToSave,
          applicationId: applicationId,
          collegeId: selectedCollege,
          collegeName: college?.name || 'N/A',
          courseType: selectedCourseType,
          courseId: selectedCourseId,
          courseName: selectedCourseName || course?.course_name || course?.name || 'N/A',
          duration: selectedDuration,
          semester: selectedSemester,
          stream: selectedStream,
          fees: selectedFees,
          status: existingApp?.status || 'Pending',
          appliedAt: existingApp?.appliedAt || new Date().toISOString(),
          verificationStatus: existingApp?.verificationStatus || 'Pending',
          paymentStatus: existingApp?.paymentStatus || 'Pending',
          regFee: existingApp?.regFee || '5000',
          profileLocked: existingApp?.profileLocked || false
        };

        // Deep clean appData of all undefined values using JSON stringify/parse
        const cleanAppData = JSON.parse(JSON.stringify(appData));

        await update(appRef, cleanAppData);

        if (existingApp?.collegeId && existingApp.collegeId !== selectedCollege) {
          const oldInquiryRef = ref(realtimeDb, `colleges/${existingApp.collegeId}/frontOffice/admissionInquiries/${appRef.key}`);
          await remove(oldInquiryRef);
        }

        if (selectedCollege && appRef.key) {
          const inquiryRef = ref(realtimeDb, `colleges/${selectedCollege}/frontOffice/admissionInquiries/${appRef.key}`);
          const inquiryData = {
            ...appData,
            studentUid: userId,
            source: 'Student Portal',
            studentName: `${dataToSave.firstName || ''} ${dataToSave.lastName || ''}`.trim() || 'Unknown Student',
            studentEmail: dataToSave.email || '',
            studentPhone: dataToSave.phone || '',
          };
          
          // Deep clean inquiryData of all undefined values
          const cleanInquiryData = JSON.parse(JSON.stringify(inquiryData));
          
          await update(inquiryRef, cleanInquiryData);

          // ALSO save to studentAdmissions immediately upon Send to College
          const admRef = ref(realtimeDb, `colleges/${selectedCollege}/studentAdmissions/${appRef.key}`);
          const baseAdmData = {
            ...appData,
            profile: dataToSave,
            studentUid: userId,
            studentName: inquiryData.studentName,
            studentEmail: inquiryData.studentEmail,
            studentPhone: inquiryData.studentPhone,
            admissionStatus: 'Pending',
            status: appData.status || 'Submitted',
            createdAt: Date.now()
          };
          const cleanBaseAdmData = JSON.parse(JSON.stringify(baseAdmData));
          await update(admRef, cleanBaseAdmData);

          alert("Application Successfully Sent to College! Pending Admission.");
        }

        // Update URL query parameter if it was a new application, so going back doesn't push a new one
        const appIdFromUrl = new URLSearchParams(window.location.search).get('appId');
        if (appIdFromUrl === 'new' && appRef.key) {
          const params = new URLSearchParams(window.location.search);
          params.set('appId', appRef.key);
          window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
        }

        // Update main course fields in user profile
        const mainUserRef = ref(realtimeDb, `users/${userId}`);
        const updates: any = {
          course: course?.name || 'N/A',
          'profile/course': course?.name || 'N/A'
        };
        await update(mainUserRef, updates);

        dataToSave.course = course?.name || 'N/A';
        setFormData((prev: any) => ({
          ...prev,
          course: course?.name || 'N/A'
        }));
      }

      const cleanDataToSave = JSON.parse(JSON.stringify(dataToSave));
      const userRef = ref(realtimeDb, `users/${userId}/profile`);
      await update(userRef, cleanDataToSave);

      const completion = 100;
      if (onStepComplete) onStepComplete(currentStep, completion);

      if (currentStep < 10) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else if (currentStep === 10) {
        await handleLockProfile();
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert('Error saving application: ' + (error.message || 'Unknown error. Please check console.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const renderStepContent = (stepOverride?: number) => {
    const step = stepOverride || currentStep;
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Form Side */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">First Name <span className="text-red-500">*</span></label>
                      <input
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Enter First Name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Middle / Father Name</label>

                      <input
                        name="middleName"
                        value={formData.middleName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Enter Middle Name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Last / Surname</label>

                      <input
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Enter Last Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Gender <span className="text-red-500">*</span></label>
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 pl-8">
                      <label className="text-sm font-normal text-slate-500">Date of Birth <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Aadhaar Number <span className="text-red-500">*</span></label>
                      <input
                        name="aadhaarNo"
                        value={formData.aadhaarNo || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="12 Digit Aadhaar"
                      />
                    </div>
                    <div className="space-y-1.5 pl-8">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-normal text-slate-500">Upload Aadhaar Card <span className="text-red-500">*</span></label>
                        <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <div className="flex-1 relative group">
                            <label className="w-full bg-white border border-slate-200 p-4 rounded-lg text-xs font-normal text-slate-400 hover:text-orange-600 hover:border-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                              <Upload size={14} /> {formData.aadhaarFrontUrl ? 'Change Front' : 'Front'}
                              <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'aadhaarFrontUrl')} />
                            </label>
                            {formData.aadhaarFrontUrl && !formData.profileLocked && (
                              <button
                                onClick={() => handleRemoveFile('aadhaarFrontUrl')}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-all z-10"
                                title="Remove Front"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 relative group">
                            <label className="w-full bg-white border border-slate-200 p-4 rounded-lg text-xs font-normal text-slate-400 hover:text-orange-600 hover:border-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                              <Upload size={14} /> {formData.aadhaarBackUrl ? 'Change Back' : 'Back'}
                              <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'aadhaarBackUrl')} />
                            </label>
                            {formData.aadhaarBackUrl && !formData.profileLocked && (
                              <button
                                onClick={() => handleRemoveFile('aadhaarBackUrl')}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-all z-10"
                                title="Remove Back"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 px-1">
                          {formData.aadhaarFrontUrlFileName && <span className="text-[13px] font-normal text-black italic">Front: {formData.aadhaarFrontUrlFileName}</span>}
                          {formData.aadhaarBackUrlFileName && <span className="text-[13px] font-normal text-black italic">Back: {formData.aadhaarBackUrlFileName}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Primary Mobile Number <span className="text-red-500">*</span></label>
                      <div className="flex">
                        <div className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-4 flex items-center text-sm font-normal text-slate-400">+91</div>
                        <input
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-r-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Mobile Number"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Secondary Mobile Number</label>
                      <div className="flex">
                        <div className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg px-4 flex items-center text-sm font-normal text-slate-400">+91</div>
                        <input
                          name="secondaryPhone"
                          value={formData.secondaryPhone || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-r-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Alternate Mobile"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">E-Mail ID</label>
                    <input
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="Enter E-Mail Address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-normal text-slate-500">Upload Transfer Certificate</label>
                        <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="bg-white border-2 border-dashed border-slate-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all flex-1 group">
                          <Upload size={18} className="text-slate-400 group-hover:text-orange-500" />
                          <span className="text-sm font-normal text-slate-600 group-hover:text-orange-600">Upload Certificate</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'transferCertificateUrl')}
                          />
                        </label>
                        {formData.transferCertificateUrlFileName && (
                          <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                            <PlusCircle size={10} /> {formData.transferCertificateUrlFileName}
                          </span>
                        )}
                        {formData.transferCertificateUrl && !formData.profileLocked && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('transferCertificateUrl')}
                            className="w-10 h-10 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all shadow-sm"
                            title="Remove Certificate"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-normal text-slate-500">Upload Bonafide Certificate</label>
                        <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="bg-white border-2 border-dashed border-slate-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all flex-1 group">
                          <Upload size={18} className="text-slate-400 group-hover:text-orange-500" />
                          <span className="text-sm font-normal text-slate-600 group-hover:text-orange-600">Upload Certificate</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'bonafideCertificateUrl')}
                          />
                        </label>
                        {formData.bonafideCertificateUrlFileName && (
                          <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                            <PlusCircle size={10} /> {formData.bonafideCertificateUrlFileName}
                          </span>
                        )}
                        {formData.bonafideCertificateUrl && !formData.profileLocked && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('bonafideCertificateUrl')}
                            className="w-10 h-10 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all shadow-sm"
                            title="Remove Certificate"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploads Side */}
                <div className="lg:w-64 space-y-6">
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-48 h-56 bg-white border-2 border-dashed border-slate-200 rounded-xl relative group overflow-hidden flex flex-col items-center justify-center">
                      {formData.photoUrl ? (
                        <>
                          <img src={formData.photoUrl} className="w-full h-full object-cover" />
                          {!formData.profileLocked && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFile('photoUrl'); }}
                              className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all z-20"
                              title="Remove Photo"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </>
                      ) : (
                        <Camera size={48} className="text-slate-200 group-hover:text-orange-200 transition-colors" />
                      )}
                      {!formData.profileLocked && (
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileChange(e, 'photoUrl')}
                        />
                      )}
                    </div>
                    <div className="w-full flex flex-col items-center gap-1">
                      <button className="w-full bg-white border border-slate-200 py-3 rounded-lg text-[13px] font-medium capitalize tracking-tight text-black hover:text-black hover:border-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Upload size={14} /> Upload Photo
                      </button>
                      <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      {formData.photoUrlFileName && (
                        <span className="text-[13px] font-normal text-black italic">{formData.photoUrlFileName}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-48 h-24 bg-white border-2 border-dashed border-slate-200 rounded-xl relative group overflow-hidden flex flex-col items-center justify-center">
                      {formData.signUrl ? (
                        <>
                          <img src={formData.signUrl} className="w-full h-full object-contain" />
                          {!formData.profileLocked && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFile('signUrl'); }}
                              className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all z-20"
                              title="Remove Signature"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </>
                      ) : (
                        <PenTool size={32} className="text-slate-200 group-hover:text-orange-200 transition-colors" />
                      )}
                      {!formData.profileLocked && (
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileChange(e, 'signUrl')}
                        />
                      )}
                    </div>
                    <div className="w-full flex flex-col items-center gap-1">
                      <button className="w-full bg-white border border-slate-200 py-3 rounded-lg text-[13px] font-medium capitalize tracking-tight text-black hover:text-black hover:border-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Upload size={14} /> Upload Sign
                      </button>
                      <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      {formData.signUrlFileName && (
                        <span className="text-[13px] font-normal text-black italic">{formData.signUrlFileName}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </fieldset>
            {!isFullFormMode && (
              <div className="flex justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center gap-2`}><RotateCcw size={16} /> Reset</button>
                <button
                  onClick={handleSaveAndNext}
                  disabled={loading}
                  className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  {formData.profileLocked ? <ArrowRight size={16} /> : <Save size={16} />}
                  {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Next')}
                </button>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              {/* Correspondence Address Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                  <div className="w-9 h-9 bg-orange-500 text-white rounded-full flex items-center justify-center font-normal text-sm shadow-sm">A</div>
                  <h4 className="text-sm font-normal text-slate-800 italic">Correspondence Address</h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Address <span className="text-red-500">*</span></label>
                    <input
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="House no / Area / Village"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Pincode <span className="text-red-500">*</span></label>
                      <input
                        name="pincode"
                        value={formData.pincode || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="6 digit pincode"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">State <span className="text-red-500">*</span></label>
                      <select
                        name="state"
                        value={formData.state || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">District <span className="text-red-500">*</span></label>
                      <select
                        name="district"
                        value={formData.district || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm"
                        disabled={!formData.state}
                      >
                        <option value="">Select District</option>
                        {formData.state && (DISTRICT_MAP[formData.state] || []).map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Taluka <span className="text-red-500">*</span></label>
                      <input
                        name="taluka"
                        value={formData.taluka || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Enter Taluka / Block"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">City / Village <span className="text-red-500">*</span></label>
                    <input
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="Enter city or village name"
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Address Section */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center font-normal text-sm shadow-sm">B</div>
                    <h4 className="text-sm font-normal text-slate-800 italic">Permanent Address</h4>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-orange-500 transition-all">
                    <input
                      type="checkbox"
                      name="sameAsCorrespondence"
                      checked={formData.sameAsCorrespondence || false}
                      onChange={(e) => {
                        const value = e.target.checked;
                        handleInputChange({ target: { name: 'sameAsCorrespondence', value } } as any);
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-[13px] font-normal text-black group-hover:text-black transition-colors">Same as Correspondence address</span>
                  </label>
                </div>

                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Address <span className="text-red-500">*</span></label>
                    <input
                      name="permAddress"
                      value={formData.permAddress || ''}
                      onChange={handleInputChange}
                      readOnly={!!formData.sameAsCorrespondence}
                      className={`w-full border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm ${formData.sameAsCorrespondence ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                      placeholder="House no / Area / Village"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Pincode <span className="text-red-500">*</span></label>
                      <input
                        name="permPincode"
                        value={formData.permPincode || ''}
                        onChange={handleInputChange}
                        readOnly={!!formData.sameAsCorrespondence}
                        className={`w-full border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm ${formData.sameAsCorrespondence ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                        placeholder="6 digit pincode"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">State <span className="text-red-500">*</span></label>
                      <select
                        name="permState"
                        value={formData.permState || ''}
                        onChange={handleInputChange}
                        disabled={!!formData.sameAsCorrespondence}
                        className={`w-full border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm ${formData.sameAsCorrespondence ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">District <span className="text-red-500">*</span></label>
                      <select
                        name="permDistrict"
                        value={formData.permDistrict || ''}
                        onChange={handleInputChange}
                        disabled={!!formData.sameAsCorrespondence}
                        className={`w-full border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm ${formData.sameAsCorrespondence ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                      >
                        <option value="">Select District</option>
                        {formData.permState && (DISTRICT_MAP[formData.permState] || []).map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Taluka <span className="text-red-500">*</span></label>
                      <input
                        name="permTaluka"
                        value={formData.permTaluka || ''}
                        onChange={handleInputChange}
                        readOnly={!!formData.sameAsCorrespondence}
                        className={`w-full border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm ${formData.sameAsCorrespondence ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                        placeholder="Enter Taluka / Block"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">City / Village <span className="text-red-500">*</span></label>
                    <input
                      name="permCity"
                      value={formData.permCity || ''}
                      onChange={handleInputChange}
                      readOnly={!!formData.sameAsCorrespondence}
                      className={`w-full border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm ${formData.sameAsCorrespondence ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                      placeholder="Enter city or village name"
                    />
                  </div>
                </div>

                {formData.sameAsCorrespondence && (
                  <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-center gap-4 animate-in zoom-in-95 duration-300">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">
                      <History size={16} />
                    </div>
                    <p className="text-[13px] font-normal text-black italic">Permanent address linked to correspondence details. Re-sync active.</p>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button
                  onClick={handleBack}
                  className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Back
                </button>
                <button
                  onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center justify-center gap-2`}
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  onClick={handleSaveAndNext}
                  disabled={loading}
                  className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}
                </button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              {/* Header Section */}
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-sm font-normal text-slate-800 italic">Parent / Guardian Details</h4>
                <p className="text-[13px] font-normal text-black capitalize tracking-tight">Candidate Family Information</p>
              </div>

              <div className="space-y-10">
                {/* Orphan Section */}
                <div className="space-y-4">
                  <label className="text-sm font-normal text-slate-500 flex items-center gap-2">
                    Orphan Candidate <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="isOrphan"
                          value={opt}
                          checked={formData.isOrphan === opt}
                          onChange={handleInputChange}
                          className="w-5 h-5 border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Father's Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Father's First Name <span className="text-red-500">*</span></label>
                      <input
                        name="fatherFirstName"
                        value={formData.fatherFirstName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Father's First Name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Father's Middle Name</label>
                      <input
                        name="fatherMiddleName"
                        value={formData.fatherMiddleName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Middle Name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Father's Last Name</label>
                      <input
                        name="fatherLastName"
                        value={formData.fatherLastName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Surname"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Father's Mobile <span className="text-red-500">*</span></label>
                      <input
                        name="fatherPhone"
                        value={formData.fatherPhone || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Mobile Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Mother's Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Mother's First Name <span className="text-red-500">*</span></label>
                      <input
                        name="motherFirstName"
                        value={formData.motherFirstName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Mother's First Name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Mother's Middle Name</label>

                      <input
                        name="motherMiddleName"
                        value={formData.motherMiddleName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Middle Name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Mother's Last Name</label>

                      <input
                        name="motherLastName"
                        value={formData.motherLastName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Surname"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-500">Mother's Mobile <span className="text-red-500">*</span></label>
                      <input
                        name="motherPhone"
                        value={formData.motherPhone || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="Mobile Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Marital Status Section */}
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-normal text-slate-800 italic">Marital Status Details</h4>
                    <p className="text-[13px] font-normal text-black capitalize tracking-tight">Personal Union Information</p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-normal text-slate-500">
                      Marital Status <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-6">
                      {['Married', 'Unmarried'].map((opt) => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="maritalStatus"
                            value={opt}
                            checked={formData.maritalStatus === opt}
                            onChange={handleInputChange}
                            className="w-5 h-5 border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.maritalStatus === 'Married' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-500">Spouse Title <span className="text-red-500">*</span></label>
                        <select
                          name="spouseTitle"
                          value={formData.spouseTitle || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm"
                        >
                          <option value="">Select Title</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-500">Spouse's First Name <span className="text-red-500">*</span></label>
                        <input
                          name="spouseFirstName"
                          value={formData.spouseFirstName || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Spouse's First Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-500">Spouse's Middle Name</label>
                        <input
                          name="spouseMiddleName"
                          value={formData.spouseMiddleName || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Spouse's Middle Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-500">Spouse's Last Name</label>
                        <input
                          name="spouseLastName"
                          value={formData.spouseLastName || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Spouse's Last Name"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button
                  onClick={handleBack}
                  className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Back
                </button>
                <button
                  onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center justify-center gap-2`}
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  onClick={handleSaveAndNext}
                  disabled={loading}
                  className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}
                </button>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Category Details</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Candidate Social & Domicile Status</p>
              </div>

              <div className="space-y-10">
                {/* Nationality & Domicile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Nationality <span className="text-red-500">*</span></label>
                    <select
                      name="nationality"
                      value={formData.nationality || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-normal text-slate-600">Are you {formData.state || 'Maharashtra'} Domiciled? <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex gap-4">
                        {['Yes', 'No'].map((opt) => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name="isMaharashtraDomiciled"
                              value={opt}
                              checked={formData.isMaharashtraDomiciled === opt}
                              onChange={handleInputChange}
                              className="w-5 h-5 border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>

                      {formData.isMaharashtraDomiciled === 'Yes' && (
                        <div className="flex flex-col gap-1.5 animate-in slide-in-from-left duration-300">
                          <div className="flex items-center gap-3">
                            <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all group">
                              <Upload size={14} className="text-orange-400 group-hover:text-orange-600" />
                              <span className="text-xs font-normal text-orange-600">Upload Domicile (Optional)</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, 'domicileUrl')}
                              />
                            </label>
                            {formData.domicileUrl && (
                              <div className="flex items-center gap-2">
                                {formData.domicileUrlFileName && (
                                  <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                                    <PlusCircle size={10} /> {formData.domicileUrlFileName}
                                  </span>
                                )}
                                {!formData.profileLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile('domicileUrl')}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                    title="Remove Document"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 pl-1">Allowed size: 1 KB to 1 MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Religion & Caste Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Religion <span className="text-red-500">*</span></label>
                    <select
                      name="religion"
                      value={formData.religion || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Religion</option>
                      {RELIGIONS.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Caste Category <span className="text-red-500">*</span></label>
                    <select
                      name="casteCategory"
                      value={formData.casteCategory || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Category</option>
                      {CASTE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Caste <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="caste"
                      value={formData.caste || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your caste"
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>

                  {formData.casteCategory && formData.casteCategory !== 'Open' && formData.caste && (
                    <div className="space-y-1.5 flex flex-col justify-end animate-in slide-in-from-left duration-300">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-sm font-normal text-slate-600">Caste Certificate (Optional)</label>
                        <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all group flex-1 justify-center">
                          <Upload size={14} className="text-orange-400 group-hover:text-orange-600" />
                          <span className="text-xs font-normal text-orange-600">Upload Caste Certificate</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'casteCertificateUrl')}
                          />
                        </label>
                        {formData.casteCertificateUrl && (
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500">
                              <CheckCircle2 size={20} />
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(formData.casteCertificateUrl, '_blank')}
                              className="w-10 h-10 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-all"
                              title="Preview Certificate"
                            >
                              <Eye size={18} />
                            </button>
                            {!formData.profileLocked && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile('casteCertificateUrl');
                                }}
                                className="w-10 h-10 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all z-20 relative"
                                title="Delete Certificate"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* PWD Section */}
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-normal text-slate-800 italic">Person With Disability Category Details</h4>
                    <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Accessibility Information</p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-normal text-slate-600">
                      Do you belong to Person with Disability Category? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex gap-6">
                        {['Yes', 'No'].map((opt) => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name="isPWD"
                              value={opt}
                              checked={formData.isPWD === opt}
                              onChange={handleInputChange}
                              className="w-5 h-5 border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>

                      {formData.isPWD === 'Yes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 animate-in slide-in-from-top duration-300 flex-1">
                          <div className="space-y-1.5">
                            <label className="text-sm font-normal text-slate-600">Disability Type <span className="text-red-500">*</span></label>
                            <select
                              name="disabilityType"
                              value={formData.disabilityType || ''}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                            >
                              <option value="">Select Disability Type</option>
                              {DISABILITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col justify-end gap-3">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-normal text-slate-600">Disability Certificate <span className="text-red-500">*</span></label>
                              <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all group flex-1">
                                <Upload size={18} className="text-orange-400 group-hover:text-orange-600" />
                                <span className="text-xs font-normal text-orange-600 capitalize">Upload Certificate</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, 'pwdCertificateUrl')}
                                />
                              </label>
                              {formData.pwdCertificateUrlFileName && (
                                <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                                  <PlusCircle size={10} /> {formData.pwdCertificateUrlFileName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button
                  onClick={handleBack}
                  className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Back
                </button>
                <button
                  onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center justify-center gap-2`}
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  onClick={handleSaveAndNext}
                  disabled={loading}
                  className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}
                </button>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Qualification Details (SSC & Above)</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Academic Records & Marksheets</p>
              </div>



              {/* Qualification Form */}
              <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Examination <span className="text-red-500">*</span></label>
                    <select
                      value={tempQual.examination}
                      onChange={(e) => setTempQual({ ...tempQual, examination: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Examination</option>
                      {EXAMINATIONS.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Board/University <span className="text-red-500">*</span></label>
                    <select
                      value={tempQual.board}
                      onChange={(e) => setTempQual({ ...tempQual, board: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="">Select Board</option>
                      {BOARDS.map(board => <option key={board} value={board}>{board}</option>)}
                      <option value="Other">Other (Custom Board/University)</option>
                    </select>
                  </div>

                  {tempQual.board === 'Other' && (
                    <div className="space-y-1.5 animate-in slide-in-from-left duration-300">
                      <label className="text-sm font-normal text-slate-600">Enter Board/University Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Type your board name here"
                        value={tempQual.customBoard || ''}
                        onChange={(e) => setTempQual(prev => ({ ...prev, customBoard: e.target.value }))}
                        className="w-full bg-white border-2 border-orange-500 rounded-lg p-4 text-[14px] font-bold outline-none shadow-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">School/College Name <span className="text-red-500">*</span></label>
                    <input
                      value={tempQual.college}
                      onChange={(e) => setTempQual({ ...tempQual, college: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="Enter school/college"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Passing Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={tempQual.passingDate}
                      onChange={(e) => setTempQual({ ...tempQual, passingDate: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Result <span className="text-red-500">*</span></label>
                    <select
                      value={tempQual.result}
                      onChange={(e) => setTempQual({ ...tempQual, result: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Result Awaited">Result Awaited</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Mode <span className="text-red-500">*</span></label>
                    <select
                      value={tempQual.mode}
                      onChange={(e) => setTempQual({ ...tempQual, mode: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Distance">Distance</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Marks System <span className="text-red-500">*</span></label>
                    <select
                      value={tempQual.marksSystem}
                      onChange={(e) => setTempQual({ ...tempQual, marksSystem: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    >
                      <option value="Marks">Marks</option>
                      <option value="Grade/CGPA">Grade/CGPA</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Marks Obtained <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={tempQual.marksObtained}
                      onChange={(e) => setTempQual({ ...tempQual, marksObtained: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Out of Marks <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={tempQual.outOfMarks}
                      onChange={(e) => setTempQual({ ...tempQual, outOfMarks: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Percentage <span className="text-red-500">*</span></label>
                    <input
                      readOnly
                      value={tempQual.percentage}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-4 text-[14px] font-normal text-orange-600 outline-none shadow-sm cursor-not-allowed"
                      placeholder="0.00%"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Class/Grade <span className="text-red-500">*</span></label>
                    <input
                      value={tempQual.grade}
                      onChange={(e) => setTempQual({ ...tempQual, grade: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                      placeholder="Distinction / A+"
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-1.5">
                    <div className="flex justify-between items-center pl-1">
                      <span className="text-xs font-normal text-slate-500">Marksheet <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all flex-1 group">
                        <Upload size={18} className="text-orange-400 group-hover:text-orange-600" />
                        <span className="text-sm font-normal text-orange-600">Upload Marksheet</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'marksheetUrl', true)}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={addQualification}
                          className="bg-[#ff9f1c] hover:bg-orange-700 text-white p-4 rounded-xl shadow-md transition-all active:scale-95 group flex items-center justify-center min-w-[100px]"
                          type="button"
                        >
                          {editQualIndex !== null ? 'Update' : 'Add'}
                        </button>
                        {editQualIndex !== null && (
                          <button
                            onClick={() => {
                              setEditQualIndex(null);
                              setTempQual({
                                examination: '', board: '', customBoard: '', college: '', passingDate: '',
                                result: 'Pass', mode: 'Regular', marksSystem: 'Marks',
                                marksObtained: '', outOfMarks: '', percentage: '', grade: '',
                                marksheetUrl: '', marksheetName: ''
                              });
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-4 rounded-xl shadow-sm transition-all active:scale-95"
                            type="button"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    {tempQual.marksheetUrl && (
                      <div className="flex items-center gap-2 px-2 mt-1">
                        <p className="text-[13px] font-normal text-emerald-600 italic">File selected: {tempQual.marksheetName || 'Marksheet'}</p>
                        <button
                          type="button"
                          onClick={() => setTempQual({ ...tempQual, marksheetUrl: '', marksheetName: '' })}
                          className="text-rose-500 hover:text-rose-700"
                          title="Remove File"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Added Qualifications Table */}
              <div className="space-y-4 pt-10">
                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-normal text-slate-800 italic">Added Qualifications</h4>
                  <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Summary of your academic background</p>
                </div>

                <div className="overflow-x-auto border-2 border-black rounded-lg">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-black text-[13px] font-black uppercase tracking-widest border-b-2 border-black">
                      <tr>
                        <th className="px-6 py-4 border-r-2 border-black text-black">Examination</th>
                        <th className="px-6 py-4 border-r-2 border-black text-black">Board/University</th>
                        <th className="px-6 py-4 border-r-2 border-black text-black">Passing Date</th>
                        <th className="px-6 py-4 border-r-2 border-black text-black">Percentage</th>
                        <th className="px-6 py-4 text-center text-black">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {formData.qualifications && formData.qualifications.length > 0 ? (
                        formData.qualifications.map((q: any, idx: number) => (
                          <tr key={idx} className="border-b-2 border-black last:border-b-0 hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 border-r-2 border-black font-bold text-slate-900">{q.examination}</td>
                            <td className="px-6 py-4 border-r-2 border-black text-slate-600">{q.board}</td>
                            <td className="px-6 py-4 border-r-2 border-black text-slate-600">{q.passingDate}</td>
                            <td className="px-6 py-4 border-r-2 border-black font-bold text-orange-600">{q.percentage}%</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                {q.marksheetUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => window.open(q.marksheetUrl, '_blank')}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-sm border border-emerald-200"
                                    title="Preview Marksheet"
                                  >
                                    <Eye size={14} /> Preview
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">No file</span>
                                )}
                                <div className="h-4 w-[1px] bg-slate-300" />
                                <button
                                  onClick={() => startEditQualification(idx)}
                                  className="text-blue-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                                  title="Edit Record"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => removeQualification(idx)}
                                  className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                  title="Delete Record"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-normal italic text-xs">No qualifications added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95">Back</button>
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? 'hidden' : ''} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2`}><RotateCcw size={16} /> Reset</button>
                <button onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2"><Save size={16} /> {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}</button>
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Training Details</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Professional Courses & Certifications</p>
              </div>

              <div className="space-y-6">
                <label className="text-sm font-normal text-slate-600">Have you completed any training? <span className="text-red-500">*</span></label>
                <div className="flex gap-10">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="hasTraining"
                        value={opt}
                        checked={formData.hasTraining === opt}
                        onChange={handleInputChange}
                        className="w-6 h-6 border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.hasTraining === 'Yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">Start Date</label>
                    <input
                      type="date"
                      name="trainingStartDate"
                      value={formData.trainingStartDate || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-600">End Date</label>
                    <input
                      type="date"
                      name="trainingEndDate"
                      value={formData.trainingEndDate || ''}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="col-span-full space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-normal text-slate-600">Upload Certificate</label>
                      <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-white border-2 border-slate-200 hover:border-orange-500 px-8 py-3 rounded-xl flex items-center gap-3 transition-all group shadow-sm">
                        <Upload size={18} className="text-slate-400 group-hover:text-orange-500" />
                        <span className="text-sm font-normal text-slate-600 group-hover:text-orange-600">Upload</span>
                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'trainingCertificateUrl')} />
                      </label>
                      {formData.trainingCertificateUrl && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-xs font-normal text-emerald-700 text-nowrap truncate max-w-[200px]">Uploaded Successfully</span>
                          </div>
                          {!formData.profileLocked && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile('trainingCertificateUrl')}
                              className="w-10 h-10 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all shadow-sm"
                              title="Remove Certificate"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95">Back</button>
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? 'hidden' : ''} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2`}><RotateCcw size={16} /> Reset</button>
                <button onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2"><Save size={16} /> {formData.profileLocked ? 'Next' : (loading ? 'Saving...' : 'Save & Next')}</button>
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Additional Details</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Ancillary & Linguistic Information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-sm font-normal text-slate-600">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-normal text-slate-600">Mother Tongue <span className="text-red-500">*</span></label>
                  <select
                    name="motherTongue"
                    value={formData.motherTongue || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                  >
                    <option value="">Select Mother Tongue</option>
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>
              </div>

              {/* Languages Known Form */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <label className="text-sm font-normal text-slate-600">Languages Known <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap items-center gap-6">
                  <select
                    value={tempLang.language}
                    onChange={(e) => setTempLang({ ...tempLang, language: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-5 py-3 text-sm font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                  >
                    <option value="">Select Language</option>
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>

                  <div className="flex items-center gap-4">
                    {['read', 'write', 'speak'].map((field) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(tempLang as any)[field]}
                          onChange={(e) => setTempLang({ ...tempLang, [field]: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-xs font-normal text-slate-600 capitalize tracking-wider group-hover:text-orange-600 transition-colors">{field}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addLanguage}
                      className="bg-[#ff9f1c] hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2 min-w-[120px] justify-center"
                      type="button"
                    >
                      {editLangIndex !== null ? 'Update' : 'Add Language'}
                    </button>
                    {editLangIndex !== null && (
                      <button
                        onClick={() => {
                          setEditLangIndex(null);
                          setTempLang({ language: '', read: false, write: false, speak: false });
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-6 py-2 rounded-lg font-normal text-xs capitalize shadow-sm transition-all active:scale-95"
                        type="button"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Added Languages Table */}
              <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-black text-[13px] font-medium capitalize tracking-tight border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Language</th>
                      <th className="px-6 py-4">Read</th>
                      <th className="px-6 py-4">Write</th>
                      <th className="px-6 py-4">Speak</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {formData.languagesKnown && formData.languagesKnown.length > 0 ? (
                      formData.languagesKnown.map((l: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-normal text-slate-900">{l.language}</td>
                          <td className="px-6 py-4 font-normal">{l.read ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4 font-normal">{l.write ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4 font-normal">{l.speak ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => startEditLanguage(idx)}
                                className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                title="Edit Record"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => removeLanguage(idx)}
                                className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                title="Delete Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-normal italic text-xs">At least one language must be added.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95">Back</button>
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95`}>Reset</button>
                <button onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2">Save & Next</button>
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Bank Details</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Financial & Tax Information</p>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-sm font-normal text-slate-600">Do you have Bank Account? <span className="text-red-500">*</span></label>
                  <div className="flex gap-10">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="hasBankAccount"
                          value={opt}
                          checked={formData.hasBankAccount === opt}
                          onChange={handleInputChange}
                          className="w-5 h-5 border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.hasBankAccount === 'Yes' && (
                  <div className="space-y-8 animate-in slide-in-from-top duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-600">Type Of Account <span className="text-red-500">*</span></label>
                        <select
                          name="accountType"
                          value={formData.accountType || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        >
                          <option value="">Select Account Type</option>
                          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-600">Account Number <span className="text-red-500">*</span></label>
                        <input
                          name="accountNumber"
                          value={formData.accountNumber || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Enter Account Number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-600">Name Of Account Holder <span className="text-red-500">*</span></label>
                        <input
                          name="accountHolderName"
                          value={formData.accountHolderName || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          placeholder="Enter Holder Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-600">Bank IFSC Code <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            name="ifscCode"
                            value={formData.ifscCode || ''}
                            onChange={handleIFSCChange}
                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                            placeholder="e.g. SBIN0001234"
                            maxLength={11}
                          />
                          {ifscLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-black animate-pulse font-medium">Verifying...</div>}
                          {ifscError && <div className="absolute -bottom-5 left-0 text-[13px] text-black font-medium">{ifscError}</div>}
                          {!ifscError && formData.bankName && <div className="absolute -bottom-5 left-0 text-[13px] text-black font-medium">Verified: {formData.bankName}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-600">Bank Name <span className="text-red-500">*</span></label>
                        <input
                          name="bankName"
                          value={formData.bankName || ''}
                          readOnly
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none shadow-sm cursor-not-allowed text-black"
                          placeholder="Auto-filled from IFSC"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-normal text-slate-600">Branch Name <span className="text-red-500">*</span></label>
                        <input
                          name="branchName"
                          value={formData.branchName || ''}
                          readOnly
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none shadow-sm cursor-not-allowed text-black"
                          placeholder="Auto-filled from IFSC"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-normal text-slate-600">Upload Bank Passbook Cover Page / Cheque <span className="text-red-500">*</span></label>
                        <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all group">
                          <Upload size={16} className="text-orange-400 group-hover:text-orange-600" />
                          <span className="text-xs font-normal text-orange-600 capitalize">Upload</span>
                          <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'bankPassbookUrl')} />
                        </label>
                        {formData.bankPassbookUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                              <PlusCircle size={10} /> {formData.bankPassbookUrlFileName || 'Uploaded'}
                            </span>
                            {!formData.profileLocked && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile('bankPassbookUrl')}
                                className="text-rose-500 hover:text-rose-700"
                                title="Remove File"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {formData.hasBankAccount === 'No' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom duration-500">
                    <div className="space-y-1.5">
                      <label className="text-sm font-normal text-slate-600">Enter PAN card number (Optional)</label>
                      <input
                        name="panCardNo"
                        value={formData.panCardNo || ''}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-sm font-normal text-slate-500">Upload PAN Card (Optional)</label>
                        <span className="text-[10px] text-slate-400">Allowed size: 1 KB to 1 MB</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-500 px-6 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all group">
                          <Upload size={16} className="text-orange-400 group-hover:text-orange-600" />
                          <span className="text-xs font-normal text-orange-600 capitalize">Upload</span>
                          <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'panCardUrl')} />
                        </label>
                        {formData.panCardUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-normal text-orange-500 italic flex items-center gap-1">
                              <PlusCircle size={10} /> {formData.panCardUrlFileName || 'Uploaded'}
                            </span>
                            {!formData.profileLocked && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile('panCardUrl')}
                                className="text-rose-500 hover:text-rose-700"
                                title="Remove File"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95">Back</button>
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95`}>Reset</button>
                <button onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2">Save & Next</button>
              </div>
            )}
          </div>
        );
      case 9:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset disabled={formData.profileLocked} className="contents disabled:opacity-80">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Work Experience</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Career History</p>
              </div>

              <div className="space-y-10">
                <div className="space-y-6 text-center md:text-left">
                  <label className="text-sm font-normal text-slate-500 capitalize tracking-tighter">Do you have work experience? <span className="text-red-500">*</span></label>
                  <div className="flex justify-center md:justify-start gap-10 pt-2">
                    {['Yes', 'No'].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="hasWorkExperience"
                          value={opt}
                          checked={formData.hasWorkExperience === opt}
                          onChange={handleInputChange}
                          className="w-5 h-5 border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm font-normal text-slate-700 group-hover:text-orange-600 transition-colors">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.hasWorkExperience === 'Yes' && (
                  <div className="space-y-10 animate-in slide-in-from-top duration-500">
                    <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-200 space-y-6">
                      <h5 className="text-[11px] font-medium text-slate-700 capitalize tracking-tight italic border-b border-slate-200 pb-2">Add Experience</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-normal text-slate-500 capitalize tracking-tighter">Organization <span className="text-red-500">*</span></label>
                          <input
                            value={tempExp.organization}
                            onChange={(e) => setTempExp({ ...tempExp, organization: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                            placeholder="Example: Tech Solutions Pvt Ltd"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-normal text-slate-500 capitalize tracking-tighter">Designation <span className="text-red-500">*</span></label>
                          <input
                            value={tempExp.designation}
                            onChange={(e) => setTempExp({ ...tempExp, designation: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                            placeholder="Example: Senior Software Engineer"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-1.5">
                          <label className="text-sm font-normal text-slate-500 capitalize tracking-tighter">From <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            value={tempExp.fromDate}
                            onChange={(e) => setTempExp({ ...tempExp, fromDate: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-normal text-slate-500 capitalize tracking-tighter">To <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            value={tempExp.toDate}
                            onChange={(e) => setTempExp({ ...tempExp, toDate: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-orange-500 transition-all shadow-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={addExperience}
                            className="bg-[#ff9f1c] hover:bg-orange-700 text-white p-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 transition-all h-[52px] flex-1"
                          >
                            {editExpIndex !== null ? 'Update Record' : 'Add Experience record'}
                          </button>
                          {editExpIndex !== null && (
                            <button
                              onClick={() => {
                                setEditExpIndex(null);
                                setTempExp({ organization: '', designation: '', fromDate: '', toDate: '' });
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-3.5 rounded-lg font-normal text-xs capitalize shadow-sm transition-all h-[52px]"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[11px] font-medium text-slate-700 capitalize tracking-tight italic">Work Experience History</h5>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-4 text-[13px] font-medium text-black capitalize tracking-tight">Company / Organization</th>
                              <th className="px-6 py-4 text-[13px] font-medium text-black capitalize tracking-tight">Designation</th>
                              <th className="px-6 py-4 text-[13px] font-medium text-black capitalize tracking-tight text-center">Duration</th>
                              <th className="px-6 py-4 text-[13px] font-medium text-black capitalize tracking-tight text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(formData.workExperiences || []).length > 0 ? (
                              (formData.workExperiences || []).map((exp: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/10 transition-colors group">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-slate-700 capitalize tracking-tighter">{exp.organization}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs font-normal text-slate-500 capitalize">{exp.designation}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="bg-teal-50/50 text-orange-600 px-4 py-1.5 rounded-full text-[9px] font-medium capitalize tracking-tight border border-teal-100/50">
                                      {exp.fromDate}  ➤  {exp.toDate}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => startEditExperience(i)}
                                        className="text-blue-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                        title="Edit Record"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button
                                        onClick={() => removeExperience(i)}
                                        className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                        title="Delete Record"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-slate-300 italic font-medium text-[11px] capitalize tracking-tight">No work experience records added yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95">Back</button>
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95`}>Reset</button>
                <button onClick={() => {
                  if (!validateStep(9)) return;
                  setIsPreviewModalOpen(true);
                }} disabled={loading} className="bg-[#ff9f1c] hover:bg-orange-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2"><Lock size={16} /> Lock Profile</button>
              </div>
            )}
          </div>
        );
      case 10: {
        const appToCheck = editingApplication || (!isOtherCourseMode && userApplications.length > 0 ? userApplications[0] : null);
        const isCourseLocked = false; // Forced false as per user request to remove all locks
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <fieldset className="contents">
              <div className="flex flex-col gap-1 pb-6 border-b border-slate-200">
                <h4 className="text-base font-normal text-slate-800 italic">Select Course</h4>
                <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Choose your Target College and Course details</p>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Target College Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">
                      Target Institution / College <span className="text-red-500">*</span> 
                    </label>
                    <select
                      value={selectedCollege}
                      disabled={isCourseLocked}
                      onChange={(e) => {
                        setUserSelectedCollege(true);
                        setSelectedCollege(e.target.value);
                        setSelectedCourseType('');
                        setSelectedCourseName('');
                        setSelectedDuration('');
                        setSelectedSemester('');
                        setSelectedStream('');
                        setSelectedCourseId('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-[#ff9f1c] transition-all cursor-pointer shadow-sm text-black disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">Select College / Institute</option>
                      {availableColleges.map((col: any) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Type Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Course Type <span className="text-red-500">*</span></label>
                    <select
                      value={selectedCourseType}
                      disabled={isCourseLocked || !selectedCollege}
                      onChange={(e) => {
                        setSelectedCourseType(e.target.value);
                        setSelectedCourseName('');
                        setSelectedDuration('');
                        setSelectedSemester('');
                        setSelectedStream('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-[#ff9f1c] transition-all cursor-pointer shadow-sm text-black disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">Select Course Type</option>
                      {availableCourseTypes.map((type: string) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Course Name Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Course Name <span className="text-red-500">*</span></label>
                    <select
                      value={selectedCourseName}
                      disabled={isCourseLocked || !selectedCourseType}
                      onChange={(e) => {
                        setSelectedCourseName(e.target.value);
                        setSelectedDuration('');
                        setSelectedSemester('');
                        setSelectedStream('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-[#ff9f1c] transition-all cursor-pointer shadow-sm text-black disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">Select Course Name</option>
                      {availableCourseNames.map((name: string) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Duration Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Course Duration <span className="text-red-500">*</span></label>
                    <select
                      value={selectedDuration}
                      disabled={isCourseLocked || !selectedCourseName}
                      onChange={(e) => {
                        setSelectedDuration(e.target.value);
                        setSelectedSemester('');
                        setSelectedStream('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-[#ff9f1c] transition-all cursor-pointer shadow-sm text-black disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">Select Course Duration</option>
                      {availableDurations.map((duration: string) => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Semester Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Semester <span className="text-red-500">*</span></label>
                    <select
                      value={selectedSemester}
                      disabled={isCourseLocked || !selectedDuration}
                      onChange={(e) => {
                        setSelectedSemester(e.target.value);
                        setSelectedStream('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-[#ff9f1c] transition-all cursor-pointer shadow-sm text-black disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">Select Semester</option>
                      {availableSemesters.map((sem: string) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stream / Branch Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-normal text-slate-500">Stream / Branch <span className="text-red-500">*</span></label>
                    <select
                      value={selectedStream}
                      disabled={isCourseLocked || !selectedSemester}
                      onChange={(e) => setSelectedStream(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-4 text-[14px] font-normal outline-none focus:border-[#ff9f1c] transition-all cursor-pointer shadow-sm text-black disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">Select Stream / Branch</option>
                      {availableStreams.map((stream: string) => (
                        <option key={stream} value={stream}>
                          {stream}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </fieldset>
            {!isFullFormMode && (
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
                <button onClick={() => !formData.profileLocked && setFormData({})} className={`${formData.profileLocked ? "hidden" : ""} bg-[#db2828] hover:bg-red-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95`}>Reset</button>
                {!isCourseLocked && (
                  <button onClick={handleSaveAndNext} disabled={loading} className="bg-[#21ba45] hover:bg-green-700 text-white px-10 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md active:scale-95 flex items-center gap-2"><ArrowRight size={16} /> Send to College</button>
                )}
              </div>
            )}
          </div>
        );
      }
      case 11:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-1 pb-6 border-b border-slate-200 text-center">
              <h4 className="text-sm font-normal text-[#ff9f1c] italic capitalize tracking-wider">Lock Profile</h4>
              <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">You have previewed your application. Please agree to the declaration to lock and submit.</p>
            </div>

            <div className="hidden">
              {/* 1. Primary Details */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Primary Details</h5>
                  <button onClick={() => setCurrentStep(1)} className="text-[13px] font-normal text-black hover:text-black capitalize tracking-tight">Edit Step 1</button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Candidate's Name</p>
                      <p className="text-sm font-medium text-slate-700 capitalize italic">
                        {`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim() || '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Gender</p>
                      <p className="text-sm font-normal text-slate-700 capitalize">{formData.gender || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Date Of Birth</p>
                      <p className="text-sm font-normal text-slate-700">{formData.dateOfBirth || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Aadhaar Number</p>
                      <p className="text-sm font-normal text-slate-700">
                        {formData.aadhaarNo ? `********${formData.aadhaarNo.slice(-4)}` : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Primary Mobile Number</p>
                      <p className="text-sm font-normal text-slate-700">{formData.phone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Secondary Mobile Number</p>
                      <p className="text-sm font-normal text-slate-700">{formData.secondaryPhone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">E-Mail ID</p>
                      <p className="text-sm font-normal text-slate-700 lowercase">{formData.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-6 md:border-l border-dashed border-slate-200 pl-8 bg-slate-50/30 py-4">
                    <div className="space-y-2 flex flex-col items-center">
                      <p className="text-[9px] font-medium text-slate-400 capitalize tracking-normal mb-1">Student Photo</p>
                      <div className="w-32 h-40 bg-white border-2 border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm relative group">
                        {formData.photoUrl ? (
                          <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <User size={40} className="text-slate-200" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-col items-center">
                      <p className="text-[9px] font-medium text-slate-400 capitalize tracking-normal mb-1">Student Signature</p>
                      <div className="w-32 h-16 bg-white border-2 border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm relative group">
                        {formData.signUrl ? (
                          <img src={formData.signUrl} alt="Sign" className="w-full h-full object-contain p-2" />
                        ) : (
                          <div className="w-20 h-[1px] bg-slate-100" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Address Details */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Address Details</h5>
                  <button onClick={() => setCurrentStep(2)} className="text-[13px] font-normal text-black hover:text-black capitalize tracking-tight">Edit Step 2</button>
                </div>
                <div className="p-8 space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Correspondence Address</p>
                    <p className="text-sm font-normal text-slate-700 leading-relaxed capitalize">
                      {`${formData.address || ''}, ${formData.city || ''}, ${formData.taluka || ''}, ${formData.district || ''}, ${formData.state || ''}, ${formData.pincode || ''}`.trim() || '-'}
                    </p>
                  </div>
                  <div className="space-y-2 border-t border-dashed border-slate-200 pt-6">
                    <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Permanent Address</p>
                    {formData.sameAsCorrespondence === 'Yes' ? (
                      <p className="text-sm font-medium text-orange-600 italic">Same as Correspondence Address</p>
                    ) : (
                      <p className="text-sm font-normal text-slate-700 leading-relaxed capitalize">
                        {`${formData.permAddress || ''}, ${formData.permCity || ''}, ${formData.permTaluka || ''}, ${formData.permDistrict || ''}, ${formData.permState || ''}, ${formData.permPincode || ''}`.trim() || '-'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Parent & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Parent / Guardian Details</h5>
                    <button onClick={() => setCurrentStep(3)} className="text-[13px] font-normal text-black capitalize tracking-tight">Edit</button>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { label: 'Orphan Candidate', value: formData.isOrphan },
                      { label: "Father's Name", value: `${formData.fatherFirstName || ''} ${formData.fatherMiddleName || ''} ${formData.fatherLastName || ''}`.trim() },
                      { label: "Father's Mobile", value: formData.fatherPhone },
                      { label: "Mother's Name", value: `${formData.motherFirstName || ''} ${formData.motherMiddleName || ''} ${formData.motherLastName || ''}`.trim() },
                      { label: "Mother's Mobile", value: formData.motherPhone },
                      { label: 'Marital Status', value: formData.maritalStatus },
                      ...(formData.maritalStatus === 'Married' ? [
                        { label: 'Spouse Name', value: `${formData.spouseTitle || ''} ${formData.spouseFirstName || ''} ${formData.spouseMiddleName || ''} ${formData.spouseLastName || ''}`.trim() }
                      ] : [])
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-[13px] font-normal text-black capitalize">{item.label}</span>
                        <span className="text-sm font-normal text-slate-700 capitalize italic">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Category Details</h5>
                    <button onClick={() => setCurrentStep(4)} className="text-[13px] font-normal text-black capitalize tracking-tight">Edit</button>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { label: 'Nationality', value: formData.nationality },
                      { label: 'Maharashtra Domiciled', value: formData.isMaharashtraDomiciled },
                      { label: 'Religion', value: formData.religion },
                      { label: 'Caste Category', value: formData.casteCategory },
                      { label: 'Person with Disability', value: formData.isPWD === 'Yes' ? `Yes (${formData.disabilityType || ''})` : 'No' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-[13px] font-normal text-black capitalize">{item.label}</span>
                        <span className="text-sm font-normal text-slate-700 capitalize italic">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Qualification */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Qualification Details</h5>
                  <button onClick={() => setCurrentStep(5)} className="text-[13px] font-normal text-black capitalize tracking-tight">Edit</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr>
                        {['Examination', 'Board/University', 'Percentage', 'Class/Grade', 'Marksheet'].map(h => (
                          <th key={h} className="px-6 py-4 text-[13px] font-medium text-black capitalize tracking-tight">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(formData.qualifications || []).length > 0 ? (
                        formData.qualifications.map((q: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-normal text-slate-700 capitalize">{q.examination}</td>
                            <td className="px-6 py-4 text-sm font-normal text-slate-500 capitalize">{q.board}</td>
                            <td className="px-6 py-4 text-sm font-medium text-[#ff9f1c] italic">{q.percentage}%</td>
                            <td className="px-6 py-4 text-sm font-normal text-slate-500 capitalize">{q.grade}</td>
                            <td className="px-6 py-4 text-sm">
                              {q.marksheetUrl ? (
                                <button
                                  type="button"
                                  onClick={() => window.open(q.marksheetUrl, '_blank')}
                                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-sm border border-emerald-200"
                                  title="Preview Marksheet"
                                >
                                  <Eye size={12} /> Preview
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs italic">No file</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-300 font-normal capitalize italic">No records added</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ancillary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Training & Other</h5>
                    <button onClick={() => setCurrentStep(6)} className="text-[13px] font-normal text-black capitalize tracking-tight">Edit</button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight mb-1">Completed Training</p>
                      <p className="text-sm font-normal text-slate-700">{formData.hasTraining || 'No'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight mb-1">Blood Group</p>
                      <p className="text-sm font-normal text-slate-700">{formData.bloodGroup || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-normal text-slate-400 capitalize tracking-tight mb-1">Mother Tongue</p>
                      <p className="text-sm font-normal text-slate-700 capitalize">{formData.motherTongue || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Languages Known</h5>
                    <button onClick={() => setCurrentStep(7)} className="text-[13px] font-normal text-black capitalize tracking-tight">Edit</button>
                  </div>
                  <div className="p-6 flex flex-wrap gap-3">
                    {(formData.languagesKnown || []).map((l: any, i: number) => (
                      <div key={i} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-700 capitalize italic">{l.language}</span>
                        <div className="flex gap-2">
                          {['read', 'write', 'speak'].map(skill => (
                            <span key={skill} className={`text-[9px] font-normal capitalize tracking-tighter ${l[skill] ? 'text-orange-600' : 'text-slate-300 line-through'}`}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(formData.languagesKnown || []).length === 0 && <span className="text-xs font-normal text-slate-300 italic capitalize">No languages added</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Bank / PAN Details</h5>
                    <button onClick={() => setCurrentStep(8)} className="text-[13px] font-normal text-black capitalize">Edit</button>
                  </div>
                  <div className="p-6">
                    {formData.hasBankAccount === 'Yes' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Bank Name</p>
                          <p className="text-xs font-normal text-slate-700">{formData.bankName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Account Number</p>
                          <p className="text-xs font-medium text-slate-700 capitalize tracking-tight">{formData.accountNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">IFSC Code</p>
                          <p className="text-xs font-normal text-[#ff9f1c] capitalize">{formData.ifscCode || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Holder Name</p>
                          <p className="text-xs font-normal text-slate-700 capitalize">{formData.accountHolderName || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight mb-1">PAN Number</p>
                        <p className="text-sm font-medium text-slate-700 capitalize tracking-tight">{formData.panCardNo || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Work Experience</h5>
                    <button onClick={() => setCurrentStep(9)} className="text-[13px] font-normal text-black capitalize">Edit</button>
                  </div>
                  <div className="p-6">
                    {formData.hasWorkExperience === 'Yes' && (formData.workExperiences || []).length > 0 ? (
                      <div className="space-y-4">
                        {(formData.workExperiences).map((exp: any, i: number) => (
                          <div key={i} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 flex flex-col gap-1">
                            <div className="flex justify-between items-start">
                              <p className="text-[11px] font-medium text-slate-700 capitalize tracking-tighter">{exp.organization}</p>
                              <span className="text-xs font-medium text-[#ff9f1c] capitalize px-2 py-0.5 bg-white border border-slate-200 rounded-full">
                                {exp.fromDate} - {exp.toDate}
                              </span>
                            </div>
                            <p className="text-xs font-normal text-slate-400 capitalize tracking-tight leading-none">{exp.designation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight mb-1">Has Work Experience</p>
                        <p className="text-sm font-normal text-slate-700">{formData.hasWorkExperience || 'No'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h5 className="text-sm font-medium text-slate-700 capitalize tracking-tight italic">Selected Course Details</h5>
                  <button onClick={() => setCurrentStep(10)} className="text-[13px] font-normal text-black capitalize">Edit Step 10</button>
                </div>
                <div className="p-6">
                  {selectedCourseId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">College / Institution</p>
                        <p className="text-sm font-normal text-slate-700">
                          {availableColleges.find(c => c.id === selectedCollege)?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Course Group</p>
                        <p className="text-sm font-normal text-slate-700 capitalize">{selectedCourseType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Specific Course</p>
                        <p className="text-sm font-medium text-slate-700 capitalize tracking-tight">
                          {(() => {
                            const c = collegeCourses.find(curr => curr.id === selectedCourseId);
                            return c ? (c.course_slug && c.course_slug !== 'NULL' ? c.course_slug : c.course_name || c.name) : 'N/A';
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Duration</p>
                        <p className="text-sm font-normal text-slate-700">{selectedDuration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Semester</p>
                        <p className="text-sm font-normal text-slate-700">{selectedSemester || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-normal text-slate-400 capitalize tracking-tight">Stream / Branch</p>
                        <p className="text-sm font-normal text-slate-700">{selectedStream || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-normal text-slate-400 italic">No course selected yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
            <div className="space-y-12 text-left">
              {/* Declaration Block */}
              <div className="bg-sky-50/50 rounded-2xl border border-orange-100 p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="declaration"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-sky-200 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="declaration" className="space-y-4 cursor-pointer">
                    <p className="text-sm font-medium text-slate-800 italic capitalize tracking-tight">I hereby declare & understand that,</p>
                    <ul className="list-decimal list-inside space-y-2 text-sm font-normal text-slate-500 leading-relaxed">
                      <li>All the information furnished by me in this profile is true, complete and correct to the best of my knowledge and belief.</li>
                      <li>Entire information furnished by me in this profile is final and binding to me.</li>
                      <li>If any information furnished by me here, is found to be false or incorrect, I shall be liable for appropriate legal action and my application will be cancelled as per rules.</li>
                    </ul>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-slate-200">
              {!isFullFormMode && <button onClick={handleBack} className="bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 px-10 py-3.5 rounded-lg font-normal text-xs capitalize transition-all active:scale-95">Back</button>}
              <button
                onClick={() => handleLockProfile()}
                disabled={!declarationChecked || formData.profileLocked || loading}
                className={`px-12 py-3.5 rounded-lg font-normal text-xs capitalize shadow-md transition-all active:scale-95 flex items-center gap-2 ${formData.profileLocked
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : declarationChecked
                    ? 'bg-[#ff9f1c] hover:bg-orange-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
              >
                <Lock size={16} /> {formData.profileLocked ? 'Application Locked' : 'Lock Profile Form'}
              </button>
            </div>
          </div>
        );
      case 222:
        return (
          <div className="animate-in zoom-in-95 duration-500 py-20 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200/50 border-8 border-white ring-1 ring-emerald-100">
                <CheckCircle2 size={100} className="text-emerald-500 animate-in zoom-in-50 duration-700" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">Admission Confirmed</h3>
              <p className="text-sm font-medium text-slate-400 max-w-md mx-auto capitalize tracking-tight leading-relaxed">
                Your admission application has been officially accepted by the institutional board. Welcome to the academic session 2026-27.
              </p>
            </div>

            <div className="pt-8">
              <div className="inline-flex items-center gap-4 px-10 py-5 bg-[#002147] text-white rounded-3xl shadow-2xl hover:scale-105 transition-transform cursor-pointer group">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-[#ff9f1c] transition-colors">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-black capitalize tracking-tight opacity-50">Document Center</p>
                  <p className="text-sm font-bold capitalize tracking-tight">Download Admission Letter</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderFullForm = () => {
    return (
      <div className="space-y-20">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
          <div key={s} className="relative">
            {s < 11 && (
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-[#ff9f1c] text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                  {s}
                </div>
                <h3 className="text-xl font-medium text-slate-800 italic">
                  {steps[s - 1].label} Details
                </h3>
              </div>
            )}
            {renderStepContent(s)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto bg-white border-4 border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="bg-orange-50/50 p-6 border-b border-orange-100">
        <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = checkStepValid(step.id, formData);
            const unlocked = isStepUnlocked(step.id);
            return (
              <button
                key={step.id}
                onClick={() => unlocked && setCurrentStep(step.id)}
                disabled={!unlocked}
                className={`flex flex-col items-center gap-3 shrink-0 group min-w-[90px] ${!unlocked ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isActive
                  ? 'bg-[#ff9f1c] text-white shadow-md ring-4 ring-orange-500/10 scale-105'
                  : isCompleted
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : unlocked
                      ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-orange-300 hover:text-orange-500'
                      : 'bg-slate-50 text-slate-400 border border-slate-200/60'
                  }`}>
                  {isCompleted ? <CheckCircle2 size={24} /> : step.id}
                </div>
                <span className={`text-[11px] font-medium transition-colors ${isActive
                  ? 'text-orange-600 font-semibold'
                  : isCompleted
                    ? 'text-emerald-600 font-semibold'
                    : unlocked
                      ? 'text-slate-600 group-hover:text-orange-500'
                      : 'text-slate-400'
                  }`}>
                  {step.id}. {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-12">
        <div className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6">
          <div>
            <h3 className="text-[#ff9f1c] text-2xl font-normal italic tracking-tight">
              {steps[currentStep - 1]?.label || 'Final'} Details
            </h3>
          </div>
          <div className="bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
            <span className="text-[11px] font-normal text-slate-400 capitalize tracking-tight">Status:</span>
            <span className={`text-[11px] font-medium capitalize tracking-tight italic ${formData.profileLocked ? 'text-red-500 animate-pulse' : 'text-orange-600'}`}>
              {formData.profileLocked ? '🔒 Profile Locked' : 'Verified Hub'}
            </span>
          </div>
        </div>

        <div className="contents">
          {isFullFormMode ? renderFullForm() : renderStepContent()}
        </div>
      </div>

      {/* Lock Profile Confirmation Popup */}
      {showLockPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-normal text-red-600 mb-3 text-center">Are you sure you want to lock this profile?</h3>
            <p className="text-sm font-normal text-blue-800/80 mb-8 leading-relaxed text-center">
              Once locked, you will not be able to edit your profile details. Please review all details carefully before proceeding.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLockPopup(false)}
                className="bg-[#ef4444] hover:bg-red-600 text-white font-normal py-2.5 px-10 rounded shadow-sm transition-all text-sm capitalize tracking-tight"
              >
                No
              </button>
              <button
                onClick={() => handleLockProfile()}
                disabled={loading}
                className="bg-[#22c55e] hover:bg-green-600 text-white font-normal py-2.5 px-10 rounded shadow-sm transition-all text-sm capitalize tracking-tight disabled:opacity-60"
              >
                {loading ? 'Locking...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ApplicationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onEdit={() => {
          setIsPreviewModalOpen(false);
          setCurrentStep(1);
        }}
        onNext={async () => {
          setIsPreviewModalOpen(false);
          await handleSaveAndNext();
          await handleLockProfile(false); // Lock profile without routing
        }}
        formData={formData}
        selectedCollegeName={availableColleges.find(c => c.id === selectedCollege)?.name || 'N/A'}
        selectedCourseType={selectedCourseType}
        selectedCourseName={(() => {
          const c = collegeCourses.find(curr => curr.id === selectedCourseId);
          return c ? (c.course_slug && c.course_slug !== 'NULL' ? c.course_slug : c.course_name || c.name) : 'N/A';
        })()}
        selectedDuration={selectedDuration}
      />
    </div>
  );
}



