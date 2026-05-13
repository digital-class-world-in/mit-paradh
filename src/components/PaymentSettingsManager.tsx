'use client';

import { useState, useEffect } from 'react';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, set, onValue } from 'firebase/database';
import { QRCodeCanvas } from 'qrcode.react';
import { Save, CreditCard, Copy, CheckCircle2, AlertCircle, Trash2, Plus } from 'lucide-react';

interface PaymentSettingsManagerProps {
  collegeId: string;
  isAdmin?: boolean;
}

export default function PaymentSettingsManager({ collegeId, isAdmin = false }: PaymentSettingsManagerProps) {
  const [settings, setSettings] = useState({
    upiId: '',
    merchantName: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collegeName, setCollegeName] = useState('');

  useEffect(() => {
    if (!collegeId) return;
    const settingsRef = ref(realtimeDb, `colleges/${collegeId}/paymentSettings`);
    
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
      setLoading(false);
    });

    const nameRef = ref(realtimeDb, `colleges/${collegeId}/name`);
    get(nameRef).then(snap => {
      if (snap.exists()) setCollegeName(snap.val());
    });

    return () => unsubscribe();
  }, [collegeId]);

  const handleSave = async () => {
    if (!settings.upiId) {
      alert("Please fill in the UPI ID.");
      return;
    }
    
    if (isAdmin && !settings.merchantName) {
      alert("Please fill in the Merchant Name.");
      return;
    }
    
    setSaving(true);
    try {
      await set(ref(realtimeDb, `colleges/${collegeId}/paymentSettings`), settings);
      alert("Payment settings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const upiUrl = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.merchantName || collegeName || 'College')}&cu=INR`;

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5D5fb1]"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border-4 border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-[#002147] p-8 text-white">
              <h3 className="text-2xl font-black tracking-tighter">UPI Configuration</h3>
              <p className="text-[13px] text-white/60 font-normal mt-1">Set up your official payment receiving details</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 ml-1">Official UPI ID</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. college@upi"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:border-[#5D5fb1] focus:bg-white transition-all pl-12"
                      value={settings.upiId}
                      onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

              </div>

              <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${settings.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setSettings({...settings, isActive: !settings.isActive})}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isActive ? 'right-1' : 'left-1'}`} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-emerald-900">Online Payments Enabled</p>
                  <p className="text-[11px] text-emerald-700">Students will be able to see these details in their portal</p>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#5D5fb1] hover:bg-[#002147] text-white py-5 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? 'SAVING CONFIGURATION...' : <><Save size={18} /> UPDATE PAYMENT SETTINGS</>}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border-4 border-slate-100 shadow-xl overflow-hidden sticky top-28">
            <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Live QR Preview</p>
            </div>
            
            <div className="p-10 flex flex-col items-center gap-8">
              {settings.upiId ? (
                <>
                  <div className="p-6 bg-white rounded-3xl shadow-2xl border-2 border-slate-100">
                    <QRCodeCanvas 
                      value={upiUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-lg font-black text-slate-800 tracking-tighter">{settings.merchantName || collegeName || 'Your College Name'}</p>
                    <p className="text-sm font-medium text-slate-500">{settings.upiId}</p>
                  </div>

                  <div className="w-full h-px bg-slate-100" />

                  <div className="w-full space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Scan to Verify Details</p>
                    <div className="flex justify-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                        <CreditCard size={14} />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                        <CheckCircle2 size={14} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <AlertCircle size={40} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 max-w-[200px] mx-auto">Enter a UPI ID to generate the scan code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
