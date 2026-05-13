'use client';

import { Header } from '@/components/MSBSVET/Header';
import { Navbar } from '@/components/MSBSVET/Navbar';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <Header />
      <Navbar />
      <main className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-black text-[#5D5fb1] capitalize tracking-tight mb-8">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200 space-y-6">
            <h2 className="text-xl font-bold text-[#5D5fb1] border-b pb-4">Get in Touch</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="text-[#5D5fb1]" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Office Address</p>
                <p className="text-slate-600 text-sm">
                  Maharashtra State Board of Skill, Vocational Education and Training,<br />
                  6th Floor, Bandra Kurla Complex, Bandra (E),<br />
                  Mumbai - 400051.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="text-[#5D5fb1]" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Phone Numbers</p>
                <p className="text-slate-600 text-sm">+91-22-26590000</p>
                <p className="text-slate-600 text-sm">+91-22-26591111</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="text-[#5D5fb1]" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Email Address</p>
                <p className="text-slate-600 text-sm">support@msbsvet.gov.in</p>
                <p className="text-slate-600 text-sm">info@msbsvet.gov.in</p>
              </div>
            </div>
          </section>

          <section className="bg-[#5D5fb1] rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">Quick Enquiry</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Full Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400" placeholder="Your Name" />
              </div>
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Email ID</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold capitalize tracking-tight text-white/60 mb-1">Message</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400 h-24" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full bg-amber-400 hover:bg-amber-500 text-[#5D5fb1] font-black py-3 rounded-lg capitalize tracking-tight transition-colors shadow-lg active:scale-95">
                Send Message
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

