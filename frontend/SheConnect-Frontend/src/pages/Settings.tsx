import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../assets/Logo.jpg';

const API_BASE = 'http://localhost:1111/api/users';

export default function SettingsPage() {
  const navigate = useNavigate();

  // Form & Preference State
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);
  const [pregnancyStage, setPregnancyStage] = useState('2nd Trimester');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const token = localStorage.getItem('authToken');
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 1. Fetch current settings on mount
  useEffect(() => {
    fetch(`${API_BASE}/me`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.email) setEmail(data.email);
          if (data.momStatus) setPregnancyStage(data.momStatus);
          if (typeof data.showActiveStatus === 'boolean') setShowActiveStatus(data.showActiveStatus);
          if (typeof data.allowDirectMessages === 'boolean') setAllowDirectMessages(data.allowDirectMessages);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          email,
          ...(newPassword ? { password: newPassword } : {}),
          momStatus: pregnancyStage,
          showActiveStatus,
          allowDirectMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not update settings');

      setSuccessMsg('Settings updated successfully ✨');
      setNewPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving changes');
    } finally {
      setLoading(false);
    }
  };

  // 3. Logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/', { replace: true });
  };

  // 4. Delete Account (Danger Zone)
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? All your posts, photos, and messages will be permanently removed.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error('Failed to delete account');
      handleLogout();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not delete account');
    }
  };

  return (
    <div className="glam-page min-h-screen flex flex-col font-sans text-[#4a454e]">
      
      {/* ─── TOP HEADER ─── */}
      <header className="relative w-full border-b border-rose-200/60 bg-white/70 backdrop-blur-xl px-8 py-3.5 flex items-center justify-between shadow-sm z-30">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors text-sm"
          title="Back"
        >
          ← Back
        </button>

        <Link to="/" className="flex items-center gap-2">
          <img src={Logo} alt="SheConnect Logo" className="w-9 h-9 rounded-full object-cover shadow-sm border border-rose-100" />
          <span className="text-2xl font-serif font-bold tracking-wider bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 bg-clip-text text-transparent">
            SheConnect
          </span>
        </Link>

        <div className="w-16"></div> {/* Spacer */}
      </header>

      {/* ─── SETTINGS CONTAINER ─── */}
      <main className="max-w-3xl w-full mx-auto px-6 py-10 flex-1 flex flex-col gap-8">
        
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">Preferences</span>
          <h1 className="text-3xl font-serif font-bold text-zinc-800">Account & Privacy Settings</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage your mama credentials, visibility, and notification preferences.</p>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-medium shadow-sm">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium shadow-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* 1. Account Credentials */}
          <div className="bg-white/80 backdrop-blur-xl border border-rose-100 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(244,63,94,0.04)] space-y-4">
            <h2 className="text-sm font-serif font-bold text-zinc-800 uppercase tracking-wider mb-2">
              Login Credentials
            </h2>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">New Password (optional)</label>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 2. Maternal Stage & Community Presence */}
          <div className="bg-white/80 backdrop-blur-xl border border-rose-100 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(244,63,94,0.04)] space-y-4">
            <h2 className="text-sm font-serif font-bold text-zinc-800 uppercase tracking-wider mb-2">
              Maternal Stage & Visibility
            </h2>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 ml-2">Current Stage</label>
              <select
                value={pregnancyStage}
                onChange={(e) => setPregnancyStage(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-sm text-zinc-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
              >
                <option value="1st Trimester">1st Trimester (Weeks 1-12) 🍼</option>
                <option value="2nd Trimester">2nd Trimester (Weeks 13-26) 🌸</option>
                <option value="3rd Trimester">3rd Trimester (Weeks 27-40) 🧸</option>
                <option value="Newborn Season">Newborn Season (0-3 mo) 🎀</option>
                <option value="Toddler Pro">Toddler & Beyond ✨</option>
              </select>
            </div>

            {/* Privacy Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 border border-rose-100/80 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-zinc-700">Display in Currently Active Sidebar</p>
                  <p className="text-[11px] text-zinc-400">Allows other mamas to see when you are online.</p>
                </div>
                <input
                  type="checkbox"
                  checked={showActiveStatus}
                  onChange={(e) => setShowActiveStatus(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/30 border border-rose-100/80 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-zinc-700">Allow Direct Messages</p>
                  <p className="text-[11px] text-zinc-400">Receive private whispers in the Social Hub.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowDirectMessages}
                  onChange={(e) => setAllowDirectMessages(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_4px_15px_rgba(244,63,94,0.35)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings ✨'}
            </button>
          </div>

        </form>

        {/* ─── DANGER & SESSION ACTIONS ─── */}
        <div className="bg-white/80 backdrop-blur-xl border border-rose-100 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(244,63,94,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-serif font-bold text-zinc-800 uppercase tracking-wider">Account Actions</h3>
            <p className="text-[11px] text-zinc-400">Sign out of your active session or remove your profile.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide text-zinc-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all hover:scale-105 active:scale-95"
            >
              Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide text-red-600 bg-red-50 border border-red-200 hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              Delete Account
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}