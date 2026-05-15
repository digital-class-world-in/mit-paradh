'use client';

import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { 
  Award, 
  Plus, 
  FileText, 
  User, 
  Calendar, 
  CheckCircle2, 
  X, 
  Save, 
  Printer, 
  Download,
  Building2,
  Users,
  GraduationCap,
  Eye
} from 'lucide-react';

export default function CertificateManager({ collegeId, defaultTab = 'tc' }: { collegeId: string | undefined, defaultTab?: 'tc' | 'marksheet' | 'course' }) {
  const [activeSubTab, setActiveSubTab] = useState<'tc' | 'marksheet' | 'course'>(defaultTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collegeData, setCollegeData] = useState<any>(null);

  useEffect(() => {
    if (collegeId) {
      const collegeRef = ref(realtimeDb, `colleges/${collegeId}/profile`);
      get(collegeRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCollegeData(data);
          // Auto-update marksheet form with real institute details
          setMarksheetForm(prev => ({
            ...prev,
            instituteName: data.collegeName || prev.instituteName,
            instituteCode: data.collegeCode || prev.instituteCode
          }));
        }
      });
    }
  }, [collegeId]);
  const [tcForm, setTcForm] = useState({
    studentName: '',
    studentId: '',
    fatherName: '',
    motherName: '',
    dob: '',
    admissionNo: '',
    dateOfLeaving: '',
    reasonForLeaving: '',
    lastClassStudied: '',
    characterConduct: 'Good',
    feesPaidStatus: true
  });

  const [marksheetForm, setMarksheetForm] = useState({
    studentName: '',
    motherName: '',
    dob: '',
    courseName: '',
    duration: '',
    examination: '',
    profileNo: '',
    applicationId: '',
    instituteName: 'MAHALAXMI VOCATIONAL EDUCATION AND TRAINING INSTITUTE',
    instituteCode: 'MSB180231',
    srNo: `202401C${Math.random().toString().slice(2, 8)}/CC/2025/03`,
    msbsvetNo: 'MSBSVET/03/2026',
    resultDate: new Date().toLocaleDateString('en-GB'),
    issueDate: new Date().toLocaleDateString('en-GB'),
    overallResult: 'Pass',
    percentage: '',
    grade: 'Distinction',
    subjects: [
      { name: '', type: 'TH', max: '100', min: '35', obt: '' }
    ],
    studentPhoto: '',
    qrCode: ''
  });

  const [courseCertForm, setCourseCertForm] = useState({
    studentName: '',
    studentId: '',
    courseName: '',
    completionDate: '',
    grade: 'A+'
  });

  const handleCreateTC = () => {
    console.log('Creating Transfer Certificate:', tcForm);
    alert('Transfer Certificate created successfully!');
    setIsModalOpen(false);
  };

  const handleAddSubject = () => {
    setMarksheetForm({
      ...marksheetForm,
      subjects: [...marksheetForm.subjects, { name: '', type: 'TH', max: '100', min: '35', obt: '' }]
    });
  };

  const handleRemoveSubject = (index: number) => {
    const newSubjects = [...marksheetForm.subjects];
    newSubjects.splice(index, 1);
    setMarksheetForm({ ...marksheetForm, subjects: newSubjects });
  };

  const handleSubjectChange = (index: number, field: string, value: string) => {
    const newSubjects = [...marksheetForm.subjects];
    (newSubjects[index] as any)[field] = value;
    setMarksheetForm({ ...marksheetForm, subjects: newSubjects });
  };

  const calculateTotal = () => {
    let totalMax = 0;
    let totalMin = 0;
    let totalObt = 0;
    marksheetForm.subjects.forEach(s => {
      totalMax += parseInt(s.max || '0');
      totalMin += parseInt(s.min || '0');
      totalObt += parseInt(s.obt || '0');
    });
    return { max: totalMax, min: totalMin, obt: totalObt };
  };

  const getMarksheetHtml = (data: any, isPreview: boolean = false) => {
    const total = calculateTotal();
    const percentage = total.max > 0 ? ((total.obt / total.max) * 100).toFixed(2) : '0.00';
    
    return `
      <html>
        <head>
          <title>Preview - ${data.studentName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap');
            body { font-family: 'Public Sans', sans-serif; margin: 0; padding: 0; color: #002147; background: ${isPreview ? '#f1f5f9' : '#fff'}; }
            .page { width: 210mm; min-height: 297mm; padding: 10mm; margin: ${isPreview ? '20px' : '0'} auto; background: white; box-sizing: border-box; position: relative; border: 2px solid #5D5fb1; box-shadow: ${isPreview ? '0 0 20px rgba(0,0,0,0.1)' : 'none'}; }
            .header { text-align: center; margin-bottom: 20px; position: relative; }
            .top-meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 10px; }
            .logo-section { margin-bottom: 10px; }
            .gov-text { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
            .dept-text { font-size: 13px; font-weight: 700; color: #b91c1c; margin-bottom: 4px; }
            .board-title { font-size: 18px; font-weight: 800; color: #002147; line-height: 1.2; margin-bottom: 4px; }
            .establishment { font-size: 9px; font-weight: 600; font-style: italic; color: #64748b; }
            
            .doc-title { font-size: 18px; font-weight: 800; text-align: center; margin: 15px 0; color: #002147; text-decoration: underline; text-underline-offset: 4px; }
            .student-name { font-size: 16px; font-weight: 800; text-align: center; margin-bottom: 15px; text-transform: uppercase; }
            
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px; margin-bottom: 20px; font-size: 11px; }
            .detail-item { display: flex; gap: 8px; }
            .detail-label { font-weight: 600; color: #475569; width: 100px; }
            .detail-value { font-weight: 700; color: #0f172a; text-transform: uppercase; flex: 1; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #002147; }
            th, td { border: 1px solid #002147; padding: 6px 10px; font-size: 11px; text-align: left; }
            th { background: #f8fafc; font-weight: 700; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; font-size: 11px; font-weight: 700; margin-bottom: 15px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
            .dates { display: flex; gap: 40px; font-size: 11px; font-weight: 700; margin-bottom: 40px; }
            
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
            .photo-box { width: 35mm; height: 45mm; border: 1px solid #002147; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            .qr-code { width: 30mm; height: 30mm; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
            .qr-code img { width: 100%; height: 100%; }
            .signatory { text-align: center; width: 60mm; }
            .signatory-text { font-size: 10px; font-weight: 700; line-height: 1.4; }
            .signatory-name { margin-top: 30px; font-weight: 800; }
            @media print { .page { margin: 0; border: none; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top-meta">
              <div>${data.msbsvetNo}</div>
              <div>Sr. No. ${data.srNo}</div>
            </div>
            
            <div class="header">
              <div class="logo-section" style="display: flex; align-items: center; justify-content: center; gap: 30px; margin-bottom: 15px;">
                ${collegeData?.logoUrl ? `<img src="${collegeData.logoUrl}" style="height: 90px; border-radius: 12px;" />` : `<div style="height: 90px; width: 90px; background: #002147; color: #fff; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; font-weight: 800;">MIT</div>`}
              </div>
              <div class="gov-text" style="font-size: 14px; color: #000; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Mahalaxmi Technical Institute Paradh, Bk</div>
              <div class="dept-text" style="font-size: 13px; color: #475569; font-weight: 600; margin-top: 5px;">Managed by: Mahalaxmi Vocational Education and Training Institute</div>
              <div class="board-title" style="font-size: 24px; font-weight: 900; color: #002147; margin-top: 10px; text-transform: uppercase;">STATEMENT OF MARKS</div>
              
              <div style="margin-top: 15px; font-size: 10px; color: #64748b; font-weight: 600;">
                Address: ${collegeData?.address || 'Paradh, Bk, Tal. Bhokardan, Dist. Jalna'} | Email: ${collegeData?.email || 'mitparadh@gmail.com'}
              </div>
            </div>
            
            <div class="doc-title" style="margin-top: 0;">ACADEMIC PERFORMANCE RECORD</div>
            <div class="student-name">${data.studentName || 'STUDENT NAME'}</div>
            
            <div class="details-grid">
              <div class="detail-item"><span class="detail-label">Mother Name</span><span class="detail-value">${data.motherName || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Date of Birth</span><span class="detail-value">${data.dob || 'N/A'}</span></div>
              <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Course</span><span class="detail-value">${data.courseName || 'COURSE NAME'}</span></div>
              <div class="detail-item"><span class="detail-label">Duration</span><span class="detail-value">${data.duration || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Profile No.</span><span class="detail-value">${data.profileNo || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Examination</span><span class="detail-value">${data.examination || 'N/A'}</span></div>
              <div class="detail-item"><span class="detail-label">Application ID</span><span class="detail-value">${data.applicationId || 'N/A'}</span></div>
              <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Institute</span><span class="detail-value">${data.instituteName} (${data.instituteCode})</span></div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th rowspan="2" class="text-center">Subject</th>
                  <th rowspan="2" class="text-center" style="width: 40px;">TH/PR</th>
                  <th colspan="3" class="text-center">Marks</th>
                  <th rowspan="2" class="text-center" style="width: 60px;">Result</th>
                </tr>
                <tr>
                  <th class="text-center" style="width: 40px;">Max.</th>
                  <th class="text-center" style="width: 40px;">Min.</th>
                  <th class="text-center" style="width: 40px;">Obt.</th>
                </tr>
              </thead>
              <tbody>
                ${data.subjects.map((s: any) => `
                  <tr>
                    <td>${s.name || '---'}</td>
                    <td class="text-center">${s.type}</td>
                    <td class="text-center">${s.max}</td>
                    <td class="text-center">${s.min}</td>
                    <td class="text-center">${s.obt || '0'}</td>
                    <td class="text-center">${parseInt(s.obt || '0') >= parseInt(s.min) ? 'Pass' : 'Fail'}</td>
                  </tr>
                `).join('')}
                <tr style="font-weight: 800; background: #f8fafc;">
                  <td colspan="2">Total</td>
                  <td class="text-center">${total.max}</td>
                  <td class="text-center">${total.min}</td>
                  <td class="text-center">${total.obt}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            
            <div class="summary">
              <div>Overall Result: ${total.obt >= total.min ? data.overallResult : 'Fail'}</div>
              <div>Percentage: ${percentage}%</div>
              <div>Grade: ${data.grade}</div>
            </div>
            
            <div class="dates">
              <div>Result Date: ${data.resultDate}</div>
              <div>Issue Date: ${data.issueDate}</div>
            </div>
            
            <div class="footer">
              <div class="photo-box">
                ${data.studentPhoto ? `<img src="${data.studentPhoto}" />` : 'Photo'}
              </div>
              <div class="qr-code">
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.srNo)}" />
              </div>
              <div class="signatory">
                <div class="signatory-text">
                  This is system generated Statement of Marks and hence require no signature
                </div>
                <div class="signatory-name">(J. M. Lohar)</div>
                <div class="signatory-text" style="font-size: 8px;">SECRETARY</div>
              </div>
            </div>
          </div>
          
          ${!isPreview ? `
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            window.onload = () => {
              const element = document.querySelector('.page');
              const opt = {
                margin: 0,
                filename: 'Marksheet_${(data.studentName || 'Student').replace(/\s+/g, '_')}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              html2pdf().set(opt).from(element).toPdf().get('pdf').save().then(() => {
                setTimeout(() => { window.close(); }, 1000);
              });
            };
          </script>
          ` : ''}
        </body>
      </html>
    `;
  };

  const handleCreateMarksheet = (isPreview: boolean = false) => {
    const html = getMarksheetHtml(marksheetForm, isPreview);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleCreateCourseCert = () => {
    console.log('Creating Course Certificate:', courseCertForm);
    alert('Course Certificate created successfully!');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header Banner */}
      <div className="bg-[#002147] rounded-[3.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-[#00a5a5] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-normal capitalize tracking-tight">
            <Award size={14} className="text-[#00a5a5]" /> Certification Module
          </div>
          <h2 className="text-4xl font-black tracking-tighter capitalize leading-none">
            {activeSubTab === 'tc' ? 'Transfer Certificates' : activeSubTab === 'marksheet' ? 'Student Marksheets' : 'Course Certificates'}
          </h2>
          <p className="text-sm font-normal text-white/60">
            {activeSubTab === 'tc' ? 'Issue and manage institutional transfer certificates for students.' : 
             activeSubTab === 'marksheet' ? 'Generate and manage academic marksheets for examination records.' : 
             'Issue official course completion and excellence certificates.'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-[#00a5a5] text-white px-10 py-5 rounded-2xl text-[11px] font-black capitalize tracking-tight shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> {activeSubTab === 'tc' ? 'Create Certificate' : activeSubTab === 'marksheet' ? 'Generate Marksheet' : 'Issue Certificate'}
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
        {[
          { id: 'tc', label: 'Transfer Certificate', icon: Award },
          { id: 'marksheet', label: 'Marksheet', icon: FileText },
          { id: 'course', label: 'Course Certificate', icon: GraduationCap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[13px] font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-[#002147] text-white shadow-xl' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* List / Placeholder */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-20 text-center">
        <div className="flex flex-col items-center gap-6 text-slate-300">
          <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner">
            <FileText size={48} className="opacity-20" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-normal tracking-normal capitalize text-black">No {activeSubTab === 'tc' ? 'Certificates' : activeSubTab === 'marksheet' ? 'Marksheets' : 'Course Certificates'} Issued</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Start by clicking the {activeSubTab === 'tc' ? 'create' : activeSubTab === 'marksheet' ? 'generate' : 'issue'} button above.
            </p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#002147]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-[#002147] p-10 text-white relative shrink-0">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute right-8 top-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all"
               >
                 <X size={24} />
               </button>
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#00a5a5] rounded-2xl flex items-center justify-center shadow-lg">
                     {activeSubTab === 'tc' ? <Award size={24} /> : activeSubTab === 'marksheet' ? <FileText size={24} /> : <GraduationCap size={24} />}
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter capitalize leading-none">
                    {activeSubTab === 'tc' ? 'Create Transfer Certificate' : activeSubTab === 'marksheet' ? 'Generate Student Marksheet' : 'Issue Course Certificate'}
                  </h3>
               </div>
               <p className="text-[13px] font-normal text-white/60 capitalize tracking-normal">
                 Institutional {activeSubTab === 'tc' ? 'Leaving and Conduct Certification' : activeSubTab === 'marksheet' ? 'Academic Performance Record' : 'Course Completion Recognition'}
               </p>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
              {activeSubTab === 'marksheet' && collegeData && (
                <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-[#00a5a5]/30 flex items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                    {collegeData.logoUrl ? (
                      <img src={collegeData.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
                    ) : (
                      <Building2 size={32} className="text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[#002147] tracking-tight">{collegeData.collegeName}</h4>
                    <p className="text-[12px] font-bold text-[#00a5a5] uppercase tracking-widest mt-1">Institutional Branding Active</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{collegeData.address}, {collegeData.city}</p>
                  </div>
                </div>
              )}

              {activeSubTab === 'tc' ? (
                <form onSubmit={(e) => { e.preventDefault(); handleCreateTC(); }} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><User size={12} /> Student Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.studentName}
                        onChange={(e) => setTcForm({...tcForm, studentName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Admission / Enrollment No.</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.admissionNo}
                        onChange={(e) => setTcForm({...tcForm, admissionNo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Father's Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.fatherName}
                        onChange={(e) => setTcForm({...tcForm, fatherName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mother's Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.motherName}
                        onChange={(e) => setTcForm({...tcForm, motherName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Calendar size={12} /> Date of Birth</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.dob}
                        onChange={(e) => setTcForm({...tcForm, dob: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Calendar size={12} /> Date of Leaving</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.dateOfLeaving}
                        onChange={(e) => setTcForm({...tcForm, dateOfLeaving: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1 flex items-center gap-2"><Building2 size={12} /> Last Class Studied</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.lastClassStudied}
                        onChange={(e) => setTcForm({...tcForm, lastClassStudied: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Reason for Leaving</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={tcForm.reasonForLeaving}
                        onChange={(e) => setTcForm({...tcForm, reasonForLeaving: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Character & Conduct</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm cursor-pointer"
                        value={tcForm.characterConduct}
                        onChange={(e) => setTcForm({...tcForm, characterConduct: e.target.value})}
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Satisfactory">Satisfactory</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 pt-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={tcForm.feesPaidStatus}
                          onChange={(e) => setTcForm({...tcForm, feesPaidStatus: e.target.checked})}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00a5a5]"></div>
                        <span className="ml-3 text-[13px] font-normal text-black capitalize tracking-tight">Institutional Dues Cleared</span>
                      </label>
                    </div>
                  </div>
                  <div className="pt-6 flex justify-end gap-4">
                    <button 
                      type="submit"
                      className="bg-[#00a5a5] text-white px-12 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                    >
                      <Save size={20} /> Finalize & Create TC
                    </button>
                  </div>
                </form>
              ) : activeSubTab === 'marksheet' ? (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Student Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.studentName}
                        onChange={(e) => setMarksheetForm({...marksheetForm, studentName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Mother Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.motherName}
                        onChange={(e) => setMarksheetForm({...marksheetForm, motherName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Date of Birth</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.dob}
                        onChange={(e) => setMarksheetForm({...marksheetForm, dob: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.courseName}
                        onChange={(e) => setMarksheetForm({...marksheetForm, courseName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Duration</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. 6 MONTH"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.duration}
                        onChange={(e) => setMarksheetForm({...marksheetForm, duration: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Examination</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. March 2026"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.examination}
                        onChange={(e) => setMarksheetForm({...marksheetForm, examination: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Profile No.</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.profileNo}
                        onChange={(e) => setMarksheetForm({...marksheetForm, profileNo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Application ID</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={marksheetForm.applicationId}
                        onChange={(e) => setMarksheetForm({...marksheetForm, applicationId: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Award size={20} className="text-[#00a5a5]" /> Academic Subjects & Marks
                      </h4>
                      <button 
                        onClick={handleAddSubject}
                        className="px-6 py-2 bg-[#00a5a5]/10 text-[#00a5a5] rounded-xl text-[12px] font-bold hover:bg-[#00a5a5] hover:text-white transition-all"
                      >
                        + Add Subject
                      </button>
                    </div>

                    <div className="space-y-4">
                      {marksheetForm.subjects.map((subject, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Subject Name</label>
                            <input 
                              type="text" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[#00a5a5]"
                              value={subject.name}
                              onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Type (TH/PR)</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none"
                              value={subject.type}
                              onChange={(e) => handleSubjectChange(idx, 'type', e.target.value)}
                            >
                              <option value="TH">Theory</option>
                              <option value="PR">Practical</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Max</label>
                            <input 
                              type="number" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none"
                              value={subject.max}
                              onChange={(e) => handleSubjectChange(idx, 'max', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Min</label>
                            <input 
                              type="number" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none"
                              value={subject.min}
                              onChange={(e) => handleSubjectChange(idx, 'min', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase">Obt</label>
                            <input 
                              type="number" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none"
                              value={subject.obt}
                              onChange={(e) => handleSubjectChange(idx, 'obt', e.target.value)}
                            />
                          </div>
                          {marksheetForm.subjects.length > 1 && (
                            <button 
                              onClick={() => handleRemoveSubject(idx)}
                              className="absolute -right-2 -top-2 w-8 h-8 bg-white text-rose-500 border border-rose-100 rounded-full shadow-lg items-center justify-center hidden group-hover:flex hover:bg-rose-500 hover:text-white transition-all"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Overall Grade</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all"
                        value={marksheetForm.grade}
                        onChange={(e) => setMarksheetForm({...marksheetForm, grade: e.target.value})}
                      >
                        <option value="Distinction">Distinction</option>
                        <option value="First Class">First Class</option>
                        <option value="Second Class">Second Class</option>
                        <option value="Pass Class">Pass Class</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Student Photo URL</label>
                      <input 
                        type="text" 
                        placeholder="Paste image URL here"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none"
                        value={marksheetForm.studentPhoto}
                        onChange={(e) => setMarksheetForm({...marksheetForm, studentPhoto: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-4">
                    <button 
                      onClick={() => handleCreateMarksheet(true)}
                      className="bg-slate-100 text-slate-600 px-8 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal hover:bg-slate-200 transition-all flex items-center gap-3 active:scale-95"
                    >
                      <Eye size={20} /> Live Preview
                    </button>
                    <button 
                      onClick={() => handleCreateMarksheet(false)}
                      className="bg-[#00a5a5] text-white px-12 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                    >
                      <Printer size={20} /> Generate & Print
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleCreateCourseCert(); }} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Student Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={courseCertForm.studentName}
                        onChange={(e) => setCourseCertForm({...courseCertForm, studentName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Course Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={courseCertForm.courseName}
                        onChange={(e) => setCourseCertForm({...courseCertForm, courseName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Completion Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm"
                        value={courseCertForm.completionDate}
                        onChange={(e) => setCourseCertForm({...courseCertForm, completionDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Grade / Performance</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-normal text-black outline-none focus:border-[#00a5a5] focus:bg-white transition-all shadow-sm cursor-pointer"
                        value={courseCertForm.grade}
                        onChange={(e) => setCourseCertForm({...courseCertForm, grade: e.target.value})}
                      >
                        <option value="A+">A+ (Excellence)</option>
                        <option value="A">A (Very Good)</option>
                        <option value="B">B (Good)</option>
                        <option value="C">C (Satisfactory)</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-6 flex justify-end gap-4">
                    <button 
                      type="submit"
                      className="bg-[#00a5a5] text-white px-12 py-5 rounded-2xl text-[12px] font-black capitalize tracking-normal shadow-2xl hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                    >
                      <Award size={20} /> Issue Certificate
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



