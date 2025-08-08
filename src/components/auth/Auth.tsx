import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import logo from '@/assets/logo2.png';
import './Auth.css';
import Flame from '../home/Flame';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

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
    <div className="min-h-screen w-full relative bg-background">
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

      <div className="absolute inset-0 z-0 bg-radial-[ellipse_80%_60%_at_50%_0%] from-stone-900 to-transparent to-70% transition-colors duration-1000" />

      <div className="relative space-y-6 w-full max-w-md mx-auto flex flex-col items-center min-h-screen pt-56 px-4">
        <div className="flex justify-center relative animate-slide-in-up mb-16">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10.5">
            <Flame className="scale-35 scale-x-45 animate-flame-ignition" />
          </div>
          <img
            src={logo}
            alt="Logo"
            className="size-24 transition-all duration-500 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.15)_60%,transparent_100%)] shadow-[0_0_40px_10px_rgb(251_146_60),0_0_0_4px_rgb(251_146_60/0.08)] opacity-100"
          />
        </div>

        {error && (
          <div className="w-full max-w-md rounded-md border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}
        
        {info && (
          <div className="animate-slide-in-up duration-75! mt-2 w-full rounded-md border border-green-500/25 bg-green-500/50 p-2 text-center text-xs text-green-500">
            {info}
          </div>
        )}
        <form onSubmit={handleEmailPassword} className="space-y-1 w-full">
          <div className="relative rounded-xl p-5 border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm">
            <div className='absolute top-0 left-0 right-0 flex justify-center pointer-events-none'>
              <div className='h-[1px] animate-border-width rounded-full bg-gradient-to-r from-transparent via-orange-700 to-transparent transition-all duration-1000' />
            </div>

            <div className="grid gap-1.5 mb-2">
              <label htmlFor="email" className="text-sm text-white/85">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="grid gap-1.5 mb-2">
              <label htmlFor="password" className="text-sm text-white/85">Password</label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <div className="grid gap-1.5 mb-2">
                <label htmlFor="confirm" className="text-sm text-white/85">Confirm password</label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" disabled={!canSubmit || isLoading} className="mt-1 w-full">
              {isLoading ? (mode === 'login' ? 'Logging in…' : 'Signing up…') : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="mt-2 w-fit text-left text-sm text-muted-foreground hover:underline"
              >
                Forgot your password?
              </button>
            )}
          </div>
        </form>

        <div className="mt-3 flex w-full max-w-md items-center gap-3">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-white/70">or</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <Button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          variant="outline"
          className="w-full max-w-md"
        >
          Continue with Google
        </Button>

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
