import { useState, type FormEvent } from 'react';
import { Card, Button, Input, TextField, Label } from '@heroui/react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function AuthForm() {
  const { signIn, signUp, signInWithGoogle, authError } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError(t('auth.unexpectedError'));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          setSuccessMsg(t('auth.checkEmail'));
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      }
    } catch {
      setError(t('auth.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Card className="w-full max-w-sm p-6 rounded-2xl">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-1 mb-1">
            <img src="/logo-login.png" className="w-20 h-20 object-contain" alt="SnagBite Logo" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('app.title')}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            name="email"
            type="email"
            value={email}
            onChange={(val) => setEmail(val)}
            isRequired
          >
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('auth.email')}</Label>
            <Input
              placeholder={t('auth.emailPlaceholder')}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl"
            />
          </TextField>

          <TextField
            name="password"
            type="password"
            value={password}
            onChange={(val) => setPassword(val)}
            isRequired
          >
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('auth.password')}</Label>
            <Input
              placeholder={t('auth.passwordPlaceholder')}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl"
            />
          </TextField>

          {(error || authError) && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg">{error || authError}</p>
          )}
          {successMsg && (
            <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">{successMsg}</p>
          )}

          <Button
            type="submit"
            isDisabled={submitting || googleSubmitting}
            className="w-full bg-emerald-600 text-white font-semibold rounded-xl py-2.5 hover:bg-emerald-700 transition-colors"
          >
            {submitting ? t('auth.submitting') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </Button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs">or</span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
        </div>

        <Button
          type="button"
          isDisabled={submitting || googleSubmitting}
          onPress={handleGoogleSignIn}
          className="w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 font-semibold rounded-xl py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {googleSubmitting ? t('auth.submitting') : t('auth.signInWithGoogle')}
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null); }}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
          </button>
        </div>
      </Card>
    </div>
  );
}