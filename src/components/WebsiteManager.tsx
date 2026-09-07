'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, set, get } from 'firebase/database';
import { realtimeDb, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  Globe,
  Save,
  Plus,
  Trash2,
  Megaphone,
  FileText,
  Users,
  Building2,
  CheckCircle2,
  ChevronRight,
  User,
  Image as ImageIcon,
  Play,
  ExternalLink,
  Zap,
  Star,
  Type,
  X,
  Menu,
  Edit2,
  Check,
  GraduationCap,
  Briefcase,
  Lightbulb,
  BookOpen,
  MessageCircle,
  Trophy,
  Info,
  Quote,
  Sparkles,
  Layers,
  ShieldCheck,
  MapPin,
  School,
  Link as LinkIcon
} from 'lucide-react';

interface WebsiteManagerProps {
  mode: 'home' | 'about' | 'course' | 'contact' | 'inquiry' | 'footer';
  adminUid?: string;
}

const defaultNotices = [
  { text: 'APRIL-2026 (2 YEAR) DETAIL TIME TABLE', isNew: true },
  { text: 'REGULAR FINAL DETAIL TIME TABLE-2026', isNew: true },
  { text: 'EX STUDENT FINAL DETAIL TIME TABLE-2026', isNew: true },
  { text: 'Regarding approval of new courses from the training session 2026-27', isNew: false },
  { text: '2 Year exam April 2026 Time Table', isNew: false },
  { text: 'MARCH 2026 FINAL TIME TABLE(27-3-2026)', isNew: false },
];

const defaultStats = [
  { value: '2,232', label: 'Institutes', icon: 'Building2', color: 'text-amber-600' },
  { value: '38', label: 'Sectors', icon: 'BarChart3', color: 'text-amber-500' },
  { value: '1,614', label: 'Courses', icon: 'BookOpen', color: 'text-amber-600' },
  { value: '211,427', label: 'Candidates', icon: 'Users', color: 'text-amber-500' },
];

const defaultSuccessStories = [
  { name: 'NITIN SURESH BEDEKAR', role: 'ELECTRICAL MAINTENANCE', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
  { name: 'ANIKET SANTOSH LAWAND', role: 'ELECTRICIAN', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
  { name: 'PRANAV RAJENDRA GURAV', role: 'ELECTRICIAN', company: 'WIPRO PARI ROBOTICS KHANDALA', year: '2024' },
  { name: 'SMRUTI RANJAN', role: 'SOFTWARE TESTER', company: 'TCS PUNE', year: '2024' },
];

const defaultHigherEd = [
  { title: 'Ratan Tata Maharashtra State Skill University', description: '' },
  { title: 'Engineering Diploma', description: '' },
  { title: 'Bachelor of Vocation (B.Voc.)', description: 'Circular for Admission', link: true },
  { title: 'Yashwantrao Chavan Maharashtra Open University', description: '' }
];

const defaultApprenticeships = [
  { title: 'Commissionerate of Skill Development, Employment and Entrepreneurship' },
  { title: 'CM Internship Program' },
  { title: 'PM Internship Scheme' }
];

const defaultEntrepreneurships = [
  { title: 'Sant Rohidas Leather Industries & Charmakar Development Corporation' },
  { title: 'Lokshahir Anna Bhau Sathe Development Corporation' },
  { title: 'Maharashtra State Khadi and Village Industries Board' }
];

const defaultInstitutes = [
  {
    name: "MAHALAXMI VOCATIONAL EDUCATION AND TRAINING INSTITUTE PARADH BK",
    location: "TQ Bhokardan, Dist Jalna"
  },
  {
    name: "MAHAVISHNU GRAMEEN VIKAS AND SHAISHANIK BAHUUDESHIY SANTHA'S OM SAI SKILL DEVELOPMENT INSTITUTE",
    location: "Paradh Budruk, Taluka Bhokardan, District Jalna"
  },
  {
    name: "MAHAVISHNU GRAMEEN VIKAS AND SHAISHANIK BAHUUDESHIY SANTHA'S MAHALAKSHMI SKILL DEVELOPMENT INSTITUTE",
    location: "Goregaon, Taluka Sengaon, District Hingoli"
  },
  {
    name: "MAHALAXMI TECHNICAL INSTITUTE PARADH BK",
    location: "Jalna"
  },
  {
    name: "MAHALAXMI NURSING & TECHNICAL INSTITUTE PARADH BK",
    location: "Jalna"
  },
  {
    name: "MAHALAXMI ANIMAL FISHERY SCIENCES TECHNICAL COLLEGE",
    location: "Paradh"
  },
  {
    name: "MAHALAXMI MADHYMIK V UCCH MADHYMIK VIDYALAY PARADH BK",
    location: "Maharashtra"
  }
];

const defaultRecognitions = [
  { imageUrl: "https://ik.imagekit.io/gnzjd77mb/download%20(2).jfif?updatedAt=1779189524664", name: "" },
  { imageUrl: "https://ik.imagekit.io/gnzjd77mb/Board%20Logo%20-%20small%20size.jpg", name: "" },
  { imageUrl: "https://ik.imagekit.io/gnzjd77mb/Seal_of_Maharashtra.png", name: "" },
  { imageUrl: "https://ik.imagekit.io/gnzjd77mb/download%20(3).jfif", name: "" },
  { imageUrl: "https://ik.imagekit.io/gnzjd77mb/images.png?updatedAt=1779189743980", name: "" }
];

const defaultContact = {
  title: 'Contact Us',
  officeAddress: 'Maharashtra State Board of Skill, Vocational Education and Training,\n6th Floor, Bandra Kurla BK, Bandra (E),\nMumbai - 400051.',
  phoneNumbers: '+91-22-26590000, +91-22-26591111',
  emails: 'support@msbsvet.gov.in, info@msbsvet.gov.in'
};

const defaultInquiry = {
  heroTitle: 'Academic Inquiry Portal',
  heroSubtitle: 'Academic Session 2026-27',
  description: "Start your journey with Maharashtra's premier vocational education network. Fill out the form to receive detailed program brochures and admission guidelines.",
  benefit1Title: 'Verified Institutions',
  benefit1Desc: 'Connect directly with government-approved skill centers and vocational colleges.',
  benefit2Title: 'Fast Response',
  benefit2Desc: 'Our dedicated admission counselors typically respond within 24-48 business hours.'
};

const cleanDataForCache = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:')) {
      return '__DATA_URL__';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanDataForCache(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cleaned[key] = cleanDataForCache(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

export default function WebsiteManager({ mode, adminUid }: WebsiteManagerProps) {
  const [loading, setLoading] = useState(true);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>({
    notices: defaultNotices, ministers: [], quickLinks: [], successStories: defaultSuccessStories, relatedVideos: [],
    stats: defaultStats, higherEducation: defaultHigherEd, apprenticeships: defaultApprenticeships, entrepreneurship: defaultEntrepreneurships, courses: [],
    testimonials: [], achievements: [], quotes: [], institutes: defaultInstitutes, recognitions: defaultRecognitions,
    aboutLinks: [{ label: 'About MIT PARADH', url: '/about' }, { label: 'Board of Directors', url: '/about#leadership' }], 
    supportLinks: [{ label: 'Contact Us', url: '/contact' }, { label: 'Inquiry Us', url: '/inquiry' }, { label: 'Help', url: '#' }, { label: 'Sitemap', url: '#' }], 
    policiesLinks: [{ label: 'Disclaimer and Policies', url: '#' }],
    title: defaultContact.title, officeAddress: defaultContact.officeAddress, phoneNumbers: defaultContact.phoneNumbers, emails: defaultContact.emails,
    heroTitle: defaultInquiry.heroTitle, heroSubtitle: defaultInquiry.heroSubtitle, description: defaultInquiry.description,
    benefit1Title: defaultInquiry.benefit1Title, benefit1Desc: defaultInquiry.benefit1Desc, benefit2Title: defaultInquiry.benefit2Title, benefit2Desc: defaultInquiry.benefit2Desc,
  });

  useEffect(() => {
    setDbLoaded(false);
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`admin_website_data_${mode}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.marqueeText || (parsed.notices && parsed.notices.length > 0) || (parsed.quickLinks && parsed.quickLinks.length > 0) || parsed.heroTitle || parsed.heading || parsed.title)) {
            setData((prev: any) => ({ ...prev, ...parsed }));
            setLoading(false); // Unblock UI early if cache is available
          }
        }
      } catch (e) {}
    }
  }, [mode]);

  // Local states for adding new items
  const [newNotice, setNewNotice] = useState({ text: '', isNew: true });
  const [newMinister, setNewMinister] = useState({ name: '', title: '', image: '' });
  const [newMainLabel, setNewMainLabel] = useState('');
  const [newSubLink, setNewSubLink] = useState({ parentIdx: -1, name: '', fileUrl: '' });
  const [newAboutLink, setNewAboutLink] = useState({ label: '', url: '' });
  const [newSupportLink, setNewSupportLink] = useState({ label: '', url: '' });
  const [newPolicyLink, setNewPolicyLink] = useState({ label: '', url: '' });

  const [uploadingSubLinkFile, setUploadingSubLinkFile] = useState(false);
  const [newSuccessStory, setNewSuccessStory] = useState({ name: '', role: '', company: '', year: '', image: '' });
  const [newRelatedVideo, setNewRelatedVideo] = useState({ url: '', description: '' });

  // New section states
  const [newHigherEd, setNewHigherEd] = useState({ title: '', description: '', link: '' });
  const [newApprenticeship, setNewApprenticeship] = useState({ title: '', company: '', description: '', link: '' });
  const [newEntrepreneurship, setNewEntrepreneurship] = useState({ title: '', description: '', link: '' });
  const [newCourse, setNewCourse] = useState({ name: '', duration: '', description: '', image: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', course: '', text: '', rating: '5', image: '' });
  const [newAchievement, setNewAchievement] = useState({ title: '', metric: '', description: '' });
  const [newQuote, setNewQuote] = useState({ text: '', theme: '' });
  const [newInstitute, setNewInstitute] = useState({ name: '', location: '' });
  const [newRecognition, setNewRecognition] = useState({ name: '', imageUrl: '' });

  const [showMenu, setShowMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified editing state
  const [editingContext, setEditingContext] = useState<{ field: string, index: number, subIndex?: number } | null>(null);
  const [editPayload, setEditPayload] = useState<any>(null);

  const startEdit = (field: string, index: number, item: any, subIndex?: number) => {
    setEditingContext({ field, index, subIndex });
    setEditPayload({ ...item });
  };

  const saveEdit = async () => {
    if (!dbLoaded) {
      alert('Database is still synchronizing. Please wait a moment before saving edits.');
      return;
    }
    if (!editingContext || !editPayload) return;
    const { field, index, subIndex } = editingContext;
    const currentItems = [...(data[field] || [])];

    if (subIndex !== undefined && field === 'quickLinks') {
      const updatedSubLinks = [...currentItems[index].subLinks];
      updatedSubLinks[subIndex] = { ...updatedSubLinks[subIndex], ...editPayload };
      currentItems[index] = { ...currentItems[index], subLinks: updatedSubLinks };
    } else {
      currentItems[index] = { ...currentItems[index], ...editPayload };
    }

    const updatedData = { ...data, [field]: currentItems };
    setData(updatedData);
    setEditingContext(null);
    setEditPayload(null);

    const { courses, ...safeUpdatedData } = updatedData;
    // Auto-publish edit immediately without blocking UI
    update(ref(realtimeDb, `settings/website/${mode}`), {
      ...safeUpdatedData,
      lastPublished: new Date().toISOString()
    }).catch(err => {
      console.error('Auto-save edit failed:', err);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) { setUploadingImage(false); return; }
          const fileRef = storageRef(storage, `settings/website/ministers/${Date.now()}.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          uploadTask.on('state_changed', null,
            (error) => { console.error('Upload failed', error); setUploadingImage(false); },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setNewMinister((prev) => ({ ...prev, image: url }));
              setUploadingImage(false);
            }
          );
        }, 'image/jpeg', 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubLinkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    setUploadingSubLinkFile(true);

    const fileRef = storageRef(storage, `settings/website/quickLinks/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('File upload failed:', error);
        alert('Failed to upload file.');
        setUploadingSubLinkFile(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setNewSubLink(prev => ({ ...prev, fileUrl: downloadURL }));
        setUploadingSubLinkFile(false);
      }
    );
  };

  const [uploadingNoticeFile, setUploadingNoticeFile] = useState(false);
  const handleNoticeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    setUploadingNoticeFile(true);

    const fileRef = storageRef(storage, `settings/website/notices/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      null,
      (error) => {
        console.error('File upload failed:', error);
        alert('Failed to upload file.');
        setUploadingNoticeFile(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setNewNotice(prev => ({ ...prev, fileUrl: downloadURL }));
        setUploadingNoticeFile(false);
      }
    );
  };

  const [uploadingStoryImage, setUploadingStoryImage] = useState(false);
  const handleStoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStoryImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) { setUploadingStoryImage(false); return; }
          const fileRef = storageRef(storage, `settings/website/successStories/${Date.now()}.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          uploadTask.on('state_changed', null,
            (error) => { console.error('Upload failed', error); setUploadingStoryImage(false); },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setNewSuccessStory(prev => ({ ...prev, image: url }));
              setUploadingStoryImage(false);
            }
          );
        }, 'image/jpeg', 0.8);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleInspirationImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const fileRef = storageRef(storage, `settings/website/achievements/${Date.now()}.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          uploadTask.on('state_changed', null,
            (error) => { console.error('Upload failed', error); },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setData((prev: any) => ({ ...prev, inspirationImage: url }));
            }
          );
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRoleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const fileRef = storageRef(storage, `settings/website/roles/${field}_${Date.now()}.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          uploadTask.on('state_changed', null,
            (error) => { console.error('Upload failed', error); },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setData((prev: any) => ({ ...prev, [field]: url }));
            }
          );
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRecognitionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const fileRef = storageRef(storage, `settings/website/recognitions/${Date.now()}.png`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          uploadTask.on('state_changed', null,
            (error) => { console.error('Upload failed', error); },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setNewRecognition(prev => ({ ...prev, imageUrl: url }));
            }
          );
        }, 'image/png');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleEditRecognitionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const fileRef = storageRef(storage, `settings/website/recognitions/edit_${Date.now()}.png`);
          const uploadTask = uploadBytesResumable(fileRef, blob);
          uploadTask.on('state_changed', null,
            (error) => { console.error('Upload failed', error); },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              setEditPayload((prev: any) => ({ ...prev, imageUrl: url }));
            }
          );
        }, 'image/png');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {

    const normalizeVal = (val: any) => ({
      ...val,
      marqueeText: val.marqueeText || '',
      notices: val.notices || [],
      ministers: val.ministers || [],
      quickLinks: val.quickLinks || [],
      successStories: val.successStories || [],
      relatedVideos: val.relatedVideos || [],
      stats: val.stats || [],
      higherEducation: (val.higherEducation && val.higherEducation.length > 0) ? val.higherEducation.map((h: any) => ({ ...h, title: h.title || h.name || '', description: h.description || h.subtitle || '' })) : [],
      apprenticeships: (val.apprenticeships && val.apprenticeships.length > 0) ? val.apprenticeships.map((a: any) => ({ ...a, title: a.title || a.name || '', description: a.description || '' })) : [],
      entrepreneurship: (val.entrepreneurship && val.entrepreneurship.length > 0) ? val.entrepreneurship.map((e: any) => ({ ...e, title: e.title || e.name || '', description: e.description || '' })) : [],
      courses: val.courses || [],
      testimonials: val.testimonials || [],
      achievements: val.achievements || [],
      aboutLinks: val.aboutLinks || [{ label: 'About MIT PARADH', url: '/about' }, { label: 'Board of Directors', url: '/about#leadership' }],
      supportLinks: val.supportLinks || [{ label: 'Contact Us', url: '/contact' }, { label: 'Inquiry Us', url: '/inquiry' }, { label: 'Help', url: '#' }, { label: 'Sitemap', url: '#' }],
      policiesLinks: val.policiesLinks || [{ label: 'Disclaimer and Policies', url: '#' }],
      aboutHeading: val.aboutHeading || 'About Us',
      supportHeading: val.supportHeading || 'Support',
      policiesHeading: val.policiesHeading || 'Policies',
      heading: val.heading || '',
      description: val.description || '',
      heroTitle: val.heroTitle || '',
      heroSubtitle: val.heroSubtitle || '',
      inspirationHeading: val.inspirationHeading || '',
      inspirationText: val.inspirationText || '',
      quotes: val.quotes || [],
      chairmanName: val.chairmanName || '',
      chairmanDesignation: val.chairmanDesignation || '',
      chairmanMessage: val.chairmanMessage || '',
      secretaryName: val.secretaryName || '',
      secretaryDesignation: val.secretaryDesignation || '',
      secretaryMessage: val.secretaryMessage || '',
      ceoName: val.ceoName || '',
      ceoDesignation: val.ceoDesignation || '',
      ceoMessage: val.ceoMessage || '',
      chairmanImage: val.chairmanImage || '',
      secretaryImage: val.secretaryImage || '',
      ceoImage: val.ceoImage || '',
      inspirationImage: val.inspirationImage || '',
      institutes: val.institutes || [],
      recognitions: val.recognitions || [],
      title: val.title || '',
      officeAddress: val.officeAddress || '',
      phoneNumbers: val.phoneNumbers || '',
      emails: val.emails || '',
      enquiryEmail: val.enquiryEmail || '',
      benefit1Title: val.benefit1Title || '',
      benefit1Desc: val.benefit1Desc || '',
      benefit2Title: val.benefit2Title || '',
      benefit2Desc: val.benefit2Desc || '',
      sansthaName: val.sansthaName || '',
      instituteName: val.instituteName || '',
      facebookUrl: val.facebookUrl || '',
      instagramUrl: val.instagramUrl || '',
      copyrightText: mode === 'footer'
        ? ((!val.copyrightText || val.copyrightText === 'New server' || val.copyrightText.includes('MAHAVISHNU'))
            ? '© MAHALAXMI NURSING AND TECHNICAL INSTITUTE PARADH. All Rights Reserved.'
            : val.copyrightText)
        : (val.copyrightText || ''),
      totalVisitors: val.totalVisitors || '',
      todayCount: val.todayCount || '',
      lastUpdated: val.lastUpdated || '',
    });

    const dataRef = ref(realtimeDb, `settings/website/${mode}`);

    // First: one-time instant fetch so fields populate immediately
    get(dataRef).then((snapshot) => {
      if (snapshot.exists()) {
        const normalized = normalizeVal(snapshot.val());
        setData(normalized);
        try {
          const cacheData = cleanDataForCache(normalized);
          if (cacheData && cacheData.courses) delete cacheData.courses; // Don't cache bloated courses array
          localStorage.setItem(`admin_website_data_${mode}`, JSON.stringify(cacheData));
        } catch (e) {}
      }
      setDbLoaded(true);
      setLoading(false);
    }).catch(() => {
      setDbLoaded(true);
      setLoading(false);
    });

    // Then: subscribe for live updates
    const unsubscribe = onValue(dataRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const normalized = normalizeVal(snapshot.val());
          setData(normalized);
          setDbLoaded(true);
          try {
            const cacheData = cleanDataForCache(normalized);
            if (cacheData && cacheData.courses) delete cacheData.courses; // Don't cache bloated courses array
            localStorage.setItem(`admin_website_data_${mode}`, JSON.stringify(cacheData));
          } catch (e) {}
        } else {
          setDbLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load website settings', err);
        setDbLoaded(true);
      }
    });

    return () => unsubscribe();
  }, [mode]);

  const handlePublish = async () => {
    if (loading) {
      alert('Please wait for data to load before publishing to avoid overwriting live data.');
      return;
    }
    if (!dbLoaded) {
      alert('Please wait for database synchronization to finish before publishing.');
      return;
    }
    setSaving(true);
    try {
      let publishData = { ...data };
      if (mode === 'footer') {
        const addresses = data.addresses || (data.address ? [data.address] : []);
        const contactNumbers = data.contactNumbers || (data.contactNumber ? [data.contactNumber] : []);
        const emails = data.emails || (data.email ? [data.email] : []);
        const branches = data.branches || (() => {
          const merged = [];
          const maxLen = Math.max(addresses.length, contactNumbers.length, emails.length);
          for (let i = 0; i < maxLen; i++) {
            merged.push({
              name: '',
              address: addresses[i] || '',
              contactNumber: contactNumbers[i] || '',
              email: emails[i] || ''
            });
          }
          if (merged.length === 0) {
            merged.push({ name: '', address: '', contactNumber: '', email: '' });
          }
          return merged;
        })();

        publishData = {
          ...publishData,
          branches: branches.map((b: any) => ({
            name: b.name || '',
            address: b.address || '',
            contactNumber: b.contactNumber || '',
            email: b.email || ''
          })),
          addresses: branches.map((b: any) => b.address || ''),
          contactNumbers: branches.map((b: any) => b.contactNumber || ''),
          emails: branches.map((b: any) => b.email || ''),
          address: branches[0]?.address || '',
          contactNumber: branches[0]?.contactNumber || '',
          email: branches[0]?.email || ''
        };
      }

      const { courses, ...safePublishData } = publishData;
      // Non-blocking save
      update(ref(realtimeDb, `settings/website/${mode}`), {
        ...safePublishData,
        lastPublished: new Date().toISOString()
      }).then(() => {
        alert('Content published successfully to the live website!');
      }).catch(error => {
        console.error('Error publishing content:', error);
        alert('Failed to publish content.');
      }).finally(() => {
        setSaving(false);
      });
    } catch (error) {
      console.error('Error preparing publish data:', error);
      alert('Failed to prepare content for publishing.');
      setSaving(false);
    }
  };

  const addItem = (field: string, item: any) => {
    const currentItems = data[field] || [];
    if (field === 'notices') {
      setData({ ...data, [field]: [item, ...currentItems] });
    } else {
      setData({ ...data, [field]: [...currentItems, item] });
    }
  };

  const removeItem = async (field: string, index: number) => {
    if (!dbLoaded) {
      alert('Database is still synchronizing. Please wait a moment before deleting items.');
      return;
    }
    const currentItems = [...(data[field] || [])];
    currentItems.splice(index, 1);
    const updatedData = { ...data, [field]: currentItems };
    setData(updatedData);

    const { courses, ...safeUpdatedData } = updatedData;
    // Auto-publish deletion immediately without blocking UI
    update(ref(realtimeDb, `settings/website/${mode}`), {
      ...safeUpdatedData,
      lastPublished: new Date().toISOString()
    }).catch(err => {
      console.error('Auto-save deletion failed:', err);
    });
  };



  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="bg-[#002147] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 sm:gap-8 text-left">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-xs sm:text-[13px] font-normal capitalize tracking-tight">
                <Zap size={14} className="text-[#00a5a5]" /> Live Website Editor
              </div>
              {dbLoaded ? (
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-[13px] font-bold text-emerald-400 capitalize tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Synced with Live Server
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs sm:text-[13px] font-bold text-amber-400 capitalize tracking-tight">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> Synchronizing latest data...
                </div>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter capitalize leading-tight">
              {mode.replace(/-/g, ' ')} Page Setup
            </h2>
            <p className="text-xs sm:text-sm font-normal text-white/60">Configure your public portal content and publish updates in real-time.</p>
          </div>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-[11px] font-black capitalize tracking-tight bg-[#00a5a5] text-white hover:bg-white hover:text-[#002147] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shrink-0"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Globe size={18} />}
            Publish Changes
          </button>
        </div>
      </div>

      {mode === 'home' && (
        <>
          <div className="flex justify-end mb-2 relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-[#00a5a5] hover:bg-slate-50 transition-colors"
            >
              <Menu size={20} />
            </button>
            {showMenu && (
              <div className="absolute top-14 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in slide-in-from-top-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 mb-1 border-b border-slate-100">Quick Navigation</div>
                {[
                  { id: 'section-header', label: 'Header Settings' },
                  { id: 'section-announcement', label: 'Home Page Announcement' },
                  { id: 'section-quicklinks', label: 'Quick Navigation Links' },
                  { id: 'section-notices', label: 'Important Notices' },
                  { id: 'section-ministers', label: 'Institutional Leadership' },
                  { id: 'section-success', label: 'Board Success Stories' },
                  { id: 'section-videos', label: 'Related Videos' },
                  { id: 'section-highered', label: 'Higher Education' },
                  { id: 'section-apprenticeships', label: 'Apprenticeships & Internships' },
                  { id: 'section-entrepreneurship', label: 'Entrepreneurship' },
                  { id: 'section-courses', label: 'Courses' },
                  { id: 'section-testimonials', label: 'Testimonials' },
                  { id: 'section-achievements', label: 'Our Achievements' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-[13px] font-bold text-slate-700 hover:text-[#00a5a5] transition-colors flex items-center justify-between group"
                  >
                    {item.label}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Header Settings */}
            <section id="section-header" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6 lg:col-span-2">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Header Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Helpline Number</label>
                  <input
                    type="text"
                    value={data.headerHelpline || ''}
                    onChange={(e) => setData({ ...data, headerHelpline: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    placeholder="e.g. 1800-456-7890"
                  />
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Displayed in the top right corner of the public website header.
                  </div>
                </div>
              </div>
            </section>

            {/* Announcement (Input Box) */}
            <section id="section-announcement" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6 lg:col-span-2">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                  <Megaphone size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Home Page Announcement</h3>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-[#00a5a5]">
                    <Type size={18} />
                  </div>
                  <input
                    type="text"
                    value={data.marqueeText || ''}
                    onChange={(e) => setData({ ...data, marqueeText: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                    placeholder="Enter announcement text to display in the marquee..."
                  />
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                    <CheckCircle2 size={12} className="text-emerald-500" /> This text will scroll across the home page announcement bar.
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Navigation Links */}
            <section id="section-quicklinks" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                  <ExternalLink size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Quick Navigation Links</h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input
                    placeholder="Main Label (e.g. Student Resources)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                    value={newMainLabel}
                    onChange={(e) => setNewMainLabel(e.target.value)}
                  />
                  <button
                    onClick={() => { if (newMainLabel) { addItem('quickLinks', { label: newMainLabel, subLinks: [] }); setNewMainLabel(''); } }}
                    className="bg-[#002147] text-white px-6 py-3 rounded-xl hover:bg-[#00a5a5] transition-colors self-end flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Main Label
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {(data.quickLinks || []).map((link: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        {editingContext?.field === 'quickLinks' && editingContext.index === idx && editingContext.subIndex === undefined ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-sm font-black text-[#002147] uppercase"
                              value={editPayload.label}
                              onChange={(e) => setEditPayload({ ...editPayload, label: e.target.value })}
                            />
                            <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600"><Check size={16} /></button>
                            <button onClick={() => setEditingContext(null)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-[#002147] uppercase tracking-tight">{link.label}</span>
                        )}
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit('quickLinks', idx, link)} className="text-amber-500 hover:text-amber-600 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => removeItem('quickLinks', idx)} className="text-red-500 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Add Sub-link form */}
                      <div className="flex flex-col gap-2 bg-white border border-slate-300 rounded-xl px-3 py-3">
                        <input
                          placeholder="Sub Label Name"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg outline-none focus:border-[#00a5a5]"
                          value={newSubLink.parentIdx === idx ? newSubLink.name : ''}
                          onChange={(e) => setNewSubLink({ parentIdx: idx, name: e.target.value, fileUrl: newSubLink.parentIdx === idx ? newSubLink.fileUrl : '' })}
                        />
                        <div className="flex gap-2 items-center">
                          <input
                            placeholder="Enter URL Link..."
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold"
                            value={newSubLink.parentIdx === idx ? (newSubLink.fileUrl?.startsWith('data:') ? '[Uploaded Document/File]' : newSubLink.fileUrl) : ''}
                            onChange={(e) => {
                              if (e.target.value === '[Uploaded Document/File]') return;
                              setNewSubLink(prev => ({ ...prev, parentIdx: idx, fileUrl: e.target.value }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-400">OR</span>
                          <input
                            type="file"
                            accept="application/pdf, image/*"
                            onChange={(e) => { setNewSubLink(prev => ({ ...prev, parentIdx: idx })); handleSubLinkFileUpload(e); }}
                            disabled={uploadingSubLinkFile}
                            className="text-xs w-48 text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                          />
                          <button
                            onClick={() => {
                              if (newSubLink.parentIdx === idx && newSubLink.name && newSubLink.fileUrl) {
                                const updatedLinks = [...data.quickLinks];
                                updatedLinks[idx] = { ...updatedLinks[idx], subLinks: [...(updatedLinks[idx].subLinks || []), { name: newSubLink.name, fileUrl: newSubLink.fileUrl }] };
                                setData({ ...data, quickLinks: updatedLinks });
                                setNewSubLink({ parentIdx: -1, name: '', fileUrl: '' });
                              }
                            }}
                            className="bg-[#00a5a5] text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 font-bold text-xs"
                            disabled={newSubLink.parentIdx === idx && (!newSubLink.name || !newSubLink.fileUrl)}
                          >
                            <Plus size={14} /> Add
                          </button>
                        </div>
                      </div>

                      {/* List Sub-links */}
                      {link.subLinks && link.subLinks.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {link.subLinks.map((sub: any, sIdx: number) => (
                            <div key={sIdx} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg">
                              {editingContext?.field === 'quickLinks' && editingContext.index === idx && editingContext.subIndex === sIdx ? (
                                <div className="flex-1 flex flex-col gap-2 mr-2">
                                  <input
                                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-bold text-slate-700"
                                    value={editPayload.name}
                                    onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })}
                                    placeholder="Name"
                                  />
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <input
                                      className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-bold text-slate-700"
                                      value={editPayload.fileUrl?.startsWith('data:') ? '[Uploaded Document/File]' : (editPayload.fileUrl || '')}
                                      onChange={(e) => {
                                        if (e.target.value === '[Uploaded Document/File]') return;
                                        setEditPayload({ ...editPayload, fileUrl: e.target.value });
                                      }}
                                      placeholder="URL Link"
                                    />
                                    <input
                                      type="file"
                                      accept="application/pdf, image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 2 * 1024 * 1024) {
                                          alert('File size must be less than 2MB');
                                          return;
                                        }
                                        const fileRef = storageRef(storage, `settings/website/quickLinks/${Date.now()}_${file.name}`);
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
                                            setEditPayload((prev: any) => ({ ...prev, fileUrl: downloadURL }));
                                          }
                                        );
                                      }}
                                      className="w-full sm:w-auto text-[9px] text-slate-500 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-slate-100 cursor-pointer"
                                    />
                                    <div className="flex items-center gap-2 ml-auto">
                                      <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600"><Check size={16} /></button>
                                      <button onClick={() => setEditingContext(null)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col min-w-0 pr-4">
                                  <span className="text-[11px] font-bold text-slate-700 truncate">{sub.name}</span>
                                  <span className="text-[9px] text-[#00a5a5] font-bold truncate" title={sub.fileUrl}>
                                    {sub.fileUrl?.startsWith('data:') ? '[Uploaded Document/File]' : (sub.fileUrl || 'No Link Attached')}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => startEdit('quickLinks', idx, sub, sIdx)} className="text-amber-500 hover:text-amber-600 ml-2">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => {
                                  const updatedLinks = [...data.quickLinks];
                                  updatedLinks[idx].subLinks.splice(sIdx, 1);
                                  setData({ ...data, quickLinks: updatedLinks });
                                }} className="text-red-500 hover:text-red-600">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Important Notices */}
            <section id="section-notices" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Important Notices (Notes)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <input
                    placeholder="Notice Content..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold"
                    value={newNotice.text}
                    onChange={(e) => setNewNotice({ ...newNotice, text: e.target.value })}
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="Enter URL Link..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold"
                      value={(newNotice as any).fileUrl?.startsWith('data:') ? '[Uploaded Document/File]' : ((newNotice as any).fileUrl || '')}
                      onChange={(e) => {
                        if (e.target.value === '[Uploaded Document/File]') return;
                        setNewNotice({ ...(newNotice as any), fileUrl: e.target.value });
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">OR</span>
                    <div className="flex flex-col items-center">
                      <input
                        type="file"
                        accept="application/pdf, image/*"
                        onChange={handleNoticeFileUpload}
                        disabled={uploadingNoticeFile}
                        className="text-xs w-48 text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                      />
                      {uploadingNoticeFile && <span className="text-[10px] font-bold text-amber-500">Processing...</span>}
                    </div>
                    <button
                      onClick={() => { if (newNotice.text) { addItem('notices', newNotice); setNewNotice({ text: '', isNew: true, fileUrl: '' } as any); } }}
                      disabled={uploadingNoticeFile}
                      className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-colors ${uploadingNoticeFile ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#002147] text-white hover:bg-[#00a5a5]'}`}
                    >
                      <Plus size={18} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {(data.notices || []).map((notice: any, idx: number) => (
                    <div key={idx} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm hover:border-[#00a5a5] transition-colors gap-2">
                      <div className="flex items-center gap-4">
                        {/* Icons rendered first as requested */}
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEdit('notices', idx, notice)} className="text-amber-500 hover:text-amber-600">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => removeItem('notices', idx)} className="text-red-500 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {editingContext?.field === 'notices' && editingContext.index === idx ? (
                          <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <input
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800"
                              value={editPayload.text}
                              onChange={(e) => setEditPayload({ ...editPayload, text: e.target.value })}
                              placeholder="Notice text"
                            />
                            <div className="flex gap-2 items-center">
                              <input
                                className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-500"
                                value={editPayload.fileUrl?.startsWith('data:') ? '[Uploaded Document/File]' : (editPayload.fileUrl || '')}
                                onChange={(e) => {
                                  if (e.target.value === '[Uploaded Document/File]') return;
                                  setEditPayload({ ...editPayload, fileUrl: e.target.value });
                                }}
                                placeholder="URL / File Link"
                              />
                              <input
                                type="file"
                                accept="application/pdf, image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert('File size must be less than 2MB');
                                    return;
                                  }
                                  const fileRef = storageRef(storage, `settings/website/notices/${Date.now()}_${file.name}`);
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
                                      setEditPayload((prev: any) => ({ ...prev, fileUrl: downloadURL }));
                                    }
                                  );
                                }}
                                className="w-auto text-[9px] text-slate-500 file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:bg-slate-100 cursor-pointer"
                              />
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button onClick={saveEdit} className="flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 px-3 py-1.5 rounded hover:bg-emerald-600"><Check size={12} /> Save</button>
                              <button onClick={() => setEditingContext(null)} className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded hover:bg-slate-200"><X size={12} /> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{notice.text}</p>
                            {notice.fileUrl && (
                              <span className="text-[10px] font-bold text-[#00a5a5] truncate">
                                Link: {notice.fileUrl.startsWith('data:') ? '[Uploaded Document/File]' : notice.fileUrl}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Institutional Leadership (Chief Name) */}
            <section id="section-ministers" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Institutional Leadership (Chiefs)</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl px-4 py-2">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Photo:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      ref={fileInputRef}
                      className="text-xs w-full text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                    {uploadingImage && <div className="text-xs font-bold text-[#00a5a5]">Uploading...</div>}
                    {newMinister.image && !uploadingImage && (
                      <div className="relative shrink-0">
                        <img src={newMinister.image} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        <button
                          onClick={() => {
                            setNewMinister({ ...newMinister, image: '' });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-[2px] shadow-sm hover:bg-red-600 z-10"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    placeholder="Full Name (e.g. Shri. Devendra Fadnavis)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                    value={newMinister.name}
                    onChange={(e) => setNewMinister({ ...newMinister, name: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Position Title (e.g. Hon' Chief Minister)"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                      value={newMinister.title}
                      onChange={(e) => setNewMinister({ ...newMinister, title: e.target.value })}
                    />
                    <button
                      onClick={() => {
                        if (newMinister.name) {
                          addItem('ministers', newMinister);
                          setNewMinister({ name: '', title: '', image: '' });
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }}
                      className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"
                    >
                      <Plus size={18} /> Add
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {(data.ministers || []).map((min: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden shrink-0">
                        {min.image ? <img src={min.image} alt={min.name} className="w-full h-full object-cover" /> : <User size={18} />}
                      </div>
                      {editingContext?.field === 'ministers' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-black text-slate-800"
                            value={editPayload.name}
                            onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })}
                          />
                          <input
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold text-slate-400 uppercase"
                            value={editPayload.title}
                            onChange={(e) => setEditPayload({ ...editPayload, title: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-[11px] font-black text-slate-800 truncate">{min.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{min.title}</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'ministers' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('ministers', idx, min)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('ministers', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Success Stories of Board */}
            <section id="section-success" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                  <Star size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Board Success Stories</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input placeholder="Student Name" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newSuccessStory.name} onChange={(e) => setNewSuccessStory({ ...newSuccessStory, name: e.target.value })} />
                  <input placeholder="Role" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newSuccessStory.role} onChange={(e) => setNewSuccessStory({ ...newSuccessStory, role: e.target.value })} />
                  <input placeholder="Company" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newSuccessStory.company} onChange={(e) => setNewSuccessStory({ ...newSuccessStory, company: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Year" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newSuccessStory.year} onChange={(e) => setNewSuccessStory({ ...newSuccessStory, year: e.target.value })} />
                  </div>
                  <div className="col-span-2 flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleStoryImageUpload(e)}
                      disabled={uploadingStoryImage}
                      className="flex-1 text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:border file:border-slate-300 file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
                    />
                    <button onClick={() => { if (newSuccessStory.name) { addItem('successStories', newSuccessStory); setNewSuccessStory({ name: '', role: '', company: '', year: '', image: '' }); } }} className="bg-[#002147] text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-[#00a5a5] transition-colors h-full"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {(data.successStories || []).map((story: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0 overflow-hidden">
                        {story.image ? <img src={story.image} alt={story.name} className="w-full h-full object-cover" /> : <CheckCircle2 size={16} />}
                      </div>
                      {editingContext?.field === 'successStories' && editingContext.index === idx ? (
                        <div className="flex-1 grid grid-cols-2 gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[10px] font-bold" value={editPayload.name} onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })} placeholder="Name" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[10px] font-bold" value={editPayload.role} onChange={(e) => setEditPayload({ ...editPayload, role: e.target.value })} placeholder="Role" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[10px] font-bold" value={editPayload.company} onChange={(e) => setEditPayload({ ...editPayload, company: e.target.value })} placeholder="Company" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[10px] font-bold" value={editPayload.year} onChange={(e) => setEditPayload({ ...editPayload, year: e.target.value })} placeholder="Year" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-xs font-black text-slate-800">{story.name}</p>
                          <p className="text-[10px] font-bold text-[#00a5a5] uppercase">{story.role} at {story.company} ({story.year})</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'successStories' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('successStories', idx, story)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('successStories', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Related Videos */}
            <section id="section-videos" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100">
                  <Play size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Related Videos</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input placeholder="YouTube Video URL" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newRelatedVideo.url} onChange={(e) => setNewRelatedVideo({ ...newRelatedVideo, url: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Description (e.g. MSBSVET च्या कार्याबाबत)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newRelatedVideo.description} onChange={(e) => setNewRelatedVideo({ ...newRelatedVideo, description: e.target.value })} />
                    <button onClick={() => { if (newRelatedVideo.url && newRelatedVideo.description) { addItem('relatedVideos', newRelatedVideo); setNewRelatedVideo({ url: '', description: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-[#00a5a5] transition-colors"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {(data.relatedVideos || []).map((video: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
                        <Play fill="currentColor" size={14} />
                      </div>
                      {editingContext?.field === 'relatedVideos' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-16">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[10px] font-bold text-slate-500" value={editPayload.url} onChange={(e) => setEditPayload({ ...editPayload, url: e.target.value })} placeholder="URL" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-black text-slate-800" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{video.url}</p>
                          <p className="text-xs font-black text-slate-800 truncate">{video.description}</p>
                        </div>
                      )}
                      <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'relatedVideos' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check size={16} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('relatedVideos', idx, video)} className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button onClick={() => removeItem('relatedVideos', idx)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Higher Education Opportunities */}
            <section id="section-highered" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Higher Education Opportunities</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input placeholder="Opportunity Title" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newHigherEd.title} onChange={(e) => setNewHigherEd({ ...newHigherEd, title: e.target.value })} />
                  <input placeholder="Description" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newHigherEd.description} onChange={(e) => setNewHigherEd({ ...newHigherEd, description: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Link (URL)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newHigherEd.link} onChange={(e) => setNewHigherEd({ ...newHigherEd, link: e.target.value })} />
                    <button onClick={() => { if (newHigherEd.title) { addItem('higherEducation', newHigherEd); setNewHigherEd({ title: '', description: '', link: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-[#00a5a5] transition-colors"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {(data.higherEducation || []).map((opp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      {editingContext?.field === 'higherEducation' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.title} onChange={(e) => setEditPayload({ ...editPayload, title: e.target.value })} placeholder="Title" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.link} onChange={(e) => setEditPayload({ ...editPayload, link: e.target.value })} placeholder="Link" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-xs font-black text-slate-800">{opp.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{opp.description}</p>
                          {opp.link && <p className="text-[9px] font-bold text-[#00a5a5] truncate">{opp.link}</p>}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'higherEducation' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('higherEducation', idx, opp)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('higherEducation', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Apprenticeship & Internships */}
            <section id="section-apprenticeships" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Apprenticeship, Internship & Jobs</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input placeholder="Opportunity Title (e.g. Intern)" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newApprenticeship.title} onChange={(e) => setNewApprenticeship({ ...newApprenticeship, title: e.target.value })} />
                  <input placeholder="Company / Organization" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newApprenticeship.company} onChange={(e) => setNewApprenticeship({ ...newApprenticeship, company: e.target.value })} />
                  <input placeholder="Description" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newApprenticeship.description} onChange={(e) => setNewApprenticeship({ ...newApprenticeship, description: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Link (URL)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newApprenticeship.link} onChange={(e) => setNewApprenticeship({ ...newApprenticeship, link: e.target.value })} />
                    <button onClick={() => { if (newApprenticeship.title) { addItem('apprenticeships', newApprenticeship); setNewApprenticeship({ title: '', company: '', description: '', link: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-[#00a5a5] transition-colors"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {(data.apprenticeships || []).map((opp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                        <Briefcase size={16} />
                      </div>
                      {editingContext?.field === 'apprenticeships' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.title} onChange={(e) => setEditPayload({ ...editPayload, title: e.target.value })} placeholder="Title" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.company} onChange={(e) => setEditPayload({ ...editPayload, company: e.target.value })} placeholder="Company" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.link} onChange={(e) => setEditPayload({ ...editPayload, link: e.target.value })} placeholder="Link" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-xs font-black text-slate-800">{opp.title}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{opp.company}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{opp.description}</p>
                          {opp.link && <p className="text-[9px] font-bold text-[#00a5a5] truncate">{opp.link}</p>}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'apprenticeships' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('apprenticeships', idx, opp)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('apprenticeships', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Entrepreneurship Opportunities */}
            <section id="section-entrepreneurship" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                  <Lightbulb size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Entrepreneurship Opportunities</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input placeholder="Program Title" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newEntrepreneurship.title} onChange={(e) => setNewEntrepreneurship({ ...newEntrepreneurship, title: e.target.value })} />
                  <input placeholder="Description" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newEntrepreneurship.description} onChange={(e) => setNewEntrepreneurship({ ...newEntrepreneurship, description: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Link (URL)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newEntrepreneurship.link} onChange={(e) => setNewEntrepreneurship({ ...newEntrepreneurship, link: e.target.value })} />
                    <button onClick={() => { if (newEntrepreneurship.title) { addItem('entrepreneurship', newEntrepreneurship); setNewEntrepreneurship({ title: '', description: '', link: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-[#00a5a5] transition-colors"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {(data.entrepreneurship || []).map((opp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                        <Lightbulb size={16} />
                      </div>
                      {editingContext?.field === 'entrepreneurship' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.title} onChange={(e) => setEditPayload({ ...editPayload, title: e.target.value })} placeholder="Title" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.link} onChange={(e) => setEditPayload({ ...editPayload, link: e.target.value })} placeholder="Link" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-xs font-black text-slate-800">{opp.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{opp.description}</p>
                          {opp.link && <p className="text-[9px] font-bold text-[#00a5a5] truncate">{opp.link}</p>}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'entrepreneurship' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('entrepreneurship', idx, opp)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('entrepreneurship', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Courses */}
            <section id="section-courses" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-[#002147]/5 rounded-xl flex items-center justify-center text-[#002147] border border-[#002147]/10">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Courses</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl px-4 py-2">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Image:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileRef = storageRef(storage, `settings/website/courses/${Date.now()}.jpg`);
                          const uploadTask = uploadBytesResumable(fileRef, file);
                          uploadTask.on('state_changed', null,
                            (error) => console.error('Upload failed', error),
                            async () => {
                              const url = await getDownloadURL(uploadTask.snapshot.ref);
                              setNewCourse(prev => ({ ...prev, image: url }));
                            }
                          );
                        }
                      }}
                      className="text-xs w-full text-slate-500"
                    />
                    {newCourse.image && (
                      <img src={newCourse.image} alt="Preview" className="w-8 h-8 rounded-lg object-cover border" />
                    )}
                  </div>
                  <input placeholder="Course Name" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} />
                  <input placeholder="Duration" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newCourse.duration} onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Description" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                    <button onClick={() => { if (newCourse.name) { addItem('courses', newCourse); setNewCourse({ name: '', duration: '', description: '', image: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {(data.courses || []).map((crs: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border overflow-hidden shrink-0">
                        {crs.image ? <img src={crs.image} alt={crs.name} className="w-full h-full object-cover" /> : <BookOpen size={18} />}
                      </div>
                      {editingContext?.field === 'courses' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-black" value={editPayload.name} onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })} placeholder="Course Name" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold" value={editPayload.duration} onChange={(e) => setEditPayload({ ...editPayload, duration: e.target.value })} placeholder="Duration" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-[11px] font-black text-slate-800 truncate">{crs.name}</p>
                          <p className="text-[9px] font-bold text-[#00a5a5] uppercase truncate">{crs.duration}</p>
                          <p className="text-[9px] font-bold text-slate-400 truncate">{crs.description}</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'courses' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('courses', idx, crs)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('courses', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section id="section-testimonials" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                  <MessageCircle size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Testimonials</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl px-4 py-2">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Photo:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileRef = storageRef(storage, `settings/website/testimonials/${Date.now()}_${file.name}`);
                          const uploadTask = uploadBytesResumable(fileRef, file);
                          uploadTask.on('state_changed', null,
                            (err) => console.error(err),
                            async () => {
                              const url = await getDownloadURL(uploadTask.snapshot.ref);
                              setNewTestimonial(prev => ({ ...prev, image: url }));
                            }
                          );
                        }
                      }}
                      className="text-xs w-full text-slate-500"
                    />
                    {newTestimonial.image && (
                      <img src={newTestimonial.image} alt="Preview" className="w-8 h-8 rounded-full object-cover border" />
                    )}
                  </div>
                  <input placeholder="Student Name" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newTestimonial.name} onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })} />
                  <input placeholder="Course / Position" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newTestimonial.course} onChange={(e) => setNewTestimonial({ ...newTestimonial, course: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Review / Testimonial Text" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newTestimonial.text} onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })} />
                    <button onClick={() => { if (newTestimonial.name) { addItem('testimonials', newTestimonial); setNewTestimonial({ name: '', course: '', text: '', rating: '5', image: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {(data.testimonials || []).map((tst: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border overflow-hidden shrink-0">
                        {tst.image ? <img src={tst.image} alt={tst.name} className="w-full h-full object-cover" /> : <User size={18} />}
                      </div>
                      {editingContext?.field === 'testimonials' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-black" value={editPayload.name} onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })} placeholder="Name" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold" value={editPayload.course} onChange={(e) => setEditPayload({ ...editPayload, course: e.target.value })} placeholder="Course" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold" value={editPayload.text} onChange={(e) => setEditPayload({ ...editPayload, text: e.target.value })} placeholder="Testimonial" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-[11px] font-black text-slate-800 truncate">{tst.name}</p>
                          <p className="text-[9px] font-bold text-[#00a5a5] uppercase truncate">{tst.course}</p>
                          <p className="text-[9px] font-bold text-slate-400 truncate">"{tst.text}"</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'testimonials' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('testimonials', idx, tst)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('testimonials', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Our Achievements */}
            <section id="section-achievements" className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                  <Trophy size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Our Achievements</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <input placeholder="Achievement Title (e.g. Total Placements)" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newAchievement.title} onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })} />
                  <input placeholder="Metric (e.g. 500+)" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newAchievement.metric} onChange={(e) => setNewAchievement({ ...newAchievement, metric: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="Description" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} />
                    <button onClick={() => { if (newAchievement.title) { addItem('achievements', newAchievement); setNewAchievement({ title: '', metric: '', description: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {(data.achievements || []).map((ach: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                        <Trophy size={16} />
                      </div>
                      {editingContext?.field === 'achievements' && editingContext.index === idx ? (
                        <div className="flex-1 flex flex-col gap-1 pr-14">
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.title} onChange={(e) => setEditPayload({ ...editPayload, title: e.target.value })} placeholder="Title" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.metric} onChange={(e) => setEditPayload({ ...editPayload, metric: e.target.value })} placeholder="Metric" />
                          <input className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                        </div>
                      ) : (
                        <div className="flex-1 truncate">
                          <p className="text-xs font-black text-slate-800">{ach.title}</p>
                          <p className="text-[12px] font-black text-[#00a5a5] uppercase">{ach.metric}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{ach.description}</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                        {editingContext?.field === 'achievements' && editingContext.index === idx ? (
                          <>
                            <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                            <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit('achievements', idx, ach)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button onClick={() => removeItem('achievements', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </>
      )}
      {mode === 'about' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
          {/* Section 1: Hero Banner */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Hero Banner Setup</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Hero Banner Title</label>
                <input
                  type="text"
                  value={data.heroTitle || ''}
                  onChange={(e) => setData({ ...data, heroTitle: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                  placeholder="Enter Hero title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Hero Banner Subtitle</label>
                <input
                  type="text"
                  value={data.heroSubtitle || ''}
                  onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                  placeholder="Enter Hero subtitle..."
                />
              </div>
            </div>
          </section>

          {/* Section 2: Address / Society Info */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">President / Society Address</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Address Section Heading</label>
                <input
                  type="text"
                  value={data.heading || ''}
                  onChange={(e) => setData({ ...data, heading: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                  placeholder="Enter Address heading..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Address Details / Text</label>
                <textarea
                  rows={6}
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                  placeholder="Enter Address description..."
                />
              </div>
            </div>
          </section>

          {/* Section 3: Our Inspiration Paragraphs */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Our Inspiration Section</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Inspiration Heading</label>
                <input
                  type="text"
                  value={data.inspirationHeading || ''}
                  onChange={(e) => setData({ ...data, inspirationHeading: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                  placeholder="Enter Inspiration heading..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Inspiration Paragraphs</label>
                <textarea
                  rows={12}
                  value={data.inspirationText || ''}
                  onChange={(e) => setData({ ...data, inspirationText: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] focus:ring-4 focus:ring-[#00a5a5]/10 transition-all"
                  placeholder="Enter multi-line paragraphs about the inspiration..."
                />
                <p className="text-[10px] text-slate-400 pl-1 font-semibold italic">Use line breaks to separate paragraphs on the website.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Inspiration Photo</label>
                <div className="flex items-center gap-4">
                  {data.inspirationImage && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-black shrink-0 bg-slate-100">
                      <img src={data.inspirationImage} alt="Inspiration" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInspirationImageUpload}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#002147] file:text-white hover:file:bg-[#00a5a5]"
                    />
                    <p className="text-[10px] text-slate-400 pl-1 font-semibold italic mt-1">Upload a portrait image (will be compressed automatically).</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Inspiration Quotes */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Quote size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Swami Vivekananda on Education Quotes</h3>
            </div>

            <div className="space-y-4">
              {/* Add quote input */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-4">
                <p className="text-xs font-black text-slate-800">Add New Quote</p>
                <input
                  placeholder="Quote Theme (e.g. True Education vs Information)"
                  className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                  value={newQuote.theme}
                  onChange={(e) => setNewQuote({ ...newQuote, theme: e.target.value })}
                />
                <div className="flex gap-2">
                  <textarea
                    placeholder="Enter Swamiji's Quote..."
                    rows={3}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                    value={newQuote.text}
                    onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                  />
                  <button
                    onClick={() => { if (newQuote.text && newQuote.theme) { addItem('quotes', newQuote); setNewQuote({ theme: '', text: '' }); } }}
                    className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
              </div>

              {/* Quotes list */}
              <div className="grid grid-cols-1 gap-4 mt-4">
                {(data.quotes || []).map((q: any, idx: number) => (
                  <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 relative group shadow-sm flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                      <Quote size={18} />
                    </div>
                    {editingContext?.field === 'quotes' && editingContext.index === idx ? (
                      <div className="flex-1 flex flex-col gap-2 pr-14">
                        <input className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold" value={editPayload.theme} onChange={(e) => setEditPayload({ ...editPayload, theme: e.target.value })} placeholder="Quote Theme" />
                        <textarea rows={3} className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold" value={editPayload.text} onChange={(e) => setEditPayload({ ...editPayload, text: e.target.value })} placeholder="Quote Text" />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-[#00a5a5] bg-[#00a5a5]/10 px-3 py-1 rounded-full uppercase tracking-wider">{q.theme}</span>
                        <p className="text-xs font-bold text-slate-600 italic mt-3">"{q.text}"</p>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex items-center gap-1 transition-opacity">
                      {editingContext?.field === 'quotes' && editingContext.index === idx ? (
                        <>
                          <button onClick={saveEdit} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                          <button onClick={() => setEditingContext(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                        </>
                      ) : (
                        <button onClick={() => startEdit('quotes', idx, q)} className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button onClick={() => removeItem('quotes', idx)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Leadership Messages Setup */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#002147] border border-indigo-100">
                <User size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Leadership Messages Setup</h3>
            </div>

            <div className="space-y-8 divide-y-2 divide-slate-100 pt-2">
              {/* Chairman */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Chairman Address Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Chairman Name</label>
                    <input
                      type="text"
                      value={data.chairmanName || ''}
                      onChange={(e) => setData({ ...data, chairmanName: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      placeholder="Shree Avinash Nandkishor Kulkarni"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Chairman Designation</label>
                    <input
                      type="text"
                      value={data.chairmanDesignation || ''}
                      onChange={(e) => setData({ ...data, chairmanDesignation: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      placeholder="Chairman Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Chairman Message Text</label>
                  <textarea
                    rows={6}
                    value={data.chairmanMessage || ''}
                    onChange={(e) => setData({ ...data, chairmanMessage: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    placeholder="Enter Chairman's message..."
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Chairman Photo</label>
                  <div className="flex items-center gap-4">
                    {data.chairmanImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-black shrink-0 bg-slate-100">
                        <img src={data.chairmanImage} alt="Chairman" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleRoleImageUpload(e, 'chairmanImage')}
                        className="w-full bg-slate-50 border-2 border-black rounded-2xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#002147] file:text-white hover:file:bg-[#00a5a5]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secretary */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Secretary Address Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Secretary Name</label>
                    <input
                      type="text"
                      value={data.secretaryName || ''}
                      onChange={(e) => setData({ ...data, secretaryName: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      placeholder="Prof.Aniket N. Kulkarni"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Secretary Designation</label>
                    <input
                      type="text"
                      value={data.secretaryDesignation || ''}
                      onChange={(e) => setData({ ...data, secretaryDesignation: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      placeholder="Secretary Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Secretary Message Text</label>
                  <textarea
                    rows={6}
                    value={data.secretaryMessage || ''}
                    onChange={(e) => setData({ ...data, secretaryMessage: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    placeholder="Enter Secretary's message..."
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Secretary Photo</label>
                  <div className="flex items-center gap-4">
                    {data.secretaryImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-black shrink-0 bg-slate-100">
                        <img src={data.secretaryImage} alt="Secretary" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleRoleImageUpload(e, 'secretaryImage')}
                        className="w-full bg-slate-50 border-2 border-black rounded-2xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#002147] file:text-white hover:file:bg-[#00a5a5]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CEO */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Vice Chairman Address Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Vice Chairman Name</label>
                    <input
                      type="text"
                      value={data.ceoName || ''}
                      onChange={(e) => setData({ ...data, ceoName: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      placeholder="Mr. Pravin T. Deshmukh"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Vice Chairman Designation</label>
                    <input
                      type="text"
                      value={data.ceoDesignation || ''}
                      onChange={(e) => setData({ ...data, ceoDesignation: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                      placeholder="Vice Chairman Mahavishnu G.V.V.S.B.S Dhamangaon (Dhad)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Vice Chairman Message Text</label>
                  <textarea
                    rows={6}
                    value={data.ceoMessage || ''}
                    onChange={(e) => setData({ ...data, ceoMessage: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-black rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                    placeholder="Enter Vice Chairman's message..."
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Vice Chairman Photo</label>
                  <div className="flex items-center gap-4">
                    {data.ceoImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-black shrink-0 bg-slate-100">
                        <img src={data.ceoImage} alt="Vice Chairman" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleRoleImageUpload(e, 'ceoImage')}
                        className="w-full bg-slate-50 border-2 border-black rounded-2xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#002147] file:text-white hover:file:bg-[#00a5a5]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Our Institutes Setup */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <School size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Our Institutes Setup</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-4">
                <p className="text-xs font-black text-slate-800">Add New Institute</p>
                <input
                  placeholder="Institute Name"
                  className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                  value={newInstitute.name}
                  onChange={(e) => setNewInstitute({ ...newInstitute, name: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Location/Address"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                    value={newInstitute.location}
                    onChange={(e) => setNewInstitute({ ...newInstitute, location: e.target.value })}
                  />
                  <button
                    onClick={() => { if (newInstitute.name && newInstitute.location) { addItem('institutes', newInstitute); setNewInstitute({ name: '', location: '' }); } }}
                    className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(data.institutes || []).map((inst: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex-1 mr-4">
                      <p className="text-[11px] font-black text-slate-800 uppercase leading-tight mb-1">{inst.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1"><MapPin size={10} className="text-[#00a5a5]" /> {inst.location}</p>
                    </div>
                    <button onClick={() => removeItem('institutes', idx)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 7: Recognition / Approvals Setup */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Star size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Recognition & Approvals Setup</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col gap-4">
                <p className="text-xs font-black text-slate-800">Add New Recognition / Logo</p>
                <input
                  placeholder="Organization Name (optional)"
                  className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold"
                  value={newRecognition.name}
                  onChange={(e) => setNewRecognition({ ...newRecognition, name: e.target.value })}
                />
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Upload Logo Image</label>
                    <input
                      type="file" accept="image/*"
                      onChange={handleRecognitionImageUpload}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#002147] file:text-white hover:file:bg-[#00a5a5]"
                    />
                  </div>
                  {newRecognition.imageUrl && (
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={newRecognition.imageUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <button
                    onClick={() => { if (newRecognition.imageUrl) { addItem('recognitions', newRecognition); setNewRecognition({ name: '', imageUrl: '' }); } }}
                    disabled={!newRecognition.imageUrl}
                    className="bg-[#002147] text-white px-6 py-3 h-full rounded-xl hover:bg-[#00a5a5] disabled:opacity-50 transition-colors flex items-center gap-2 font-bold text-sm shrink-0 w-full md:w-auto justify-center"
                  >
                    <Plus size={18} /> Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(data.recognitions || []).map((rec: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm relative group min-h-[200px]">
                    {editingContext?.field === 'recognitions' && editingContext.index === idx ? (
                      <div className="flex flex-col gap-3 w-full pt-6">
                        {editPayload?.imageUrl && (
                          <img src={editPayload.imageUrl} className="h-16 object-contain mx-auto" alt="Preview" />
                        )}
                        <input
                          type="file" accept="image/*"
                          onChange={handleEditRecognitionImageUpload}
                          className="w-full text-[10px] font-bold text-slate-800 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-slate-100"
                        />
                        <input
                          placeholder="Organization Name"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-center"
                          value={editPayload.name || ''}
                          onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })}
                        />
                        <div className="flex justify-center gap-2 mt-2">
                          <button onClick={saveEdit} className="p-2 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200"><Check size={16} /></button>
                          <button onClick={() => setEditingContext(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex items-center justify-center pt-4 w-full">
                          <img src={rec.imageUrl} alt={rec.name} className="max-h-[100px] max-w-full object-contain pointer-events-none" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 text-center mt-4 leading-tight break-words w-full px-2">
                          {rec.name || <span className="text-slate-300 italic">No Name</span>}
                        </p>
                        <div className="absolute top-3 right-3 flex gap-2 bg-white/90 backdrop-blur rounded-full p-1 shadow-md">
                          <button onClick={() => startEdit('recognitions', idx, rec)} className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => removeItem('recognitions', idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {mode === 'footer' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Layers size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Footer Identity & Socials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Sanstha Name</label>
                <input
                  type="text"
                  value={data.sansthaName || ''}
                  onChange={(e) => setData({ ...data, sansthaName: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Institute Name</label>
                <input
                  type="text"
                  value={data.instituteName || ''}
                  onChange={(e) => setData({ ...data, instituteName: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Facebook URL</label>
                <input
                  type="text"
                  value={data.facebookUrl || ''}
                  onChange={(e) => setData({ ...data, facebookUrl: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Instagram URL</label>
                <input
                  type="text"
                  value={data.instagramUrl || ''}
                  onChange={(e) => setData({ ...data, instagramUrl: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">YouTube URL</label>
                <input
                  type="text"
                  value={data.youtubeUrl || ''}
                  onChange={(e) => setData({ ...data, youtubeUrl: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </section>

          {/* Copyright Settings Card */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Copyright Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Copyright / Bottom Text</label>
                <input
                  type="text"
                  value={data.copyrightText || ''}
                  onChange={(e) => setData({ ...data, copyrightText: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  placeholder="e.g. All Rights Reserved."
                />
              </div>
            </div>
          </section>

          {/* Footer Link Sections */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                <LinkIcon size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Footer Links Management</h3>
            </div>

            {/* About Us Links */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <div className="relative flex items-center group">
                  <input
                    type="text"
                    value={data.aboutHeading || 'About Us'}
                    onChange={(e) => setData({ ...data, aboutHeading: e.target.value })}
                    className="text-md font-bold text-slate-800 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#00a5a5] outline-none hover:bg-slate-50 transition-colors px-1 py-0.5 pr-6"
                    placeholder="Column Heading (e.g. About Us)"
                  />
                  <Edit2 size={14} className="text-slate-400 absolute right-1 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <input placeholder="Link Label (e.g. About MIT PARADH)" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newAboutLink.label} onChange={(e) => setNewAboutLink({ ...newAboutLink, label: e.target.value })} />
                <div className="flex gap-2">
                  <input placeholder="Link URL (e.g. /about)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newAboutLink.url} onChange={(e) => setNewAboutLink({ ...newAboutLink, url: e.target.value })} />
                  <button onClick={() => { if (newAboutLink.label) { addItem('aboutLinks', newAboutLink); setNewAboutLink({ label: '', url: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                </div>
              </div>
              <div className="space-y-2">
                {(data.aboutLinks || []).map((link: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{link.label}</p>
                      <p className="text-xs text-slate-500">{link.url}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setNewAboutLink({ label: link.label, url: link.url });
                          removeItem('aboutLinks', idx);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Link"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => removeItem('aboutLinks', idx)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete Link"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Links */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <div className="relative flex items-center group">
                  <input
                    type="text"
                    value={data.supportHeading || 'Support'}
                    onChange={(e) => setData({ ...data, supportHeading: e.target.value })}
                    className="text-md font-bold text-slate-800 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#00a5a5] outline-none hover:bg-slate-50 transition-colors px-1 py-0.5 pr-6"
                    placeholder="Column Heading (e.g. Support)"
                  />
                  <Edit2 size={14} className="text-slate-400 absolute right-1 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <input placeholder="Link Label (e.g. Contact Us)" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newSupportLink.label} onChange={(e) => setNewSupportLink({ ...newSupportLink, label: e.target.value })} />
                <div className="flex gap-2">
                  <input placeholder="Link URL (e.g. /contact)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newSupportLink.url} onChange={(e) => setNewSupportLink({ ...newSupportLink, url: e.target.value })} />
                  <button onClick={() => { if (newSupportLink.label) { addItem('supportLinks', newSupportLink); setNewSupportLink({ label: '', url: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                </div>
              </div>
              <div className="space-y-2">
                {(data.supportLinks || []).map((link: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{link.label}</p>
                      <p className="text-xs text-slate-500">{link.url}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setNewSupportLink({ label: link.label, url: link.url });
                          removeItem('supportLinks', idx);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Link"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => removeItem('supportLinks', idx)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete Link"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Policies Links */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <div className="relative flex items-center group">
                  <input
                    type="text"
                    value={data.policiesHeading || 'Policies'}
                    onChange={(e) => setData({ ...data, policiesHeading: e.target.value })}
                    className="text-md font-bold text-slate-800 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#00a5a5] outline-none hover:bg-slate-50 transition-colors px-1 py-0.5 pr-6"
                    placeholder="Column Heading (e.g. Policies)"
                  />
                  <Edit2 size={14} className="text-slate-400 absolute right-1 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <input placeholder="Link Label (e.g. Disclaimer and Policies)" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newPolicyLink.label} onChange={(e) => setNewPolicyLink({ ...newPolicyLink, label: e.target.value })} />
                <div className="flex gap-2">
                  <input placeholder="Link URL (e.g. /policy)" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newPolicyLink.url} onChange={(e) => setNewPolicyLink({ ...newPolicyLink, url: e.target.value })} />
                  <button onClick={() => { if (newPolicyLink.label) { addItem('policiesLinks', newPolicyLink); setNewPolicyLink({ label: '', url: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                </div>
              </div>
              <div className="space-y-2">
                {(data.policiesLinks || []).map((link: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{link.label}</p>
                      <p className="text-xs text-slate-500">{link.url}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setNewPolicyLink({ label: link.label, url: link.url });
                          removeItem('policiesLinks', idx);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Link"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => removeItem('policiesLinks', idx)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete Link"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Address & Contact Settings Card */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Address & Contact Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Office/Institute Branches</h4>
                <button
                  onClick={() => {
                    const addresses = data.addresses || (data.address ? [data.address] : []);
                    const contactNumbers = data.contactNumbers || (data.contactNumber ? [data.contactNumber] : []);
                    const emails = data.emails || (data.email ? [data.email] : []);
                    const currentBranches = data.branches || (() => {
                      const merged = [];
                      const maxLen = Math.max(addresses.length, contactNumbers.length, emails.length);
                      for (let i = 0; i < maxLen; i++) {
                        merged.push({
                          name: '',
                          address: addresses[i] || '',
                          addressLink: '',
                          contactNumber: contactNumbers[i] || '',
                          email: emails[i] || ''
                        });
                      }
                      return merged;
                    })();
                    setData({ ...data, branches: [...currentBranches, { name: '', address: '', addressLink: '', contactNumber: '', email: '' }] });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#00a5a5] hover:bg-[#008b8b] text-white text-xs font-bold rounded-xl transition-all"
                >
                  + Add Branch Address & Contact
                </button>
              </div>

              {(() => {
                const addresses = data.addresses || (data.address ? [data.address] : []);
                const contactNumbers = data.contactNumbers || (data.contactNumber ? [data.contactNumber] : []);
                const emails = data.emails || (data.email ? [data.email] : []);
                const branchesList = data.branches || (() => {
                  const merged = [];
                  const maxLen = Math.max(addresses.length, contactNumbers.length, emails.length);
                  for (let i = 0; i < maxLen; i++) {
                    merged.push({
                      name: '',
                      address: addresses[i] || '',
                      addressLink: '',
                      contactNumber: contactNumbers[i] || '',
                      email: emails[i] || ''
                    });
                  }
                  if (merged.length === 0) {
                    merged.push({ name: '', address: '', addressLink: '', contactNumber: '', email: '' });
                  }
                  return merged;
                })();

                return (
                  <div className="space-y-6">
                    {branchesList.map((branch: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 relative space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Branch #{idx + 1}</span>
                          {branchesList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentBranches = [...branchesList];
                                currentBranches.splice(idx, 1);
                                setData({ ...data, branches: currentBranches });
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1 px-3 rounded-lg transition-all"
                            >
                              <Trash2 size={14} /> Remove Branch
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest pl-1">Branch Name</label>
                            <input
                              type="text"
                              value={branch.name || ''}
                              onChange={(e) => {
                                const currentBranches = [...branchesList];
                                currentBranches[idx] = { ...currentBranches[idx], name: e.target.value };
                                setData({ ...data, branches: currentBranches });
                              }}
                              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                              placeholder="e.g. Head Office / Paradh Branch"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest pl-1">Branch Contact/Mobile Number</label>
                            <input
                              type="text"
                              value={branch.contactNumber || ''}
                              onChange={(e) => {
                                const currentBranches = [...branchesList];
                                currentBranches[idx] = { ...currentBranches[idx], contactNumber: e.target.value };
                                setData({ ...data, branches: currentBranches });
                              }}
                              className="w-full bg-white border-2 border-black rounded-xl py-3.5 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                              placeholder="Enter branch contact/mobile number..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest pl-1">Branch Email Address</label>
                            <input
                              type="email"
                              value={branch.email || ''}
                              onChange={(e) => {
                                const currentBranches = [...branchesList];
                                currentBranches[idx] = { ...currentBranches[idx], email: e.target.value };
                                setData({ ...data, branches: currentBranches });
                              }}
                              className="w-full bg-white border-2 border-black rounded-xl py-3.5 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                              placeholder="Enter branch email address..."
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest pl-1">Branch Address</label>
                            <textarea
                              rows={2}
                              value={branch.address || ''}
                              onChange={(e) => {
                                const currentBranches = [...branchesList];
                                currentBranches[idx] = { ...currentBranches[idx], address: e.target.value };
                                setData({ ...data, branches: currentBranches });
                              }}
                              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                              placeholder="Enter branch address..."
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-widest pl-1">Branch Address Map Link (Google Maps URL)</label>
                            <input
                              type="text"
                              value={branch.addressLink || ''}
                              onChange={(e) => {
                                const currentBranches = [...branchesList];
                                currentBranches[idx] = { ...currentBranches[idx], addressLink: e.target.value };
                                setData({ ...data, branches: currentBranches });
                              }}
                              className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                              placeholder="e.g. https://maps.google.com/..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Visitor & System Counter</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Total Visitors</label>
                <input
                  type="text"
                  value={data.totalVisitors || ''}
                  onChange={(e) => setData({ ...data, totalVisitors: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Today's Count</label>
                <input
                  type="text"
                  value={data.todayCount || ''}
                  onChange={(e) => setData({ ...data, todayCount: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Last Updated Date</label>
                <input
                  type="text"
                  value={data.lastUpdated || ''}
                  onChange={(e) => setData({ ...data, lastUpdated: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {mode === 'course' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-[#002147]/5 rounded-xl flex items-center justify-center text-[#002147] border border-[#002147]/10">
                <BookOpen size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Featured Website Courses</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl px-4 py-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Image:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileRef = storageRef(storage, `settings/website/courses/${Date.now()}_${file.name}`);
                        const uploadTask = uploadBytesResumable(fileRef, file);
                        uploadTask.on('state_changed', null,
                          (err) => console.error(err),
                          async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            setNewCourse(prev => ({ ...prev, image: url }));
                          }
                        );
                      }
                    }}
                    className="text-xs w-full text-slate-500"
                  />
                  {newCourse.image && (
                    <img src={newCourse.image} alt="Preview" className="w-8 h-8 rounded-lg object-cover border" />
                  )}
                </div>
                <input placeholder="Course Name" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} />
                <input placeholder="Duration" className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newCourse.duration} onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })} />
                <div className="flex gap-2">
                  <input placeholder="Description" className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                  <button onClick={() => { if (newCourse.name) { addItem('courses', newCourse); setNewCourse({ name: '', duration: '', description: '', image: '' }); } }} className="bg-[#002147] text-white px-6 rounded-xl hover:bg-[#00a5a5] transition-colors flex items-center gap-2 font-bold text-sm"><Plus size={18} /> Add</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {(data.courses || []).map((crs: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 relative group shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border overflow-hidden shrink-0">
                      {crs.image ? <img src={crs.image} alt={crs.name} className="w-full h-full object-cover" /> : <BookOpen size={18} />}
                    </div>
                    {editingContext?.field === 'courses' && editingContext.index === idx ? (
                      <div className="flex-1 flex flex-col gap-1 pr-14">
                        <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-black" value={editPayload.name} onChange={(e) => setEditPayload({ ...editPayload, name: e.target.value })} placeholder="Course Name" />
                        <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold" value={editPayload.duration} onChange={(e) => setEditPayload({ ...editPayload, duration: e.target.value })} placeholder="Duration" />
                        <input className="bg-white border border-slate-300 rounded px-2 py-1 text-[9px] font-bold" value={editPayload.description} onChange={(e) => setEditPayload({ ...editPayload, description: e.target.value })} placeholder="Description" />
                      </div>
                    ) : (
                      <div className="flex-1 truncate">
                        <p className="text-[11px] font-black text-slate-800 truncate">{crs.name}</p>
                        <p className="text-[9px] font-bold text-[#00a5a5] uppercase truncate">{crs.duration}</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate">{crs.description}</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1 transition-opacity">
                      {editingContext?.field === 'courses' && editingContext.index === idx ? (
                        <>
                          <button onClick={saveEdit} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-full"><Check size={14} /></button>
                          <button onClick={() => setEditingContext(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full"><X size={14} /></button>
                        </>
                      ) : (
                        <button onClick={() => startEdit('courses', idx, crs)} className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full">
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button onClick={() => removeItem('courses', idx)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {mode === 'contact' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Contact Us Page Content</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Page Title</label>
                <input
                  type="text"
                  value={data.title || ''}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Office Address</label>
                <textarea
                  rows={4}
                  value={data.officeAddress || ''}
                  onChange={(e) => setData({ ...data, officeAddress: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  placeholder="Enter office address..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Phone Numbers (comma separated)</label>
                <input
                  type="text"
                  value={data.phoneNumbers || ''}
                  onChange={(e) => setData({ ...data, phoneNumbers: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  placeholder="e.g. +91-22-26590000, +91-22-26591111"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Email Addresses (comma separated)</label>
                <input
                  type="text"
                  value={data.emails || ''}
                  onChange={(e) => setData({ ...data, emails: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                  placeholder="e.g. support@msbsvet.gov.in, info@msbsvet.gov.in"
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {mode === 'inquiry' && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
          <section className="bg-white rounded-[2.5rem] p-10 border border-black shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-black pb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Academic Inquiry Page Content</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Portal Title</label>
                <input
                  type="text"
                  value={data.heroTitle || ''}
                  onChange={(e) => setData({ ...data, heroTitle: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Session Subtitle</label>
                <input
                  type="text"
                  value={data.heroSubtitle || ''}
                  onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#00a5a5] uppercase tracking-wider pl-1">Portal Description</label>
                <textarea
                  rows={4}
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-black rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#00a5a5] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Benefit 1 Settings</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Benefit 1 Title</label>
                    <input
                      type="text"
                      value={data.benefit1Title || ''}
                      onChange={(e) => setData({ ...data, benefit1Title: e.target.value })}
                      className="w-full bg-white border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Benefit 1 Description</label>
                    <textarea
                      rows={2}
                      value={data.benefit1Desc || ''}
                      onChange={(e) => setData({ ...data, benefit1Desc: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Benefit 2 Settings</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Benefit 2 Title</label>
                    <input
                      type="text"
                      value={data.benefit2Title || ''}
                      onChange={(e) => setData({ ...data, benefit2Title: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#00a5a5] uppercase tracking-wider pl-1">Benefit 2 Description</label>
                    <textarea
                      rows={2}
                      value={data.benefit2Desc || ''}
                      onChange={(e) => setData({ ...data, benefit2Desc: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-black rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#00a5a5] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
