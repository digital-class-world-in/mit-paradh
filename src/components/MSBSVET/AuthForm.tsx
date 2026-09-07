'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  auth,
  studentAuth,
  staffAuth,
  collegeAuth,
  realtimeDb
} from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { User, Lock, Eye, EyeOff, AlertCircle, X, ChevronRight, Loader2, ShieldCheck, CheckCircle2, GraduationCap, Building2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import LiveFooter from '@/components/LiveFooter';

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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUid, setForgotUid] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const [authChecking, setAuthChecking] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Select correct auth instance based on role to ensure session isolation across portals
  const selectedAuth = (role === 'student' ? studentAuth :
    role === 'staff' ? staffAuth :
      role === 'college' ? collegeAuth : auth) || auth;

  // Prefetch dashboard routes for instant transition & check if already authenticated on mount
  useEffect(() => {
    router.prefetch('/admin/dashboard');
    router.prefetch('/student/dashboard');
    router.prefetch('/staff/dashboard');
    router.prefetch('/college/dashboard');

    if (typeof window !== 'undefined') {
      const isEmergencyBypass = sessionStorage.getItem('emergencyBypass') === 'true';
      const bypassedUid = sessionStorage.getItem('bypassedUid');
      const isAdminMaster = sessionStorage.getItem('isAdminMaster') === 'true';
      const isStaffMaster = sessionStorage.getItem('isStaffMaster') === 'true';

      if (
        (role === 'admin' && isAdminMaster) ||
        (role === 'staff' && isStaffMaster) ||
        (isEmergencyBypass && bypassedUid)
      ) {
        console.log(`[AuthForm] Bypass active. Redirecting to /${role}/dashboard`);
        router.push(`/${role}/dashboard`);
        return;
      }
    }

    const unsubscribe = onAuthStateChanged(selectedAuth, (user) => {
      if (user) {
        console.log(`[AuthForm] Already logged in. Redirecting to /${role}/dashboard`);
        router.push(`/${role}/dashboard`);
      } else {
        setAuthChecking(false);
      }
    });

    return () => unsubscribe();
  }, [selectedAuth, role, router]);

  // Auto-fill email if provided in URL
  useEffect(() => {
    const registeredEmail = searchParams.get('registered_email');
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let shouldKeepLoading = false;
    let loginEmail = email.toLowerCase().trim();

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // ── MASTER ADMIN BYPASS ──
      if (role === 'admin' && normalizedEmail === 'mitparadh@gmail.com' && password === 'mitparadh@123') {
        console.log("Master Admin Bypass triggered successfully.");
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('isAdminMaster', 'true');
          shouldKeepLoading = true;
          router.push('/admin/dashboard');
        }
        return;
      }

      // ── MASTER STAFF BYPASS ──
      if (role === 'staff' && normalizedEmail === 'staff@mitparadh.com' && password === 'staff@123') {
        console.log("Master Staff Bypass triggered successfully.");
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('isStaffMaster', 'true');
          shouldKeepLoading = true;
          router.push('/staff/dashboard');
        }
        return;
      }

      // Ensure we clear master bypass if using regular auth
      sessionStorage.removeItem('isAdminMaster');
      sessionStorage.removeItem('isStaffMaster');

      console.log(`[AuthForm] Attempting login for role: ${role} using instance:`, selectedAuth?.app?.name || 'Default');

      loginEmail = normalizedEmail;

      // ── ENROLLMENT / STUDENT ID LOOKUP ──
      // If the input looks like an Enrollment ID (starts with MIT-) or Student ID (starts with STU), look up the email
      if (role === 'student' && (normalizedEmail.startsWith('mit-') || normalizedEmail.startsWith('stu'))) {
        console.log("[AuthForm] Input recognized as Enrollment or Student ID. Looking up email...");
        const usersRef = ref(realtimeDb, 'users');
        const searchField = normalizedEmail.startsWith('mit-') ? 'regNo' : 'studentId';
        const searchVal = email.toUpperCase().trim();
        const idQuery = query(usersRef, orderByChild(searchField), equalTo(searchVal));
        const idSnapshot = await get(idQuery);

        if (idSnapshot.exists()) {
          const matchingUsers = idSnapshot.val();
          const firstUid = Object.keys(matchingUsers)[0];
          loginEmail = matchingUsers[firstUid].email;
          console.log("[AuthForm] ID found in users. Associated email:", loginEmail);
        } else {
          console.warn("[AuthForm] ID not found in users. Searching in colleges via optimized queries...");
          try {
            const dbUrl = "https://mit-paradh-default-rtdb.firebaseio.com";
            const response = await fetch(`${dbUrl}/colleges.json?shallow=true`);
            if (response.ok) {
              const collegesData = await response.json();
              const collegeIds = Object.keys(collegesData || {});
              
              let foundEmail = null;
              const searchValUpper = searchVal.toUpperCase();
              
              for (const cId of collegeIds) {
                const stuQuery = query(ref(realtimeDb, `colleges/${cId}/students`), orderByChild(searchField), equalTo(searchValUpper));
                const stuSnap = await get(stuQuery);
                if (stuSnap.exists()) {
                  const stus = stuSnap.val();
                  const firstStuUid = Object.keys(stus)[0];
                  foundEmail = stus[firstStuUid].email;
                  break;
                }
              }
              if (foundEmail) {
                loginEmail = foundEmail;
                console.log("[AuthForm] ID found in colleges. Associated email:", loginEmail);
              } else {
                console.warn("[AuthForm] ID not found in colleges either.");
              }
            }
          } catch (e) {
            console.error("Optimized colleges search failed", e);
          }
        }
      }

      const userCredential = await signInWithEmailAndPassword(selectedAuth, loginEmail, password);
      const user = userCredential.user;
      console.log("[AuthForm] Auth successful! UID:", user.uid);

      if (realtimeDb && typeof realtimeDb === 'object') {
        console.log("[AuthForm] Checking role in database...");
        const userRef = ref(realtimeDb, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log("[AuthForm] Database user found:", userData);

          if (userData.role === role) {
            console.log(`[AuthForm] Role verified: ${role}. Redirecting to /${role}/dashboard...`);
            if (typeof window !== 'undefined') {
              shouldKeepLoading = true;
              router.push(`/${role}/dashboard`);
            }
          } else {
            console.warn(`[AuthForm] Role mismatch! User is ${userData.role}, expected ${role}`);
            setError(`Unauthorized: Your account is registered as ${userData.role}, but you are trying to log in as ${role}.`);
            await selectedAuth.signOut();
            setLoading(false);
          }
        } else {
          console.warn("[AuthForm] User record not found in database. Proceeding to dashboard by default.");
          if (typeof window !== 'undefined') {
            shouldKeepLoading = true;
            router.push(`/${role}/dashboard`);
          }
        }
      } else {
        console.log("[AuthForm] Database not available. Proceeding based on authentication only.");
        if (typeof window !== 'undefined') {
          shouldKeepLoading = true;
          router.push(`/${role}/dashboard`);
        }
      }
    } catch (err: any) {
      console.error("[AuthForm] LOGIN ERROR:", err);

      // --- CUSTOM PASSWORD BYPASS INTERCEPT ---
      // If Firebase Auth fails but the custom password in RealtimeDB matches, allow login
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-email'
      ) {
        if (role === 'college' && realtimeDb) {
          try {
            let firstUid = null;
            const inputValLower = email.toLowerCase().trim();
            const collegeQuery = query(ref(realtimeDb, 'colleges'), orderByChild('email'), equalTo(inputValLower));
            const collegeSnap = await get(collegeQuery);
            if (collegeSnap.exists()) {
              const matchingColleges = collegeSnap.val();
              for (const uid in matchingColleges) {
                if (matchingColleges[uid].password === password) {
                  firstUid = uid;
                  break;
                }
              }
            }
            if (firstUid) {
              console.warn("Bypassed Firebase Auth using RealtimeDB custom password for college");
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('emergencyBypass', 'true');
                sessionStorage.setItem('bypassedUid', firstUid);
                shouldKeepLoading = true;
                router.push(`/${role}/dashboard`);
              }
              return;
            }
          } catch (bypassErr) {
            console.error("College bypass check failed:", bypassErr);
          }
        }

        if (role === 'student' && realtimeDb) {
          try {
            let firstUid = null;
            const inputValLower = email.toLowerCase().trim();
            const inputValUpper = email.toUpperCase().trim();
            
            // 1. Search in global users using optimized queries
            let matchSnap = await get(query(ref(realtimeDb, 'users'), orderByChild('email'), equalTo(inputValLower)));
            if (!matchSnap.exists() && loginEmail) {
               matchSnap = await get(query(ref(realtimeDb, 'users'), orderByChild('email'), equalTo(loginEmail.toLowerCase())));
            }
            if (!matchSnap.exists()) {
               matchSnap = await get(query(ref(realtimeDb, 'users'), orderByChild('regNo'), equalTo(inputValUpper)));
            }
            if (!matchSnap.exists()) {
               matchSnap = await get(query(ref(realtimeDb, 'users'), orderByChild('studentId'), equalTo(inputValUpper)));
            }

            if (matchSnap.exists()) {
               const allUsers = matchSnap.val();
               for (const uid in allUsers) {
                 if (allUsers[uid].password === password) {
                   firstUid = uid;
                   break;
                 }
               }
            }

            // 2. Search in colleges using optimized API
            if (!firstUid) {
              console.log("[AuthForm] Student not found in users bypass. Searching colleges optimally...");
              try {
                const dbUrl = "https://mit-paradh-default-rtdb.firebaseio.com";
                const response = await fetch(`${dbUrl}/colleges.json?shallow=true`);
                if (response.ok) {
                  const collegesData = await response.json();
                  const collegeIds = Object.keys(collegesData || {});
                  
                  for (const cId of collegeIds) {
                     let cMatchSnap = await get(query(ref(realtimeDb, `colleges/${cId}/students`), orderByChild('email'), equalTo(inputValLower)));
                     if (!cMatchSnap.exists() && loginEmail) {
                        cMatchSnap = await get(query(ref(realtimeDb, `colleges/${cId}/students`), orderByChild('email'), equalTo(loginEmail.toLowerCase())));
                     }
                     if (!cMatchSnap.exists()) {
                        cMatchSnap = await get(query(ref(realtimeDb, `colleges/${cId}/students`), orderByChild('regNo'), equalTo(inputValUpper)));
                     }
                     if (!cMatchSnap.exists()) {
                        cMatchSnap = await get(query(ref(realtimeDb, `colleges/${cId}/students`), orderByChild('studentId'), equalTo(inputValUpper)));
                     }
                     
                     if (cMatchSnap.exists()) {
                       const stus = cMatchSnap.val();
                       for (const stuUid in stus) {
                         if (stus[stuUid].password === password) {
                           firstUid = stuUid;
                           break;
                         }
                       }
                     }
                     if (firstUid) break;
                  }
                }
              } catch (e) {
                console.error("Colleges bypass search failed", e);
              }
            }

            if (firstUid) {
              console.warn("Bypassed Firebase Auth using RealtimeDB custom password");
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('emergencyBypass', 'true');
                sessionStorage.setItem('bypassedUid', firstUid);
                shouldKeepLoading = true;
                router.push(`/${role}/dashboard`);
              }
              return;
            }
          } catch (bypassErr) {
            console.error("Bypass check failed:", bypassErr);
          }
        }
      }

      let friendlyError = 'Invalid Email or Password. Please try again.';

      if (err.message === "Authentication service is not initialized.") {
        friendlyError = "Server configuration error. Please check environment variables.";
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyError = "The Email or Password you entered is incorrect. Please double-check and try again.";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = "Too many failed attempts. Your account has been temporarily locked. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        friendlyError = "Network error. Please check your internet connection or disable ad-blockers/VPNs that might be blocking Firebase.";
      }

      setError(friendlyError);
    } finally {
      if (!shouldKeepLoading) {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      if (forgotStep === 1) {
        const normalizedEmail = forgotEmail.toLowerCase().trim();
        const usersRef = ref(realtimeDb, 'users');
        const usersSnapshot = await get(usersRef);

        let foundUid = null;
        if (usersSnapshot.exists()) {
          const allUsers = usersSnapshot.val();
          for (const uid in allUsers) {
            if (allUsers[uid].email?.toLowerCase().trim() === normalizedEmail && allUsers[uid].role === 'student') {
              foundUid = uid;
              break;
            }
          }
        }

        if (!foundUid) {
          throw new Error('wrong-email');
        }

        setForgotUid(foundUid);
        setForgotMessage('Verified successfully!');
        setForgotStep(2);
      } else if (forgotStep === 2) {
        if (newPassword !== confirmPassword) {
          throw new Error('passwords-do-not-match');
        }

        if (newPassword.length < 6) {
          throw new Error('weak-password');
        }

        const { update } = await import('firebase/database');
        const userRef = ref(realtimeDb, `users/${forgotUid}`);
        await update(userRef, { password: newPassword });

        setForgotMessage('Password updated successfully! Redirecting to login...');

        setTimeout(() => {
          setShowForgotModal(false);
          setEmail(forgotEmail);
          setPassword(newPassword);
          setForgotStep(1);
          setForgotMessage('');
          setForgotEmail('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      }

    } catch (err: any) {
      console.error("FORGOT PASSWORD ERROR:", err);
      if (err.message === 'wrong-email') {
        setForgotError('Wrong email. No registered student found with this email address.');
      } else if (err.message === 'passwords-do-not-match') {
        setForgotError('Passwords do not match. Please try again.');
      } else if (err.message === 'weak-password') {
        setForgotError('Password must be at least 6 characters long.');
      } else {
        setForgotError('Error: ' + (err.message || 'Unknown error occurred.'));
      }
    } finally {
      setForgotLoading(false);
    }
  };

  if (authChecking || loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-slate-200 rounded-full" />
        <div className="w-20 h-20 border-4 border-t-[#003366] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-black font-black capitalize tracking-normal text-[13px]">
          {loading ? "Validating Credentials" : "Establishing Secure Portal Link"}
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#ff9f1c] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );

  const roleConfig = {
    student: {
      icon: GraduationCap,
      badge: 'Student & Academic Portal',
      label: 'Enrollment ID or Email',
      placeholder: 'Enrollment ID or Email',
    },
    college: {
      icon: Building2,
      badge: 'College & Branch Portal',
      label: 'College Code / Email',
      placeholder: 'College Email or Branch ID',
    },
    staff: {
      icon: User,
      badge: 'Faculty & Teacher Portal',
      label: 'Staff ID or Email',
      placeholder: 'Staff Email or Employee ID',
    },
    admin: {
      icon: ShieldCheck,
      badge: 'Board Administrator Portal',
      label: 'Admin Email ID',
      placeholder: 'mitparadh@gmail.com',
    },
  }[role];

  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-between font-sans">
      <div>
        <Header />
        <Navbar />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-10 w-full">
        {/* Back to Home Link */}
        <Link 
          href="/" 
          className="mb-4 sm:mb-5 inline-flex items-center gap-2 text-slate-500 hover:text-[#003366] transition-colors text-xs font-bold capitalize tracking-tight px-3 py-1.5 rounded-lg hover:bg-slate-200/60 min-h-[36px]"
        >
          <X size={14} /> Back to Homepage
        </Link>

        <div className="w-full max-w-[420px] bg-white shadow-xl border border-slate-200 overflow-hidden rounded-2xl sm:rounded-3xl">
          {/* Institutional Header */}
          <div className="bg-gradient-to-br from-[#002244] via-[#003366] to-[#001833] px-4 sm:px-8 py-5 sm:py-6 text-white text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-2.5 flex items-center justify-center shadow-inner bg-white/10 backdrop-blur-sm border border-white/20">
              <RoleIcon size={24} className="text-amber-300" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight capitalize text-white">{title}</h2>
            <p className="text-[11.5px] sm:text-[12px] text-white/80 font-medium mt-1 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
            <span className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-white/10">
              <ShieldCheck size={12} /> {roleConfig.badge}
            </span>
          </div>

          <div className="p-4 sm:p-7">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3.5 sm:p-4 mb-5 rounded-r-lg flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] sm:text-xs font-bold text-red-700 leading-relaxed">{error}</p>
                </div>
                {error.includes("Network error") && (
                  <button
                    onClick={() => {
                      console.warn("Bypassing auth due to network error...");
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('emergencyBypass', 'true');
                        router.push(`/${role}/dashboard`);
                      }
                    }}
                    className="ml-6 text-[10px] bg-red-600 text-white px-3 py-1.5 rounded font-black hover:bg-red-700 transition-colors w-fit shadow-sm uppercase tracking-wider"
                  >
                    Force Open Dashboard (Emergency Bypass)
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-4.5">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-bold text-slate-800 capitalize tracking-tight pl-0.5">
                  {roleConfig.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#003366] focus:bg-white py-3 sm:py-3.5 pl-10 sm:pl-11 pr-4 text-[15px] sm:text-sm text-slate-700 outline-none transition-all rounded-xl font-bold min-h-[46px] shadow-sm"
                    placeholder={roleConfig.placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-800 capitalize tracking-tight pl-0.5">Password</label>
                  {role === 'student' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotStep(1);
                        setForgotEmail(email);
                        setForgotMessage('');
                        setForgotError('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="text-[11px] font-bold text-[#003366] hover:text-amber-600 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#003366] focus:bg-white py-3 sm:py-3.5 pl-10 sm:pl-11 pr-11 text-[15px] sm:text-sm text-slate-700 outline-none transition-all rounded-xl min-h-[46px] shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#003366] hover:bg-[#002244] active:scale-[0.99] text-white font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all disabled:opacity-70 flex items-center justify-center gap-2.5 min-h-[48px] shadow-md hover:shadow-lg mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Validating Credentials...
                  </>
                ) : (
                  'Log In to Portal'
                )}
              </button>
            </form>

            {/* Quick Access for Staff and College */}
            {role === 'college' && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 text-center">Institutional Quick Access</p>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('isCollegeMaster', 'true');
                    sessionStorage.setItem('emergencyBypass', 'true');
                    router.push('/college/dashboard');
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-lg text-[11px] font-black text-[#00a5a5] capitalize transition-all flex items-center justify-center gap-2 min-h-[40px]"
                >
                  <ShieldCheck size={14} className="text-[#00a5a5]" /> Demo College Portal Access
                </button>
              </div>
            )}

            {role === 'staff' && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 text-center">Institutional Quick Access</p>
                <button
                  onClick={() => {
                    setEmail('staff@mitparadh.com');
                    setPassword('staff@123');
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-lg text-[11px] font-black text-[#003366] capitalize transition-all flex items-center justify-center gap-2 min-h-[40px]"
                >
                  <ShieldCheck size={14} className="text-amber-500" /> Auto-Fill Staff Demo
                </button>
              </div>
            )}

            {role === 'student' && (
              <div className="mt-5 pt-4 border-t border-slate-200 text-center">
                <p className="text-xs sm:text-[13px] font-bold text-slate-700 capitalize tracking-tight mb-1.5">New Student Admission?</p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#c05621] hover:text-[#9c4221] hover:underline capitalize min-h-[36px]"
                >
                  Go to Registration Center <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Quick Switch to Other Portals */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Switch Portal
                </p>
                <Link href="/login" className="text-[11px] font-bold text-[#003366] hover:text-amber-600 transition-colors flex items-center gap-1">
                  All Portals <ChevronRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                {role !== 'student' && (
                  <Link href="/login/student" className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-[11px] font-bold text-slate-700 border border-slate-200 transition-all min-h-[38px] flex items-center justify-center text-center">
                    Student
                  </Link>
                )}
                {role !== 'college' && (
                  <Link href="/login/college" className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-[11px] font-bold text-slate-700 border border-slate-200 transition-all min-h-[38px] flex items-center justify-center text-center">
                    College / Branch
                  </Link>
                )}
                {role !== 'staff' && (
                  <Link href="/login/staff" className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 text-[11px] font-bold text-slate-700 border border-slate-200 transition-all min-h-[38px] flex items-center justify-center text-center">
                    Staff
                  </Link>
                )}
                {role !== 'admin' && (
                  <Link href="/login/admin" className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-[#003366] hover:border-[#003366]/40 text-[11px] font-bold text-slate-700 border border-slate-200 transition-all min-h-[38px] flex items-center justify-center text-center">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 py-3 text-center border-t border-slate-200">
            <p className="text-[9.5px] font-bold text-slate-400 capitalize tracking-tight">© MIT Institutional ERP 4.0</p>
          </div>
        </div>
      </div>

      <LiveFooter />

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#003366] px-5 sm:px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-sm tracking-tight">Reset Password</h3>
              <button 
                onClick={() => setShowForgotModal(false)} 
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              {forgotMessage && forgotStep === 2 && forgotMessage.includes('Redirecting') ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={28} />
                  </div>
                  <p className="text-xs sm:text-[13px] font-bold text-emerald-700">{forgotMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotStep === 1 && <p className="text-[12px] text-slate-600 mb-2">Enter your registered email address to verify your account.</p>}
                  {forgotStep === 2 && <p className="text-[12px] text-emerald-600 font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> Verified! Enter your new password below.</p>}

                  {forgotError && (
                    <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-lg border border-red-200 flex gap-2 items-start">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      {forgotError}
                    </div>
                  )}

                  {forgotStep === 1 ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[15px] sm:text-sm outline-none focus:border-[#003366] focus:bg-white transition-all font-medium min-h-[44px]"
                        placeholder="student@example.com"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[15px] sm:text-sm outline-none focus:border-[#003366] focus:bg-white transition-all font-medium min-h-[44px]"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-[15px] sm:text-sm outline-none focus:border-[#003366] focus:bg-white transition-all font-medium min-h-[44px]"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading || (forgotStep === 1 ? !forgotEmail : (!newPassword || !confirmPassword))}
                    className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3 rounded-lg text-xs font-bold transition-colors disabled:opacity-70 flex justify-center items-center gap-2 mt-2 min-h-[44px]"
                  >
                    {forgotLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {forgotStep === 1 ? 'Verify Email' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
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
