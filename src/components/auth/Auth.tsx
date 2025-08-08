import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import logo from '@/assets/logo2.png';
import './Auth.css';

interface AuthProps {
  onAuthSuccess: () => void;
  defaultToLogin?: boolean;
  onGoBack?: () => void;
}

type AuthMode = 'login' | 'signup';

const WEB_REDIRECT_URL = 'https://useintent.app';

export default function AuthComponent({ onAuthSuccess, defaultToLogin = false, onGoBack }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(defaultToLogin ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (mode === 'signup' && password !== confirmPassword) return false;
    return true;
  }, [email, password, confirmPassword, mode]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === 'SIGNED_IN' && session) onAuthSuccess();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [onAuthSuccess]);

  const handleEmailPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuthSuccess();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: WEB_REDIRECT_URL },
        });
        if (signUpError) throw signUpError;
        setInfo('Check your email for the confirmation link.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, mode, onAuthSuccess]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: WEB_REDIRECT_URL },
      });
      if (oauthError) throw oauthError;
      // For OAuth we rely on redirect; no further action here
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to start Google sign-in');
    }
  }, []);

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setError('Enter your email to reset your password');
      return;
    }
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: WEB_REDIRECT_URL,
      });
      if (resetError) throw resetError;
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return (
    <div className="auth-form-container relative w-full">
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md p-2 text-white/60 transition hover:bg-white/5 hover:text-white/90"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back
        </button>
      )}

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4">
        <div className="h-24 w-24 overflow-hidden rounded-full opacity-90">
          <img src={logo} alt="Logo" className="h-full w-full object-contain" />
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              mode === 'login'
                ? 'border-transparent bg-[var(--primary)] text-white'
                : 'border-white/20 text-white/85 hover:bg-white/5'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              mode === 'signup'
                ? 'border-transparent bg-[var(--primary)] text-white'
                : 'border-white/20 text-white/85 hover:bg-white/5'
            }`}
          >
            Sign up
          </button>
        </div>

        {error && (
          <div className="w-full max-w-md rounded-md border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}
        {info && (
          <div className="w-full max-w-md rounded-md border border-green-500/30 bg-green-500/10 p-3 text-center text-sm text-green-400">
            {info}
          </div>
        )}

        <form onSubmit={handleEmailPassword} className="mx-auto flex w-full max-w-md flex-col gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm text-white/85">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm text-white/85">Password</label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          {mode === 'signup' && (
            <div className="grid gap-1.5">
              <label htmlFor="confirm" className="text-sm text-white/85">Confirm password</label>
              <input
                id="confirm"
                type="password"
                placeholder="Re-enter your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="mt-1 rounded-md bg-[var(--primary)] px-4 py-3 text-white transition hover:bg-[#e55a15] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (mode === 'login' ? 'Logging in…' : 'Signing up…') : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="mt-2 w-fit text-left text-sm text-[var(--primary)] hover:underline"
            >
              Forgot your password?
            </button>
          )}
        </form>

        <div className="mt-3 flex w-full max-w-md items-center gap-3">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-white/70">or</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full max-w-md rounded-md border border-white/25 px-4 py-2 text-white/90 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Continue with Google
        </button>

        <div className="mt-2 text-sm text-white/80">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-[var(--primary)] hover:underline">Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-[var(--primary)] hover:underline">Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
