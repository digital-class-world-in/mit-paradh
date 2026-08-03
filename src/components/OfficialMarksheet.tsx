'use client';

import React from 'react';
import { formatAutoRegNo } from '@/lib/formatUtils';

interface Subject {
  name: string;
  maxMarks: string;
  passingMarks: string;
  obtainedMarks: string;
  result: string;
}

interface OfficialMarksheetProps {
  data: {
    studentName: string;
    fatherName: string;
    motherName: string;
    dob: string;
    college: string;
    courseType: string;
    course: string;
    duration: string;
    regNo: string;
    rollNumber: string;
    subjects: Subject[];
    examDate?: string;
    issueDate?: string;
    resultDate?: string;
    profilePhoto?: string;
    signature?: string;
    grade?: string;
    percentage?: string;
    marksheetNo?: string;
  };
  id: string;
}

export const OfficialMarksheet = React.forwardRef<HTMLDivElement, OfficialMarksheetProps>(({ data, id }, ref) => {
  const subjects = data.subjects || [];
  const totalMax = subjects.reduce((sum, s) => sum + (parseFloat(s.maxMarks) || 0), 0);
  const totalMin = subjects.reduce((sum, s) => sum + (parseFloat(s.passingMarks) || 0), 0);
  const totalObt = subjects.reduce((sum, s) => sum + (parseFloat(s.obtainedMarks) || 0), 0);
  const percentage = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(2) : '0.00';
  
  const getGrade = (pct: number) => {
    if (pct >= 75) return 'Distinction';
    if (pct >= 60) return 'First Class';
    if (pct >= 50) return 'Second Class';
    if (pct >= 35) return 'Pass Class';
    return 'Fail';
  };

  const grade = getGrade(parseFloat(percentage));
  const overallResult = subjects.length > 0 ? (subjects.every(s => s.result === 'Pass') ? 'Pass' : 'Fail') : 'Awaited';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr; // Already formatted
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    return dateStr;
  };

  return (
    <div 
      ref={ref}
      id={id}
      className="p-0 m-0"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '10mm',
        boxSizing: 'border-box',
        border: '2px solid #000000',
        color: '#000000',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'serif',
        lineHeight: '1.3'
      }}
    >
      <div style={{ 
        position: 'relative', 
        padding: '32px', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#ffffff', 
        overflow: 'hidden',
        border: '1px solid #000000'
      }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', marginBottom: '4px', color: '#475569' }}>
          <span>MITPARADH</span>
          <span style={{ textAlign: 'right' }}>Marksheet No. : {data.marksheetNo || 'PENDING'}</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Emblem_of_India.svg/100px-Emblem_of_India.svg.png" 
            alt="Emblem" 
            style={{ margin: '0 auto', height: '64px', marginBottom: '8px' }}
            crossOrigin="anonymous"
          />
          <p style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '-0.025em', color: '#1e293b', margin: 0 }}>Government of Maharashtra</p>
          <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px', color: '#002147', margin: 0 }}>Mahavishnu Gramin Vikas & Shaikshnik B. sanstha Dhamangaon (Dhad)</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
             <img 
               src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" 
               alt="Institute Logo" 
               style={{ height: '72px', width: '72px', objectFit: 'contain', marginTop: '12px' }}
               crossOrigin="anonymous"
             />
             <p style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', color: '#002147', margin: 0 }}>Mahalaxmi Nursing and technical institute Paradh</p>
          </div>
          <p style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: '#000000', margin: 0 }}>At. Post Paradh, Bk. Tq. Bhokardan, Dist. Jalna</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', textTransform: 'uppercase', marginBottom: '8px', color: '#002147', margin: 0 }}>STATEMENT OF MARKS</h2>
          <h3 style={{ fontSize: '26px', textTransform: 'uppercase', paddingBottom: '4px', display: 'inline-block', color: '#000000', margin: 0 }}>{data.studentName}</h3>
        </div>

        {/* Student Details Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '12px', border: '1px solid #000000' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px', width: '128px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Mother Name</td>
              <td style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{data.motherName || 'SUNITA'}</td>
              <td style={{ padding: '6px', width: '128px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Date of Birth</td>
              <td style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{data.dob || '26/09/1999'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Course</td>
              <td colSpan={3} style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{data.course || 'CERTIFICATE COURSE IN COMPUTER TYPING'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Duration</td>
              <td style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{data.duration || '6 MONTH'}</td>
              <td style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Roll Number</td>
              <td style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{data.rollNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Examination</td>
              <td style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{data.examDate || 'March 2026'}</td>
              <td style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Registration Number</td>
              <td style={{ padding: '6px', fontWeight: '700', border: '1px solid #000000' }}>{formatAutoRegNo(data.regNo)}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>Institute</td>
              <td colSpan={3} style={{ padding: '6px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid #000000' }}>{data.college || 'MAHALAXMI VOCATIONAL EDUCATION AND TRAINING INSTITUTE'}</td>
            </tr>
          </tbody>
        </table>

        {/* Marks Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '16px', border: '0.5px solid #000000' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ padding: '12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '900', width: '66%', border: '0.5px solid #000000' }}>Subject</th>
              <th rowSpan={2} style={{ width: '40px', border: '0.5px solid #000000' }}></th>
              <th colSpan={3} style={{ padding: '4px', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', border: '0.5px solid #000000' }}>Marks</th>
              <th rowSpan={2} style={{ padding: '12px', textAlign: 'center', textTransform: 'uppercase', fontWeight: '900', border: '0.5px solid #000000' }}>Result</th>
            </tr>
            <tr>
              <th style={{ padding: '4px', textAlign: 'center', width: '64px', textTransform: 'uppercase', fontWeight: '900', border: '0.5px solid #000000' }}>Max.</th>
              <th style={{ padding: '4px', textAlign: 'center', width: '64px', textTransform: 'uppercase', fontWeight: '900', border: '0.5px solid #000000' }}>Min.</th>
              <th style={{ padding: '4px', textAlign: 'center', width: '64px', textTransform: 'uppercase', fontWeight: '900', border: '0.5px solid #000000' }}>Obt.</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, i) => (
              <tr key={i} style={{ fontWeight: '700' }}>
                <td style={{ padding: '4px 12px', textTransform: 'uppercase', border: '1px solid #000000' }}>{sub.name}</td>
                <td style={{ padding: '4px', textAlign: 'center', fontSize: '10px', border: '1px solid #000000' }}>{i % 2 === 0 ? 'TH' : 'PR'}</td>
                <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}>{sub.maxMarks}</td>
                <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}>{sub.passingMarks}</td>
                <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}>{sub.obtainedMarks}</td>
                <td style={{ padding: '4px', textAlign: 'center', textTransform: 'uppercase', border: '1px solid #000000' }}>{sub.result}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: '900' }}>
              <td style={{ padding: '4px 12px', textTransform: 'uppercase', border: '1px solid #000000' }}>Total</td>
              <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}></td>
              <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}>{totalMax}</td>
              <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}>{totalMin}</td>
              <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}>{totalObt}</td>
              <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #000000' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Summary Zone */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '700', marginTop: '8px', padding: '0 8px' }}>
           <span>Overall Result: {overallResult}</span>
           <span>Percentage: {percentage}</span>
           <span>Grade: {grade}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '700', marginTop: '8px', padding: '8px 8px 0 8px', borderTop: '1px solid #000000' }}>
           <span>Result Date : {formatDate(data.resultDate)}</span>
           <span>Issue Date : {formatDate(data.issueDate)}</span>
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', paddingTop: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            {/* Student Identity Block (Photo + Signature) */}
            <div style={{ width: '144px', margin: '0 auto', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid #000000' }}>
              {/* Photo Box */}
              <div style={{ height: '128px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #000000' }}>
                {data.profilePhoto ? (
                  <img 
                  src={data.profilePhoto} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#000000' }}>
                     <span>PHOTO</span>
                  </div>
                )}
              </div>
              {/* Signature Box */}
              <div style={{ height: '48px', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {data.signature ? (
                  <img 
                  src={data.signature} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '700', fontStyle: 'italic', color: '#000000' }}>
                     <span>Student Signature</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', paddingBottom: '8px', paddingRight: '48px' }}>
             <div style={{ textAlign: 'center', display: 'inline-block' }}>
                <div style={{ paddingTop: '8px' }}>
                   <div style={{ width: '192px', height: '1px', backgroundColor: '#000000', marginBottom: '4px' }} />
                   <p style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', color: '#002147', margin: 0 }}>Authorized Signature</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OfficialMarksheet.displayName = 'OfficialMarksheet';
