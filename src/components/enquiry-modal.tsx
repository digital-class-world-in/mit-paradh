'use client';

import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { X, Send, User, Mail, Phone, BookOpen, MessageSquare, CheckCircle2 } from 'lucide-react';

interface EnquiryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resolvedUid?: string;
  displayedCourses?: any[];
}

export function EnquiryModal({
  isOpen,
  onOpenChange,
  resolvedUid,
  displayedCourses = []
}: EnquiryModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const enquiriesRef = push(ref(realtimeDb, 'contact_enquiries'));
      await set(enquiriesRef, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        course: form.course || 'General Enquiry',
        message: form.message,
        resolvedUid: resolvedUid || null,
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ name: '', email: '', phone: '', course: '', message: '' });
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit enquiry:', err);
      setError(err?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSuccess(false);
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Header */}
        <div className="relative bg-gradient-to-r from-[#8E24AA] via-[#9C27B0] to-[#7B1FA2] p-6 text-white">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Admission Enquiry</h2>
              <p className="text-xs text-white/80 mt-0.5">Get in touch with us for course details & admissions</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Enquiry Submitted!</h3>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Thank you for reaching out. Our admissions team will contact you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Email & Phone grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Course selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interested Course
                </label>
                <div className="relative">
                  <BookOpen size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:bg-white transition-all text-slate-800 font-medium appearance-none"
                  >
                    <option value="">Select a course (Optional)</option>
                    {displayedCourses.map((c: any, index: number) => {
                      const courseName = typeof c === 'string' ? c : (c.title || c.name || c.courseName || `Course #${index + 1}`);
                      return (
                        <option key={index} value={courseName}>
                          {courseName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message / Query
                </label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what you'd like to know..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-[#8E24AA] via-[#9C27B0] to-[#7B1FA2] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Enquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnquiryModal;
