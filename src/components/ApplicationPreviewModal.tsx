import React from 'react';
import { X, Lock, Edit2 } from 'lucide-react';

interface ApplicationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onNext: () => void;
  formData: any;
  selectedCollegeName?: string;
  selectedCourseType?: string;
  selectedCourseName?: string;
  selectedDuration?: string;
}

export default function ApplicationPreviewModal({
  isOpen,
  onClose,
  onEdit,
  onNext,
  formData
}: ApplicationPreviewModalProps) {
  if (!isOpen) return null;

  const currentDate = new Date();

  // Collect all uploaded documents
  const uploadedDocuments = [
    { label: 'Photo', name: formData.photoUrlFileName },
    { label: 'Signature', name: formData.signUrlFileName },
    { label: 'Aadhaar Front', name: formData.aadhaarFrontUrlFileName },
    { label: 'Aadhaar Back', name: formData.aadhaarBackUrlFileName },
    { label: 'Domicile Certificate', name: formData.domicileUrlFileName },
    { label: 'Caste Certificate', name: formData.casteCertificateUrlFileName },
    { label: 'PWD Certificate', name: formData.pwdCertificateUrlFileName },
    ...(formData.qualifications || []).filter((q: any) => q.marksheetName).map((q: any) => ({
      label: `${q.examination} Marksheet`, name: q.marksheetName
    })),
    { label: 'Training Certificate', name: formData.trainingCertificateUrlFileName },
    { label: 'Bank Passbook / Cheque', name: formData.bankPassbookUrlFileName },
    { label: 'PAN Card', name: formData.panCardUrlFileName },
  ].filter(doc => doc.name);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide text-slate-800">APPLICATION FORM</h3>
            <p className="text-xs text-slate-500 mt-1">Review your details before locking your profile.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 transition-colors p-2 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-8 overflow-y-auto">
          <table className="w-full text-left border-collapse border border-slate-800 text-[13px] bg-white shadow-sm">
            <tbody>
              {/* Top Form Header */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-200 p-3 font-bold uppercase text-slate-900 text-center tracking-widest text-lg">
                  APPLICATION FORM
                </th>
              </tr>

              {/* Primary Details */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  1. Primary Details
                </th>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50 w-1/4">Registration No</td>
                <td className="border border-slate-800 p-2.5 w-1/4 font-bold text-indigo-700">{formData.regNo || formData.registrationNo || 'PENDING'}</td>
                <td rowSpan={6} colSpan={2} className="border border-slate-800 p-4 w-1/2 align-middle text-center print:table-cell">
                  <div className="flex justify-center items-center h-full">
                    <div className="w-[120px] h-[150px] border-2 border-slate-800 p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      {formData.photoUrl || formData.photo ? <img src={formData.photoUrl || formData.photo} alt="Photo" crossOrigin="anonymous" className="w-full h-full object-cover print:block" /> : <span className="text-xs text-slate-400">Passport Photo</span>}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50 w-1/4">Course</td>
                <td className="border border-slate-800 p-2.5 w-1/4 font-bold uppercase">{formData.courseName || formData.course || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50 w-1/4">Candidate's Name</td>
                <td className="border border-slate-800 p-2.5 w-1/4 uppercase font-bold">{`${formData.firstName || ''} ${formData.middleName || ''} ${formData.lastName || ''}`.trim() || formData.studentName || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Date of Birth</td>
                <td className="border border-slate-800 p-2.5">{formData.dateOfBirth || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Gender</td>
                <td className="border border-slate-800 p-2.5">{formData.gender || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Aadhaar No</td>
                <td className="border border-slate-800 p-2.5">{formData.aadhaarNo || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Mobile Number</td>
                <td className="border border-slate-800 p-2.5">{formData.phone || '-'}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Email ID</td>
                <td className="border border-slate-800 p-2.5">{formData.email || '-'}</td>
              </tr>

              {/* Address Details */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  2. Address Details
                </th>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Correspondence Address</td>
                <td colSpan={3} className="border border-slate-800 p-2.5">{`${formData.address || ''}, ${formData.city || ''}, ${formData.district || ''}, ${formData.state || ''} - ${formData.pincode || ''}`.trim().replace(/^,|,$/g, '') || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Permanent Address</td>
                <td colSpan={3} className="border border-slate-800 p-2.5">{formData.sameAsCorrespondence === 'Yes' ? 'Same as Correspondence' : `${formData.permAddress || ''}, ${formData.permCity || ''}, ${formData.permDistrict || ''}, ${formData.permState || ''} - ${formData.permPincode || ''}`.trim().replace(/^,|,$/g, '') || '-'}</td>
              </tr>

              {/* Parent Details */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  3. Parent / Guardian Details
                </th>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Father's Name</td>
                <td className="border border-slate-800 p-2.5">{`${formData.fatherFirstName || ''} ${formData.fatherMiddleName || ''} ${formData.fatherLastName || ''}`.trim() || '-'}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Mother's Name</td>
                <td className="border border-slate-800 p-2.5">{`${formData.motherFirstName || ''} ${formData.motherMiddleName || ''} ${formData.motherLastName || ''}`.trim() || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Annual Income</td>
                <td className="border border-slate-800 p-2.5">{formData.annualIncome || '-'}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Marital Status</td>
                <td className="border border-slate-800 p-2.5">{formData.maritalStatus || '-'}</td>
              </tr>

              {/* Category */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  4. Category & Reservation
                </th>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Religion</td>
                <td className="border border-slate-800 p-2.5">{formData.religion || '-'}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Caste Category</td>
                <td className="border border-slate-800 p-2.5">{formData.casteCategory || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Caste / Sub-Caste</td>
                <td className="border border-slate-800 p-2.5">{formData.caste || '-'}{formData.subCaste ? ` / ${formData.subCaste}` : ''}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">PWD</td>
                <td className="border border-slate-800 p-2.5">{formData.isPWD || '-'}</td>
              </tr>

              {/* Qualifications */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  5. Educational Qualifications
                </th>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-800 p-0">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-r border-slate-800 p-2 font-semibold">Examination</th>
                        <th className="border-r border-slate-800 p-2 font-semibold">Board/University</th>
                        <th className="border-r border-slate-800 p-2 font-semibold">Passing Date</th>
                        <th className="p-2 font-semibold">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.qualifications || []).length > 0 ? (
                        formData.qualifications.map((q: any, i: number) => (
                          <tr key={i} className="border-t border-slate-800">
                            <td className="border-r border-slate-800 p-2">{q.examination}</td>
                            <td className="border-r border-slate-800 p-2">{q.board}</td>
                            <td className="border-r border-slate-800 p-2">{q.passingDate}</td>
                            <td className="p-2 font-bold">{q.percentage}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-slate-800"><td colSpan={4} className="p-2 text-center text-slate-400 italic">No qualifications added</td></tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Training */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  6. Training Details
                </th>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Has Training?</td>
                <td className="border border-slate-800 p-2.5">{formData.hasTraining || '-'}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Duration</td>
                <td className="border border-slate-800 p-2.5">
                  {formData.hasTraining === 'Yes' ? `${formData.trainingStartDate || '-'} to ${formData.trainingEndDate || '-'}` : '-'}
                </td>
              </tr>

              {/* Additional Details */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  7. Additional Details
                </th>
              </tr>
              <tr>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Blood Group</td>
                <td className="border border-slate-800 p-2.5">{formData.bloodGroup || '-'}</td>
                <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Mother Tongue</td>
                <td className="border border-slate-800 p-2.5">{formData.motherTongue || '-'}</td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-800 p-0">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-r border-slate-800 p-2 font-semibold">Language Known</th>
                        <th className="border-r border-slate-800 p-2 font-semibold text-center">Read</th>
                        <th className="border-r border-slate-800 p-2 font-semibold text-center">Write</th>
                        <th className="p-2 font-semibold text-center">Speak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.languagesKnown || []).length > 0 ? (
                        formData.languagesKnown.map((l: any, i: number) => (
                          <tr key={i} className="border-t border-slate-800">
                            <td className="border-r border-slate-800 p-2">{l.language}</td>
                            <td className="border-r border-slate-800 p-2 text-center">{l.read ? 'Yes' : 'No'}</td>
                            <td className="border-r border-slate-800 p-2 text-center">{l.write ? 'Yes' : 'No'}</td>
                            <td className="p-2 text-center">{l.speak ? 'Yes' : 'No'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-slate-800"><td colSpan={4} className="p-2 text-center text-slate-400 italic">No languages added</td></tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Bank Details */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  8. Bank Details
                </th>
              </tr>
              {(formData.hasBankAccount === 'Yes' || formData.accountNumber || formData.bankName) ? (
                <>
                  <tr>
                    <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Account Name</td>
                    <td className="border border-slate-800 p-2.5">{formData.accountHolderName || '-'}</td>
                    <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Account No</td>
                    <td className="border border-slate-800 p-2.5">{formData.accountNumber || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Bank & Branch</td>
                    <td className="border border-slate-800 p-2.5">{formData.bankName} - {formData.branchName}</td>
                    <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">IFSC Code</td>
                    <td className="border border-slate-800 p-2.5">{formData.ifscCode || '-'}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">Has Bank Account?</td>
                  <td className="border border-slate-800 p-2.5">No</td>
                  <td className="border border-slate-800 p-2.5 font-semibold bg-slate-50">PAN Card No</td>
                  <td className="border border-slate-800 p-2.5">{formData.panCardNo || '-'}</td>
                </tr>
              )}

              {/* Work Experience */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  9. Work Experience
                </th>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-800 p-0">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-r border-slate-800 p-2 font-semibold">Organization</th>
                        <th className="border-r border-slate-800 p-2 font-semibold">Designation</th>
                        <th className="border-r border-slate-800 p-2 font-semibold">From</th>
                        <th className="p-2 font-semibold">To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.workExperiences || []).length > 0 ? (
                        formData.workExperiences.map((w: any, i: number) => (
                          <tr key={i} className="border-t border-slate-800">
                            <td className="border-r border-slate-800 p-2">{w.organization}</td>
                            <td className="border-r border-slate-800 p-2">{w.designation}</td>
                            <td className="border-r border-slate-800 p-2">{w.fromDate}</td>
                            <td className="p-2">{w.toDate}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t border-slate-800"><td colSpan={4} className="p-2 text-center text-slate-400 italic">No work experience added</td></tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Uploaded Documents */}
              <tr>
                <th colSpan={4} className="border border-slate-800 bg-slate-100 p-2.5 font-bold uppercase text-slate-900 text-xs tracking-wider">
                  Uploaded Documents
                </th>
              </tr>
              <tr>
                <td colSpan={4} className="border border-slate-800 p-6">
                  <div className="flex flex-col gap-y-3">
                    {uploadedDocuments.length > 0 ? (
                      uploadedDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-4 text-sm">
                          <span className="font-bold text-slate-900">{idx + 1}.</span>
                          <span className="font-semibold text-slate-800 tracking-wide uppercase">{doc.label}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No documents uploaded</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Declaration & Signature */}
              <tr>
                <td colSpan={4} className="border border-slate-800 p-6 bg-white">
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-sm font-medium text-slate-900 space-y-1">
                      <p>Date: <span className="font-bold">{currentDate.toLocaleDateString('en-GB')}</span></p>
                      <p>Time: <span className="font-bold">{currentDate.toLocaleTimeString('en-US')}</span></p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-40 h-16 border-b-2 border-slate-800 mb-2 flex items-end justify-center pb-1">
                        {formData.signUrl || formData.signature ? <img src={formData.signUrl || formData.signature} alt="Signature" crossOrigin="anonymous" className="max-h-full object-contain print:block" /> : <span className="text-slate-400 italic text-xs mb-2">Signature</span>}
                      </div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Signature of Student</p>
                    </div>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50 flex justify-center gap-4 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={onEdit} className="bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-8 rounded-lg shadow-sm transition-all text-sm capitalize flex items-center gap-2">
            <Edit2 size={16} /> Edit Details
          </button>
          <button onClick={onNext} className="bg-[#ff9f1c] hover:bg-orange-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition-all text-sm capitalize flex items-center gap-2">
            <Lock size={16} /> Lock Profile
          </button>
        </div>
      </div>
    </div>
  );
}
