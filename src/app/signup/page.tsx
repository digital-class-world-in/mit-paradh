'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ChevronRight, ArrowLeft, ShieldCheck, X } from 'lucide-react';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';

export default function SignupWizard() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Select Category');
  const [hasRegistered, setHasRegistered] = useState<string | null>(null);
  const [regNo, setRegNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState('');
  const router = useRouter();

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (hasRegistered === 'yes') {
        setStep(3);
      } else if (hasRegistered === 'no') {
        router.push('/register');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-[500px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200">
        <div className="bg-[#002147] px-10 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <UserPlus size={20} className="text-institutional-gold" />
             </div>
             <div>
               <h2 className="text-white font-black tracking-tight text-lg italic capitalize leading-tight">Candidate Registration</h2>
               <p className="text-[13px] font-bold text-black tracking-tight capitalize opacity-80 leading-tight">Institutional Enrollment Wizard</p>
             </div>
          </div>
          <button onClick={() => router.push('/')} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-3">
                 <label className="text-[13px] font-black text-black capitalize tracking-normal pl-1 leading-none">Identity Category *</label>
                 <select 
                   className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary focus:bg-white rounded-2xl p-5 font-black text-slate-700 outline-none transition-all appearance-none cursor-pointer" 
                   value={category}
                   onChange={(e) => setCategory(e.target.value)}
                 >
                   <option disabled hidden value="Select Category">Choice Identity Type</option>
                   <option value="Candidate">Regular Candidate</option>
                   <option value="Ex-Candidate">Ex-Candidate (Re-Enrolling)</option>
                 </select>
               </div>
               
               <button 
                onClick={handleNext} 
                className="w-full bg-primary hover:bg-primary-dark text-black font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 capitalize tracking-normal text-[13px]"
                disabled={category === 'Select Category'}
              >
                Intake Protocol Initiation <ChevronRight size={16} className="text-institutional-gold" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                 <p className="text-slate-800 font-extrabold text-lg tracking-tighter leading-tight italic">Have you undergone institutional registration previously with the Board?</p>
                 <div className="h-1 w-12 bg-institutional-gold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'yes', label: 'Affirmative (Yes)' },
                  { id: 'no', label: 'Negative (No)' }
                ].map((opt) => (
                  <label key={opt.id} className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-4 group 
                    ${hasRegistered === opt.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg' : 'border-slate-200 bg-slate-50 hover:border-primary/30'}
                  `}>
                    <input 
                      type="radio" 
                      name="registered" 
                      className="hidden"
                      onChange={() => setHasRegistered(opt.id)}
                      checked={hasRegistered === opt.id}
                    />
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors 
                      ${hasRegistered === opt.id ? 'border-primary bg-primary' : 'border-slate-300 bg-white group-hover:border-primary/50'}
                    `}>
                      {hasRegistered === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-[11px] font-black capitalize tracking-tight transition-colors 
                      ${hasRegistered === opt.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}
                    `}>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-6 pt-5">
                <button onClick={handleBack} className="flex-1 border-2 border-slate-200 text-black font-black py-5 rounded-2xl hover:bg-slate-50 transition-colors capitalize tracking-normal text-[13px] flex items-center justify-center gap-2">
                   <ArrowLeft size={16} /> Retreat
                </button>
                <button 
                  onClick={handleNext} 
                  className="flex-[2] bg-primary hover:bg-primary-dark text-black font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 capitalize tracking-normal text-[13px]"
                  disabled={!hasRegistered}
                >
                  Confirm Status
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4 mb-2">
                  <ShieldCheck size={24} className="text-primary" />
                  <p className="text-[13px] font-bold text-black leading-relaxed capitalize tracking-wide">Enter your legacy identification credentials to synchronize records.</p>
               </div>

               {[
                 { label: 'Board Registration Number', value: regNo, set: setRegNo, type: 'text', placeholder: 'Ex: MSB-2024-XXXX' },
                 { label: 'Candidate First Name', value: firstName, set: setFirstName, type: 'text', placeholder: 'Ex: Rahul' },
                 { label: 'Documented Date of Birth', value: dob, set: setDob, type: 'date', placeholder: '' }
               ].map((field, i) => (
                 <div key={i} className="space-y-2">
                   <label className="text-[13px] font-black text-black capitalize tracking-normal pl-1 leading-none">{field.label}</label>
                   <input 
                     type={field.type} 
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary focus:bg-white rounded-2xl p-4 font-black text-slate-700 outline-none transition-all placeholder:opacity-30" 
                     placeholder={field.placeholder}
                     value={field.value} 
                     onChange={(e) => field.set(e.target.value)}
                   />
                 </div>
               ))}

               <div className="space-y-4 pt-4">
                 <button 
                   className="w-full bg-[#002147] hover:bg-black text-black font-black py-5 rounded-2xl shadow-2xl shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-30 capitalize tracking-normal text-[13px]"
                   disabled={!regNo || !firstName || !dob}
                 >
                   Synchronize & Retrieve Account
                 </button>
                 <button onClick={handleBack} className="block w-full text-center text-[13px] font-black text-black hover:text-black transition-colors capitalize tracking-normal">Correction / Back</button>
               </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-10 py-5 text-center border-t border-slate-200">
          <p className="text-[9px] font-black text-slate-300 capitalize tracking-[0.6em] italic leading-none">Security Encryption Protocol Active</p>
        </div>
        </div>
      </main>
    </div>
  );
}



