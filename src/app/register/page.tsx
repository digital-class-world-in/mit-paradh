'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import { ArrowLeft, CheckCircle, ChevronRight, UserCircle, X, UserPlus, HelpCircle, Eye, EyeOff } from 'lucide-react';
import Script from 'next/script';
import { studentAuth, realtimeDb } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';

declare global {
  interface Window {
    phoneEmailReceiver: (userObj: any) => void;
  }
}

export default function RegisterPage() {
  const [step, setStep] = useState(0); // 0: Category, 1: Prev Reg, 2: Form
  const [category, setCategory] = useState('Candidate');
  const [prevReg, setPrevReg] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    phone: '',
    secondaryPhone: '',
    securityQuestion: '',
    securityAnswer: '',
    password: '',
    confirmPassword: '',
    captchaInput: ''
  });

  // Captcha state
  const [captcha, setCaptcha] = useState({ a: 5, b: 2 });
  
  useEffect(() => {
    setCaptcha({ 
      a: Math.floor(Math.random() * 10), 
      b: Math.floor(Math.random() * 10) 
    });
  }, []);

  useEffect(() => {
    window.phoneEmailReceiver = async (userObj: any) => {
      const user_json_url = userObj.user_json_url;
      try {
        const response = await fetch(user_json_url);
        const data = await response.json();
        if (data.user_email_id) {
          const email = data.user_email_id;
          
          // Check if email already exists in Realtime DB
          if (realtimeDb) {
            const usersRef = ref(realtimeDb, 'users');
            const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
            const snapshot = await get(emailQuery);
            
            if (snapshot.exists()) {
              setEmailError('this email already use');
              setVerifiedEmail('');
              return;
            }
          }

          setEmailError('');
          setVerifiedEmail(email);
          setFormData(prev => ({ ...prev, email: email }));
          alert('Email Verification Successful !!');
        }
      } catch (error) {
        console.error('Error fetching verified email:', error);
        setVerifiedEmail('Verification Pending');
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseInt(formData.captchaInput) !== (captcha.a + captcha.b)) {
      alert('Invalid Security Check answer.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const trimmedEmail = (formData.email || verifiedEmail).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      alert('Please provide a valid email address.');
      return;
    }

    setLoading(true);

    const generateRegNo = () => {
      const year = new Date().getFullYear();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `MIT-${year}-${random}`;
    };

    try {
      if (!studentAuth) throw new Error("Auth service unavailable");

      // 1. Create User in Firebase Auth
      console.log("Creating user with email:", trimmedEmail);
      const userCredential = await createUserWithEmailAndPassword(studentAuth, trimmedEmail, formData.password);
      const user = userCredential.user;
      console.log("User created successfully:", user.uid);

      // 2. Save Profile in Realtime Database
      if (realtimeDb) {
        console.log("Saving profile to Realtime DB...");
        const regNo = generateRegNo();
        await set(ref(realtimeDb, `users/${user.uid}`), {
          uid: user.uid,
          email: trimmedEmail,
          role: 'student',
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          phone: formData.phone,
          gender: formData.gender.toLowerCase(),
          dateOfBirth: formData.dateOfBirth,
          password: formData.password,
          regNo: regNo,
          profile: {
            registrationDate: new Date().toISOString(),
            profileLocked: false,
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            phone: formData.phone,
            gender: formData.gender.toLowerCase(),
            dateOfBirth: formData.dateOfBirth,
            email: trimmedEmail
          }
        });
        console.log("Profile saved successfully.");
      }

      // Sign out so they can log in fresh and see the auto-fill
      await studentAuth.signOut();
      router.push(`/login/student?registered_email=${encodeURIComponent(trimmedEmail)}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 0: Category Selection ---
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-[#00a5a5] px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus size={20} />
              <h3 className="font-bold capitalize tracking-tight text-sm">Candidate Registration</h3>
            </div>
            <button onClick={() => router.push('/')} className="hover:rotate-90 transition-transform">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-black capitalize tracking-tight pl-1">Category *</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-2 border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] focus:bg-white rounded-xl transition-all appearance-none cursor-pointer"
              >
                  <option value="New">New</option>
                  <option value="Existing">Existing</option>
              </select>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="w-full bg-[#48bb78] hover:bg-[#38a169] text-white py-4 rounded-xl font-black text-xs capitalize tracking-normal shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} /> Candidate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 1: Previous Registration Check ---
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-[#00a5a5] px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus size={20} />
              <h3 className="font-bold capitalize tracking-tight text-sm">Candidate Registration</h3>
            </div>
            <button onClick={() => router.push('/')} className="hover:rotate-90 transition-transform">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-700">Have you registered for Admission Previously?</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="prevReg" 
                    value="yes" 
                    className="w-4 h-4 text-[#00a5a5] focus:ring-[#00a5a5]"
                    onChange={() => setPrevReg('yes')}
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="prevReg" 
                    value="no" 
                    className="w-4 h-4 text-[#00a5a5] focus:ring-[#00a5a5]"
                    onChange={() => setPrevReg('no')}
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">No</span>
                </label>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setStep(0)}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-400 py-3 rounded-lg font-bold text-xs capitalize tracking-tight hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button 
                disabled={!prevReg}
                onClick={() => {
                  if (prevReg === 'no') setStep(2);
                  else alert('Please use your existing credentials to login.');
                }}
                className="flex-1 bg-[#81e6d9] hover:bg-[#4fd1c5] disabled:opacity-50 text-slate-800 py-3 rounded-lg font-bold text-xs capitalize tracking-tight shadow-md transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: Main Form ---
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />
      <Navbar />

      <main className="max-w-6xl mx-auto w-full py-12 px-4">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-white">
          {/* Form Header */}
          <div className="bg-[#00a5a5] px-10 py-8 text-white flex items-center gap-5">
             <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
               <UserPlus size={32} />
             </div>
             <div>
               <h1 className="text-2xl font-black capitalize tracking-tight italic">New Candidate Registration</h1>
               <p className="text-[13px] font-black text-black capitalize tracking-normal mt-1 italic">Institutional Admission Pipeline 2026</p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-12 bg-white">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">First Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter first name" 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                    required 
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Middle / Father Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter middle name" 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                    required 
                    onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter last name" 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                    required 
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                    required 
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Gender</label>
                  <select 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all appearance-none cursor-pointer"
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option>Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
               </div>
            </div>

            {/* Verification & Mobile */}
            <div className="space-y-8 pt-8 border-t border-slate-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <div className="space-y-2">
                    <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Email ID</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <input 
                          type="email" 
                          name="username"
                          autoComplete="username"
                          placeholder="Enter your email ID" 
                          className={`w-full border-b-2 bg-[#f0f4f8] p-4 text-sm font-bold outline-none rounded-t-xl transition-all ${emailError ? 'border-red-500 text-red-600' : 'border-slate-200 text-slate-700'}`} 
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({...formData, email: e.target.value});
                            setVerifiedEmail(e.target.value); // keep for compatibility
                          }}
                        />
                        {emailError && (
                          <div className="absolute left-2 -bottom-6 text-[13px] font-bold text-black capitalize italic">
                            {emailError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Primary Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="Enter mobile number" 
                      className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                      required 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Secondary Mobile (Optional)</label>
                    <input 
                      type="tel" 
                      placeholder="Enter secondary mobile number" 
                      className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                      onChange={(e) => setFormData({...formData, secondaryPhone: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            {/* Security Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Security Question</label>
                  <select 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all appearance-none"
                    required
                    onChange={(e) => setFormData({...formData, securityQuestion: e.target.value})}
                  >
                    <option>Select a security question</option>
                    <option>What is your pet's name?</option>
                    <option>What was your first school?</option>
                    <option>What is your mother's maiden name?</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Security Answer</label>
                  <input 
                    type="text" 
                    placeholder="Enter your answer" 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all" 
                    required 
                    onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})}
                  />
               </div>
                <div className="space-y-2 relative">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Password</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="••••••••" 
                    className="w-full border-b-2 border-slate-200 bg-[#f0f4f8] p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all rounded-t-xl pr-12" 
                    required 
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bottom-4 text-slate-400 hover:text-[#00a5a5] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[13px] font-black text-black capitalize tracking-tight pl-2 italic">Confirm Password</label>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Confirm password" 
                    className="w-full border-b-2 border-slate-200 bg-transparent p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#00a5a5] transition-all pr-12" 
                    required 
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 bottom-4 text-slate-400 hover:text-[#00a5a5] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
            </div>

            {/* Captcha Section */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border-2 border-slate-200 space-y-6">
               <div className="flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center gap-6">
                    <span className="text-3xl font-black text-[#00a5a5] italic tracking-tight drop-shadow-sm">{captcha.a} + {captcha.b} = ?</span>
                    <button 
                      type="button" 
                      onClick={() => setCaptcha({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) })}
                      className="p-2 text-slate-300 hover:text-[#00a5a5] transition-colors rounded-full hover:bg-white"
                    >
                      <HelpCircle size={20} />
                    </button>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Enter Sum Value" 
                    className="max-w-[400px] w-full border-b-2 border-slate-200 bg-white p-4 text-center text-sm font-black text-slate-700 outline-none focus:border-[#00a5a5] transition-all rounded-xl shadow-inner" 
                    required 
                    value={formData.captchaInput}
                    onChange={(e) => setFormData({...formData, captchaInput: e.target.value})}
                  />
               </div>
            </div>

            <div className="pt-10">
               <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#81e6d9] hover:bg-[#4fd1c5] text-[#003366] py-5 rounded-2xl font-black text-sm capitalize tracking-normal shadow-xl shadow-teal-500/10 active:scale-95 transition-all disabled:opacity-50"
               >
                 {loading ? 'Processing...' : 'Register'}
               </button>
            </div>
          </form>

          <footer className="bg-slate-50 px-10 py-6 text-center border-t border-slate-200">
          </footer>
        </div>
      </main>
    </div>
  );
}



