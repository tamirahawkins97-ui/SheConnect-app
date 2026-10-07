import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { setToken } from '../utils/auth';

type AuthResponse = { message: string; token: string };

export default function LandingPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<AuthResponse>(
        isRegister ? '/api/users/register' : '/api/users/login',
        {
          method: 'POST',
          body: isRegister
            ? { username: name.trim(), email: email.trim(), password }
            : { email: email.trim(), password },
        }
      );

      if (!response.token) {
        throw new Error('The server did not return an authentication token.');
      }

      setToken(response.token);
      navigate('/feed', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft Pink Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-white/75 backdrop-blur-xl border border-rose-100 rounded-3xl p-8 shadow-[0_20px_50px_rgba(244,63,94,0.08)] relative">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">Welcome Darling</span>
          <h1 className="text-3xl font-glam text-zinc-800 mt-1 mb-2">
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-zinc-400 font-light">
            {isRegister ? 'Step inside to join the circle.' : 'Sign in to access your space.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50/80 border border-rose-200/60 text-rose-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 ml-3">Username</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arabella"
                className="w-full px-5 py-3 rounded-full bg-rose-50/40 border border-rose-100 text-zinc-700 placeholder-zinc-300 text-sm focus:outline-none focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-3">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-5 py-3 rounded-full bg-rose-50/40 border border-rose-100 text-zinc-700 placeholder-zinc-300 text-sm focus:outline-none focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-3">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3 rounded-full bg-rose-50/40 border border-rose-100 text-zinc-700 placeholder-zinc-300 text-sm focus:outline-none focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/50 transition-all"
            />
          </div>

          {/* Glowing Glam Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 text-white font-medium text-sm tracking-wide shadow-[0_8px_20px_rgba(244,63,94,0.25)] transition-all duration-300 hover:shadow-[0_10px_25px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isRegister ? 'Join Now ✨' : 'Sign In ✨'}
          </button>
        </form>

        {/* Mode Toggle Button */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          <span>{isRegister ? 'Already a member?' : "Don't have an account?"}</span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-rose-500 font-semibold hover:text-rose-600 transition-colors ml-1 underline decoration-rose-200 underline-offset-4"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}