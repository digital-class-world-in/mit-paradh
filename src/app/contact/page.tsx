'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onValue, push, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import { Mail, Phone, MapPin } from 'lucide-react';
import LiveFooter from '@/components/LiveFooter';

const DEFAULT_CONTACT_DATA = {
  title: 'Contact Us',
  officeAddress: 'Maharashtra State Board of Skill, Vocational Education and Training,\n6th Floor, Bandra Kurla BK, Bandra (E),\nMumbai - 400051.',
  phoneNumbers: '+91-22-26590000, +91-22-26591111',
  emails: 'support@msbsvet.gov.in, info@msbsvet.gov.in'
};

export default function ContactPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(DEFAULT_CONTACT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cache_contact');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Object.keys(parsed).length > 0) {
            setData(parsed);
          }
        }
      } catch (e) {}
      setLoading(false);
    }

    const contactRef = ref(realtimeDb, 'settings/website/contact');
    const unsubscribe = onValue(contactRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setData(val);
        try { localStorage.setItem('cache_contact', JSON.stringify(val)); } catch (e) {}
      } else {
        setData(DEFAULT_CONTACT_DATA);
        try { localStorage.removeItem('cache_contact'); } catch (e) {}
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.message) return alert("Please fill all fields");
    
    setIsSubmitting(true);
    try {
      const newEnquiryRef = push(ref(realtimeDb, 'contact_enquiries'));
      await set(newEnquiryRef, {
        ...form,
        createdAt: new Date().toISOString()
      });
      setSuccessMsg("Thank you! Your message has been sent successfully.");
      setForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => {
        setSuccessMsg('');
        router.push('/');
      }, 1500);
    } catch (error) {
      alert("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans">
        <Header />
        <Navbar />
        <div className="max-w-4xl mx-auto py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#5D5fb1] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading contact information...</p>
        </div>
        <LiveFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <Header />
      <Navbar />
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-black text-[#5D5fb1] capitalize tracking-tight mb-8">{data.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200 space-y-6">
            <h2 className="text-xl font-bold text-[#5D5fb1] border-b pb-4">Get in Touch</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="text-[#5D5fb1]" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">Office Address</p>
                <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed mt-1">
                  {data.officeAddress}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="text-[#5D5fb1]" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">Phone Numbers</p>
                <div className="space-y-0.5 mt-1">
                  {data.phoneNumbers.split(',').map((num: string, idx: number) => {
                    const cleanNum = num.trim();
                    if (!cleanNum) return null;
                    return (
                      <p key={idx} className="text-slate-600 text-sm">
                        <a href={`tel:${cleanNum}`} className="hover:underline">{cleanNum}</a>
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="text-[#5D5fb1]" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">Email Address</p>
                <div className="space-y-0.5 mt-1">
                  {data.emails.split(',').map((email: string, idx: number) => {
                    const cleanEmail = email.trim();
                    if (!cleanEmail) return null;
                    return (
                      <p key={idx} className="text-slate-600 text-sm">
                        <a href={`mailto:${cleanEmail}`} className="hover:underline">{cleanEmail}</a>
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#5D5fb1] rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">Quick Enquiry</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {successMsg && <div className="bg-emerald-500/20 text-emerald-100 border border-emerald-500/50 p-3 rounded-lg text-sm font-bold">{successMsg}</div>}
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Full Name</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400" placeholder="Your Name" />
              </div>
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Email ID</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Mobile Number</label>
                <input required type="tel" pattern="[0-9]{10}" maxLength={10} title="Please enter a valid 10-digit mobile number" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Message</label>
                <textarea required value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400 h-24" placeholder="How can we help you?"></textarea>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-[#5D5fb1] font-black py-3 rounded-lg capitalize tracking-tight transition-colors shadow-lg active:scale-95 disabled:opacity-50">
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>
        </div>
      </main>
      <LiveFooter />
    </div>
  );
}

