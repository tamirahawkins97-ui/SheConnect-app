import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { setToken } from '../utils/auth';

type AuthMode = 'signin' | 'signup';
type AuthResponse = { message: string; token: string };

function Auth() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const isRegister = mode === 'signup';

    try {
      const response = await apiFetch<AuthResponse>(
        isRegister ? '/api/users/register' : '/api/users/login',
        {
          method: 'POST',
          body: isRegister
            ? { username: username.trim(), email: email.trim(), password }
            : { email: email.trim(), password },
        }
      );

      if (!response.token) {
        throw new Error('The server did not return an authentication token.');
      }

      setToken(response.token);
      setSuccess(isRegister ? 'Your account is ready. Welcome to SheConnect!' : 'You’re signed in. Welcome back!');
      navigate('/feed', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSuccess(null);
  }

  return (
    <main>
      <section aria-labelledby="auth-heading">
        <h1 id="auth-heading">{mode === 'signup' ? 'Create your account' : 'Sign in to SheConnect'}</h1>
        <p>{mode === 'signup' ? 'Join the community and meet other moms.' : 'Welcome back. Sign in to continue.'}</p>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 7 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p>
          {mode === 'signup' ? 'Already have an account?' : 'New to SheConnect?'}{' '}
          <button type="button" onClick={switchMode}>
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <Link to="/">Back to landing page</Link>
      </section>
    </main>
  );
}

export default Auth;
