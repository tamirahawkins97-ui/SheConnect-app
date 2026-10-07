import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpg'; // Your SheConnect logo asset

// Default placeholder for your upcoming asset image
const DEFAULT_SUPPORTING_IMAGE = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80';

const API_BASE = 'http://localhost:1111/api/users';

const PREGNANCY_STAGES = [
  { id: 1, label: 'Mo 1', detail: 'Weeks 1-4' },
  { id: 2, label: 'Mo 2', detail: 'Weeks 5-8' },
  { id: 3, label: 'Mo 3', detail: 'Weeks 9-12' },
  { id: 4, label: 'Mo 4', detail: 'Weeks 13-16' },
  { id: 5, label: 'Mo 5', detail: 'Weeks 17-20' },
  { id: 6, label: 'Mo 6', detail: 'Weeks 21-24' },
  { id: 7, label: 'Mo 7', detail: 'Weeks 25-28' },
  { id: 8, label: 'Mo 8', detail: 'Weeks 29-32' },
  { id: 9, label: 'Mo 9', detail: 'Weeks 33-40' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(5); // default Month 5
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const token = localStorage.getItem('authToken');
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 1. Fetch current profile data if logged in
  useEffect(() => {
    fetch(`${API_BASE}/me`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.username) setUsername(data.username);
          if (data.name && !data.username) setUsername(data.name);
          if (data.email) setEmail(data.email);
          if (data.avatar) setProfilePreview(data.avatar);
          if (data.pregnancyMonth) setSelectedMonth(Number(data.pregnancyMonth));
        }
      })
      .catch(() => {});
  }, []);

  // 2. Handle Independent Local File Selection & Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Instant client-side visual preview
      const previewUrl = URL.createObjectURL(file);
      setProfilePreview(previewUrl);
    }
  };

  // Convert File to Base64 (simplest for JSON payloads)
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // 3. Submit profile updates
  const handleSaveAndContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      let avatarPayload = profilePreview;

      // If user uploaded a new local image file, encode it
      if (selectedFile) {
        avatarPayload = await fileToBase64(selectedFile);
      }

      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          username,
          email,
          ...(password ? { password } : {}),
          avatar: avatarPayload,
          pregnancyMonth: selectedMonth,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setStatusMessage('Profile polished ✨ Routing to feed...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf5f7] via-[#f7edf2] to-[#f4e6ec] text-[#4a454e] flex flex-col font-sans">
      
      {/* ─── TOP HEADER BAR ─── */}
      <header className="relative w-full border-b border-rose-200/60 bg-white/70 backdrop-blur-xl px-8 py-3.5 flex items-center justify-between shadow-sm z-30">
        <div className="w-10"></div>

        {/* Center Logo */}
        <div className="flex items-center gap-2">
          <img
            src={Logo}
            alt="SheConnect Logo"
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-rose-100"
          />
          <span className="text-2xl font-serif font-bold tracking-wider bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text text-transparent">
            SheConnect
          </span>
        </div>

        {/* Settings Icon */}
        <button
          onClick={() => alert('Settings menu')}
          className="p-2.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-600 shadow-sm transition-all duration-300 hover:bg-rose-500 hover:text-white hover:scale-110 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* ─── PREGNANCY STAGES STRIP ─── */}
      <section className="w-full max-w-6xl mx-auto px-8 py-5 border-b border-rose-200/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-serif font-bold uppercase tracking-widest text-zinc-700">
            Pregnancy Stages
          </h2>

          {/* Month Indicator & Calendar Icon */}
          <div className="flex items-center gap-3">
            <span className="px-4 py-1 rounded-full text-xs font-semibold bg-white/80 border border-rose-200 text-rose-600 shadow-sm">
              Month {selectedMonth}
            </span>
            <div className="p-2 rounded-full bg-white/80 border border-rose-200 text-rose-500 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Carousel Row with Arrows */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSelectedMonth((m) => Math.max(1, m - 1))}
            className="w-8 h-8 rounded-full bg-white border border-rose-200 text-rose-500 flex items-center justify-center text-sm shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            ←
          </button>

          <div className="flex-1 flex items-center justify-between gap-2 overflow-x-auto py-2">
            {PREGNANCY_STAGES.map((stg) => {
              const isActive = selectedMonth === stg.id;
              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => setSelectedMonth(stg.id)}
                  className={`flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-medium text-xs shadow-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-tr from-rose-400 to-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-white border border-rose-200 text-zinc-600'
                    }`}
                  >
                    {stg.id}
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-zinc-500">{stg.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setSelectedMonth((m) => Math.min(9, m + 1))}
            className="w-8 h-8 rounded-full bg-white border border-rose-200 text-rose-500 flex items-center justify-center text-sm shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            →
          </button>
        </div>
      </section>

      {/* ─── MAIN 3-BLOCK EDIT CONTAINER ─── */}
      <main className="max-w-6xl w-full mx-auto px-8 py-8 flex-1 grid grid-cols-12 gap-8 items-stretch">
        
        {/* 1. LEFT: PROFILE PIC UPLOAD CARD */}
        <div className="col-span-12 md:col-span-4 bg-white/75 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(244,63,94,0.05)] flex flex-col items-center justify-between">
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Profile Pic Display Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-52 h-52 rounded-3xl overflow-hidden border-2 border-dashed border-rose-300 bg-rose-50/40 flex items-center justify-center cursor-pointer group shadow-inner transition-all hover:border-rose-400 hover:bg-rose-50/70"
            >
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-3xl mb-2 block">📷</span>
                  <span className="text-xs font-serif text-zinc-500 block">No photo chosen</span>
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-rose-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Change Photo ✦
              </div>
            </div>
          </div>

          {/* Action Trigger Text */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-xs font-medium text-rose-500 hover:text-rose-600 underline underline-offset-4 tracking-wide transition-colors"
          >
            Upload a profile picture
          </button>
        </div>

        {/* 2. CENTER: PROFILE FORM FIELDS */}
        <div className="col-span-12 md:col-span-4 bg-white/75 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(244,63,94,0.05)] flex flex-col justify-center gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. MamaSophia"
              className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mama@example.com"
              className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Update password (optional)"
              className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/60 transition-all"
            />
          </div>

          {statusMessage && (
            <p className="text-xs text-center text-rose-500 font-medium mt-1">
              {statusMessage}
            </p>
          )}
        </div>

        {/* 3. RIGHT: SUPPORTING BACKGROUND IMAGE & CONTINUE BUTTON */}
        <div className="col-span-12 md:col-span-4 relative rounded-3xl overflow-hidden border border-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.05)] group min-h-[300px]">
          {/* Supporting background image */}
          <img
            src={DEFAULT_SUPPORTING_IMAGE}
            alt="Maternal Aesthetic"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Soft vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Continue Button (Bottom Right) */}
          <div className="absolute bottom-6 right-6 z-10">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAndContinue}
              className="px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_4px_15px_rgba(244,63,94,0.35)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}