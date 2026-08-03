import React from 'react';
import { formatAutoRegNo } from '@/lib/formatUtils';

interface OfficialCertificateProps {
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

export const OfficialCertificate = React.forwardRef<HTMLDivElement, OfficialCertificateProps>(({ data, id }, ref) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
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
        width: '297mm', 
        height: '210mm', 
        padding: '8mm',
        boxSizing: 'border-box',
        border: '8px double #002147',
        color: '#000000',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'serif',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        height: '100%', 
        border: '3px solid #002147', 
        padding: '24px 40px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        backgroundColor: '#ffffff', 
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
         {/* Document Identifiers */}
         <div style={{ position: 'absolute', top: '12px', left: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', whiteSpace: 'nowrap' }}>
               <p style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0 }}>Certificate No. :</p>
               <p style={{ fontSize: '13px', fontWeight: '900', color: '#002147', margin: 0 }}>{data.marksheetNo || 'PENDING'}</p>
            </div>
         </div>
         <div style={{ position: 'absolute', top: '12px', right: '24px', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px', whiteSpace: 'nowrap' }}>
               <p style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0 }}>Reg. No. :</p>
               <p style={{ fontSize: '13px', fontWeight: '900', color: '#002147', margin: 0 }}>{formatAutoRegNo(data.regNo)}</p>
            </div>
         </div>
         
         {/* Top Branding */}
         <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', marginTop: '10px' }}>
            <img 
               src="https://ik.imagekit.io/gnzjd77mb/WhatsApp%20Image%202026-04-23%20at%2014.44.57.jpeg" 
               alt="Institute Logo" 
               style={{ height: '80px', width: '80px', objectFit: 'contain' }}
               crossOrigin="anonymous"
            />
            <div style={{ textAlign: 'center' }}>
               <h1 style={{ fontSize: '28px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#002147', margin: 0, maxWidth: '600px', lineHeight: '1.1' }}>Mahalaxmi Nursing and technical institute Paradh</h1>
               <p style={{ fontSize: '14px', fontWeight: '700', color: '#000000', margin: '4px 0 0 0' }}>At. Post Paradh, Bk. Tq. Bhokardan, Dist. Jalna</p>
            </div>
         </div>

         <div style={{ textAlign: 'center', flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#002147', margin: 0 }}>CERTIFICATE</h2>
            
            <p style={{ fontSize: '18px', fontStyle: 'italic', color: '#475569', margin: '4px 0' }}>This is to certify that</p>
            
            <h3 style={{ fontSize: '36px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0', display: 'inline-block', color: '#000000', margin: '0 auto', maxWidth: '100%', wordBreak: 'break-word' }}>
               {data.studentName}
            </h3>

            <p style={{ fontSize: '16px', lineHeight: '1.4', maxWidth: '40rem', margin: '4px auto', color: '#334155' }}>
               has successfully completed the <span style={{ fontWeight: '700', color: '#002147' }}>{data.courseType}</span> in
            </p>

            <h4 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.01em', color: '#002147', margin: '4px 0', maxWidth: '100%', wordBreak: 'break-word' }}>
               {data.course}
            </h4>

            <p style={{ fontSize: '16px', color: '#334155', margin: '4px 0' }}>
               conducted at <span style={{ fontWeight: '700', textTransform: 'uppercase', color: '#000000' }}>{data.college}</span>
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px', width: '90%', marginInline: 'auto', textAlign: 'left', padding: '24px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: 0 }}>Examination Session</p>
                  <p style={{ fontSize: '16px', fontWeight: '900', color: '#002147', margin: 0 }}>{data.examDate || 'March 2026'}</p>
                  
                  <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: '8px 0 0 0' }}>Duration</p>
                  <p style={{ fontSize: '16px', fontWeight: '900', color: '#002147', margin: 0 }}>{data.duration || '6 MONTH'}</p>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ width: '140px', height: '100%', borderBottom: '1px dashed #cbd5e1', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2px' }}>
                     </div>
                  </div>
                  <div style={{ width: '140px', height: '1px', backgroundColor: '#002147', marginTop: '6px', marginBottom: '2px' }} />
                  <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#002147', margin: 0 }}>Authorized Signature</p>
               </div>
            </div>
         </div>

         {/* Footer */}
         <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px' }}>
               <p style={{ fontSize: '11px', fontWeight: '700', color: '#475569', margin: 0 }}>Issued on: {formatDate(data.issueDate) || new Date().toLocaleDateString()}</p>
               <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: 0 }}>Document Verified & System Generated</p>
            </div>
         </div>
      </div>
    </div>
  );
});

OfficialCertificate.displayName = 'OfficialCertificate';
