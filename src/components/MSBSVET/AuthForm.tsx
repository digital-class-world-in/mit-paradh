'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth, studentAuth, collegeAuth, staffAuth, realtimeDb } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { User, Lock, Eye, EyeOff, AlertCircle, X, ChevronRight, Loader2 } from 'lucide-react';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';

interface AuthFormProps {
  title: string;
  subtitle: string;
  role: 'student' | 'admin' | 'staff' | 'college';
}

export const AuthFormContent = ({ title, subtitle, role }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-fill email if provided in URL
  useEffect(() => {
    const registeredEmail = searchParams.get('registered_email');
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [searchParams]);

  // Prefetch dashboard routes for instant transition
  useEffect(() => {
    router.prefetch('/admin/dashboard');
    router.prefetch('/student/dashboard');
    router.prefetch('/staff/dashboard');
    router.prefetch('/college/dashboard');
  }, [router]);

  // Select correct auth instance based on role
  const selectedAuth = 
    role === 'student' ? studentAuth : 
    role === 'college' ? collegeAuth : 
    role === 'staff' ? staffAuth : 
    auth; // Default to admin auth

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // â”€â”€ MASTER ADMIN BYPASS â”€â”€
      const normalizedEmail = email.toLowerCase().trim();
      
      // â”€â”€ MASTER ADMIN BYPASS â”€â”€
      if (role === 'admin' && normalizedEmail === 'mitparadh@gmail.com' && password === 'mitparadh@123') {
        console.log("Master Admin Bypass triggered successfully.");
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('isAdminMaster', 'true');
          router.push('/admin/dashboard');
        }
        return;
      }

      // â”€â”€ MASTER STAFF BYPASS â”€â”€
      if (role === 'staff' && normalizedEmail === 'staff@mitparadh.com' && password === 'staff@123') {
        console.log("Master Staff Bypass triggered successfully.");
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('isStaffMaster', 'true');
          router.push('/staff/dashboard');
        }
        return;
      }
      
      // Ensure we clear master bypass if using regular auth
      sessionStorage.removeItem('isAdminMaster');
      sessionStorage.removeItem('isStaffMaster');

      console.log(`Attempting login for role: ${role} using instance:`, selectedAuth?.app?.name || 'Default');
      const userCredential = await signInWithEmailAndPassword(selectedAuth, email, password);
      const user = userCredential.user;
      console.log("Auth success, UID:", user.uid);

      if (realtimeDb && typeof realtimeDb === 'object') {
        console.log("Verifying user role in RealtimeDB...");
        const userRef = ref(realtimeDb, 'users/' + user.uid);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log("User data found in DB:", userData);
          if (userData.role === role) {
            console.log(`Role match! Redirecting to /${role}/dashboard`);
            router.push(`/${role}/dashboard`);
          } else {
            console.warn(`Role mismatch! User role is ${userData.role}, expected ${role}`);
            setError(`Unauthorized: Access restricted to ${role}s only.`);
            await selectedAuth.signOut();
            setLoading(false);
          }
        } else {
          console.warn("User exists in Auth but not in RealtimeDB users/ node. Allowing entry by default.");
          router.push(`/${role}/dashboard`);
        }
      } else {
        // DB not configured, but auth worked - allow entry
        console.log("RealtimeDB not configured, allowing entry based on Auth only.");
        router.push(`/${role}/dashboard`);
      }
    } catch (err: any) {
      console.error("Detailed login error:", err);
      
      let friendlyError = 'Invalid ID or Password. Please try again.';
      
      if (err.message === "Authentication service is not initialized.") {
        friendlyError = "Server configuration error. Please check environment variables.";
      } else if (err.code === 'auth/invalid-credential') {
        friendlyError = "The Email or Password you entered is incorrect. Please double-check and try again.";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = "Too many failed attempts. Your account has been temporarily locked. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = "Network error. Please check your internet connection or disable ad-blockers/VPNs that might be blocking Firebase.";
      }

      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      <Header />
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12">
      {/* Back to Home Link */}
      <Link href="/" className="mb-8 flex items-center gap-2 text-slate-400 hover:text-[#003366] transition-colors text-xs font-bold capitalize tracking-tight">
        <X size={14} /> Back to Homepage
      </Link>

      <div className="w-full max-w-[440px] bg-white shadow-xl border border-slate-200 overflow-hidden rounded-md">
        {/* Simple Institutional Header */}
        <div className="bg-[#003366] px-8 py-6 text-white text-center">
            <h2 className="text-xl font-bold tracking-tight capitalize">{title}</h2>
            <p className="text-[12px] text-white/70 font-normal mt-1">{subtitle}</p>
            <p className="text-[13px] text-black font-normal capitalize tracking-normal mt-2 italic">Official Access Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-600 mt-0.5" />
              <p className="text-[11px] font-bold text-red-700 capitalize leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">
                {role === 'admin' ? 'email id' : 'Enrollment ID / Email'}
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#003366] focus:bg-white p-3.5 pl-12 text-sm text-slate-700 outline-none transition-all rounded"
                  placeholder="Enter your ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-normal text-black capitalize tracking-tight pl-1">Password</label>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#003366] focus:bg-white p-3.5 pl-12 pr-12 text-sm text-slate-700 outline-none transition-all rounded"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#003366] hover:bg-black text-white font-bold py-4 rounded text-xs capitalize tracking-normal transition-all disabled:opacity-70 flex items-center justify-center gap-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validating...
                </>
              ) : (
                'Log In to Portal'
              )}
            </button>
          </form>

          {role === 'student' && (
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
               <p className="text-[13px] font-bold text-black capitalize tracking-tight mb-4">New Student?</p>
               <Link 
                href="/register" 
                className="inline-flex items-center gap-2 text-xs font-bold text-[#8b0000] hover:underline capitalize tracking-wide"
               >
                 Go to Registration Center <ChevronRight size={14} />
               </Link>
            </div>
          )}
        </div>

        <div className="bg-slate-50 py-4 text-center border-t border-slate-200">
           <p className="text-[9px] font-bold text-slate-300 capitalize tracking-tight">Â© MIT Institutional ERP 4.0</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export const AuthForm = (props: AuthFormProps) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
          <div className="w-20 h-20 border-4 border-t-[#003366] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <div className="text-black font-black capitalize tracking-normal text-[13px] animate-pulse">
          Establishing Secure Portal Link
        </div>
      </div>
    }>
      <AuthFormContent {...props} />
    </Suspense>
  );
};




