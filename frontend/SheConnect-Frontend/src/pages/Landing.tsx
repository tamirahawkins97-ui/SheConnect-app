import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { removeToken, setToken } from '../utils/auth';
import Brand from '../components/layout/Brand';
import AppearanceControl from '../components/layout/AppearanceControl';
import { ShieldCheck, Users } from 'lucide-react';

type AuthResponse = { message: string; token: string };

export default function LandingPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isVeteranLogin, setIsVeteranLogin] = useState(false);
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
      if (isVeteranLogin) {
        await apiFetch<{ message: string }>('/api/users/admin');
      }
      navigate('/feed', { replace: true });
    } catch (err: unknown) {
      if (isVeteranLogin) removeToken();
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glam-page min-h-screen relative flex items-center justify-center overflow-hidden p-6">
      {/* Soft Pink Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-rose-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Glass Card */}
      <div className="glam-card relative w-full max-w-md p-8">
        <div className="absolute right-5 top-5">
          <AppearanceControl />
        </div>
        <Brand to="/" className="mx-auto mb-7 mt-12 w-fit" />
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
            {isVeteranLogin ? 'Veteran Mommy Access' : 'Welcome Darling'}
          </span>
          <h1 className="text-3xl font-glam text-zinc-800 mt-1 mb-2">
            {isRegister ? 'Create an Account' : isVeteranLogin ? 'Welcome Back, Veteran' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-zinc-400 font-light">
            {isRegister
              ? 'Step inside to join the circle.'
              : isVeteranLogin
                ? 'Sign in with your approved Veteran Mommy account.'
                : 'Sign in to access your space.'}
          </p>
        </div>

        {!isRegister && (
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-1.5" aria-label="Choose sign-in type">
            <button
              type="button"
              aria-pressed={!isVeteranLogin}
              onClick={() => { setIsVeteranLogin(false); setError(null); }}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 ${
                !isVeteranLogin ? 'bg-white text-rose-700 shadow-sm' : 'text-zinc-500 hover:text-rose-600'
              }`}
            >
              <Users size={15} aria-hidden="true" />
              Community Login
            </button>
            <button
              type="button"
              aria-pressed={isVeteranLogin}
              onClick={() => { setIsVeteranLogin(true); setError(null); }}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 ${
                isVeteranLogin ? 'bg-white text-rose-700 shadow-sm' : 'text-zinc-500 hover:text-rose-600'
              }`}
            >
              <ShieldCheck size={15} aria-hidden="true" />
              Veteran Mommy
            </button>
          </div>
        )}
        {!isRegister && isVeteranLogin && (
          <p className="-mt-3 mb-5 text-center text-xs leading-5 text-zinc-500">
            Veteran access is confirmed securely by the server. This option is only for accounts already assigned the Veteran Mommy role.
          </p>
        )}

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
                className="glam-input"
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
              className="glam-input"
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
              className="glam-input"
            />
          </div>

          {/* Glowing Glam Button */}
          <button
            type="submit"
            disabled={loading}
            className="glam-btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : isRegister
                ? 'Join Now ✨'
                : isVeteranLogin
                  ? 'Verify Veteran Access'
                  : 'Sign In ✨'}
          </button>
        </form>

        {/* Mode Toggle Button */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          <span>{isRegister ? 'Already a member?' : "Don't have an account?"}</span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setIsVeteranLogin(false);
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