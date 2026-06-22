import { useState, FormEvent } from 'react';
import { Card, Button, Input, TextField, Label } from '@heroui/react';
import { ChefHat, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f9fafb] dark:bg-[#030712] transition-colors duration-300">
      <Card className="w-full max-w-sm p-6 rounded-2xl">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ChefHat className="w-8 h-8" />
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

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          {successMsg && (
            <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">{successMsg}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 text-white font-semibold rounded-xl py-2.5 hover:bg-emerald-700 transition-colors"
          >
            {submitting ? t('auth.submitting') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </Button>
        </form>

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